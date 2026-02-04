/**
 * Hand Tracking Module
 * Uses MediaPipe Hands for webcam-based gesture control
 */

import * as THREE from "three";
import { params } from "../config.js";

// Hand tracking state
let hands = null;
let camera = null;
let videoElement = null;
let canvasElement = null;
let canvasCtx = null;
let isInitialized = false;
let isRunning = false;

// Hand data exposed to other modules
export let handPosition = new THREE.Vector3(0, 50, 0); // 3D position in scene space
export let handNormalized = { x: 0.5, y: 0.5 }; // 0-1 normalized screen position
export let handPresent = false;
export let gestureState = {
  isFist: false,
  isWaving: false,
  isPointing: false,
  isPinching: false,
};

// Gesture detection history
const positionHistory = [];
const HISTORY_LENGTH = 10;
let lastWaveCheck = 0;
let waveDirection = 0;
let waveCount = 0;

// MediaPipe hand landmark indices
const LANDMARKS = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_TIP: 20,
  INDEX_MCP: 5,
  MIDDLE_MCP: 9,
  RING_MCP: 13,
  PINKY_MCP: 17,
};

/**
 * Initialize hand tracking with MediaPipe
 */
export async function initHandTracking() {
  if (isInitialized) return;

  console.log("🖐️ Initializing hand tracking...");

  // Create video element for webcam
  videoElement = document.createElement("video");
  videoElement.id = "hand-tracking-video";
  videoElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 200px;
    height: 150px;
    border-radius: 12px;
    border: 2px solid rgba(0, 255, 255, 0.5);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    transform: scaleX(-1);
    z-index: 1000;
    opacity: 0.8;
    display: none;
  `;
  document.body.appendChild(videoElement);

  // Create canvas for debug overlay
  canvasElement = document.createElement("canvas");
  canvasElement.id = "hand-tracking-canvas";
  canvasElement.width = 200;
  canvasElement.height = 150;
  canvasElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 200px;
    height: 150px;
    border-radius: 12px;
    z-index: 1001;
    pointer-events: none;
    transform: scaleX(-1);
    display: none;
  `;
  document.body.appendChild(canvasElement);
  canvasCtx = canvasElement.getContext("2d");

  // Create status indicator
  const statusEl = document.createElement("div");
  statusEl.id = "hand-status";
  statusEl.style.cssText = `
    position: fixed;
    bottom: 180px;
    left: 20px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    color: #0ff;
    font-family: 'Menlo', monospace;
    font-size: 12px;
    border-radius: 8px;
    z-index: 1002;
    display: none;
  `;
  statusEl.textContent = "🖐️ Hand tracking ready";
  document.body.appendChild(statusEl);

  // Load MediaPipe Hands via CDN
  try {
    await loadMediaPipeScripts();
    await setupMediaPipeHands();
    isInitialized = true;
    console.log("✅ Hand tracking initialized");
  } catch (error) {
    console.error("❌ Failed to initialize hand tracking:", error);
    throw error;
  }
}

/**
 * Load MediaPipe scripts dynamically
 */
function loadMediaPipeScripts() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Hands) {
      resolve();
      return;
    }

    const scripts = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
    ];

    let loaded = 0;
    scripts.forEach((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        loaded++;
        if (loaded === scripts.length) {
          // Small delay to ensure globals are available
          setTimeout(resolve, 100);
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  });
}

/**
 * Set up MediaPipe Hands instance
 */
async function setupMediaPipeHands() {
  hands = new window.Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
  });

  hands.onResults(onHandResults);
}

/**
 * Start hand tracking (request webcam access)
 */
export async function startHandTracking() {
  if (!isInitialized) {
    await initHandTracking();
  }

  if (isRunning) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
    });

    videoElement.srcObject = stream;
    await videoElement.play();

    // Show UI elements
    videoElement.style.display = "block";
    canvasElement.style.display = "block";
    document.getElementById("hand-status").style.display = "block";

    // Start detection loop
    isRunning = true;
    detectLoop();

    console.log("🎥 Hand tracking started");
  } catch (error) {
    console.error("❌ Failed to access webcam:", error);
    throw error;
  }
}

