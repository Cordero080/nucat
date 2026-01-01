/**
 * GUI setup with lil-gui
 */

import GUI from "three/addons/libs/lil-gui.module.min.js";
import { CONFIG, params } from "../config.js";
import {
  onCharacterChange,
  onSamplingChange,
  onColorChange,
  onGlowChange,
  onBloomChange,
  resetDefaults,
} from "./handlers.js";

/**
 * Initialize lil-gui controls
 */
export function initGUI() {
  const gui = new GUI();

  // Character settings folder
  const charFolder = gui.addFolder("Character Settings");

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

  charFolder.open();

  // Color settings folder
  const colorFolder = gui.addFolder("Color Settings");

  colorFolder.addColor(params, "color").name("Color").onChange(onColorChange);

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

  bloomFolder.open();

  // Reset button
  gui
    .add({ reset: () => resetDefaults(gui) }, "reset")
    .name("🔄 Reset to Defaults");

  return gui;
}
