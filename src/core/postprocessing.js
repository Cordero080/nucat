/**
 * Post-processing with bloom effect
 */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { params } from "../config.js";
import { scene, camera, renderer, setComposer } from "../state.js";

/**
 * Initialize post-processing pipeline with bloom effect
 */
export function initPostProcessing() {
  const composer = new EffectComposer(renderer);

  // Standard render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Unreal bloom pass for neon glow effect
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    params.bloomStrength,
    params.bloomRadius,
    params.bloomThreshold
  );
  composer.addPass(bloomPass);

  // Store reference for GUI updates
  composer.bloomPass = bloomPass;

  setComposer(composer);
  return composer;
}
