/**
 * CHAOS MIX - Generative effect evolution using mathematical beauty
 *
 * Uses:
 * - Golden Ratio (φ = 1.618...) for harmonious color/intensity shifts
 * - Fibonacci sequence for organic timing
 * - Quantum-inspired probability blending
 * - Entropy that increases over time
 */

import { params } from "../config.js";

// ═══════════════════════════════════════════════════════════════
// MATHEMATICAL CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PHI = 1.6180339887498948482; // Golden ratio
const GOLDEN_ANGLE = 137.5077640500378546463; // degrees - for color harmony
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];

// ═══════════════════════════════════════════════════════════════
// CHAOS STATE
// ═══════════════════════════════════════════════════════════════

let isRunning = false;
let startTime = 0;
let lastEventTime = 0;
let fibIndex = 0;
let entropy = 0.1; // Starts low, increases over time
let colorHue = 0;
let cycleCount = 0;

// Callback to update button visuals
let onEffectChange = null;
let onColorChange = null;
let onParamsChange = null; // Updates GUI sliders

// Effect names for cycling - ordered by subtlety
const EFFECTS = ["hover", "wave", "spiral", "noise", "disperse", "spiralFlow"];

// Max effects at once (prevents chaos overload)
const MAX_ACTIVE_EFFECTS = 3;

// ═══════════════════════════════════════════════════════════════
// QUANTUM-INSPIRED PROBABILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Quantum superposition probability - effects have weighted chances
 * Returns value between 0 and 1 based on interference pattern
 */
function quantumProbability(effectIndex, time, entropy) {
  const phase1 = Math.sin(
    time * PHI + (effectIndex * GOLDEN_ANGLE * Math.PI) / 180
  );
  const phase2 = Math.cos(time / PHI + (effectIndex * Math.PI) / PHI);
  const interference = (phase1 + phase2) / 2;

  // Probability increases with entropy
  return ((interference + 1) / 2) * entropy;
}

/**
 * Fibonacci-based intensity oscillation
 */
function fibonacciIntensity(time, baseIntensity) {
  const fibPhase = FIBONACCI[Math.floor(time) % FIBONACCI.length];
  const oscillation = Math.sin((time * Math.PI) / fibPhase);
  return baseIntensity * (1 + oscillation * 0.5);
}

/**
 * Golden ratio color hue shift
 */
