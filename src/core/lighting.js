/**
 * Lighting setup
 */

import * as THREE from "three";
import { scene } from "../state.js";

/**
 * Initialize lighting for depth perception
 */
export function initLighting() {
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  // Main directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(50, 100, 50);
  scene.add(directionalLight);

  // Secondary fill light from below for dramatic effect
  const fillLight = new THREE.DirectionalLight(0x00ffff, 0.3);
  fillLight.position.set(-50, -50, -50);
  scene.add(fillLight);
}
