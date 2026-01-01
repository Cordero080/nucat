/**
 * OrbitControls setup
 */

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { camera, renderer, setControls } from "../state.js";

/**
 * Initialize OrbitControls for camera interaction
 */
export function initControls() {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 50, 0);
  controls.minDistance = 50;
  controls.maxDistance = 500;
  controls.update();
  setControls(controls);
  return controls;
}
