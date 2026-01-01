/**
 * ASCII Point Cloud Animation - Three.js + Mixamo FBX
 *
 * This application loads a Mixamo-animated FBX model and renders it as a
 * 3D ASCII point cloud that follows bone transformations in real-time.
 *
 * Key concepts:
 * - SkinnedMesh vertex sampling with bone transformations
 * - InstancedMesh for performant multi-character rendering
 * - AnimationMixer for Mixamo animation playback
 * - Post-processing bloom for cyberpunk glow effect
 */

import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import GUI from "three/addons/libs/lil-gui.module.min.js";

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
  // Available ASCII characters for point cloud
  characterSets: {
    // Block characters
    "Block Full": "█",
    "Block Dark": "▓",
    "Block Medium": "▒",
    "Block Light": "░",
    // Punctuation & Symbols
    "Question ?": "?",
    "Exclaim !": "!",
    "At @": "@",
    "Hash #": "#",
    "Dollar $": "$",
    "Percent %": "%",
    "Ampersand &": "&",
    "Asterisk *": "*",
    "Plus +": "+",
    "Equals =": "=",
    // Letters
    "Letter X": "X",
    "Letter O": "O",
    "Letter A": "A",
    "Letter Z": "Z",
    "Letter M": "M",
    "Letter W": "W",
    // Numbers
    "Number 0": "0",
    "Number 1": "1",
    "Number 8": "8",
    // Special
    "Bullet •": "•",
    "Cross ×": "×",
    "Tilde ~": "~",
    "Caret ^": "^",
    "Colon :": ":",
    "Dot .": ".",
    "Comma ,": ",",
    "Slash /": "/",
    "Backslash \\": "\\",
    "Pipe |": "|",
    "Underscore _": "_",
    "Hyphen -": "-",
  },

  // Color presets with cyberpunk aesthetic
  colorPresets: {
    Cyan: "#00ffff",
    Magenta: "#ff00ff",
    "Neon Green": "#00ff66",
    White: "#ffffff",
    "Hot Pink": "#ff0066",
    "Electric Blue": "#0066ff",
  },

  // ==========================================================================
  // DEFAULT SETTINGS - ADJUST THESE TO CHANGE INITIAL VALUES ON PAGE LOAD
  // ==========================================================================
  defaults: {
    character: "█", // Starting character - can be any from characterSets above
    samplingDensity: 1, // 1 = every vertex (dense), higher = sparser cloud
    characterSize: 10.8, // ADJUST THIS: Starting size (try 1.0, 5.0, 10.0 for bigger)
    color: "#00ffff", // Starting color (cyan)
    animationSpeed: 1.0, // Animation playback speed multiplier
    billboardMode: true, // true = characters face camera, false = follow mesh normals
    maxCharacters: 200000, // Max ASCII chars - high limit for adaptive subdivision
    emissiveIntensity: 0.3, // ADJUST THIS: Character glow (0 = no glow, 2 = very bright)
    bloomStrength: 0.8, // ADJUST THIS: Post-process bloom intensity (0-3)
    bloomRadius: 0.3, // Bloom spread radius (0-1)
    bloomThreshold: 0.5, // ADJUST THIS: Higher = less bloom, clearer shapes (0-2)
  },
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

let scene, camera, renderer, composer;
let controls;
let clock;
let mixer; // AnimationMixer for Mixamo animations
let skinnedMeshes = []; // Array of SkinnedMesh objects from FBX
let fbxModel; // Reference to loaded FBX model
let instancedMesh; // InstancedMesh for ASCII characters
let font; // Loaded 3D font
let currentGeometry; // Current character geometry

// Temporary objects for matrix calculations (reused for performance)
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempVertex = new THREE.Vector3();
const tempNormal = new THREE.Vector3();

// GUI-controlled parameters
const params = {
  character: CONFIG.defaults.character,
  samplingDensity: CONFIG.defaults.samplingDensity,
  characterSize: CONFIG.defaults.characterSize,
  color: CONFIG.defaults.color,
  animationSpeed: CONFIG.defaults.animationSpeed,
  billboardMode: CONFIG.defaults.billboardMode,
  emissiveIntensity: CONFIG.defaults.emissiveIntensity,
  bloomStrength: CONFIG.defaults.bloomStrength,
  bloomRadius: CONFIG.defaults.bloomRadius,
  bloomThreshold: CONFIG.defaults.bloomThreshold,
};

// Vertex sampling data
let sampledVertexIndices = []; // Indices of vertices to sample
let vertexWeights = []; // Bone weights for each sampled vertex
let vertexBoneIndices = []; // Bone indices for each sampled vertex

// ============================================================================
// INITIALIZATION
// ============================================================================

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

    // Load the 3D font for ASCII characters
    await loadFont();

    // Load the FBX model
    await loadFBXModel();

    // Setup GUI controls
    initGUI();

    // Hide loading indicator
    hideLoading();

    // Start animation loop
    clock = new THREE.Clock();
    animate();
  } catch (error) {
    console.error("Initialization failed:", error);
    showError(error.message);
  }
}

