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
import {
  initHolographicCube,
  updateHolographicCube,
} from "./core/holographicCube.js";

// Loaders
import { loadFBXModel } from "./loaders/fbxLoader.js";
import { loadFont } from "./loaders/fontLoader.js";

// ASCII system
import {
  initializeASCIIPointCloud,
  updateASCIIPositions,
} from "./ascii/index.js";
import { processMystiqueFade } from "./ascii/mystiqueFade.js";
import { processChaosMix } from "./ascii/chaosMix.js";

// GUI
import { initGUI } from "./gui/gui.js";

// Landing page
import {
  initLandingScene,
  destroyLandingScene,
} from "./landing/landingScene.js";

// Utils
import { autoFrameCamera } from "./utils/camera.js";
import { hideLoading, showError } from "./utils/ui.js";
import { onWindowResize } from "./utils/resize.js";

/**
 * Setup landing page interaction
 */
function setupLandingPage() {
  // Initialize 3D landing scene
  initLandingScene();

  const landing = document.getElementById("landing");
  const enterBtn = document.getElementById("enter-btn");
  const loading = document.getElementById("loading");
  const canvasContainer = document.getElementById("canvas-container");

  enterBtn.addEventListener("click", () => {
    // Fade out landing page
    landing.style.transition = "opacity 0.5s ease";
    landing.style.opacity = "0";

    setTimeout(() => {
      // Clean up landing scene
      destroyLandingScene();

      landing.classList.add("hidden");
      loading.classList.remove("hidden");
      canvasContainer.classList.remove("hidden");

      // Start the main app
      init();
    }, 500);
  });
}

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

    // Load font for ASCII characters
    await loadFont();

    // Load FBX model (no font needed - using Orbitron via canvas)
    const fbx = await loadFBXModel();

    // Initialize ASCII point cloud
    initializeASCIIPointCloud();

    // Initialize holographic cube (incubation chamber)
    // Size is calculated automatically from the FBX model bounds
    initHolographicCube();

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

  // Process chaos mix evolution
  processChaosMix(delta);

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

  // Update holographic cube (when incubated)
  updateHolographicCube(delta, clock.elapsedTime);

  // Update controls and render
  controls.update();
  composer.render();
}

// Start with landing page
setupLandingPage();