function goldenHue(time) {
  return (time * GOLDEN_ANGLE) % 360;
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize chaos mix with callbacks
 */
export function initChaosMix(
  effectChangeCallback,
  colorChangeCallback,
  paramsChangeCallback
) {
  onEffectChange = effectChangeCallback;
  onColorChange = colorChangeCallback;
  onParamsChange = paramsChangeCallback;
}

/**
 * Start the chaos mix
 */
export function startChaosMix() {
  isRunning = true;
  startTime = performance.now() / 1000;
  lastEventTime = startTime;
  fibIndex = 0;
  entropy = 0.2; // Start with some entropy
  cycleCount = 0;
  colorHue = Math.random() * 360; // Random starting hue

  // Immediately activate first effect so user sees something
  const firstEffect = EFFECTS[Math.floor(Math.random() * 3)]; // hover, noise, or wave
  params.activeEffects[firstEffect] = true;
  params._focusedEffect = firstEffect;
  params.effectParams[firstEffect].intensity = 10;
  params.effectParams[firstEffect].speed = 1;

  if (onEffectChange) {
    onEffectChange(firstEffect, "activate");
  }

  console.log(`🌀 CHAOS MIX initiated with ${firstEffect}`);
}

/**
 * Stop chaos mix (triggers mystique fade)
 */
export function stopChaosMix() {
  isRunning = false;
  params._isReturning = true;
  params._disperseTarget = 0;

  // Deactivate all effects
  Object.keys(params.activeEffects).forEach((key) => {
    params.activeEffects[key] = false;
  });
  params._focusedEffect = null;

  if (onEffectChange) {
    onEffectChange(null, "reset");
  }

  console.log("🌀 CHAOS MIX fading out...");
}

/**
 * Check if chaos mix is running
 */
export function isChaosMixRunning() {
  return isRunning;
}

/**
 * Process chaos mix each frame
 * Call this in your animation loop
 */
export function processChaosMix(delta) {
  if (!isRunning) return;

  const now = performance.now() / 1000;
  const elapsed = now - startTime;

  // Entropy increases over time (caps at 1.0) - faster ramp up
  entropy = Math.min(1.0, 0.2 + elapsed * 0.02);

  // Check if it's time for a Fibonacci event
  const nextEventTime =
    lastEventTime + FIBONACCI[fibIndex % FIBONACCI.length] * 0.5; // Faster events

  if (now >= nextEventTime) {
    triggerFibonacciEvent(elapsed);
    lastEventTime = now;
    fibIndex++;
    cycleCount++;
  }

  // Continuous evolution
  evolveEffects(elapsed, delta);
  evolveColor(elapsed);
  evolveBloom(elapsed);
}

/**
 * Trigger event on Fibonacci timing
 */
function triggerFibonacciEvent(elapsed) {
  // Count active effects
  const activeCount = Object.values(params.activeEffects).filter(
    (v) => v
  ).length;

  // Pick ONE random effect to toggle each event
  const effectIndex = Math.floor(Math.random() * EFFECTS.length);
  const effectName = EFFECTS[effectIndex];
  const prob = quantumProbability(effectIndex, elapsed, entropy);
  const threshold = 0.4; // Fixed threshold

  if (
    prob > threshold &&
    !params.activeEffects[effectName] &&
    activeCount < MAX_ACTIVE_EFFECTS
  ) {
    // Activate effect
    params.activeEffects[effectName] = true;
    params._focusedEffect = effectName;

    // Set balanced intensity based on effect type
    const baseIntensity =
      effectName === "noise" ? 3 : effectName === "disperse" ? 8 : 10;
    params.effectParams[effectName].intensity = baseIntensity + entropy * 5;
    params.effectParams[effectName].speed = 0.5 + entropy * 0.5;

    // Sync to global params for GUI display
    params.effectIntensity = params.effectParams[effectName].intensity;
    params.effectSpeed = params.effectParams[effectName].speed;

    if (onEffectChange) {
      onEffectChange(effectName, "activate");
    }
    if (onParamsChange) {
      onParamsChange();
    }

    console.log(
      `🌀 Chaos activated: ${effectName} (${activeCount + 1} active)`
    );
  } else if (
    params.activeEffects[effectName] &&
    (prob < 0.3 || activeCount >= MAX_ACTIVE_EFFECTS)
  ) {
    // Deactivate - more likely when many effects active
    params.activeEffects[effectName] = false;

    if (onEffectChange) {
      onEffectChange(effectName, "deactivate");
    }

    console.log(
      `🌀 Chaos deactivated: ${effectName} (${activeCount - 1} active)`
    );
  }

  // Special: Disperse target oscillates
  if (params.activeEffects.disperse) {
    params._disperseTarget = Math.random() > 0.5 ? 1 : 0.5;
  }

  // Special: Spiral flow
  if (params.activeEffects.spiralFlow) {
    params._spiralFlowActive = true;
  }
}

/**
 * Continuous effect evolution
 */
function evolveEffects(elapsed, delta) {
  // Evolve intensity for all active effects using phi
  Object.keys(params.effectParams).forEach((effectName, index) => {
    if (params.activeEffects[effectName]) {
      // Noise gets lower intensity to not overpower
      const maxIntensity =
        effectName === "noise" ? 8 : effectName === "disperse" ? 15 : 20;
      const baseIntensity = 3 + entropy * (maxIntensity - 3);
      const intensity = fibonacciIntensity(
        elapsed + index * PHI,
        baseIntensity
      );
      params.effectParams[effectName].intensity = intensity;

      // Speed varies with golden ratio
      const speed =
        0.3 + Math.sin((elapsed * PHI) / (index + 1)) * 0.3 * entropy;
      params.effectParams[effectName].speed = 0.3 + speed;
    }
  });

  // Sync focused effect to global params for GUI display
  if (params._focusedEffect && params.activeEffects[params._focusedEffect]) {
    params.effectIntensity =
      params.effectParams[params._focusedEffect].intensity;
    params.effectSpeed = params.effectParams[params._focusedEffect].speed;
  }

  // Update GUI sliders periodically (every ~10 frames)
  if (Math.floor(elapsed * 60) % 10 === 0 && onParamsChange) {
    onParamsChange();
  }
}

/**
 * Evolve bloom using Fibonacci
 */
function evolveBloom(elapsed) {
  const fibIndex = Math.floor(elapsed * 0.5) % FIBONACCI.length;
  const fibValue = FIBONACCI[fibIndex];

  // Bloom strength oscillates with phi
  params.bloomStrength =
    0.5 + Math.sin((elapsed * PHI) / fibValue) * 0.5 * entropy + entropy * 0.5;

  // Bloom radius varies subtly
  params.bloomRadius = 0.3 + Math.cos(elapsed / PHI) * 0.2 * entropy;
}

/**
 * Evolve color using golden angle
 */
function evolveColor(elapsed) {
  // Hue shifts by golden angle - faster
  colorHue = goldenHue(elapsed * 0.3);

  // Saturation pulses on Fibonacci rhythm
  const satIndex = Math.floor(elapsed) % FIBONACCI.length;
  const saturation =
    80 + Math.sin((elapsed * Math.PI) / FIBONACCI[satIndex]) * 20;

  // Lightness based on entropy
  const lightness = 55 + entropy * 10;

  const newColor = hslToHex(colorHue, saturation, lightness);

  if (params.color !== newColor) {
    params.color = newColor;
    if (onColorChange) {
      onColorChange(newColor);
    }
  }
}

/**
 * Get chaos state for debugging/UI
 */
export function getChaosState() {
  return {
    isRunning,
    entropy: entropy.toFixed(2),
    cycleCount,
    colorHue: Math.round(colorHue),
    activeEffects: Object.entries(params.activeEffects)
      .filter(([_, v]) => v)
      .map(([k]) => k),
  };
}
