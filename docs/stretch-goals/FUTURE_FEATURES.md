# NUCAT Stretch Goals 🚀

## Completed ✅

### Model Switcher
- Multiple cat character support
- Hot-swap disposal and reload
- Adaptive sampling based on model complexity

---

## In Progress 🔨

### Hand Tracking / Pose Control
**Status:** Implementing  
**Tech:** MediaPipe Hands + Pose

Features:
- [ ] Hand position → pushes/attracts nearby particles
- [ ] Make a fist → triggers disperse explosion
- [ ] Wave gesture → triggers wave effect
- [ ] Full body pose → cat mirrors your skeleton (Phase 2)

---

## Planned 📋

### Audio Reactivity
Make particles respond to music or microphone input:
- Bass frequencies → dispersion pulse intensity
- Treble → spiral speed
- Volume → bloom intensity
- BPM detection → effect sync

**Tech:** Web Audio API + FFT analysis

### Character Morphing
Smoothly morph between different characters:
- Particles flow from one skeleton to another
- Animation interpolation during morph
- "Fusion" mode combining two models

### Time Capture + Export
- Record sessions as replayable "moments"
- Scrub through time like a video
- Export high-res stills or video clips
- Shareable URLs with encoded state

### Multiplayer Vibes
Multiple people influence the same cat:
- Each visitor gets a cursor affecting particles
- Vote on active effects
- Shared CHAOS MIX sessions
- "DJ mode" - one controls, others watch

**Tech:** WebSockets / WebRTC

### WebXR / AR Mode
Place the ASCII cat in your real environment:
- Phone AR through camera
- VR mode to walk around the character
- Room-scale interaction

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Hand Tracking | 🔥🔥🔥 | Medium | **NOW** |
| Audio Reactivity | 🔥🔥🔥 | Low | Next |
| Character Morphing | 🔥🔥 | High | Later |
| Time Capture | 🔥🔥 | Medium | Later |
| Multiplayer | 🔥🔥🔥 | High | Future |
| WebXR | 🔥🔥 | High | Future |