/**
 * Stop hand tracking
 */
export function stopHandTracking() {
  if (!isRunning) return;

  isRunning = false;

  // Stop video stream
  if (videoElement && videoElement.srcObject) {
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }

  // Hide UI elements
  videoElement.style.display = "none";
  canvasElement.style.display = "none";
  document.getElementById("hand-status").style.display = "none";

  // Reset state
  handPresent = false;
  gestureState.isFist = false;
  gestureState.isWaving = false;

  console.log("🛑 Hand tracking stopped");
}

/**
 * Toggle hand tracking on/off
 */
export async function toggleHandTracking() {
  if (isRunning) {
    stopHandTracking();
    return false;
  } else {
    await startHandTracking();
    return true;
  }
}

/**
 * Detection loop - sends frames to MediaPipe
 */
async function detectLoop() {
  if (!isRunning) return;

  if (videoElement.readyState >= 2) {
    await hands.send({ image: videoElement });
  }

  requestAnimationFrame(detectLoop);
}

/**
 * Handle MediaPipe results
 */
function onHandResults(results) {
  // Clear canvas
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    handPresent = true;

    // Draw hand landmarks on debug canvas
    drawHandLandmarks(landmarks);

    // Get palm center (average of wrist and MCP joints)
    const palmX =
      (landmarks[LANDMARKS.WRIST].x +
        landmarks[LANDMARKS.INDEX_MCP].x +
        landmarks[LANDMARKS.PINKY_MCP].x) /
      3;
    const palmY =
      (landmarks[LANDMARKS.WRIST].y +
        landmarks[LANDMARKS.INDEX_MCP].y +
        landmarks[LANDMARKS.PINKY_MCP].y) /
      3;
    const palmZ = landmarks[LANDMARKS.WRIST].z;

    // Update normalized position (0-1)
    handNormalized.x = 1 - palmX; // Flip X for mirror
    handNormalized.y = palmY;

    // Convert to 3D scene space
    // X: -100 to 100, Y: 0 to 150, Z: based on hand depth
    handPosition.x = (handNormalized.x - 0.5) * 200;
    handPosition.y = (1 - handNormalized.y) * 150;
    handPosition.z = palmZ * -300; // Depth

    // Detect gestures
    detectGestures(landmarks);

    // Update status
    updateStatus();
  } else {
    handPresent = false;
    gestureState.isFist = false;
    gestureState.isWaving = false;
    updateStatus();
  }
}

/**
 * Draw hand landmarks on debug canvas
 */
function drawHandLandmarks(landmarks) {
  const w = canvasElement.width;
  const h = canvasElement.height;

  canvasCtx.fillStyle = "#0ff";
  canvasCtx.strokeStyle = "#0ff";
  canvasCtx.lineWidth = 2;

  // Draw connections
  const connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // Thumb
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // Index
    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Middle
    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Ring
    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Pinky
    [0, 17], // Palm
  ];

  canvasCtx.beginPath();
  connections.forEach(([a, b]) => {
    const ax = landmarks[a].x * w;
    const ay = landmarks[a].y * h;
    const bx = landmarks[b].x * w;
    const by = landmarks[b].y * h;
    canvasCtx.moveTo(ax, ay);
    canvasCtx.lineTo(bx, by);
  });
  canvasCtx.stroke();

  // Draw points
  landmarks.forEach((lm, i) => {
    const x = lm.x * w;
    const y = lm.y * h;
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, i === 0 ? 5 : 3, 0, Math.PI * 2);
    canvasCtx.fill();
  });
}

/**
 * Detect hand gestures from landmarks
 */
