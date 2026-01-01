/**
 * Manual skinned vertex position calculation
 */

import * as THREE from "three";

/**
 * Apply bone skinning transformation to a vertex manually.
 * This replicates what the GPU does during skinned mesh rendering.
 *
 * @param {number} vertexIndex - Index of the vertex in the geometry
 * @param {THREE.SkinnedMesh} mesh - The skinned mesh containing skeleton
 * @param {THREE.Vector3} target - Vector3 to store the result
 * @returns {THREE.Vector3} - Transformed vertex position in world space
 */
export function getSkinnedVertexPosition(vertexIndex, mesh, target) {
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const skinIndex = geometry.attributes.skinIndex;
  const skinWeight = geometry.attributes.skinWeight;
  const skeleton = mesh.skeleton;

  // Reset target
  target.set(0, 0, 0);

  // Get original vertex position
  const vertex = new THREE.Vector3();
  vertex.fromBufferAttribute(position, vertexIndex);

  // Check if this vertex has any bone weights
  const weights = [
    skinWeight.getX(vertexIndex),
    skinWeight.getY(vertexIndex),
    skinWeight.getZ(vertexIndex),
    skinWeight.getW(vertexIndex),
  ];

  const totalWeight = weights[0] + weights[1] + weights[2] + weights[3];

  // If no bone weights, just use the original position transformed by mesh matrix
  if (totalWeight === 0) {
    target.copy(vertex);
    target.applyMatrix4(mesh.matrixWorld);
    return target;
  }

  // Apply bind matrix (transforms from mesh local space to skeleton space)
  vertex.applyMatrix4(mesh.bindMatrix);

  // Temporary vectors for calculations
  const tempVertex = new THREE.Vector3();
  const tempMatrix = new THREE.Matrix4();

  // Get skin indices for this vertex
  const indices = [
    skinIndex.getX(vertexIndex),
    skinIndex.getY(vertexIndex),
    skinIndex.getZ(vertexIndex),
    skinIndex.getW(vertexIndex),
  ];

  // Process each bone influence (up to 4)
  for (let i = 0; i < 4; i++) {
    const weight = weights[i];

    // Skip if weight is zero
    if (weight === 0) continue;

    const boneIndex = indices[i];

    // Ensure valid bone index
    if (boneIndex < 0 || boneIndex >= skeleton.bones.length) continue;

    // Copy vertex position
    tempVertex.copy(vertex);

    // Create the bone transformation matrix:
    // boneMatrix = bone.matrixWorld * boneInverse
    tempMatrix.multiplyMatrices(
      skeleton.bones[boneIndex].matrixWorld,
      skeleton.boneInverses[boneIndex]
    );

    // Apply bone transformation
    tempVertex.applyMatrix4(tempMatrix);

    // Accumulate weighted position
    tempVertex.multiplyScalar(weight);
    target.add(tempVertex);
  }

  // Apply bind matrix inverse to go back to mesh local space
  target.applyMatrix4(mesh.bindMatrixInverse);

  // Apply mesh's world matrix to get final world position
  target.applyMatrix4(mesh.matrixWorld);

  return target;
}
