/**
 * Window resize handler
 */

import { camera, renderer, composer } from "../state.js";

/**
 * Handle window resize
 */
export function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
}
