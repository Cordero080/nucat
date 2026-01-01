/**
 * Configuration & Constants
 * All settings in one place for easy customization
 */

export const CONFIG = {
  // Available ASCII characters for point cloud
  characterSets: {
    // Block characters
    "Block Full": "█",
    "Block Dark": "▓",
    "Block Medium": "▒",
    "Block Light": "░",
    // Punctuation & Symbols
    "Question ?": "?",
    "Exclaim !": "!",
    "At @": "@",
    "Hash #": "#",
    "Dollar $": "$",
    "Percent %": "%",
    "Ampersand &": "&",
    "Asterisk *": "*",
    "Plus +": "+",
    "Equals =": "=",
    // Letters
    "Letter X": "X",
    "Letter O": "O",
    "Letter A": "A",
    "Letter Z": "Z",
    "Letter M": "M",
    "Letter W": "W",
    // Numbers
    "Number 0": "0",
    "Number 1": "1",
    "Number 8": "8",
    // Special
    "Bullet •": "•",
    "Cross ×": "×",
    "Tilde ~": "~",
    "Caret ^": "^",
    "Colon :": ":",
    "Dot .": ".",
    "Comma ,": ",",
    "Slash /": "/",
    "Backslash \\": "\\",
    "Pipe |": "|",
    "Underscore _": "_",
    "Hyphen -": "-",
  },

  // Color presets with cyberpunk aesthetic
  colorPresets: {
    Cyan: "#00ffff",
    Magenta: "#ff00ff",
    "Neon Green": "#00ff66",
    White: "#ffffff",
    "Hot Pink": "#ff0066",
    "Electric Blue": "#0066ff",
  },

  // Default settings - adjust these to change initial values on page load
  defaults: {
    character: "█",
    samplingDensity: 1,
    characterSize: 10.8,
    color: "#00ffff",
    animationSpeed: 1.0,
    billboardMode: true,
    maxCharacters: 200000,
    emissiveIntensity: 0.3,
    bloomStrength: 0.8,
    bloomRadius: 0.3,
    bloomThreshold: 0.5,
  },

  // Scene settings
  scene: {
    backgroundColor: 0x033363,
  },

  // Model settings
  model: {
    path: "./models/SLOW_QI.fbx",
    rotationY: Math.PI / 3, // 60 degrees
  },

  // Camera settings
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    initialPosition: { x: 0, y: 100, z: 200 },
    lookAt: { x: 0, y: 50, z: 0 },
  },

  // Font URL
  fontUrl:
    "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/fonts/helvetiker_regular.typeface.json",
};

// GUI-controlled parameters (mutable at runtime)
export const params = {
  character: CONFIG.defaults.character,
  samplingDensity: CONFIG.defaults.samplingDensity,
  characterSize: CONFIG.defaults.characterSize,
  color: CONFIG.defaults.color,
  backgroundColor: "#033363",
  animationSpeed: CONFIG.defaults.animationSpeed,
  billboardMode: CONFIG.defaults.billboardMode,
  emissiveIntensity: CONFIG.defaults.emissiveIntensity,
  bloomStrength: CONFIG.defaults.bloomStrength,
  bloomRadius: CONFIG.defaults.bloomRadius,
  bloomThreshold: CONFIG.defaults.bloomThreshold,

  // Character effects
  effectType: "none", // "none", "hover", "disperse", "noise", "wave", "spiral", "spiralFlow"
  effectIntensity: 5.0, // How far characters move
  effectSpeed: 1.0, // Speed of the effect
  disperseAmount: 0.0, // 0 = home, 1 = fully dispersed (animated)
  _disperseTarget: 0, // Internal: target for disperse animation

  // Spiral Flow effect
  spiralFlowProgress: 0.0, // 0 = all home, 1 = full animation cycle
  spiralFlowSpeed: 1.0, // Speed of the spiral flow
  spiralFlowWaves: 5, // Number of wave groups
  _spiralFlowActive: false, // Is animation running
};