function detectGestures(landmarks) {
  // Store position history for wave detection
  positionHistory.push({ x: landmarks[LANDMARKS.WRIST].x, time: Date.now() });
  if (positionHistory.length > HISTORY_LENGTH) {
    positionHistory.shift();
  }

  // Fist detection: all fingertips are close to palm/MCP joints
  const wrist = landmarks[LANDMARKS.WRIST];
  const fingerTips = [
    landmarks[LANDMARKS.INDEX_TIP],
    landmarks[LANDMARKS.MIDDLE_TIP],
    landmarks[LANDMARKS.RING_TIP],
    landmarks[LANDMARKS.PINKY_TIP],
  ];
  const fingerMCPs = [
    landmarks[LANDMARKS.INDEX_MCP],
    landmarks[LANDMARKS.MIDDLE_MCP],
    landmarks[LANDMARKS.RING_MCP],
    landmarks[LANDMARKS.PINKY_MCP],
  ];

  // Check if fingers are curled (tips close to MCPs)
  let curledFingers = 0;
  fingerTips.forEach((tip, i) => {
    const mcp = fingerMCPs[i];
    const dist = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
    if (dist < 0.08) curledFingers++;
  });

  gestureState.isFist = curledFingers >= 3;

  // Wave detection: rapid horizontal movement
  if (positionHistory.length >= HISTORY_LENGTH) {
    const now = Date.now();
    if (now - lastWaveCheck > 100) {
      lastWaveCheck = now;

      const first = positionHistory[0];
      const last = positionHistory[positionHistory.length - 1];
      const dx = last.x - first.x;
      const dt = last.time - first.time;

      // Check for direction change
      const currentDirection = Math.sign(dx);
      if (currentDirection !== 0 && currentDirection !== waveDirection) {
        waveDirection = currentDirection;
        waveCount++;
      }

      // Detect wave: multiple direction changes with speed
      const speed = Math.abs(dx) / (dt / 1000);
      gestureState.isWaving = waveCount >= 3 && speed > 0.3;

      // Reset wave count after timeout
      if (speed < 0.1) {
        waveCount = 0;
      }
    }
  }

  // Pinch detection: thumb tip close to index tip
  const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
  const indexTip = landmarks[LANDMARKS.INDEX_TIP];
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  gestureState.isPinching = pinchDist < 0.05;
}

/**
 * Update status display
 */
function updateStatus() {
  const statusEl = document.getElementById("hand-status");
  if (!statusEl) return;

  if (!handPresent) {
    statusEl.textContent = "🖐️ Show your hand";
    statusEl.style.color = "#888";
  } else if (gestureState.isFist) {
    statusEl.textContent = "✊ FIST → Disperse!";
    statusEl.style.color = "#f0f";
  } else if (gestureState.isWaving) {
    statusEl.textContent = "👋 WAVE → Wave effect!";
    statusEl.style.color = "#0f0";
  } else if (gestureState.isPinching) {
    statusEl.textContent = "🤏 PINCH → Attract";
    statusEl.style.color = "#ff0";
  } else {
    statusEl.textContent = "🖐️ Move to push particles";
    statusEl.style.color = "#0ff";
  }
}

/**
 * Check if hand tracking is currently running
 */
export function isHandTrackingActive() {
  return isRunning;
}

/**
 * Get current hand influence for particle effects
 * Returns an object with force direction and strength
 */
export function getHandInfluence(particlePosition) {
  if (!handPresent || !params.handTrackingEnabled) {
    return { force: new THREE.Vector3(), strength: 0 };
  }

  // Calculate direction from hand to particle
  const direction = new THREE.Vector3().subVectors(
    particlePosition,
    handPosition
  );
  const distance = direction.length();

  // Influence falloff (stronger when closer)
  const maxDistance = params.handInfluenceRadius || 80;
  const strength = Math.max(0, 1 - distance / maxDistance);

  if (strength === 0) {
    return { force: new THREE.Vector3(), strength: 0 };
  }

  direction.normalize();

  // Modify based on gesture
  let force = direction.clone();
  let finalStrength = strength * (params.handInfluenceStrength || 15);

  if (gestureState.isPinching) {
    // Pinch attracts particles
    force.negate();
    finalStrength *= 1.5;
  }

  return { force, strength: finalStrength };
}
