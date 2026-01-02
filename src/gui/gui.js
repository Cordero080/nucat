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

  // Enable auto-scrolling when panel gets too tall
  gui.domElement.style.maxHeight = "90vh";
  gui.domElement.style.overflowY = "auto";

  // Character settings folder
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

  charFolder.open();

  // Color settings folder
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

  colorFolder.open();

  // Animation settings folder
  const animFolder = gui.addFolder("Animation");
  animFolder.add(params, "animationSpeed", 0.1, 3.0, 0.1).name("Speed");
  animFolder.add(params, "billboardMode").name("Billboard Mode");
  animFolder.open();

  // Character Effects folder
  const effectsFolder = gui.addFolder("EFFECTS");

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
  const actionsFolder = gui.addFolder("QUICK ACTIONS");

  // Effect colors - unique for each effect
  const EFFECT_COLORS = {
    hover: { bright: "#3b82f6", dim: "#1e3a5f" }, // Blue
    noise: { bright: "#eab308", dim: "#5c4a0a" }, // Yellow
    wave: { bright: "#06b6d4", dim: "#0a4a54" }, // Cyan
    spiral: { bright: "#a855f7", dim: "#4a2270" }, // Purple
    disperse: { bright: "#f97316", dim: "#5c2d0a" }, // Orange
    spiralFlow: { bright: "#ec4899", dim: "#5c1a3a" }, // Magenta
  };
  const INACTIVE_COLOR = "#333";

  // Store button elements and controllers
  const effectButtons = {};
  const buttonElements = {};

  // Reference to effect params folder for border color
  let effectParamsFolderEl = null;

  function updateButtonStyle(effectName, state) {
    // state: "inactive", "active-focused", "active-dimmed"
    const el = buttonElements[effectName];
    if (!el) return;

    const colors = EFFECT_COLORS[effectName];
    const stopBtn = el.querySelector(".stop-btn");

    if (state === "inactive") {
      el.style.backgroundColor = "";
      el.style.borderLeftColor = INACTIVE_COLOR;
      el.style.color = "";
      if (stopBtn) stopBtn.style.display = "none";
    } else if (state === "active-focused") {
      el.style.backgroundColor = colors.bright;
      el.style.borderLeftColor = colors.bright;
      el.style.color = "#fff";
      if (stopBtn) stopBtn.style.display = "block";
    } else if (state === "active-dimmed") {
      el.style.backgroundColor = colors.dim;
      el.style.borderLeftColor = colors.dim;
      el.style.color = "#aaa";
      if (stopBtn) stopBtn.style.display = "block";
    }
  }

  function updateParamsBorder(effectName) {
    if (effectParamsFolderEl && effectName && EFFECT_COLORS[effectName]) {
      const color = EFFECT_COLORS[effectName].bright;
      effectParamsFolderEl.style.borderLeft = `3px solid ${color}`;
      // Update label colors (lil-gui uses .name class)
      effectParamsFolderEl
        .querySelectorAll(".controller .name")
        .forEach((label) => {
          label.style.color = color;
        });
      // Update number inputs
      effectParamsFolderEl.querySelectorAll("input").forEach((input) => {
        input.style.color = color;
        input.style.borderColor = `${color}66`;
      });
      // Update slider fills (lil-gui slider structure)
      effectParamsFolderEl.querySelectorAll(".slider").forEach((slider) => {
        const fill = slider.querySelector(".fill");
        if (fill)
          fill.style.background = `linear-gradient(90deg, ${color}aa, ${color})`;
      });
    } else if (effectParamsFolderEl) {
      effectParamsFolderEl.style.borderLeft =
        "3px solid rgba(80, 120, 160, 0.2)";
      effectParamsFolderEl
        .querySelectorAll(".controller .name")
        .forEach((label) => {
          label.style.color = "";
        });
      effectParamsFolderEl.querySelectorAll("input").forEach((input) => {
        input.style.color = "";
        input.style.borderColor = "";
      });
      effectParamsFolderEl.querySelectorAll(".slider").forEach((slider) => {
        const fill = slider.querySelector(".fill");
        if (fill) fill.style.background = "";
      });
    }
  }

  function updateAllButtonStyles() {
    Object.keys(params.activeEffects).forEach((name) => {
      if (params.activeEffects[name]) {
        if (params._focusedEffect === name) {
          updateButtonStyle(name, "active-focused");
        } else {
          updateButtonStyle(name, "active-dimmed");
        }
      } else {
        updateButtonStyle(name, "inactive");
      }
    });
    updateParamsBorder(params._focusedEffect);
  }

  function resetAllButtons() {
    Object.keys(params.activeEffects).forEach((name) => {
      updateButtonStyle(name, "inactive");
    });
    params._focusedEffect = null;
    updateParamsBorder(null);
  }

  // Save current params to focused effect
  function saveParamsToEffect(effectName) {
    if (!effectName || !params.effectParams[effectName]) return;
    params.effectParams[effectName].intensity = params.effectIntensity;
    params.effectParams[effectName].speed = params.effectSpeed;
    if (effectName === "spiralFlow") {
      params.effectParams[effectName].flowSpeed = params.spiralFlowSpeed;
      params.effectParams[effectName].waves = params.spiralFlowWaves;
    }
  }

  // Load effect params to GUI
  function loadParamsFromEffect(effectName) {
    if (!effectName || !params.effectParams[effectName]) return;
    params.effectIntensity = params.effectParams[effectName].intensity;
    params.effectSpeed = params.effectParams[effectName].speed;
    if (effectName === "spiralFlow") {
      params.spiralFlowSpeed = params.effectParams[effectName].flowSpeed;
      params.spiralFlowWaves = params.effectParams[effectName].waves;
    }
    // Update GUI display
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
  }

  // Focus an effect (for parameter editing)
  function focusEffect(effectName, loadParams = false) {
    // Save current focused effect params before switching
    if (params._focusedEffect && params._focusedEffect !== effectName) {
      saveParamsToEffect(params._focusedEffect);
    }
    // Set new focus
    params._focusedEffect = effectName;
    // Only load params if explicitly requested (clicking already-focused button)
    if (loadParams) {
      loadParamsFromEffect(effectName);
    }
    // Update all button styles
    updateAllButtonStyles();
  }

  // Toggle effect on/off and focus
  function toggleEffect(effectName) {
    params._isReturning = false;
    const isActive = params.activeEffects[effectName];

    if (isActive && params._focusedEffect === effectName) {
      // Already focused and active - load its params to edit them
      loadParamsFromEffect(effectName);
      return;
    } else if (isActive) {
      // Active but not focused - just focus it (don't load params)
      focusEffect(effectName, false);
    } else {
      // Not active - turn on and focus (don't load params, keep current)
      params.activeEffects[effectName] = true;
      focusEffect(effectName, false);

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

    // Update legacy effectType
    const activeList = Object.entries(params.activeEffects)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    params.effectType = activeList.length > 0 ? activeList[0] : "none";
  }

  // Stop a specific effect
  function stopEffect(effectName) {
    params.activeEffects[effectName] = false;

    if (effectName === "disperse") {
      params._disperseTarget = 0;
    }
    if (effectName === "spiralFlow") {
      params._spiralFlowActive = false;
    }

    // If this was focused, focus another active effect or none
    if (params._focusedEffect === effectName) {
      const otherActive = Object.entries(params.activeEffects).find(
        ([_, v]) => v
      );
      if (otherActive) {
        focusEffect(otherActive[0]);
      } else {
        params._focusedEffect = null;
        updateParamsBorder(null);
      }
    }

    updateAllButtonStyles();

    // Update legacy effectType
    const activeList = Object.entries(params.activeEffects)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    params.effectType = activeList.length > 0 ? activeList[0] : "none";
  }

  // Create effect buttons with stop icon
  function createEffectButton(effectName, label) {
    const action = {};
    action[effectName] = () => toggleEffect(effectName);
    const controller = actionsFolder.add(action, effectName).name(label);
    effectButtons[effectName] = controller;

    // Get the button element and customize it
    setTimeout(() => {
      const el = controller.domElement.closest(".controller");
      if (el) {
        buttonElements[effectName] = el;
        el.style.position = "relative";
        el.style.borderLeft = "3px solid";
        el.style.borderTop = "none";
        el.style.borderBottom = "none";
        el.style.marginBottom = "1px";
        el.style.transition = "all 0.15s ease";
        el.style.letterSpacing = "1px";
        el.style.fontSize = "10px";
        el.style.fontWeight = "500";

        // Create stop button (minimal SVG)
        const stopBtn = document.createElement("div");
        stopBtn.className = "stop-btn";
        stopBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="currentColor" rx="1"/></svg>`;
        stopBtn.style.cssText = `
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          background: rgba(255, 60, 60, 0.15);
          color: #ff4444;
          border: 1px solid rgba(255, 60, 60, 0.4);
          border-radius: 3px;
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        `;
        stopBtn.onclick = (e) => {
          e.stopPropagation();
          stopEffect(effectName);
        };
        el.appendChild(stopBtn);

        updateButtonStyle(effectName, "inactive");
      }
    }, 0);

    return controller;
  }

  createEffectButton("hover", "HOVER");
  createEffectButton("noise", "NOISE");
  createEffectButton("wave", "WAVE");
  createEffectButton("spiral", "SPIRAL");
  createEffectButton("disperse", "DISPERSE");
  createEffectButton("spiralFlow", "FLOW");

  // Return button - gradually fades effects back to default
  actionsFolder
    .add(
      {
        return: () => {
          // Just set the flag - animation loop handles gradual fade
          params._isReturning = true;
          params._disperseTarget = 0;
          // Don't deactivate effects here - let them fade naturally
        },
      },
      "return"
    )
    .name("RETURN");

  // Stop All button - immediate stop without return animation
  actionsFolder
    .add(
      {
        stop: () => {
          params._isReturning = false;
          Object.keys(params.activeEffects).forEach((key) => {
            params.activeEffects[key] = false;
          });
          params.effectType = "none";
          params._disperseTarget = 0;
          params._spiralFlowActive = false;
          params._focusedEffect = null;
          resetAllButtons();
        },
      },
      "stop"
    )
    .name("STOP ALL");

  // Store resetAllButtons for use in main.js
  params._resetAllButtons = resetAllButtons;

  actionsFolder.open();

  // Effect Parameters folder
  const effectParamsFolder = gui.addFolder("EFFECT PARAMS");

  // Get folder element for border coloring
  setTimeout(() => {
    effectParamsFolderEl = effectParamsFolder.domElement;
    if (effectParamsFolderEl) {
      effectParamsFolderEl.style.transition = "border-color 0.3s";
      effectParamsFolderEl.style.borderLeft = "3px solid #333";
    }
  }, 0);

  effectParamsFolder
    .add(params, "effectIntensity", 0, 300, 1)
    .name("Intensity")
    .onChange(() => {
      if (params._focusedEffect) {
        saveParamsToEffect(params._focusedEffect);
      }
    });
  effectParamsFolder
    .add(params, "effectSpeed", 0.1, 5, 0.1)
    .name("Effect Speed")
    .onChange(() => {
      if (params._focusedEffect) {
        saveParamsToEffect(params._focusedEffect);
      }
    });
  effectParamsFolder
    .add(params, "spiralFlowSpeed", 0.1, 3, 0.1)
    .name("Flow Speed")
    .onChange(() => {
      if (params._focusedEffect === "spiralFlow") {
        saveParamsToEffect("spiralFlow");
      }
    });
  effectParamsFolder
    .add(params, "spiralFlowWaves", 1, 10, 1)
    .name("Wave Groups")
    .onChange(() => {
      if (params._focusedEffect === "spiralFlow") {
        saveParamsToEffect("spiralFlow");
      }
    });

  effectParamsFolder.open();

  // Bloom settings folder
  const bloomFolder = gui.addFolder("BLOOM");

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
