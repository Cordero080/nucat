/**
 * GUI change handlers
 */

import * as THREE from "three";
import { CONFIG, params } from "../config.js";
import { instancedMesh, composer, scene, fbxModel } from "../state.js";
import { sampleVertices, sampleSkeletonBones } from "../ascii/sampling.js";
import { createCharacterGeometry } from "../ascii/geometry.js";
import { createInstancedMesh } from "../ascii/instancedMesh.js";
import { loadFBXModel, disposeCurrentModel } from "../loaders/fbxLoader.js";
import {
  initHolographicCube,
  isModelIncubated,
  release,
} from "../core/holographicCube.js";
import { autoFrameCamera } from "../utils/camera.js";

/**
 * Handle model change - load new FBX
 */
export async function onModelChange(modelPath) {
  console.log("🔄 Switching model to:", modelPath);

  // Release from incubation if active
  if (isModelIncubated()) {
    release();
  }

  // Dispose current model
  disposeCurrentModel();

  // Load new model
  try {
    const fbx = await loadFBXModel(modelPath);

    // Calculate model bounds for adaptive character sizing
    const box = new THREE.Box3().setFromObject(fbx);
    const modelSize = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);

    // Auto-adjust character size based on model size
    // Smaller models need smaller characters to look good
    const autoCharSize = Math.max(1, Math.min(15, maxDim / 25));
    params.characterSize = autoCharSize;
    console.log(
      `📏 Auto character size: ${autoCharSize.toFixed(1)} (model max dim: ${maxDim.toFixed(1)})`,
    );

    // Resample vertices and rebuild ASCII
    sampleVertices();
    sampleSkeletonBones();
    createCharacterGeometry();
    createInstancedMesh();

    // Reinitialize holographic cube with new model bounds
    initHolographicCube();

    // Reframe camera
    autoFrameCamera(fbx);

    console.log("✅ Model switched successfully");
  } catch (error) {
    console.error("❌ Failed to switch model:", error);
  }
}

/**
 * Handle character or size change
 */
export function onCharacterChange() {
  createCharacterGeometry();
  createInstancedMesh();
  console.log(
    `Character changed to: "${params.character}" with size: ${params.characterSize}`,
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
 * Handle background color change
 */
export function onBackgroundChange() {
  if (scene) {
    scene.background = new THREE.Color(params.backgroundColor);
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
