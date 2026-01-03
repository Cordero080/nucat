# CHAOS MIX — Stretch Goals

Ideas to push the generative chaos system further.

---

## 1. Chaos Presets/Modes

Different personalities for the chaos engine:

| Mode      | Description                                           |
| --------- | ----------------------------------------------------- |
| `GENTLE`  | Slow φ evolution, 1-2 effects max, soft pastel colors |
| `STORM`   | Fast Fibonacci events, high entropy, wild swings      |
| `TRANCE`  | Rhythmic, BPM-synced events, hypnotic patterns        |
| `QUANTUM` | Pure probability, completely unpredictable            |

UI: Dropdown or radio buttons in the GUI panel.

---

## 2. Debug Overlay

Show the math live on screen for nerds who want to see the beauty:

```
φ = 1.618...  entropy: 0.73
fib: [8] → next event in 4s
active: wave, spiral (2/3)
hue: 247° saturation: 85%
bloom: 0.8 radius: 0.4
```

Toggle with `D` key or checkbox in GUI.

---

## 3. User Nudge Controls

Let user influence chaos direction without stopping it:

| Key     | Action                       |
| ------- | ---------------------------- |
| `↑`     | Boost intensity temporarily  |
| `↓`     | Reduce intensity temporarily |
| `←`     | Shift color hue cooler       |
| `→`     | Shift color hue warmer       |
| `SPACE` | Force a Fibonacci event NOW  |
| `R`     | Reset entropy to 0.2         |

---

## 4. Chaos Seed Recording

- **Record** - Capture the sequence of events/params over time
- **Save** - Export as JSON with timestamps
- **Replay** - Load a saved session and replay it exactly
- **Share** - URL params encode a seed for shareable chaos states

---

## 5. Audio Reactivity

Mic input drives the chaos:

- **Bass** → Disperse intensity
- **Mids** → Color saturation
- **Highs** → Bloom strength
- **Volume** → Entropy level
- **Beat detection** → Trigger Fibonacci events

Uses Web Audio API `AnalyserNode`.

---

## 6. Effect Weighting

Sliders to bias which effects appear more often:

```
hover:      ████████░░ 80%
noise:      ██░░░░░░░░ 20%
wave:       █████░░░░░ 50%
spiral:     ███████░░░ 70%
disperse:   ███░░░░░░░ 30%
spiralFlow: ██████░░░░ 60%
```

Higher weight = higher probability in quantum selection.

---

## 7. Beat Sync / BPM Mode

Set a BPM (120, 140, etc.) and Fibonacci events snap to musical timing:

- Events trigger on beat boundaries
- Fibonacci sequence determines _which_ beats (1, 1, 2, 3, 5, 8...)
- Tap tempo support
- Optional metronome click

---

## 8. Chaos Battles

Two chaos engines running simultaneously:

- Split screen or blended
- Each with different presets
- Winner determined by... something??

---

## 9. Mobile Gestures

- **Swipe up/down** → Intensity
- **Swipe left/right** → Color shift
- **Pinch** → Bloom
- **Shake** → Force event

---

## 10. Screensaver Mode

- Auto-start chaos after idle
- Cycle through presets
- Never the same twice

---

_The math is the music. Let it play._
