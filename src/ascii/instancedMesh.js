/**
 * InstancedMesh for ASCII character rendering
 */

import * as THREE from "three";
import { params } from "../config.js";
import {
  scene,
  camera,
  skinnedMeshes,
  instancedMesh,
  currentGeometry,
  sampledVertexIndices,
  setInstancedMesh,
  tempMatrix,
  tempPosition,
  tempQuaternion,
  tempScale,
  tempNormal,
} from "../state.js";
import { getSkinnedVertexPosition } from "./skinning.js";

/**
 * Create the InstancedMesh for efficient multi-character rendering
 */
export function createInstancedMesh() {
  // Remove existing instanced mesh if present
  if (instancedMesh) {
    scene.remove(instancedMesh);
    instancedMesh.dispose();
  }

  // Create material with emissive properties for glow
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(params.color),
    emissive: new THREE.Color(params.color),
    emissiveIntensity: params.emissiveIntensity,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Create instanced mesh with sampled vertex count
  const instanceCount = sampledVertexIndices.length;
  const mesh = new THREE.InstancedMesh(currentGeometry, material, instanceCount);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Initialize all instances with identity matrices
  for (let i = 0; i < instanceCount; i++) {
    tempMatrix.identity();
    mesh.setMatrixAt(i, tempMatrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
  setInstancedMesh(mesh);

  console.log(`Created InstancedMesh with ${instanceCount} instances`);

  return mesh;
}

/**
 * Update ASCII character positions based on current skeleton pose
 */
export function updateASCIIPositions() {
  if (!instancedMesh || skinnedMeshes.length === 0) return;

  sampledVertexIndices.forEach((sample, instanceIndex) => {
    const mesh = skinnedMeshes[sample.meshIndex];
    const geometry = mesh.geometry;

    // Handle different sample types
    if (sample.type === "faceCenter") {
      const [i0, i1, i2] = sample.faceVertices;
      const p0 = new THREE.Vector3();
      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();

      getSkinnedVertexPosition(i0, mesh, p0);
      getSkinnedVertexPosition(i1, mesh, p1);
      getSkinnedVertexPosition(i2, mesh, p2);

      tempPosition.set(
        (p0.x + p1.x + p2.x) / 3,
        (p0.y + p1.y + p2.y) / 3,
        (p0.z + p1.z + p2.z) / 3
      );
    } else if (sample.type === "edgePoint") {
      const [a, b] = sample.edgeVertices;
      const t = sample.t;
      const pA = new THREE.Vector3();
      const pB = new THREE.Vector3();

      getSkinnedVertexPosition(a, mesh, pA);
      getSkinnedVertexPosition(b, mesh, pB);

      tempPosition.lerpVectors(pA, pB, t);
    } else if (sample.type === "interior") {
      const [i0, i1, i2] = sample.faceVertices;
      const [u, v, w] = sample.bary;
      const p0 = new THREE.Vector3();
      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();

      getSkinnedVertexPosition(i0, mesh, p0);
      getSkinnedVertexPosition(i1, mesh, p1);
      getSkinnedVertexPosition(i2, mesh, p2);

      tempPosition.set(
        p0.x * u + p1.x * v + p2.x * w,
        p0.y * u + p1.y * v + p2.y * w,
        p0.z * u + p1.z * v + p2.z * w
      );
    } else if (sample.type === "edgeMidpoint") {
      const [a, b] = sample.edgeVertices;
      const pA = new THREE.Vector3();
      const pB = new THREE.Vector3();

      getSkinnedVertexPosition(a, mesh, pA);
      getSkinnedVertexPosition(b, mesh, pB);

      tempPosition.set((pA.x + pB.x) / 2, (pA.y + pB.y) / 2, (pA.z + pB.z) / 2);
    } else {
      getSkinnedVertexPosition(sample.vertexIndex, mesh, tempPosition);
    }

    // Handle rotation based on billboard mode
    if (params.billboardMode) {
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      cameraDirection.negate();

      const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
      tempQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    } else {
      const normalAttr = geometry.attributes.normal;
      if (normalAttr && sample.type === "vertex") {
        tempNormal.fromBufferAttribute(normalAttr, sample.vertexIndex);
        tempQuaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          tempNormal.normalize()
        );
      } else {
        tempQuaternion.identity();
      }
    }

    tempScale.setScalar(1);
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    instancedMesh.setMatrixAt(instanceIndex, tempMatrix);
  });

  instancedMesh.instanceMatrix.needsUpdate = true;
}
