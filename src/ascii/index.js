/**
 * Initialize ASCII point cloud from skinned mesh
 */

import { sampleVertices, sampleSkeletonBones } from "./sampling.js";
import { createCharacterGeometry } from "./geometry.js";
import { createInstancedMesh } from "./instancedMesh.js";

/**
 * Initialize the ASCII point cloud from skinned mesh vertices
 */
export function initializeASCIIPointCloud() {
  // Sample vertices from all skinned meshes
  sampleVertices();

  // Sample points along skeleton bones to fill gaps
  sampleSkeletonBones();

  // Create character geometry
  createCharacterGeometry();

  // Create instanced mesh
  createInstancedMesh();
}

// Re-export for convenience
export { sampleVertices, sampleSkeletonBones } from "./sampling.js";
export { createCharacterGeometry } from "./geometry.js";
export { createInstancedMesh, updateASCIIPositions } from "./instancedMesh.js";
export { getSkinnedVertexPosition } from "./skinning.js";
