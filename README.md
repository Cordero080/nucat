# NUCAT ✦

> *When your character wants to be a point cloud, you let them.*

![Three.js](https://img.shields.io/badge/Three.js-r182-black?style=flat-square&logo=three.js)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Served_Fresh-🔥-orange?style=flat-square)
![Brooklyn](https://img.shields.io/badge/Made_in-Brooklyn_NY-blue?style=flat-square)

---

## What Is This?

NUCAT is a **real-time ASCII point cloud renderer** that takes a rigged 3D character and explodes it into ~20,000 floating particles that dance, spiral, disperse, and flow—all while maintaining the skeleton animation underneath.

Think of it as your character having an out-of-body experience. But make it aesthetic.

![demo](https://img.shields.io/badge/status-vibing-brightgreen?style=flat-square)

---

## ✦ Features

- **🎭 Custom Character & Animation** — Original character design and Mixamo-rigged animation. Yes, I made this.
- **⚡ Layered Effects System** — Stack multiple effects simultaneously. Hover + Wave + Spiral? Go crazy.
- **🎨 Per-Effect Parameters** — Each effect remembers its own intensity and speed settings
- **🌀 Six Unique Effects:**
  - `HOVER` — Gentle floating
  - `NOISE` — Chaotic jitter
  - `WAVE` — Smooth oscillation  
  - `SPIRAL` — Rotational motion
  - `DISPERSE` — Explosion scatter
  - `FLOW` — Cinematic spiral flow from bottom to top
- **✨ Bloom Post-Processing** — That glow hits different
- **🖥️ Glassmorphism UI** — Sleek, futuristic controls that don't fight the visuals
- **↩️ Mystique Return** — Effects fade out slow and smooth, like they're savoring the moment

---

## 🛠️ Tech Stack

| What | Why |
|------|-----|
| [Three.js](https://threejs.org/) | 3D rendering engine |
| [InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh) | GPU-efficient particle rendering |
| [FBXLoader](https://threejs.org/docs/#examples/en/loaders/FBXLoader) | Loading rigged characters |
| [UnrealBloomPass](https://threejs.org/docs/#examples/en/postprocessing/UnrealBloomPass) | That *chef's kiss* glow |
| [lil-gui](https://lil-gui.georgealways.com/) | Lightweight controls |
| [TextGeometry](https://threejs.org/docs/#examples/en/geometries/TextGeometry) | ASCII character meshes |

---

## 🚀 Run It

```bash
# Clone it
git clone https://github.com/yourusername/nucat.git
cd nucat

# Install dependencies
npm install

# Run local server
npm run dev
```

Open `http://localhost:3000` and watch your character transcend physical form.

---

## 🎮 Controls

| Action | What It Does |
|--------|--------------|
| Click effect button | Toggle effect ON and focus it |
| Click focused effect | Edit its parameters |
| Click another active effect | Switch focus (params stay saved) |
| Red stop icon | Kill that specific effect |
| `RETURN` | Gradual fade back to default (the mystique way) |
| `STOP ALL` | Immediate hard stop |

---

## 📁 Project Structure

```
nucat/
├── index.html
├── models/           # FBX character + animations
├── src/
│   ├── main.js       # Animation loop & orchestration
│   ├── config.js     # All the knobs and dials
│   ├── state.js      # Shared state management
│   ├── style.css     # Glassmorphism vibes
│   ├── ascii/
│   │   ├── instancedMesh.js   # Particle system + effects
│   │   ├── geometry.js        # Text geometry creation
│   │   └── skinning.js        # Skeleton sampling
│   └── gui/
│       ├── gui.js             # Control panel setup
│       └── handlers.js        # Parameter callbacks
```

---

## 🎨 Credits

**Character Design & Animation:** Me. I drew them. I rigged them. I made them dance.

**Code Architecture:** Collaboration between human vision and AI implementation.

**Vibe:** Brooklyn, NY — where we make things weird but make them *work*.

---

## License

Do whatever you want with it. Just don't be weird about it.

MIT © 2026

---

<p align="center">
  <sub>Built with caffeine, curiosity, and a refusal to accept "good enough"</sub>
</p>
