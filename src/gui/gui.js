/**
 * GUI setup with lil-gui
 * Split into two panels: Model Controls (left) and Animation Controls (right)
 */

import { initModelControls } from "./modelControls.js";
import { initAnimationControls } from "./animationControls.js";

/**
 * Initialize both GUI panels
 */
export function initGUI() {
  const modelGui = initModelControls();
  const animationGui = initAnimationControls();

  return { modelGui, animationGui };
}
