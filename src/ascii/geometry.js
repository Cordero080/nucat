/**
 * ASCII character geometry creation
 */

import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { params } from "../config.js";
import { font, currentGeometry, setCurrentGeometry } from "../state.js";

/**
 * Create the geometry for a single ASCII character using TextGeometry
 */
export function createCharacterGeometry() {
  if (currentGeometry) {
    currentGeometry.dispose();
  }

  const geometry = new TextGeometry(params.character, {
    font: font,
    size: params.characterSize,
    depth: params.characterSize * 0.3,
    curveSegments: 2,
    bevelEnabled: false,
  });

  // Center the geometry so it rotates around its center
  geometry.computeBoundingBox();
  geometry.center();

  setCurrentGeometry(geometry);

  console.log(
    `Created ASCII character geometry: "${params.character}" with size: ${params.characterSize}`
  );

  return geometry;
}
