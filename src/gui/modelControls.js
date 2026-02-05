/**
 * Model Controls Panel - Left side
 * Character settings, color, model selection
 */

import GUI from "three/addons/libs/lil-gui.module.min.js";
import { CONFIG, params } from "../config.js";
import {
  onCharacterChange,
  onSamplingChange,
  onColorChange,
  onGlowChange,
  onBackgroundChange,
  resetDefaults,
  onModelChange,
} from "./handlers.js";

/**
 * Initialize model controls panel (left side)
 */
export function initModelControls() {
  const gui = new GUI({ title: "MODEL CONTROLS" });

  // Position on left side
  gui.domElement.style.position = "fixed";
  gui.domElement.style.left = "0";
  gui.domElement.style.right = "auto";
  gui.domElement.style.top = "0";
  gui.domElement.style.maxHeight = "90vh";
  gui.domElement.style.overflowY = "auto";

  // ═══════════════════════════════════════════════════════════════
  // MODEL SELECTOR
  // ═══════════════════════════════════════════════════════════════
  const modelFolder = gui.addFolder("MODEL");

  const modelOptions = Object.keys(CONFIG.models);
  const modelSelection = { selected: "Slow Qi" };

  modelFolder
    .add(modelSelection, "selected", modelOptions)
    .name("Character")
    .onChange((selectedKey) => {
      const modelPath = CONFIG.models[selectedKey];
      onModelChange(modelPath);
    });

  // ═══════════════════════════════════════════════════════════════
  // CHARACTER SETTINGS
  // ═══════════════════════════════════════════════════════════════
  const charFolder = gui.addFolder("CHARACTER");

  // Character selection dropdown
  const charOptions = Object.keys(CONFIG.characterSets);
  const charSelection = { selected: "Block Full" };

  charFolder
    .add(charSelection, "selected", charOptions)
    .name("Character")
    .onChange((selectedKey) => {
      params.character = CONFIG.characterSets[selectedKey];
      onCharacterChange();
    });

  charFolder
    .add(params, "samplingDensity", 1, 10, 1)
    .name("Sample Density")
    .onChange(onSamplingChange);

  charFolder
    .add(params, "characterSize", 0.1, 50.0, 0.5)
    .name("Char Size")
    .onChange(onCharacterChange);

  charFolder
    .add(params, "emissiveIntensity", 0, 2.0, 0.1)
    .name("Glow Intensity")
    .onChange(onGlowChange);

  // ═══════════════════════════════════════════════════════════════
  // COLOR SETTINGS
  // ═══════════════════════════════════════════════════════════════
  const colorFolder = gui.addFolder("COLOR");

  colorFolder
    .addColor(params, "color")
    .name("Char Color")
    .onChange(onColorChange);

  colorFolder
    .addColor(params, "backgroundColor")
    .name("Background")
    .onChange(onBackgroundChange);

  const presetController = colorFolder
    .add({ preset: "Cyan" }, "preset", Object.keys(CONFIG.colorPresets))
    .name("Presets");

  presetController.onChange((presetName) => {
    params.color = CONFIG.colorPresets[presetName];
    onColorChange();
    gui.controllersRecursive().forEach((c) => {
      if (c.property === "color") c.updateDisplay();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // BLOOM SETTINGS
  // ═══════════════════════════════════════════════════════════════
  const bloomFolder = gui.addFolder("BLOOM");

  bloomFolder
    .add(params, "bloomStrength", 0, 3, 0.1)
    .name("Strength")
    .onChange(() => {
      // Import dynamically to avoid circular deps
      import("./handlers.js").then(({ onBloomChange }) => onBloomChange());
    });

  bloomFolder
    .add(params, "bloomRadius", 0, 1, 0.05)
    .name("Radius")
    .onChange(() => {
      import("./handlers.js").then(({ onBloomChange }) => onBloomChange());
    });

  bloomFolder
    .add(params, "bloomThreshold", 0, 2, 0.1)
    .name("Threshold")
    .onChange(() => {
      import("./handlers.js").then(({ onBloomChange }) => onBloomChange());
    });

  // ═══════════════════════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════════════════════
  gui
    .add({ reset: () => resetDefaults(gui) }, "reset")
    .name("🔄 Reset Defaults");

  return gui;
}
