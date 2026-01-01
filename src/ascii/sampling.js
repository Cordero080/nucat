/**
 * Vertex sampling from skinned meshes
 */

import * as THREE from "three";
import { CONFIG, params } from "../config.js";
import {
  skinnedMeshes,
  sampledVertexIndices,
  vertexWeights,
  vertexBoneIndices,
  setSampledVertexIndices,
  setVertexWeights,
  setVertexBoneIndices,
  pushSampledVertex,
  pushVertexWeight,
  pushVertexBoneIndex,
} from "../state.js";

/**
 * Sample points along TAIL bones ONLY - fills the tail gap
 */
export function sampleSkeletonBones() {
  let totalBonePoints = 0;

  skinnedMeshes.forEach((mesh, meshIndex) => {
    if (!mesh.skeleton) return;

    const bones = mesh.skeleton.bones;

    // Find ONLY tail bones
    const tailBones = bones.filter((bone) =>
      bone.name.toLowerCase().includes("tail")
    );

    console.log(
      `Found ${tailBones.length} TAIL bones:`,
      tailBones.map((b) => b.name)
    );

    // For each tail bone, add points along its length
    tailBones.forEach((bone) => {
      const boneIndex = bones.indexOf(bone);
      if (!bone.parent || !bone.parent.isBone) return;

      const parentBoneIndex = bones.indexOf(bone.parent);

      const pointsPerBone = 20;

      for (let i = 0; i <= pointsPerBone; i++) {
        if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters)
          return;

        const t = i / pointsPerBone;
        pushSampledVertex({
          meshIndex,
          type: "bonePoint",
          boneIndex,
          parentBoneIndex,
          t,
        });

        pushVertexWeight(new THREE.Vector4(1, 0, 0, 0));
        pushVertexBoneIndex(new THREE.Vector4(boneIndex, 0, 0, 0));

        totalBonePoints++;
      }
    });
  });

  console.log(`TAIL bone points added: ${totalBonePoints}`);
}

/**
 * Sample vertices, face centers, edge points, AND interior points from skinned meshes
 */
