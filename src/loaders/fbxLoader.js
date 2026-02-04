/**
 * FBX model and animation loading
 */

import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { CONFIG } from "../config.js";
import {
  scene,
  setFbxModel,
  setMixer,
  addSkinnedMesh,
  skinnedMeshes,
  clearSkinnedMeshes,
  clearSampledData,
  fbxModel,
  mixer,
  instancedMesh,
} from "../state.js";

/**
 * Load the FBX model with Mixamo animation
 */
export function loadFBXModel(modelPath = null) {
  const path = modelPath || CONFIG.model.path;

  return new Promise((resolve, reject) => {
    const loader = new FBXLoader();

    loader.load(
      path,
      (fbx) => {
        console.log("FBX loaded:", fbx);

        // Keep original scale - we'll adjust camera to fit
        fbx.scale.setScalar(1);

        // Find all SkinnedMesh objects in the FBX
        fbx.traverse((child) => {
          if (child.isSkinnedMesh) {
            addSkinnedMesh(child);
            console.log("Found SkinnedMesh:", child.name);
            console.log(
              "Vertex count:",
              child.geometry.attributes.position.count,
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
            console.log(
              "Found regular Mesh:",
              child.name,
              "vertices:",
              child.geometry.attributes.position.count,
            );
          }
        });

        if (skinnedMeshes.length === 0) {
          reject(new Error("No SkinnedMesh found in FBX file"));
          return;
        }

        // Store FBX reference
        setFbxModel(fbx);

        // Apply rotation
        fbx.rotation.y = CONFIG.model.rotationY;

        // Add FBX to scene
        scene.add(fbx);

        // Setup animation mixer
        setupAnimationMixer(fbx);

        resolve(fbx);
      },
      (progress) => {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
        console.log(`Loading: ${percent}%`);
      },
      (error) => {
        console.error("FBX loading failed:", error);
        reject(
          new Error(
            `Failed to load FBX model: ${error.message || "Unknown error"}`,
          ),
        );
      },
    );
  });
}

/**
 * Dispose of current model and clean up resources
 */
export function disposeCurrentModel() {
  // Stop and dispose mixer
  if (mixer) {
    mixer.stopAllAction();
    mixer.uncacheRoot(fbxModel);
  }

  // Dispose instanced mesh
  if (instancedMesh) {
    if (instancedMesh.parent) {
      instancedMesh.parent.remove(instancedMesh);
    }
    instancedMesh.geometry?.dispose();
    instancedMesh.material?.dispose();
  }

  // Dispose FBX model
  if (fbxModel) {
    scene.remove(fbxModel);
    fbxModel.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  // Clear state
  clearSkinnedMeshes();
  clearSampledData();
  setFbxModel(null);
  setMixer(null);

  console.log("🗑️ Previous model disposed");
}

/**
 * Setup AnimationMixer for Mixamo animation playback
 */
export function setupAnimationMixer(fbx) {
  const mixer = new THREE.AnimationMixer(fbx);

  if (fbx.animations && fbx.animations.length > 0) {
    fbx.animations.forEach((clip, index) => {
      console.log(
        `Animation clip ${index}: ${clip.name}, duration: ${clip.duration}s`,
      );
      const action = mixer.clipAction(clip);
      action.play();
    });
  } else {
    console.warn("No animations found in FBX file");
  }

  setMixer(mixer);
  return mixer;
}
