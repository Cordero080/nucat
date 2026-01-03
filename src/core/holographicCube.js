/**
 * Holographic Cube Display - "Incubation Chamber"
 *
 * A multi-layered holographic cube that surrounds the nucat like a museum display.
 * When incubated, the model and cube rotate together as one unit.
 * User can drag to rotate (trackball style) or let it auto-rotate.
 */

import * as THREE from "three";
import { scene, camera, renderer, instancedMesh, fbxModel } from "../state.js";
import { params } from "../config.js";

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let isIncubated = false;
let incubationMode = "holographic"; // "holographic" or "rubix"
let cubeGroup = null; // Contains cube + model
let cubeSize = 300; // Will be calculated from model
let modelCenter = new THREE.Vector3(0, 100, 0);
let modelSize = new THREE.Vector3(100, 200, 100);

// Cube visual elements
let outerLayer = null;
let middleLayer = null;
let innerLayer = null;
let edgeWireframe = null;
let innerLight = null;

// Rubix cube elements
let rubixPanels = []; // Array of panel meshes
let rubixEdges = null;

// Rotation state
let autoRotate = true;
let rotationSpeed = { x: 0, y: 0 };
let isDragging = false;
let previousMouse = { x: 0, y: 0 };

// Animation
let edgeMaterial = null;
let middleMaterial = null;

// Callbacks
let onIncubateChange = null;
let onModeChange = null;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the holographic cube (call once at startup)
 */
export function initHolographicCube(options = {}) {
  // Calculate size from the actual FBX model bounds
  if (fbxModel) {
    const box = new THREE.Box3().setFromObject(fbxModel);
    modelCenter = box.getCenter(new THREE.Vector3());
    modelSize = box.getSize(new THREE.Vector3());

    // Cube should be slightly larger than the model
    cubeSize = Math.max(modelSize.x, modelSize.y, modelSize.z) * 1.3;

    console.log("🔮 Model bounds:", modelSize);
    console.log("🔮 Model center:", modelCenter);
    console.log("🔮 Cube size:", cubeSize);
  }

  const size = cubeSize;

  // Create the group that will hold everything
  cubeGroup = new THREE.Group();
  cubeGroup.position.copy(modelCenter);
  cubeGroup.visible = false; // Hidden until incubated

  // 1. OUTER LAYER - Very subtle, iridescent
  const outerGeom = new THREE.BoxGeometry(
    size * 1.02,
    size * 1.02,
    size * 1.02
  );
  const outerMat = new THREE.MeshPhysicalMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.06,
    metalness: 1.0,
    roughness: 0.0,
    transmission: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  outerLayer = new THREE.Mesh(outerGeom, outerMat);
  cubeGroup.add(outerLayer);

  // 2. MIDDLE LAYER - Shimmering, color-cycling
  const middleGeom = new THREE.BoxGeometry(size, size, size);
  middleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.12,
    metalness: 3.95,
    roughness: 0.02,
    transmission: 0.8,
    side: THREE.DoubleSide,
    emissive: 0x00ffff,
    emissiveIntensity: 0.2,
    depthWrite: false,
  });
  middleLayer = new THREE.Mesh(middleGeom, middleMaterial);
  cubeGroup.add(middleLayer);

  // 3. INNER LAYER - Core glow
  const innerGeom = new THREE.BoxGeometry(
    size * 0.98,
    size * 0.98,
    size * 0.98
  );
  const innerMat = new THREE.MeshPhysicalMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.04,
    metalness: 1.0,
    roughness: 0.0,
    transmission: 0.98,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  innerLayer = new THREE.Mesh(innerGeom, innerMat);
  cubeGroup.add(innerLayer);

  // 4. EDGE WIREFRAME - Color-cycling glow
  const edgesGeom = new THREE.EdgesGeometry(middleGeom);
  edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9,
    linewidth: 2,
  });
  edgeWireframe = new THREE.LineSegments(edgesGeom, edgeMaterial);
  cubeGroup.add(edgeWireframe);

  // 5. INTERIOR POINT LIGHT
  innerLight = new THREE.PointLight(0xff00ff, 1.5, size * 2);
  innerLight.position.set(0, 0, 0);
  cubeGroup.add(innerLight);

  // 6. RUBIX CUBE PANELS (hidden by default)
  createRubixPanels(size);

  // Add to scene (but invisible until incubated)
  scene.add(cubeGroup);

  // Setup mouse/touch interaction
  setupInteraction();

  console.log("🔮 Holographic cube initialized, size:", size);
}

/**
 * Create Rubix-style panels on each face of the cube
 */
