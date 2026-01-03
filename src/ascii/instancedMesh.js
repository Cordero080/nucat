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
  effectTime,
  disperseDirections,
  setDisperseDirections,
  modelCenter,
} from "../state.js";
import { getSkinnedVertexPosition } from "./skinning.js";
import {
  isModelIncubated,
  reattachInstancedMesh,
} from "../core/holographicCube.js";

/**
 * Create the InstancedMesh for efficient multi-character rendering
 */
export function createInstancedMesh() {
  // Remove existing instanced mesh if present
  if (instancedMesh) {
    // Remove from wherever it currently is (scene or cubeGroup)
    if (instancedMesh.parent) {
      instancedMesh.parent.remove(instancedMesh);
    }
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
  const mesh = new THREE.InstancedMesh(
    currentGeometry,
    material,
    instanceCount
  );
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Initialize all instances with identity matrices
  for (let i = 0; i < instanceCount; i++) {
    tempMatrix.identity();
    mesh.setMatrixAt(i, tempMatrix);
  }

  mesh.instanceMatrix.needsUpdate = true;

  // Add to scene first
  scene.add(mesh);
  setInstancedMesh(mesh);

  // If incubated, reattach to the cube group
  if (isModelIncubated()) {
    reattachInstancedMesh(mesh);
  }

  // Generate random disperse directions for each character
  const directions = [];
  for (let i = 0; i < instanceCount; i++) {
    directions.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize()
    );
  }
  setDisperseDirections(directions);

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

    // Apply effects to position
    applyEffects(instanceIndex, tempPosition);

    tempScale.setScalar(1);
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    instancedMesh.setMatrixAt(instanceIndex, tempMatrix);
  });

  instancedMesh.instanceMatrix.needsUpdate = true;
}

/**
 * Apply visual effects to character position - supports layering multiple effects
 * Each effect uses its own stored parameters
 */
function applyEffects(instanceIndex, position) {
  const { activeEffects, effectParams, disperseAmount } = params;

  // Check if any effects are active
  const hasActiveEffect = Object.values(activeEffects).some((v) => v);
  if (!hasActiveEffect && params.effectType === "none") return;

  const phase = instanceIndex * 0.1;

  // Apply hover effect with its own params
  if (activeEffects.hover || params.effectType === "hover") {
    const p = effectParams.hover;
    const time = effectTime * p.speed;
    position.x += Math.sin(time * 2 + phase) * p.intensity * 0.5;
    position.y += Math.sin(time * 3 + phase * 1.3) * p.intensity * 0.3;
    position.z += Math.cos(time * 2.5 + phase * 0.7) * p.intensity * 0.4;
  }

  // Apply disperse effect with its own params
  if (activeEffects.disperse || params.effectType === "disperse") {
    const p = effectParams.disperse;
    if (disperseDirections[instanceIndex]) {
      const dir = disperseDirections[instanceIndex];
      const distance = disperseAmount * p.intensity * 10;
      position.x += dir.x * distance;
      position.y += dir.y * distance;
      position.z += dir.z * distance;
    }
  }

  // Apply noise effect with its own params
  if (activeEffects.noise || params.effectType === "noise") {
    const p = effectParams.noise;
    const time = effectTime * p.speed;
    const noiseScale = p.intensity * 0.5;
    position.x += Math.sin(time * 10 + instanceIndex * 100) * noiseScale;
    position.y += Math.cos(time * 12 + instanceIndex * 73) * noiseScale;
    position.z += Math.sin(time * 8 + instanceIndex * 47) * noiseScale;
  }

  // Apply wave effect with its own params
  if (activeEffects.wave || params.effectType === "wave") {
    const p = effectParams.wave;
    const time = effectTime * p.speed;
    const waveOffset = Math.sin(time * 2 + position.y * 0.05) * p.intensity;
    position.x += waveOffset;
  }

  // Apply spiral effect with its own params
  if (activeEffects.spiral || params.effectType === "spiral") {
    const p = effectParams.spiral;
    const time = effectTime * p.speed;
    const angle = time * 2 + phase;
    const radius = p.intensity * 0.5;
    position.x += Math.cos(angle) * radius;
    position.z += Math.sin(angle) * radius;
  }

  // Apply spiralFlow effect with its own params
  if (activeEffects.spiralFlow || params.effectType === "spiralFlow") {
    const p = effectParams.spiralFlow;
    const time = effectTime * p.speed;
    applySpiralFlowEffect(instanceIndex, position, time, p);
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Spiral Flow Effect - Characters flow out in waves, spiral around, return
 */
function applySpiralFlowEffect(instanceIndex, position, time, effectParam) {
  const { spiralFlowProgress } = params;
  const intensity = effectParam.intensity;
  const waves = effectParam.waves;

  if (spiralFlowProgress <= 0) return;

  const center = modelCenter || { x: 0, y: 50, z: 0 };

  // Characters at BOTTOM flow out first, then middle, then top
  const normalizedY = (position.y + 50) / 250;
  const waveIndex = Math.floor(normalizedY * waves);
  const wavePhase = waveIndex / waves;

  // Add randomness for organic feel
  const randomOffset = ((instanceIndex % 100) / 100) * 0.3;

  // Calculate when this character should start moving
  const charStartTime = wavePhase * 0.5 + randomOffset * 0.2;
  const charEndTime = charStartTime + 0.5;

  // Progress for this character
  let charProgress = 0;
  if (spiralFlowProgress > charStartTime) {
    if (spiralFlowProgress < charEndTime) {
      charProgress =
        (spiralFlowProgress - charStartTime) / (charEndTime - charStartTime);
    } else if (spiralFlowProgress < charEndTime + 0.3) {
      charProgress = 1 - (spiralFlowProgress - charEndTime) / 0.3;
    } else {
      charProgress = 0;
    }
  }

  if (charProgress <= 0) return;

  const smoothProgress = easeInOutCubic(Math.min(charProgress, 1));

  const spiralRadius = intensity * 3 * smoothProgress;
  const spiralHeight = intensity * 2 * smoothProgress;

  const angleOffset = instanceIndex * 0.01 + wavePhase * Math.PI * 2;
  const spiralAngle = time * 3 + angleOffset + smoothProgress * Math.PI * 4;

  const dirX = position.x - center.x;
  const dirZ = position.z - center.z;
  const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;

  const outwardDist = intensity * 2 * smoothProgress;

  position.x +=
    (dirX / dirLen) * outwardDist + Math.cos(spiralAngle) * spiralRadius;
  position.y += Math.sin(smoothProgress * Math.PI) * spiralHeight;
  position.z +=
    (dirZ / dirLen) * outwardDist + Math.sin(spiralAngle) * spiralRadius;
}
