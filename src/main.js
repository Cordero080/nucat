/**
 * ASCII Point Cloud Animation - Three.js + Mixamo FBX
 *
 * Entry point - all logic is split into modules
 */

import * as THREE from "three";
import { params } from "./config.js";
import {
  setClock,
  clock,
  mixer,
  skinnedMeshes,
  controls,
  composer,
  updateEffectTime,
} from "./state.js";

// Core setup
import { initScene, initCamera, initRenderer } from "./core/scene.js";
import { initLighting } from "./core/lighting.js";
import { initControls } from "./core/controls.js";
import { initPostProcessing } from "./core/postprocessing.js";

// Loaders
import { loadFont } from "./loaders/fontLoader.js";
import { loadFBXModel } from "./loaders/fbxLoader.js";

// ASCII system
import {
  initializeASCIIPointCloud,
  updateASCIIPositions,
} from "./ascii/index.js";
import { processMystiqueFade } from "./ascii/mystiqueFade.js";

// GUI
import { initGUI } from "./gui/gui.js";

// Utils
import { autoFrameCamera } from "./utils/camera.js";
import { hideLoading, showError } from "./utils/ui.js";
import { onWindowResize } from "./utils/resize.js";

/**
 * Main initialization function
 */
async function init() {
  try {
    // Initialize core Three.js components
    initScene();
    initCamera();
    initRenderer();
    initLighting();
    initControls();
    initPostProcessing();

    // Window resize handler
    window.addEventListener("resize", onWindowResize);

    // Load assets
    await loadFont();
    const fbx = await loadFBXModel();

    // Initialize ASCII point cloud
    initializeASCIIPointCloud();

    // Auto-frame camera
    autoFrameCamera(fbx);

    // Setup GUI
    initGUI();

    // Hide loading, start animation
    hideLoading();
    setClock(new THREE.Clock());
    animate();
  } catch (error) {
    console.error("Initialization failed:", error);
    showError(error.message);
  }
}

/**
 * Main animation loop
 */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Update animation mixer
  if (mixer) {
    mixer.update(delta * params.animationSpeed);
  }

  // Update skinned meshes
  skinnedMeshes.forEach((mesh) => {
    mesh.skeleton.update();
  });

  // Update effect time
  updateEffectTime(delta);

  // Handle gradual return with mystique fade
  processMystiqueFade();

  // Animate disperse effect (works with button OR activeEffects)
  const disperseActive =
    params.activeEffects?.disperse || params.effectType === "disperse";
  const disperseTarget = params._disperseTarget ?? (disperseActive ? 1 : 0);
  params.disperseAmount +=
    (disperseTarget - params.disperseAmount) * 0.02 * params.effectSpeed;

  // Animate spiral flow effect
  const spiralFlowActive =
    params.activeEffects?.spiralFlow || params.effectType === "spiralFlow";
  if (params._spiralFlowActive || spiralFlowActive) {
    params.spiralFlowProgress += delta * params.spiralFlowSpeed;
    if (params.spiralFlowProgress > 5.0) {
      params.spiralFlowProgress = 0;
    }
  } else {
    params.spiralFlowProgress *= 0.95; // Smooth fade out
  }

  // Update ASCII positions
  updateASCIIPositions();

  // Update controls and render
  controls.update();
  composer.render();
}

// Start
init();