function createRubixPanels(size) {
  rubixPanels = [];
  //                    WAS 3
  const gridSize = 13; // 3x3 grid per face
  const gap = 0.02; // Gap between panels (percentage)
  const panelSize = (size / gridSize) * (1 - gap);
  const offset = size / 2; // Distance from center to face

  // Face definitions: normal direction, up direction, position offset
  const faces = [
    {
      dir: new THREE.Vector3(0, 0, 1),
      up: new THREE.Vector3(0, 1, 0),
      pos: new THREE.Vector3(0, 0, offset),
    }, // Front
    {
      dir: new THREE.Vector3(0, 0, -1),
      up: new THREE.Vector3(0, 1, 0),
      pos: new THREE.Vector3(0, 0, -offset),
    }, // Back
    {
      dir: new THREE.Vector3(1, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      pos: new THREE.Vector3(offset, 0, 0),
    }, // Right
    {
      dir: new THREE.Vector3(-1, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      pos: new THREE.Vector3(-offset, 0, 0),
    }, // Left
    {
      dir: new THREE.Vector3(0, 1, 0),
      up: new THREE.Vector3(0, 0, -1),
      pos: new THREE.Vector3(0, offset, 0),
    }, // Top
    {
      dir: new THREE.Vector3(0, -1, 0),
      up: new THREE.Vector3(0, 0, 1),
      pos: new THREE.Vector3(0, -offset, 0),
    }, // Bottom
  ];

  const panelGeom = new THREE.PlaneGeometry(panelSize, panelSize);

  faces.forEach((face, faceIndex) => {
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const panelMat = new THREE.MeshPhysicalMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.3,
          metalness: 0.8,
          roughness: 0.1,
          emissive: 0x00ffff,
          emissiveIntensity: 0.3,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const panel = new THREE.Mesh(panelGeom, panelMat);

        // Calculate grid position relative to face center
        const gridOffset = (gridSize - 1) / 2;
        const localX = (col - gridOffset) * (size / gridSize);
        const localY = (row - gridOffset) * (size / gridSize);

        // Position panel on face
        panel.position.copy(face.pos);

        // Orient panel to face outward
        panel.lookAt(face.pos.clone().add(face.dir));

        // Offset within the face grid
        const right = new THREE.Vector3()
          .crossVectors(face.up, face.dir)
          .normalize();
        panel.position.add(right.clone().multiplyScalar(localX));
        panel.position.add(face.up.clone().multiplyScalar(localY));

        // Store metadata for animation
        panel.userData = {
          faceIndex,
          row,
          col,
          basePosition: panel.position.clone(),
          phase: faceIndex * 0.5 + row * 0.3 + col * 0.2, // Unique phase for wave
          direction: face.dir.clone(),
        };

        panel.visible = false; // Hidden until rubix mode
        rubixPanels.push(panel);
        cubeGroup.add(panel);
      }
    }
  });

  // Rubix edge wireframe (slightly larger)
  const rubixEdgeGeom = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(size * 1.01, size * 1.01, size * 1.01)
  );
  rubixEdges = new THREE.LineSegments(
    rubixEdgeGeom,
    new THREE.LineBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.8,
    })
  );
  rubixEdges.visible = false;
  cubeGroup.add(rubixEdges);

  console.log("🎲 Rubix panels created:", rubixPanels.length);
}

/**
 * Setup mouse drag interaction for trackball rotation
 */
