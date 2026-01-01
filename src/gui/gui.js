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

  // Quick Actions folder - toggle buttons for layered effects
  const actionsFolder = gui.addFolder("⚡ Quick Actions");

  // Store button controllers for color updates
  const effectButtons = {};

  // Active button style
  const ACTIVE_COLOR = "#00ff66";
  const INACTIVE_COLOR = "";

  function updateButtonStyle(controller, isActive) {
    const el = controller.domElement.closest(".controller");
    if (el) {
      el.style.backgroundColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
      el.style.color = isActive ? "#000" : "";
    }
  }

  function resetAllButtons() {
    Object.values(effectButtons).forEach((ctrl) => {
      updateButtonStyle(ctrl, false);
    });
  }

  // Toggle effect function
  function toggleEffect(effectName) {
    params._isReturning = false;
    const isActive = params.activeEffects[effectName];

    if (isActive) {
      // Turn off this effect
      params.activeEffects[effectName] = false;
      updateButtonStyle(effectButtons[effectName], false);
    } else {
      // Turn on this effect
      params.activeEffects[effectName] = true;
      updateButtonStyle(effectButtons[effectName], true);

      // Special handling for disperse
      if (effectName === "disperse") {
        params._disperseTarget = 1;
      }
      // Special handling for spiralFlow
      if (effectName === "spiralFlow") {
        params._spiralFlowActive = true;
        params.spiralFlowProgress = 0;
      }
    }

    // Update legacy effectType for dropdown sync
    const activeList = Object.entries(params.activeEffects)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    params.effectType = activeList.length > 0 ? activeList[0] : "none";
  }

  const effectActions = {
    hover: () => toggleEffect("hover"),
    noise: () => toggleEffect("noise"),
    wave: () => toggleEffect("wave"),
    spiral: () => toggleEffect("spiral"),
    disperse: () => toggleEffect("disperse"),
    spiralFlow: () => toggleEffect("spiralFlow"),
    return: () => {
      params._isReturning = true;
      params._disperseTarget = 0;
      params._spiralFlowActive = false;
    },
    stop: () => {
      params._isReturning = false;
      // Turn off all effects immediately
      Object.keys(params.activeEffects).forEach((key) => {
        params.activeEffects[key] = false;
      });
      params.effectType = "none";
      params._disperseTarget = 0;
      params._spiralFlowActive = false;
      resetAllButtons();
    },
  };

  effectButtons.hover = actionsFolder
    .add(effectActions, "hover")
    .name("🎈 Hover");
  effectButtons.noise = actionsFolder
    .add(effectActions, "noise")
    .name("⚡ Noise");
  effectButtons.wave = actionsFolder.add(effectActions, "wave").name("🌊 Wave");
  effectButtons.spiral = actionsFolder
    .add(effectActions, "spiral")
    .name("🔄 Spiral");
  effectButtons.disperse = actionsFolder
    .add(effectActions, "disperse")
    .name("💥 Disperse!");
  effectButtons.spiralFlow = actionsFolder
    .add(effectActions, "spiralFlow")
    .name("🌀 Spiral Flow!");
  actionsFolder.add(effectActions, "return").name("↩️ Return");
  actionsFolder.add(effectActions, "stop").name("⏹ Stop All");

  // Store resetAllButtons for use in main.js when return completes
  params._resetAllButtons = resetAllButtons;

  actionsFolder.open();

  // Effect Parameters folder
  const effectParamsFolder = gui.addFolder("🎛 Effect Parameters");

  effectParamsFolder
    .add(params, "effectIntensity", 0, 300, 1)
    .name("Intensity");
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