/**
 * Initialize the Three.js scene with cyberpunk background
 */
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x033363); // CHANGE THIS FOR BACKGROUND COLOR

  // No fog - it can hide objects that are too far
  // scene.fog = new THREE.Fog(0x0a0a0f, 50, 200);
}

/**
 * Initialize the perspective camera
 */
function initCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(0, 100, 200);
  camera.lookAt(0, 50, 0);
}

/**
 * Initialize the WebGL renderer
 */
function initRenderer() {
  const container = document.getElementById("canvas-container");

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  container.appendChild(renderer.domElement);

  // Handle window resize
  window.addEventListener("resize", onWindowResize);
}

/**
 * Initialize lighting for depth perception
 * Even though we're rendering ASCII, lights affect material appearance
 */
function initLighting() {
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

/**
 * Initialize OrbitControls for camera interaction
 */
function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 50, 0);
  controls.minDistance = 50;
  controls.maxDistance = 500;
  controls.update();
}

/**
 * Initialize post-processing pipeline with bloom effect
 */
function initPostProcessing() {
  composer = new EffectComposer(renderer);

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
}

// ============================================================================
// ASSET LOADING
// ============================================================================

/**
 * Load the 3D font for TextGeometry
 */
function loadFont() {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader();

    // Using helvetiker font from Three.js examples
    const fontUrl =
      "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/fonts/helvetiker_regular.typeface.json";

    loader.load(
      fontUrl,
      (loadedFont) => {
        font = loadedFont;
        console.log("Font loaded successfully");
        resolve();
      },
      undefined,
      (error) => {
        console.error("Font loading failed:", error);
        reject(new Error("Failed to load 3D font"));
      }
    );
  });
}

/**
 * Load the FBX model with Mixamo animation
 */
function loadFBXModel() {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader();

    loader.load(
      "./models/SLOW_QI.fbx",
      (fbx) => {
        console.log("FBX loaded:", fbx);

        // Keep original scale - we'll adjust camera to fit
        fbx.scale.setScalar(1);

        // Find all SkinnedMesh AND regular Mesh objects in the FBX
        fbx.traverse((child) => {
          if (child.isSkinnedMesh) {
            skinnedMeshes.push(child);
            console.log("Found SkinnedMesh:", child.name);
            console.log(
              "Vertex count:",
              child.geometry.attributes.position.count
            );
            // Hide original mesh - only show ASCII characters
            child.visible = false;

            // Log skeleton bones for debugging
            if (child.skeleton) {
              console.log("Skeleton bones:", child.skeleton.bones.length);
              child.skeleton.bones.forEach((bone, i) => {
                console.log(`  Bone ${i}: ${bone.name}`);
              });
            }
          } else if (child.isMesh) {
            // Also check for regular meshes (tail might be separate)
            console.log(
              "Found regular Mesh:",
              child.name,
              "vertices:",
              child.geometry.attributes.position.count
            );
          }
        });

        if (skinnedMeshes.length === 0) {
          reject(new Error("No SkinnedMesh found in FBX file"));
          return;
        }

        // Store FBX reference
        fbxModel = fbx;

        // ==========================================================================
        // ROTATE THE MODEL - CHANGE THIS NUMBER TO ROTATE (in radians)
        // Math.PI = 180 degrees, Math.PI/2 = 90 degrees
        // ==========================================================================
        fbx.rotation.y = Math.PI / 3; // 90 degrees to the left

        // Add FBX to scene (needed for skeleton/animation updates)
        scene.add(fbx);

        // Setup animation mixer
        setupAnimationMixer(fbx);

        // Initialize ASCII point cloud
        initializeASCIIPointCloud();

        // Auto-frame camera to fit model
        autoFrameCamera(fbx);

        resolve();
      },
      (progress) => {
        // Update loading progress if needed
        const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
        console.log(`Loading: ${percent}%`);
      },
      (error) => {
        console.error("FBX loading failed:", error);
        reject(
          new Error(
            `Failed to load FBX model: ${error.message || "Unknown error"}`
          )
        );
      }
    );
  });
}

/**
 * Setup AnimationMixer for Mixamo animation playback
 */
function setupAnimationMixer(fbx) {
  mixer = new THREE.AnimationMixer(fbx);

  // Play all animation clips (Mixamo FBX typically has one)
  if (fbx.animations && fbx.animations.length > 0) {
    fbx.animations.forEach((clip, index) => {
      console.log(
        `Animation clip ${index}: ${clip.name}, duration: ${clip.duration}s`
      );
      const action = mixer.clipAction(clip);
      action.play();
    });
  } else {
    console.warn("No animations found in FBX file");
  }
}

// ============================================================================
// ASCII POINT CLOUD SYSTEM
// ============================================================================