function setupInteraction() {
  const canvas = renderer.domElement;

  canvas.addEventListener("pointerdown", (e) => {
    if (!isIncubated) return;
    isDragging = true;
    previousMouse = { x: e.clientX, y: e.clientY };
    autoRotate = false; // Stop auto-rotate when user interacts
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!isIncubated || !isDragging) return;

    const deltaX = e.clientX - previousMouse.x;
    const deltaY = e.clientY - previousMouse.y;

    rotationSpeed.x = deltaX * 0.005;
    rotationSpeed.y = deltaY * 0.005;

    previousMouse = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener("pointerup", () => {
    isDragging = false;
    // Resume auto-rotate after 3 seconds of no interaction
    setTimeout(() => {
      if (!isDragging) autoRotate = true;
    }, 3000);
  });

  canvas.addEventListener("pointerleave", () => {
    isDragging = false;
  });
}

// ═══════════════════════════════════════════════════════════════
// INCUBATION CONTROL
// ═══════════════════════════════════════════════════════════════

/**
 * Incubate the model - put it inside the cube
 */
export function incubate() {
  if (isIncubated || !cubeGroup) return;

  isIncubated = true;
  cubeGroup.visible = true;

  // Scale down the entire display for better framing
  cubeGroup.scale.setScalar(0.6);

  // Move the instanced mesh into the cube group
  if (instancedMesh && instancedMesh.parent === scene) {
    // Store original position
    const originalPos = instancedMesh.position.clone();

    scene.remove(instancedMesh);
    cubeGroup.add(instancedMesh);

    // Position relative to cube center
    // The cube is centered on modelCenter, but we want the figure grounded (feet at bottom)
    // So we need to shift down by half the cube size, then up by the model's base offset
    const cubeBottom = -cubeSize / 2;
    const modelBottom = -modelSize.y / 2; // Model's feet relative to its center
    const yOffset = cubeBottom - modelBottom; // This grounds the feet at the cube bottom

    instancedMesh.position.set(
      -modelCenter.x,
      -modelCenter.y + yOffset,
      -modelCenter.z
    );

    console.log(
      "🔮 InstancedMesh moved into cube, offset:",
      instancedMesh.position
    );
  }

  // Sync cube color with current character color
  updateCubeColor(params.color);

  autoRotate = true;
  rotationSpeed = { x: 0, y: 0 };

  if (onIncubateChange) onIncubateChange(true);
  console.log("🔮 Nucat incubated");
}

/**
 * Release the model from incubation
 */
export function release() {
  if (!isIncubated || !cubeGroup) return;

  isIncubated = false;
  cubeGroup.visible = false;

  // Reset scale
  cubeGroup.scale.setScalar(1);

  // Move the instanced mesh back to scene root
  if (instancedMesh && instancedMesh.parent === cubeGroup) {
    cubeGroup.remove(instancedMesh);
    scene.add(instancedMesh);
    instancedMesh.position.set(0, 0, 0); // Reset position
  }

  // Reset cube rotation
  cubeGroup.quaternion.identity();

  if (onIncubateChange) onIncubateChange(false);
  console.log("🔮 Nucat released");
}

/**
 * Toggle incubation state
 */
export function toggleIncubation() {
  if (isIncubated) {
    release();
  } else {
    incubate();
  }
  return isIncubated;
}

/**
 * Check if currently incubated
 */
export function isModelIncubated() {
  return isIncubated;
}

/**
 * Set callback for incubation state changes
 */
export function setOnIncubateChange(callback) {
  onIncubateChange = callback;
}

// ═══════════════════════════════════════════════════════════════
// ANIMATION UPDATE
// ═══════════════════════════════════════════════════════════════

/**
 * Update the holographic cube each frame
 * Call this in the animation loop
 */
export function updateHolographicCube(delta, elapsedTime) {
  if (!isIncubated || !cubeGroup) return;

  // ─── ROTATION ───
  if (isDragging && (rotationSpeed.x !== 0 || rotationSpeed.y !== 0)) {
    // Trackball rotation from user drag
    const rotX = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -rotationSpeed.y
    );
    const rotY = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotationSpeed.x
    );
    const rotation = new THREE.Quaternion().multiplyQuaternions(rotY, rotX);
    cubeGroup.quaternion.premultiply(rotation);

    // Damping
    rotationSpeed.x *= 0.92;
    rotationSpeed.y *= 0.92;
  } else if (autoRotate) {
    // Gentle auto-rotate on Y axis
    const autoRotY = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      delta * 0.3
    );
    cubeGroup.quaternion.premultiply(autoRotY);
  }

  // ─── EDGE COLOR CYCLING ───
  if (edgeMaterial) {
    const time = elapsedTime;
    const r = Math.sin(time * 0.5) * 0.5 + 0.5;
    const g = Math.sin(time * 0.5 + 2) * 0.5 + 0.5;
    const b = Math.sin(time * 0.5 + 4) * 0.5 + 0.5;
    edgeMaterial.color.setRGB(r, g, b);
    edgeMaterial.opacity = 0.1 + Math.sin(time * 1.5) * 0.2;
  }

  // ─── MIDDLE LAYER SHIMMER ───
  if (middleMaterial) {
    const shimmerTime = elapsedTime * 0.8;
    const hue = (shimmerTime * 0.1) % 1;
    const r = Math.abs(Math.sin((shimmerTime + hue * 6.28) * 0.5)) * 0.5 + 0.3;
    const g =
      Math.abs(Math.sin((shimmerTime + hue * 6.28 + 2) * 0.5)) * 0.5 + 0.3;
    const b =
      Math.abs(Math.sin((shimmerTime + hue * 6.28 + 4) * 0.5)) * 0.5 + 0.5;
    middleMaterial.color.setRGB(r, g, b);
    middleMaterial.emissiveIntensity = 0.2 + Math.sin(shimmerTime * 2) * 0.1;
  }

  // ─── INNER LIGHT PULSE ───
  if (innerLight) {
    innerLight.intensity = 1.5 + Math.sin(elapsedTime * 1) * 0.5;
  }

  // ─── SUBTLE FLOATING ───
  cubeGroup.position.y = modelCenter.y + Math.sin(elapsedTime * 0.5) * 5;

  // ─── RUBIX PANEL ANIMATION ───
  if (incubationMode === "rubix") {
    animateRubixPanels(elapsedTime);
  }
}