export function sampleVertices() {
  // Reset arrays
  setSampledVertexIndices([]);
  setVertexWeights([]);
  setVertexBoneIndices([]);

  let totalVertices = 0;
  let totalFaceCenters = 0;
  let totalEdgePoints = 0;
  let totalInteriorPoints = 0;
  let totalAdaptivePoints = 0;

  skinnedMeshes.forEach((mesh, meshIndex) => {
    const geometry = mesh.geometry;
    const positionAttr = geometry.attributes.position;
    const skinIndexAttr = geometry.attributes.skinIndex;
    const skinWeightAttr = geometry.attributes.skinWeight;
    const indexAttr = geometry.index;

    const vertexCount = positionAttr.count;
    totalVertices += vertexCount;

    console.log(
      `Mesh ${meshIndex} (${mesh.name}): ${vertexCount} total vertices`
    );

    // Helper to add a sample point with bone weights
    const addSample = (sample, boneIdx, boneWeight) => {
      if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters)
        return false;
      pushSampledVertex(sample);
      if (skinWeightAttr && skinIndexAttr && boneIdx && boneWeight) {
        pushVertexWeight(boneWeight);
        pushVertexBoneIndex(boneIdx);
      }
      return true;
    };

    // Helper to get vertex position
    const getPos = (idx) =>
      new THREE.Vector3(
        positionAttr.getX(idx),
        positionAttr.getY(idx),
        positionAttr.getZ(idx)
      );

    // Helper to calculate triangle area
    const triangleArea = (p0, p1, p2) => {
      const v0 = new THREE.Vector3().subVectors(p1, p0);
      const v1 = new THREE.Vector3().subVectors(p2, p0);
      return v0.cross(v1).length() * 0.5;
    };

    // Sample every Nth vertex based on sampling density
    for (let i = 0; i < vertexCount; i += params.samplingDensity) {
      if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters) break;
      addSample(
        { meshIndex, vertexIndex: i, type: "vertex" },
        skinIndexAttr
          ? new THREE.Vector4(
              skinIndexAttr.getX(i),
              skinIndexAttr.getY(i),
              skinIndexAttr.getZ(i),
              skinIndexAttr.getW(i)
            )
          : null,
        skinWeightAttr
          ? new THREE.Vector4(
              skinWeightAttr.getX(i),
              skinWeightAttr.getY(i),
              skinWeightAttr.getZ(i),
              skinWeightAttr.getW(i)
            )
          : null
      );
    }

    // Track unique edges to avoid duplicates
    const edgeSet = new Set();

    // ADAPTIVE SAMPLING: Sample more points in larger triangles
    if (indexAttr) {
      const faceCount = indexAttr.count / 3;

      // First pass: calculate average triangle area
      let totalArea = 0;
      let maxArea = 0;
      for (let f = 0; f < faceCount; f++) {
        const p0 = getPos(indexAttr.getX(f * 3));
        const p1 = getPos(indexAttr.getX(f * 3 + 1));
        const p2 = getPos(indexAttr.getX(f * 3 + 2));
        const area = triangleArea(p0, p1, p2);
        totalArea += area;
        maxArea = Math.max(maxArea, area);
      }
      const avgArea = totalArea / faceCount;
      const largeThreshold = avgArea * 2;

      console.log(
        `Mesh ${meshIndex}: avg triangle area = ${avgArea.toFixed(
          4
        )}, max = ${maxArea.toFixed(4)}, threshold = ${largeThreshold.toFixed(
          4
        )}`
      );

      for (let f = 0; f < faceCount; f += params.samplingDensity) {
        if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters) break;

        const i0 = indexAttr.getX(f * 3);
        const i1 = indexAttr.getX(f * 3 + 1);
        const i2 = indexAttr.getX(f * 3 + 2);

        // Get bone data for vertices
        const getBoneData = (idx) => ({
          weight: skinWeightAttr
            ? new THREE.Vector4(
                skinWeightAttr.getX(idx),
                skinWeightAttr.getY(idx),
                skinWeightAttr.getZ(idx),
                skinWeightAttr.getW(idx)
              )
            : null,
          index: skinIndexAttr
            ? new THREE.Vector4(
                skinIndexAttr.getX(idx),
                skinIndexAttr.getY(idx),
                skinIndexAttr.getZ(idx),
                skinIndexAttr.getW(idx)
              )
            : null,
        });

        const b0 = getBoneData(i0);

        // Calculate this triangle's area
        const p0 = getPos(i0);
        const p1 = getPos(i1);
        const p2 = getPos(i2);
        const area = triangleArea(p0, p1, p2);
        const isLargeTriangle = area > largeThreshold;

        // Add face center
        addSample(
          { meshIndex, type: "faceCenter", faceVertices: [i0, i1, i2] },
          b0.index,
          b0.weight
        );
        totalFaceCenters++;

        // Base interior points
        let barycentricPoints = [
          [0.5, 0.25, 0.25],
          [0.25, 0.5, 0.25],
          [0.25, 0.25, 0.5],
          [0.6, 0.2, 0.2],
          [0.2, 0.6, 0.2],
          [0.2, 0.2, 0.6],
        ];

        // For large triangles, add more interior points
        if (isLargeTriangle) {
          const subdivisions = Math.min(10, Math.ceil(area / avgArea) + 3);
          barycentricPoints = [];
          for (let i = 0; i <= subdivisions; i++) {
            for (let j = 0; j <= subdivisions - i; j++) {
              const k = subdivisions - i - j;
              if (i + j + k === subdivisions) {
                const u = i / subdivisions;
                const v = j / subdivisions;
                const w = k / subdivisions;
                if (
                  (u === 1 || v === 1 || w === 1) &&
                  (u === 0 || v === 0 || w === 0)
                )
                  continue;
                barycentricPoints.push([u, v, w]);
              }
            }
          }
          totalAdaptivePoints += barycentricPoints.length;
        }

        for (const bary of barycentricPoints) {
          if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters)
            break;
          addSample(
            { meshIndex, type: "interior", faceVertices: [i0, i1, i2], bary },
            b0.index,
            b0.weight
          );
          totalInteriorPoints++;
        }

        // Edge points
        const edgeTs = isLargeTriangle
          ? [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
          : [0.25, 0.5, 0.75];

        const edgePairs = [
          [i0, i1],
          [i1, i2],
          [i2, i0],
        ];

        for (const [a, b] of edgePairs) {
          const edgeKey = `${Math.min(a, b)}-${Math.max(a, b)}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);

            const ba = getBoneData(a);
            for (const t of edgeTs) {
              if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters)
                break;
              addSample(
                { meshIndex, type: "edgePoint", edgeVertices: [a, b], t },
                ba.index,
                ba.weight
              );
              totalEdgePoints++;
            }
          }
        }
      }
    }
  });

  console.log(`\n=== VERTEX SAMPLING SUMMARY ===`);
  console.log(`Total vertices available: ${totalVertices}`);
  console.log(
    `Vertices sampled: ${Math.floor(totalVertices / params.samplingDensity)}`
  );
  console.log(`Face centers added: ${totalFaceCenters}`);
  console.log(`Edge points added: ${totalEdgePoints}`);
  console.log(`Interior points added: ${totalInteriorPoints}`);
  console.log(
    `Adaptive extra points (large triangles): ${totalAdaptivePoints}`
  );
  console.log(`Sampling density: every ${params.samplingDensity}`);
  console.log(`FINAL TOTAL POINTS: ${sampledVertexIndices.length}`);
  console.log(`Max characters limit: ${CONFIG.defaults.maxCharacters}`);
  console.log(`================================\n`);
}
