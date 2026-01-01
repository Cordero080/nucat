/**
 * Camera utilities
 */

import * as THREE from "three";
import { camera, controls } from "../state.js";

/**
 * Auto-frame camera to fit the loaded model
 */
export function autoFrameCamera(fbx) {
  const box = new THREE.Box3().setFromObject(fbx);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraDistance = maxDim / (2 * Math.tan(fov / 2));

  // Padding to see full model with some margin
  cameraDistance *= 1.5;

  // Position camera to look at front of model
  camera.position.set(
    center.x,
    center.y + size.y * 0.1,
    center.x + cameraDistance
  );
  camera.lookAt(center);

  // Update controls
  controls.target.copy(center);
  controls.minDistance = cameraDistance * 0.3;
  controls.maxDistance = cameraDistance * 5;
  controls.update();

  // Update near/far planes
  camera.near = maxDim * 0.01;
  camera.far = cameraDistance * 20;
  camera.updateProjectionMatrix();

  console.log("\n=== AUTO-FRAME CAMERA ===");
  console.log("Model center:", center);
  console.log("Model size:", size);
  console.log("Camera distance:", cameraDistance);
  console.log("=========================\n");
}
