/**
 * GUI change handlers
 */

import * as THREE from "three";
import { CONFIG, params } from "../config.js";
import { instancedMesh, composer } from "../state.js";
import { sampleVertices } from "../ascii/sampling.js";
import { createCharacterGeometry } from "../ascii/geometry.js";
import { createInstancedMesh } from "../ascii/instancedMesh.js";

/**
 * Handle character or size change
 */
export function onCharacterChange() {
  createCharacterGeometry();
  createInstancedMesh();
  console.log(
    `Character changed to: "${params.character}" with size: ${params.characterSize}`
  );
}

/**
 * Handle sampling density change
 */
export function onSamplingChange() {
  sampleVertices();
  createInstancedMesh();
}

/**
 * Handle color change
 */
export function onColorChange() {
  if (instancedMesh && instancedMesh.material) {
    const color = new THREE.Color(params.color);
    instancedMesh.material.color = color;
    instancedMesh.material.emissive = color;
  }
}

/**
 * Handle glow intensity change
 */
export function onGlowChange() {
  if (instancedMesh && instancedMesh.material) {
    instancedMesh.material.emissiveIntensity = params.emissiveIntensity;
  }
}

/**
 * Handle bloom parameter changes
 */
export function onBloomChange() {
  if (composer && composer.bloomPass) {
    composer.bloomPass.strength = params.bloomStrength;
    composer.bloomPass.radius = params.bloomRadius;
    composer.bloomPass.threshold = params.bloomThreshold;
  }
}

/**
 * Reset all parameters to defaults
 */
export function resetDefaults(gui) {
  params.character = CONFIG.defaults.character;
  params.samplingDensity = 1;
  params.characterSize = 0.8;
  params.color = CONFIG.defaults.color;
  params.animationSpeed = CONFIG.defaults.animationSpeed;
  params.billboardMode = CONFIG.defaults.billboardMode;
  params.bloomStrength = 1.5;
  params.bloomRadius = 0.4;
  params.bloomThreshold = 0.1;

  onSamplingChange();
  onColorChange();
  onBloomChange();

  if (gui) {
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
  }

  console.log("Reset to optimal defaults");
}
