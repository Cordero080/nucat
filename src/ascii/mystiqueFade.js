/**
 * Mystique Fade - Gradual effect fade-out with that mysterious vibe
 *
 * Controls how effects gracefully dissolve back to the default state.
 * Adjust FADE_RATE for faster/slower transitions.
 */

import { params } from "../config.js";

// ═══════════════════════════════════════════════════════════════
// MYSTIQUE SETTINGS - Tweak these to control the fade feel
// ═══════════════════════════════════════════════════════════════

/**
 * Fade rate per frame (0.99 = slow, 0.95 = fast)
 * Current: 0.992 = ~5-8 seconds to fully fade
 */
const FADE_RATE = 0.992;

/**
 * Threshold to consider an effect "fully faded"
 * Lower = more complete fade before snapping to zero
 */
const FADE_THRESHOLD = 0.05;

/**
 * Default intensity to reset to after fade completes
 */
const DEFAULT_INTENSITY = 5.0;

// ═══════════════════════════════════════════════════════════════

/**
 * Process the mystique fade each frame
 * Call this in your animation loop when params._isReturning is true
 *
 * @returns {boolean} - true if fade is complete, false if still fading
 */
export function processMystiqueFade() {
  if (!params._isReturning) return false;

  // Fade global intensity
  params.effectIntensity *= FADE_RATE;

  // Fade all per-effect intensities
  Object.keys(params.effectParams).forEach((effectName) => {
    params.effectParams[effectName].intensity *= FADE_RATE;
  });

  // Fade disperse amount back to 0
  params.disperseAmount *= FADE_RATE;

  // Fade spiral flow progress
  params.spiralFlowProgress *= FADE_RATE;

  // Check if all effects have faded enough
  const allFaded =
    params.effectIntensity < FADE_THRESHOLD &&
    params.disperseAmount < FADE_THRESHOLD &&
    params.spiralFlowProgress < FADE_THRESHOLD;

  if (allFaded) {
    completeFade();
    return true;
  }

  return false;
}

/**
 * Complete the fade - reset everything to defaults
 */
function completeFade() {
  params.effectIntensity = 0;
  params.effectType = "none";

  // Turn off all active effects
  Object.keys(params.activeEffects).forEach((key) => {
    params.activeEffects[key] = false;
  });

  params._isReturning = false;
  params._spiralFlowActive = false;
  params.disperseAmount = 0;
  params.spiralFlowProgress = 0;

  // Reset intensities for next use
  params.effectIntensity = DEFAULT_INTENSITY;
  Object.keys(params.effectParams).forEach((effectName) => {
    params.effectParams[effectName].intensity = DEFAULT_INTENSITY;
  });

  params._focusedEffect = null;

  // Reset button colors
  if (params._resetAllButtons) {
    params._resetAllButtons();
  }
}

/**
 * Get current fade settings (for debugging/UI)
 */
export function getFadeSettings() {
  return {
    fadeRate: FADE_RATE,
    threshold: FADE_THRESHOLD,
    defaultIntensity: DEFAULT_INTENSITY,
  };
}