/**
 * Initialize the ASCII point cloud from skinned mesh vertices
 * This creates an InstancedMesh with one instance per sampled vertex
 */
function initializeASCIIPointCloud() {
  // Sample vertices from all skinned meshes
  sampleVertices();

  // Sample points along skeleton bones to fill gaps
  sampleSkeletonBones();

  // Create character geometry
  createCharacterGeometry();

  // Create instanced mesh
  createInstancedMesh();
}

/**
 * Sample points along TAIL bones ONLY - fills the tail gap
 */
function sampleSkeletonBones() {
  let totalBonePoints = 0;

  skinnedMeshes.forEach((mesh, meshIndex) => {
    if (!mesh.skeleton) return;

    const bones = mesh.skeleton.bones;

    // Find ONLY tail bones
    const tailBones = bones.filter((bone) =>
      bone.name.toLowerCase().includes("tail")
    );

    console.log(
      `Found ${tailBones.length} TAIL bones:`,
      tailBones.map((b) => b.name)
    );

    // For each tail bone, add MANY points along its length
    tailBones.forEach((bone) => {
      const boneIndex = bones.indexOf(bone);
      if (!bone.parent || !bone.parent.isBone) return;

      const parentBoneIndex = bones.indexOf(bone.parent);

      // Add MORE points per tail bone segment to fill the gap
      const pointsPerBone = 20;

      for (let i = 0; i <= pointsPerBone; i++) {
        if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters)
          return;

        const t = i / pointsPerBone;
        sampledVertexIndices.push({
          meshIndex,
          type: "bonePoint",
          boneIndex,
          parentBoneIndex,
          t,
        });

        vertexWeights.push(new THREE.Vector4(1, 0, 0, 0));
        vertexBoneIndices.push(new THREE.Vector4(boneIndex, 0, 0, 0));

        totalBonePoints++;
      }
    });
  });

  console.log(`TAIL bone points added: ${totalBonePoints}`);
}

/**
 * Sample vertices, face centers, edge points, AND interior points from skinned meshes
 * Uses dense sampling to fill ALL gaps including sparse areas like tails
 */
