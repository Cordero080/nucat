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
  onBackgroundChange,
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

  colorFolder.open();

  // Animation settings folder
  const animFolder = gui.addFolder("Animation");
  animFolder.add(params, "animationSpeed", 0.1, 3.0, 0.1).name("Speed");
  animFolder.add(params, "billboardMode").name("Billboard Mode");
  animFolder.open();

  // Character Effects folder
  const effectsFolder = gui.addFolder("✨ Character Effects");

  effectsFolder
    .add(params, "effectType", [
      "none",
      "hover",
      "disperse",
      "noise",
      "wave",
      "spiral",
      "spiralFlow",
    ])
    .name("Effect Type")
    .onChange(() => {
      // Sync auto-triggers when manually switching
      params._disperseTarget = params.effectType === "disperse" ? 1 : 0;
      params._spiralFlowActive = params.effectType === "spiralFlow";
    });

  effectsFolder.open();

  // Quick Actions folder - buttons for all effects
  const actionsFolder = gui.addFolder("⚡ Quick Actions");

  const effectActions = {
    hover: () => {
      params.effectType = "hover";
    },
    noise: () => {
      params.effectType = "noise";
    },
    wave: () => {
      params.effectType = "wave";
    },
    spiral: () => {
      params.effectType = "spiral";
    },
    disperse: () => {
      params.effectType = "disperse";
      params._disperseTarget = 1;
    },
    return: () => {
      params._disperseTarget = 0;
    },
    spiralFlow: () => {
      params.effectType = "spiralFlow";
      params._spiralFlowActive = true;
      params.spiralFlowProgress = 0;
    },
    stop: () => {
      params.effectType = "none";
      params._disperseTarget = 0;
      params._spiralFlowActive = false;
    },
  };

  actionsFolder.add(effectActions, "hover").name("🎈 Hover");
  actionsFolder.add(effectActions, "noise").name("⚡ Noise");
  actionsFolder.add(effectActions, "wave").name("🌊 Wave");
  actionsFolder.add(effectActions, "spiral").name("🔄 Spiral");
  actionsFolder.add(effectActions, "disperse").name("💥 Disperse!");
  actionsFolder.add(effectActions, "return").name("↩️ Return");
  actionsFolder.add(effectActions, "spiralFlow").name("🌀 Spiral Flow!");
  actionsFolder.add(effectActions, "stop").name("⏹ Stop All");

  actionsFolder.open();

  // Effect Parameters folder
  const effectParamsFolder = gui.addFolder("🎛 Effect Parameters");

  effectParamsFolder.add(params, "effectIntensity", 0, 50, 1).name("Intensity");
  effectParamsFolder
    .add(params, "effectSpeed", 0.1, 5, 0.1)
    .name("Effect Speed");
  effectParamsFolder
    .add(params, "spiralFlowSpeed", 0.1, 3, 0.1)
    .name("Flow Speed");
  effectParamsFolder
    .add(params, "spiralFlowWaves", 1, 10, 1)
    .name("Wave Groups");

  effectParamsFolder.open();

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
