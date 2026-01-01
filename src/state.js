/**
 * Global State
 * Shared variables across all modules
 */

import * as THREE from "three";

// Core Three.js objects
export let scene = null;
export let camera = null;
export let renderer = null;
export let composer = null;
export let controls = null;
export let clock = null;

// Animation
export let mixer = null;

// Model data
export let skinnedMeshes = [];
export let fbxModel = null;

// ASCII rendering
export let instancedMesh = null;
export let font = null;
export let currentGeometry = null;

// Vertex sampling data
export let sampledVertexIndices = [];
export let vertexWeights = [];
export let vertexBoneIndices = [];

// Temporary objects for matrix calculations (reused for performance)
export const tempMatrix = new THREE.Matrix4();
export const tempPosition = new THREE.Vector3();
export const tempQuaternion = new THREE.Quaternion();
export const tempScale = new THREE.Vector3();
export const tempVertex = new THREE.Vector3();
export const tempNormal = new THREE.Vector3();

// Setters for modules to update state
export function setScene(s) {
  scene = s;
}
export function setCamera(c) {
  camera = c;
}
export function setRenderer(r) {
  renderer = r;
}
export function setComposer(c) {
  composer = c;
}
export function setControls(c) {
  controls = c;
}
export function setClock(c) {
  clock = c;
}
export function setMixer(m) {
  mixer = m;
}
export function setFbxModel(f) {
  fbxModel = f;
}
export function setInstancedMesh(im) {
  instancedMesh = im;
}
export function setFont(f) {
  font = f;
}
export function setCurrentGeometry(g) {
  currentGeometry = g;
}

export function addSkinnedMesh(mesh) {
  skinnedMeshes.push(mesh);
}

export function clearSkinnedMeshes() {
  skinnedMeshes = [];
}

export function setSampledVertexIndices(arr) {
  sampledVertexIndices = arr;
}

export function setVertexWeights(arr) {
  vertexWeights = arr;
}

export function setVertexBoneIndices(arr) {
  vertexBoneIndices = arr;
}

export function pushSampledVertex(sample) {
  sampledVertexIndices.push(sample);
}

export function pushVertexWeight(weight) {
  vertexWeights.push(weight);
}

export function pushVertexBoneIndex(index) {
  vertexBoneIndices.push(index);
}