/**
 * Animate Rubix panels - push in/out in waves
 */
function animateRubixPanels(time) {
  rubixPanels.forEach((panel) => {
    const { basePosition, phase, direction, faceIndex, row, col } =
      panel.userData;

    // Wave animation - panels push in and out
    const waveSpeed = 1.5;
    const waveAmplitude = cubeSize * 0.08; // How far panels move

    // Multiple wave patterns combined
    const wave1 = Math.sin(time * waveSpeed + phase) * 0.5;
    const wave2 = Math.sin(time * waveSpeed * 0.7 + phase * 1.3) * 0.3;
    const wave3 = Math.sin(time * waveSpeed * 1.5 + faceIndex) * 0.2;

    const displacement = (wave1 + wave2 + wave3) * waveAmplitude;

    // Move panel along its face normal
    panel.position.copy(basePosition);
    panel.position.add(direction.clone().multiplyScalar(displacement));

    // Color cycling per panel
    const hue = (time * 0.2 + phase * 0.1) % 1;
    const r = Math.abs(Math.sin(hue * Math.PI * 2));
    const g = Math.abs(Math.sin((hue + 0.33) * Math.PI * 2));
    const b = Math.abs(Math.sin((hue + 0.66) * Math.PI * 2));

    panel.material.color.setRGB(r * 0.5 + 0.3, g * 0.5 + 0.3, b * 0.5 + 0.5);
    panel.material.emissive.setRGB(r, g, b);
    panel.material.emissiveIntensity = 0.3 + wave1 * 0.2;
    panel.material.opacity = 0.25 + Math.abs(wave1) * 0.15;
  });

  // Rubix edges color
  if (rubixEdges) {
    const r = Math.sin(time * 0.5) * 0.5 + 0.5;
    const g = Math.sin(time * 0.5 + 2) * 0.5 + 0.5;
    const b = Math.sin(time * 0.5 + 4) * 0.5 + 0.5;
    rubixEdges.material.color.setRGB(r, g, b);
  }
}

// ═══════════════════════════════════════════════════════════════
// COLOR SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Update cube color to match character (or keep cycling)
 */
export function updateCubeColor(hexColor) {
  // The cube does its own color cycling, but we can tint it
  // For now, let the cube do its spectral thing
}

/**
 * Get cube group for external manipulation if needed
 */
export function getCubeGroup() {
  return cubeGroup;
}

// ═══════════════════════════════════════════════════════════════
// MODE SWITCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Set incubation mode: "holographic" or "rubix"
 */
export function setIncubationMode(mode) {
  incubationMode = mode;

  // Toggle visibility of elements based on mode
  const isHolo = mode === "holographic";
  const isRubix = mode === "rubix";

  // Holographic elements
  if (outerLayer) outerLayer.visible = isHolo;
  if (middleLayer) middleLayer.visible = isHolo;
  if (innerLayer) innerLayer.visible = isHolo;
  if (edgeWireframe) edgeWireframe.visible = isHolo;

  // Rubix elements
  rubixPanels.forEach((panel) => (panel.visible = isRubix));
  if (rubixEdges) rubixEdges.visible = isRubix;

  if (onModeChange) onModeChange(mode);
  console.log("🔮 Incubation mode:", mode);
}

/**
 * Get current incubation mode
 */
export function getIncubationMode() {
  return incubationMode;
}

/**
 * Toggle between holographic and rubix modes
 */
export function toggleIncubationMode() {
  const newMode = incubationMode === "holographic" ? "rubix" : "holographic";
  setIncubationMode(newMode);
  return newMode;
}

/**
 * Set callback for mode changes
 */
export function setOnModeChange(callback) {
  onModeChange = callback;
}

/**
 * Get the cube group (for adding instancedMesh when incubated)
 */
export function getIncubationContainer() {
  return isIncubated ? cubeGroup : null;
}

/**
 * Re-add instancedMesh to cube group after it's recreated
 * Call this after createInstancedMesh() if incubated
 */
export function reattachInstancedMesh(newMesh) {
  if (!isIncubated || !cubeGroup || !newMesh) return;

  // Remove from scene if it was added there
  if (newMesh.parent === scene) {
    scene.remove(newMesh);
  }

  // Add to cube group
  cubeGroup.add(newMesh);

  // Position correctly within the cube
  const cubeBottom = -cubeSize / 2;
  const modelBottom = -modelSize.y / 2;
  const yOffset = cubeBottom - modelBottom;

  newMesh.position.set(
    -modelCenter.x,
    -modelCenter.y + yOffset,
    -modelCenter.z
  );

  console.log("🔮 Reattached instancedMesh to cube group");
}
