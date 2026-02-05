/**
 * Landing Page - Three.js 3D Text Scene
 * Uses Orbitron/Audiowide style font for futuristic look
 */

import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

let scene, camera, renderer;
let letterMeshes = [];
let animationId;
let isActive = true;
let fadeProgress = 0;
let fadeStartTime = null;

// Animation timing
const WAVE_DURATION = 5.0; // seconds for one wave direction
const PAUSE_DURATION = 2.0; // seconds to pause between waves
const HALF_CYCLE = WAVE_DURATION + PAUSE_DURATION; // one direction + pause
const FULL_CYCLE = HALF_CYCLE * 2; // forward + pause + reverse + pause

// Font URLs - try Orbitron first, fallback to Helvetiker Bold
const FONT_URLS = [
  "https://cdn.jsdelivr.net/gh/nicholaswmin/three-orbitron-fonts@master/fonts/Orbitron_Bold.json",
  "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/fonts/helvetiker_bold.typeface.json",
];

/**
 * Initialize the landing page 3D scene
 */
export function initLandingScene() {
  const container = document.getElementById("landing-canvas");
  if (!container) {
    console.error("Landing canvas container not found");
    return;
  }

  console.log("Initializing landing scene...");

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 400;

  // Renderer with transparency
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Add lighting first
  addLighting();

  // Load font and create text
  loadFontWithFallback(0);

  // Handle resize
  window.addEventListener("resize", onResize);

  // Start animation
  animate();
}

/**
 * Try to load fonts with fallback
 */
function loadFontWithFallback(index) {
  if (index >= FONT_URLS.length) {
    console.error("All font URLs failed to load");
    return;
  }

  const loader = new FontLoader();
  console.log(`Trying to load font: ${FONT_URLS[index]}`);

  loader.load(
    FONT_URLS[index],
    (font) => {
      console.log("Font loaded successfully!");
      createTextMeshes(font);
    },
    undefined,
    (error) => {
      console.warn(`Font ${index} failed, trying next...`, error);
      loadFontWithFallback(index + 1);
    },
  );
}

/**
 * Create the 3D text meshes - individual letters for animation
 */
function createTextMeshes(font) {
  const letters = "NUCAT";
  const letterSpacing = 52; // space between letters
  const totalWidth = (letters.length - 1) * letterSpacing;
  const startX = -totalWidth / 2;

  letterMeshes = [];

  for (let i = 0; i < letters.length; i++) {
    const letterGeometry = new TextGeometry(letters[i], {
      font: font,
      size: 50,
      depth: 15,
      curveSegments: 1.5,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1.5,
      bevelOffset: 0,
      bevelSegments: 8,
    });

    letterGeometry.computeBoundingBox();
    letterGeometry.center();

    // Material for each letter - metallic purple with depth
    const letterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc084fc,
      emissive: 0x6b21a8,
      emissiveIntensity: 0.4,
      metalness: 1.0,
      roughness: 0.15,
      reflectivity: 1.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: 0,
    });

    const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
    letterMesh.position.x = startX + i * letterSpacing;
    letterMesh.position.y = 20;
    letterMesh.userData.baseY = 20;
    letterMesh.userData.index = i;

    scene.add(letterMesh);
    letterMeshes.push(letterMesh);
  }

  // Start fade animation
  fadeStartTime = performance.now();

  console.log("Letter meshes created!");
}

/**
 * Add lights to the scene
 */
function addLighting() {
  // Ambient light - brighter for visibility
  const ambient = new THREE.AmbientLight(0x4a3a6e, 1.2);
  scene.add(ambient);

  // Spotlight - main hero light shining on the title
  const spotlight = new THREE.SpotLight(0xffffff, 3.0);
  spotlight.position.set(0, 150, 200);
  spotlight.angle = Math.PI / 6;
  spotlight.penumbra = 0.8;
  spotlight.decay = 1.5;
  spotlight.distance = 600;
  scene.add(spotlight);

  // Key light - bright white from top-right for metallic highlights
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(100, 80, 100);
  scene.add(keyLight);

  // Main light - purple tint from front
  const mainLight = new THREE.DirectionalLight(0xa855f7, 1.2);
  mainLight.position.set(0, 30, 80);
  scene.add(mainLight);

  // Fill light - blue tint from left
  const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.8);
  fillLight.position.set(-80, 0, 50);
  scene.add(fillLight);

  // Rim light - magenta from behind for edge definition
  const rimLight = new THREE.DirectionalLight(0xec4899, 1.2);
  rimLight.position.set(0, -30, -80);
  scene.add(rimLight);

  // Bottom light - subtle purple for underside detail
  const bottomLight = new THREE.DirectionalLight(0x7c3aed, 0.5);
  bottomLight.position.set(0, -60, 30);
  scene.add(bottomLight);
}

/**
 * Animation loop
 */
function animate() {
  if (!isActive) return;

  animationId = requestAnimationFrame(animate);

  const time = performance.now() * 0.001;

  // Fade in animation
  if (fadeStartTime && fadeProgress < 1) {
    const elapsed = (performance.now() - fadeStartTime) / 1000;
    fadeProgress = Math.min(elapsed / 1.5, 1); // 1.5 second fade
    const eased = 1 - Math.pow(1 - fadeProgress, 3); // ease-out cubic

    letterMeshes.forEach((mesh) => {
      mesh.material.opacity = eased;
    });
  }

  // Animate letters - smooth water-like domino wave that reverses
  if (letterMeshes.length > 0) {
    const fullCycleTime = time % FULL_CYCLE;
    const isReversed = fullCycleTime >= HALF_CYCLE;
    const cycleTime = isReversed ? fullCycleTime - HALF_CYCLE : fullCycleTime;
    const numLetters = letterMeshes.length;

    letterMeshes.forEach((mesh, index) => {
      // Original gentle rotation and bob (always active)
      mesh.rotation.y = Math.sin(time * 0.3) * 0.1;
      const gentleBob = Math.sin(time * 0.5) * 3;

      // Domino wave effect - water-like continuous flow
      let waveBounce = 0;

      if (cycleTime < WAVE_DURATION) {
        // Reverse index direction every other cycle
        const letterIndex = isReversed ? numLetters - 1 - index : index;
        const delay = letterIndex * 0.4;
        const letterTime = cycleTime - delay;
        const letterDuration = 2.0; // longer, smoother bounce

        if (letterTime > 0 && letterTime < letterDuration) {
          // Super smooth easing - ease-in-out sine squared for water feel
          const progress = letterTime / letterDuration;
          const smoothProgress = Math.sin(progress * Math.PI);
          waveBounce = smoothProgress * smoothProgress * 8; // squared for extra smoothness
        }
      }
      // During pause, waveBounce stays 0 - smooth because sine naturally ends at 0

      mesh.position.y = mesh.userData.baseY + gentleBob + waveBounce;
    });
  }

  renderer.render(scene, camera);
}

/**
 * Handle window resize
 */
function onResize() {
  if (!renderer || !camera) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Cleanup landing scene
 */
export function destroyLandingScene() {
  isActive = false;

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  window.removeEventListener("resize", onResize);

  // Dispose geometries and materials
  letterMeshes.forEach((mesh) => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  letterMeshes = [];

  // Dispose renderer
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }
}
