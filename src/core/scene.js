/**
 * Scene, Camera, and Renderer initialization
 */

import * as THREE from "three";
import { CONFIG } from "../config.js";
import { setScene, setCamera, setRenderer } from "../state.js";

/**
 * Initialize the Three.js scene
 */
export function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.scene.backgroundColor);
  setScene(scene);
  return scene;
}

/**
 * Initialize the perspective camera
 */
export function initCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    aspect,
    CONFIG.camera.near,
    CONFIG.camera.far
  );
  camera.position.set(
    CONFIG.camera.initialPosition.x,
    CONFIG.camera.initialPosition.y,
    CONFIG.camera.initialPosition.z
  );
  camera.lookAt(
    CONFIG.camera.lookAt.x,
    CONFIG.camera.lookAt.y,
    CONFIG.camera.lookAt.z
  );
  setCamera(camera);
  return camera;
}

/**
 * Initialize the WebGL renderer
 */
export function initRenderer() {
  const container = document.getElementById("canvas-container");

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  container.appendChild(renderer.domElement);
  setRenderer(renderer);
  return renderer;
}