function sampleVertices() {
  sampledVertexIndices = [];
  vertexWeights = [];
  vertexBoneIndices = [];

  let totalVertices = 0;
  let totalFaceCenters = 0;
  let totalEdgePoints = 0;
  let totalInteriorPoints = 0;
  let totalAdaptivePoints = 0;

  skinnedMeshes.forEach((mesh, meshIndex) => {
    const geometry = mesh.geometry;
    const positionAttr = geometry.attributes.position;
    const skinIndexAttr = geometry.attributes.skinIndex;
    const skinWeightAttr = geometry.attributes.skinWeight;
    const indexAttr = geometry.index;

    const vertexCount = positionAttr.count;
    totalVertices += vertexCount;

    console.log(
      `Mesh ${meshIndex} (${mesh.name}): ${vertexCount} total vertices`
    );

    // Helper to add a sample point with bone weights
    const addSample = (sample, boneIdx, boneWeight) => {
      if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters)
        return false;
      sampledVertexIndices.push(sample);
      if (skinWeightAttr && skinIndexAttr && boneIdx && boneWeight) {
        vertexWeights.push(boneWeight);
        vertexBoneIndices.push(boneIdx);
      }
      return true;
    };

    // Helper to get vertex position
    const getPos = (idx) =>
      new THREE.Vector3(
        positionAttr.getX(idx),
        positionAttr.getY(idx),
        positionAttr.getZ(idx)
      );

    // Helper to calculate triangle area
    const triangleArea = (p0, p1, p2) => {
      const v0 = new THREE.Vector3().subVectors(p1, p0);
      const v1 = new THREE.Vector3().subVectors(p2, p0);
      return v0.cross(v1).length() * 0.5;
    };

    // Sample every Nth vertex based on sampling density
    for (let i = 0; i < vertexCount; i += params.samplingDensity) {
      if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters) break;
      addSample(
        { meshIndex, vertexIndex: i, type: "vertex" },
        skinIndexAttr
          ? new THREE.Vector4(
              skinIndexAttr.getX(i),
              skinIndexAttr.getY(i),
              skinIndexAttr.getZ(i),
              skinIndexAttr.getW(i)
            )
          : null,
        skinWeightAttr
          ? new THREE.Vector4(
              skinWeightAttr.getX(i),
              skinWeightAttr.getY(i),
              skinWeightAttr.getZ(i),
              skinWeightAttr.getW(i)
            )
          : null
      );
    }

    // Track unique edges to avoid duplicates
    const edgeSet = new Set();

    // ADAPTIVE SAMPLING: Sample more points in larger triangles
    if (indexAttr) {
      const faceCount = indexAttr.count / 3;

      // First pass: calculate average triangle area to determine "large" threshold
      let totalArea = 0;
      let maxArea = 0;
      for (let f = 0; f < faceCount; f++) {
        const p0 = getPos(indexAttr.getX(f * 3));
        const p1 = getPos(indexAttr.getX(f * 3 + 1));
        const p2 = getPos(indexAttr.getX(f * 3 + 2));
        const area = triangleArea(p0, p1, p2);
        totalArea += area;
        maxArea = Math.max(maxArea, area);
      }
      const avgArea = totalArea / faceCount;
      const largeThreshold = avgArea * 2; // Triangles 2x bigger than average get extra points

      console.log(
        `Mesh ${meshIndex}: avg triangle area = ${avgArea.toFixed(
          4
        )}, max = ${maxArea.toFixed(4)}, threshold = ${largeThreshold.toFixed(
          4
        )}`
      );

      for (let f = 0; f < faceCount; f += params.samplingDensity) {
        if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters) break;

        const i0 = indexAttr.getX(f * 3);
        const i1 = indexAttr.getX(f * 3 + 1);
        const i2 = indexAttr.getX(f * 3 + 2);

        // Get bone data for vertices
        const getBoneData = (idx) => ({
          weight: skinWeightAttr
            ? new THREE.Vector4(
                skinWeightAttr.getX(idx),
                skinWeightAttr.getY(idx),
                skinWeightAttr.getZ(idx),
                skinWeightAttr.getW(idx)
              )
            : null,
          index: skinIndexAttr
            ? new THREE.Vector4(
                skinIndexAttr.getX(idx),
                skinIndexAttr.getY(idx),
                skinIndexAttr.getZ(idx),
                skinIndexAttr.getW(idx)
              )
            : null,
        });

        const b0 = getBoneData(i0);

        // Calculate this triangle's area
        const p0 = getPos(i0);
        const p1 = getPos(i1);
        const p2 = getPos(i2);
        const area = triangleArea(p0, p1, p2);
        const isLargeTriangle = area > largeThreshold;

        // Add face center
        addSample(
          { meshIndex, type: "faceCenter", faceVertices: [i0, i1, i2] },
          b0.index,
          b0.weight
        );
        totalFaceCenters++;

        // Base interior points
        let barycentricPoints = [
          [0.5, 0.25, 0.25],
          [0.25, 0.5, 0.25],
          [0.25, 0.25, 0.5],
          [0.6, 0.2, 0.2],
          [0.2, 0.6, 0.2],
          [0.2, 0.2, 0.6],
        ];

        // ADAPTIVE: For large triangles, add MANY more interior points
        if (isLargeTriangle) {
          // Generate a dense grid of barycentric points
          const subdivisions = Math.min(10, Math.ceil(area / avgArea) + 3);
          barycentricPoints = [];
          for (let i = 0; i <= subdivisions; i++) {
            for (let j = 0; j <= subdivisions - i; j++) {
              const k = subdivisions - i - j;
              if (i + j + k === subdivisions) {
                const u = i / subdivisions;
                const v = j / subdivisions;
                const w = k / subdivisions;
                // Skip corners (vertices already sampled)
                if (
                  (u === 1 || v === 1 || w === 1) &&
                  (u === 0 || v === 0 || w === 0)
                )
                  continue;
                barycentricPoints.push([u, v, w]);
              }
            }
          }
          totalAdaptivePoints += barycentricPoints.length;
        }

        for (const bary of barycentricPoints) {
          if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters)
            break;
          addSample(
            { meshIndex, type: "interior", faceVertices: [i0, i1, i2], bary },
            b0.index,
            b0.weight
          );
          totalInteriorPoints++;
        }

        // Edge points - more points for large triangles
        const edgeTs = isLargeTriangle
          ? [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] // 9 points per edge for large triangles
          : [0.25, 0.5, 0.75]; // 3 points for normal triangles

        const edgePairs = [
          [i0, i1],
          [i1, i2],
          [i2, i0],
        ];

        for (const [a, b] of edgePairs) {
          const edgeKey = `${Math.min(a, b)}-${Math.max(a, b)}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);

            const ba = getBoneData(a);
            for (const t of edgeTs) {
              if (sampledVertexIndices.length >= CONFIG.defaults.maxCharacters)
                break;
              addSample(
                { meshIndex, type: "edgePoint", edgeVertices: [a, b], t },
                ba.index,
                ba.weight
              );
              totalEdgePoints++;
            }
          }
        }
      }
    }
  });

  console.log(`\n=== VERTEX SAMPLING SUMMARY ===`);
  console.log(`Total vertices available: ${totalVertices}`);
  console.log(
    `Vertices sampled: ${Math.floor(totalVertices / params.samplingDensity)}`
  );
  console.log(`Face centers added: ${totalFaceCenters}`);
  console.log(`Edge points added: ${totalEdgePoints}`);
  console.log(`Interior points added: ${totalInteriorPoints}`);
  console.log(
    `Adaptive extra points (large triangles): ${totalAdaptivePoints}`
  );
  console.log(`Sampling density: every ${params.samplingDensity}`);
  console.log(`FINAL TOTAL POINTS: ${sampledVertexIndices.length}`);
  console.log(`Max characters limit: ${CONFIG.defaults.maxCharacters}`);
  console.log(`================================\n`);
}

/**
 * Create the geometry for a single ASCII character using TextGeometry
 */
function createCharacterGeometry() {
  if (currentGeometry) {
    currentGeometry.dispose();
  }

  // ==========================================================================
  // TEXT GEOMETRY CREATION - ADJUST THESE FOR CHARACTER APPEARANCE
  // ==========================================================================
  currentGeometry = new TextGeometry(params.character, {
    font: font,
    size: params.characterSize, // Character size (controlled by GUI slider)
    depth: params.characterSize * 0.3, // ADJUST THIS: Character thickness (0.1 = flat, 1.0 = thick cube)
    curveSegments: 2, // ADJUST THIS: Curve smoothness (1-8, higher = smoother but slower)
    bevelEnabled: false, // ADJUST THIS: Set true for rounded edges
    // Uncomment below for bevel options if bevelEnabled is true:
    // bevelThickness: params.characterSize * 0.05,
    // bevelSize: params.characterSize * 0.03,
    // bevelSegments: 2,
  });

  // Center the geometry so it rotates around its center
  currentGeometry.computeBoundingBox();
  currentGeometry.center();

  console.log(
    `Created ASCII character geometry: "${params.character}" with size: ${params.characterSize}`
  );
}

/**
 * Create the InstancedMesh for efficient multi-character rendering
 */
function createInstancedMesh() {
  // Remove existing instanced mesh if present
  if (instancedMesh) {
    scene.remove(instancedMesh);
    instancedMesh.dispose();
  }

  // Create material with emissive properties for glow
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(params.color),
    emissive: new THREE.Color(params.color),
    emissiveIntensity: params.emissiveIntensity,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Create instanced mesh with sampled vertex count
  const instanceCount = sampledVertexIndices.length;
  instancedMesh = new THREE.InstancedMesh(
    currentGeometry,
    material,
    instanceCount
  );
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Initialize all instances with identity matrices
  for (let i = 0; i < instanceCount; i++) {
    tempMatrix.identity();
    instancedMesh.setMatrixAt(i, tempMatrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  scene.add(instancedMesh);

  console.log(`Created InstancedMesh with ${instanceCount} instances`);
}

/**
 * Update ASCII character positions based on current skeleton pose
 * This is the core function that samples transformed vertex positions
 *
 * HOW SKINNED MESH VERTEX SAMPLING WORKS:
 *
 * 1. Each vertex in a SkinnedMesh has up to 4 bone influences
 * 2. skinIndex attribute contains the indices of influencing bones
 * 3. skinWeight attribute contains the weight of each bone's influence
 * 4. The final vertex position is calculated by:
 *    - For each bone influence:
 *      a. Get the bone's world matrix from skeleton.boneMatrices
 *      b. Transform the original vertex by this matrix
 *      c. Multiply by the influence weight
 *    - Sum all weighted positions for final position
 *
 * 5. We also apply the mesh's world matrix to get world-space coordinates
 */
function updateASCIIPositions() {
  if (!instancedMesh || skinnedMeshes.length === 0) return;

  sampledVertexIndices.forEach((sample, instanceIndex) => {
    const mesh = skinnedMeshes[sample.meshIndex];
    const geometry = mesh.geometry;

    // Handle different sample types
    if (sample.type === "faceCenter") {
      // Face center: average 3 vertex positions
      const [i0, i1, i2] = sample.faceVertices;
      const p0 = new THREE.Vector3();
      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();

      getSkinnedVertexPosition(i0, mesh, p0);
      getSkinnedVertexPosition(i1, mesh, p1);
      getSkinnedVertexPosition(i2, mesh, p2);

      tempPosition.set(
        (p0.x + p1.x + p2.x) / 3,
        (p0.y + p1.y + p2.y) / 3,
        (p0.z + p1.z + p2.z) / 3
      );
    } else if (sample.type === "edgePoint") {
      // Edge point: interpolate between 2 vertices at position t
      const [a, b] = sample.edgeVertices;
      const t = sample.t;
      const pA = new THREE.Vector3();
      const pB = new THREE.Vector3();

      getSkinnedVertexPosition(a, mesh, pA);
      getSkinnedVertexPosition(b, mesh, pB);

      tempPosition.lerpVectors(pA, pB, t);
    } else if (sample.type === "interior") {
      // Interior point: barycentric interpolation of 3 vertices
      const [i0, i1, i2] = sample.faceVertices;
      const [u, v, w] = sample.bary;
      const p0 = new THREE.Vector3();
      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();

      getSkinnedVertexPosition(i0, mesh, p0);
      getSkinnedVertexPosition(i1, mesh, p1);
      getSkinnedVertexPosition(i2, mesh, p2);

      tempPosition.set(
        p0.x * u + p1.x * v + p2.x * w,
        p0.y * u + p1.y * v + p2.y * w,
        p0.z * u + p1.z * v + p2.z * w
      );
    } else if (sample.type === "edgeMidpoint") {
      // Legacy edge midpoint support
      const [a, b] = sample.edgeVertices;
      const pA = new THREE.Vector3();
      const pB = new THREE.Vector3();

      getSkinnedVertexPosition(a, mesh, pA);
      getSkinnedVertexPosition(b, mesh, pB);

      tempPosition.set((pA.x + pB.x) / 2, (pA.y + pB.y) / 2, (pA.z + pB.z) / 2);
    } else {
      // Regular vertex
      getSkinnedVertexPosition(sample.vertexIndex, mesh, tempPosition);
    }

    // Handle rotation based on billboard mode
    if (params.billboardMode) {
      // Billboard: character faces camera but stays upright
      // We need to counter the camera's rotation to face it, but keep Y-up
      // Create a rotation that looks at camera but doesn't flip the text
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      // Flip to face toward camera (not away)
      cameraDirection.negate();

      // Only rotate around Y axis to keep text upright
      const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
      tempQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    } else {
      // Use vertex normal for orientation (if available)
      const normalAttr = geometry.attributes.normal;
      if (normalAttr && sample.type === "vertex") {
        tempNormal.fromBufferAttribute(normalAttr, sample.vertexIndex);
        // Create rotation from normal direction
        tempQuaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          tempNormal.normalize()
        );
      } else {
        tempQuaternion.identity();
      }
    }

    // Set scale
    tempScale.setScalar(1);

    // Compose and set instance matrix
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    instancedMesh.setMatrixAt(instanceIndex, tempMatrix);
  });

  // Mark instance matrices as needing update
  instancedMesh.instanceMatrix.needsUpdate = true;
}

/**
 * Auto-frame camera to fit the loaded model
 */
function autoFrameCamera(fbx) {
  // Compute bounding box of the model
  const box = new THREE.Box3().setFromObject(fbx);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Get the maximum dimension
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraDistance = maxDim / (2 * Math.tan(fov / 2));

  // Padding to see full model with some margin (1.5 = 50% more distance)
  cameraDistance *= 1.5;

  // ==========================================================================
  // CAMERA STARTING POSITION - ADJUST THIS TO CHANGE THE VIEW ANGLE
  // ==========================================================================
  // center.z - cameraDistance = FRONT view (facing the model)
  // center.z + cameraDistance = BACK view (behind the model, sees tail)
  // center.x + cameraDistance = SIDE view (right side)
  // center.x - cameraDistance = SIDE view (left side)
  // ==========================================================================
  camera.position.set(
    center.x, // X position (left/right)
    center.y + size.y * 0.1, // Y position (up/down, slightly above center)
    center.x + cameraDistance // Z position (front/back) - CHANGE THIS FOR DIFFERENT VIEW
  );
  camera.lookAt(center);

  // Update controls target to model center
  controls.target.copy(center);
  controls.minDistance = cameraDistance * 0.3;
  controls.maxDistance = cameraDistance * 5;
  controls.update();

  // Update near/far planes based on model size
  camera.near = maxDim * 0.01;
  camera.far = cameraDistance * 20;
  camera.updateProjectionMatrix();

  console.log("\\n=== AUTO-FRAME CAMERA ===");
  console.log("Model center:", center);
  console.log("Model size:", size);
  console.log("Max dimension:", maxDim);
  console.log("Camera distance:", cameraDistance);
  console.log("=========================\\n");
}

/**
 * Apply bone skinning transformation to a vertex manually
 * This replicates what the GPU does during skinned mesh rendering
 *
 * HOW SKINNED MESH VERTEX TRANSFORMATION WORKS:
 *
 * 1. Each vertex has up to 4 bone influences stored in:
 *    - skinIndex: indices of the bones that affect this vertex
 *    - skinWeight: how much each bone affects this vertex (weights sum to 1)
 *
 * 2. The skeleton stores:
 *    - bones[]: array of Bone objects with current world matrices
 *    - boneInverses[]: inverse of each bone's bind pose matrix
 *
 * 3. For each bone influence, we:
 *    a. Start with the original vertex position
 *    b. Apply bindMatrix to transform to skeleton space
 *    c. Apply boneInverse to get position relative to bone's bind pose
 *    d. Apply bone's current world matrix to get animated position
 *    e. Multiply by the bone's weight
 *
 * 4. Sum all weighted positions for the final skinned position
 *
 * @param {number} vertexIndex - Index of the vertex in the geometry
 * @param {THREE.SkinnedMesh} mesh - The skinned mesh containing skeleton
 * @param {THREE.Vector3} target - Vector3 to store the result
 * @returns {THREE.Vector3} - Transformed vertex position in world space
 */
function getSkinnedVertexPosition(vertexIndex, mesh, target) {
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const skinIndex = geometry.attributes.skinIndex;
  const skinWeight = geometry.attributes.skinWeight;
  const skeleton = mesh.skeleton;

  // Reset target
  target.set(0, 0, 0);

  // Get original vertex position
  const vertex = new THREE.Vector3();
  vertex.fromBufferAttribute(position, vertexIndex);

  // Check if this vertex has any bone weights
  const weights = [
    skinWeight.getX(vertexIndex),
    skinWeight.getY(vertexIndex),
    skinWeight.getZ(vertexIndex),
    skinWeight.getW(vertexIndex),
  ];

  const totalWeight = weights[0] + weights[1] + weights[2] + weights[3];

  // If no bone weights, just use the original position transformed by mesh matrix
  if (totalWeight === 0) {
    target.copy(vertex);
    target.applyMatrix4(mesh.matrixWorld);
    return target;
  }

  // Apply bind matrix (transforms from mesh local space to skeleton space)
  vertex.applyMatrix4(mesh.bindMatrix);

  // Temporary vectors for calculations
  const tempVertex = new THREE.Vector3();
  const tempMatrix = new THREE.Matrix4();

  // Get skin indices for this vertex
  const indices = [
    skinIndex.getX(vertexIndex),
    skinIndex.getY(vertexIndex),
    skinIndex.getZ(vertexIndex),
    skinIndex.getW(vertexIndex),
  ];

  // Process each bone influence (up to 4)
  for (let i = 0; i < 4; i++) {
    const weight = weights[i];

    // Skip if weight is zero
    if (weight === 0) continue;

    const boneIndex = indices[i];

    // Ensure valid bone index
    if (boneIndex < 0 || boneIndex >= skeleton.bones.length) continue;

    // Copy vertex position
    tempVertex.copy(vertex);

    // Create the bone transformation matrix:
    // boneMatrix = bone.matrixWorld * boneInverse
    // This transforms from bind pose to current animated pose
    tempMatrix.multiplyMatrices(
      skeleton.bones[boneIndex].matrixWorld,
      skeleton.boneInverses[boneIndex]
    );

    // Apply bone transformation
    tempVertex.applyMatrix4(tempMatrix);

    // Accumulate weighted position
    tempVertex.multiplyScalar(weight);
    target.add(tempVertex);
  }

  // Apply bind matrix inverse to go back to mesh local space
  target.applyMatrix4(mesh.bindMatrixInverse);

  // Apply mesh's world matrix to get final world position
  target.applyMatrix4(mesh.matrixWorld);

  return target;
}

// ============================================================================
// GUI SETUP
// ============================================================================

/**
 * Initialize dat.GUI controls
 */
function initGUI() {
  const gui = new GUI();

  // Character settings folder
  const charFolder = gui.addFolder("Character Settings");

  // Character selection dropdown - use object for selection
  const charOptions = Object.keys(CONFIG.characterSets);
  const charSelection = { selected: "Block Full" }; // Default selection label

  charFolder
    .add(charSelection, "selected", charOptions)
    .name("Character")
    .onChange((selectedKey) => {
      params.character = CONFIG.characterSets[selectedKey];
      onCharacterChange();
    });

  // Sampling density
  charFolder
    .add(params, "samplingDensity", 1, 10, 1)
    .name("Sample Density")
    .onChange(onSamplingChange);

  // ==========================================================================
  // CHARACTER SIZE SLIDER - ADJUST THE RANGE HERE
  // Format: .add(params, "characterSize", MIN, MAX, STEP)
  // ==========================================================================
  charFolder
    .add(params, "characterSize", 0.1, 50.0, 0.5) // ADJUST: Change 50.0 to allow even bigger chars (try 100, 200)
    .name("Char Size")
    .onChange(onCharacterChange);

  // ==========================================================================
  // GLOW INTENSITY SLIDER - Controls character emissive brightness
  // ==========================================================================
  charFolder
    .add(params, "emissiveIntensity", 0, 2.0, 0.1) // ADJUST: Increase max (2.0) for brighter glow
    .name("Glow Intensity")
    .onChange(onGlowChange);

  charFolder.open();

  // Color settings folder
  const colorFolder = gui.addFolder("Color Settings");

  // Color picker
  colorFolder.addColor(params, "color").name("Color").onChange(onColorChange);

  // Color presets
  const presetController = colorFolder
    .add({ preset: "Cyan" }, "preset", Object.keys(CONFIG.colorPresets))
    .name("Presets");

  presetController.onChange((presetName) => {
    params.color = CONFIG.colorPresets[presetName];
    onColorChange();
    // Update the color picker in GUI
    gui.controllersRecursive().forEach((c) => {
      if (c.property === "color") c.updateDisplay();
    });
  });

  colorFolder.open();

  // Animation settings folder
  const animFolder = gui.addFolder("Animation");

  animFolder.add(params, "animationSpeed", 0.1, 3.0, 0.1).name("Speed");

  animFolder.add(params, "billboardMode").name("Billboard Mode");

  animFolder.open();

  // Bloom settings folder
  const bloomFolder = gui.addFolder("Bloom Effect");

  bloomFolder
    .add(params, "bloomStrength", 0, 3, 0.1)
    .name("Strength")
    .onChange(onBloomChange);

  bloomFolder
    .add(params, "bloomRadius", 0, 1, 0.05)
    .name("Radius")
    .onChange(onBloomChange);

  bloomFolder
    .add(params, "bloomThreshold", 0, 2, 0.1)
    .name("Threshold")
    .onChange(onBloomChange);

  // Note: Higher threshold = less bloom, clearer character shapes
  // If characters look like they're just glowing, increase threshold

  bloomFolder.open();

  // Reset to Defaults button
  const resetObj = {
    resetDefaults: function () {
      // Reset all parameters to optimal defaults
      params.character = CONFIG.defaults.character;
      params.samplingDensity = 1; // Every vertex for dense cloud
      params.characterSize = 0.8;
      params.color = CONFIG.defaults.color;
      params.animationSpeed = CONFIG.defaults.animationSpeed;
      params.billboardMode = CONFIG.defaults.billboardMode;
      params.bloomStrength = 1.5;
      params.bloomRadius = 0.4;
      params.bloomThreshold = 0.1;

      // Apply changes
      onSamplingChange();
      onColorChange();
      onBloomChange();

      // Update all GUI controllers to show new values
      gui.controllersRecursive().forEach((c) => c.updateDisplay());

      console.log("Reset to optimal defaults");
    },
  };

  gui.add(resetObj, "resetDefaults").name("🔄 Reset to Defaults");
}

/**
 * Handle character or size change
 */
function onCharacterChange() {
  createCharacterGeometry();

  // Recreate the entire instanced mesh with new geometry
  // (just swapping geometry doesn't work well with InstancedMesh)
  createInstancedMesh();

  console.log(
    `Character changed to: "${params.character}" with size: ${params.characterSize}`
  );
}

/**
 * Handle sampling density change
 */
function onSamplingChange() {
  // Re-sample vertices and recreate instanced mesh
  sampleVertices();
  createInstancedMesh();
}

/**
 * Handle color change
 */
function onColorChange() {
  if (instancedMesh && instancedMesh.material) {
    const color = new THREE.Color(params.color);
    instancedMesh.material.color = color;
    instancedMesh.material.emissive = color;
  }
}

/**
 * Handle glow intensity change
 */
function onGlowChange() {
  if (instancedMesh && instancedMesh.material) {
    instancedMesh.material.emissiveIntensity = params.emissiveIntensity;
  }
}

/**
 * Handle bloom parameter changes
 */
function onBloomChange() {
  if (composer && composer.bloomPass) {
    composer.bloomPass.strength = params.bloomStrength;
    composer.bloomPass.radius = params.bloomRadius;
    composer.bloomPass.threshold = params.bloomThreshold;
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle window resize
 */
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Hide the loading indicator
 */
function hideLoading() {
  const loading = document.getElementById("loading");
  if (loading) {
    loading.classList.add("hidden");
  }
}

/**
 * Show error message
 */
function showError(message) {
  hideLoading();

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.innerHTML = `
        <h2>⚠️ Error Loading Model</h2>
        <p>${message}</p>
        <p>Make sure the FBX file exists at:</p>
        <p><code>./models/SLOW_QI.fbx</code></p>
    `;
  document.body.appendChild(errorDiv);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

let frameCount = 0;

/**
 * Main animation loop
 */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Update animation mixer (plays Mixamo animation)
  if (mixer) {
    mixer.update(delta * params.animationSpeed);
  }

  // Update skinned meshes to apply bone transformations
  skinnedMeshes.forEach((mesh) => {
    mesh.skeleton.update();
  });

  // Update ASCII character positions to follow animation
  updateASCIIPositions();

  // Debug: log first frame info
  frameCount++;
  if (frameCount === 1) {
    console.log("\n=== FIRST FRAME DEBUG ===");
    console.log("Camera position:", camera.position);
    console.log("Camera target:", controls.target);
    console.log("InstancedMesh exists:", !!instancedMesh);
    if (instancedMesh) {
      console.log("InstancedMesh count:", instancedMesh.count);
      console.log("InstancedMesh visible:", instancedMesh.visible);
      console.log(
        "InstancedMesh in scene:",
        scene.children.includes(instancedMesh)
      );
      // Log first instance position
      const testMatrix = new THREE.Matrix4();
      instancedMesh.getMatrixAt(0, testMatrix);
      const testPos = new THREE.Vector3();
      testPos.setFromMatrixPosition(testMatrix);
      console.log("First instance position:", testPos);
    }
    console.log("=========================\n");
  }

  // Update orbit controls
  controls.update();

  // Render with post-processing
  composer.render();
}

// ============================================================================
// START APPLICATION
// ============================================================================

init();
