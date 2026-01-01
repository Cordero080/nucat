/**
 * Font loading
 */

import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { CONFIG } from "../config.js";
import { setFont } from "../state.js";

/**
 * Load the 3D font for TextGeometry
 */
export function loadFont() {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader();

    loader.load(
      CONFIG.fontUrl,
      (loadedFont) => {
        setFont(loadedFont);
        console.log("Font loaded successfully");
        resolve(loadedFont);
      },
      undefined,
      (error) => {
        console.error("Font loading failed:", error);
        reject(new Error("Failed to load 3D font"));
      }
    );
  });
}
