# Nigar Kiz Desktop Pet

A lightweight animated desktop companion built with Electron. Nigar Kiz is a local-only pixel pet with transparent windowing, tray controls, focus sessions, and persistent preferences.

## Features

- Transparent, frameless, always-on-top desktop window
- Sprite-sheet animation state machine using the approved 8 x 11 atlas
- Drag movement with left/right running animations and saved window position
- Click to wave, double-click to jump
- Mouse-look behavior using the built-in 16-direction `look-*` states
- Random idle messages, gentle idle actions, rest-like waiting, and longer idle sleep simulation
- Compact settings panel with scale, always-on-top, random actions, speech bubble, launch-at-login, focus duration, and reset position controls
- 25, 45, and 60 minute focus timers with working state, near-finish encouragement, celebration sequence, review pause, and desktop notification
- Idle detection after 5 minutes of system inactivity, then a wake-up wave when activity resumes
- Right-click menu and macOS tray menu with Wave, Jump, Work, Review, Rest, Sleep, Celebrate, Reset Position, and Focus actions
- Keyboard access for waving, jumping, focus, review, settings dismissal, and menu opening
- Reduced-motion support
- Single-instance app lock
- macOS and Windows packaging configuration

## Run locally

Install dependencies once:

```bash
npm install
```

Start the pet:

```bash
npm start
```

If you use pnpm instead of npm:

```bash
pnpm install
pnpm start
```

## Controls

- Drag: move the pet
- Click: wave
- Double-click: jump
- Right-click: open the action menu
- Move the pointer over the pet: Nigar Kiz looks toward the pointer
- W while focused: wave
- J while focused: jump
- F while focused: start the saved focus duration
- R while focused: review
- Esc: hide settings if open
- Enter while focused: wave
- Space while focused: jump
- Context Menu key while focused: open the action menu
- Tray menu: show/hide, Wave, Jump, Work, Review, Rest, Sleep, Celebrate, focus timer, settings, reset position, quit

## Settings

Settings are stored locally in Electron's userData folder as JSON. The app saves preferences and the last valid window position, then clamps the pet back onto the current display when it opens again.

## Test

```bash
npm test
```

The tests cover the sprite atlas/state configuration, settings validation, animation timing helpers, look-direction math, and interaction action mapping. The character spritesheet is intentionally not regenerated or resized by the app code.

## Package As A macOS App

For a local macOS build:

```bash
npm run package:mac
```

For an unpacked build that is quicker to inspect during development:

```bash
npm run package:mac:dir
```

The packaged app is written under `dist/`. For distribution outside your own Mac, configure Apple Developer ID signing and notarization through electron-builder before shipping.

Windows packaging is also configured:

```bash
npm run package:win
```

## Project Structure

- `assets/pet.json`: pet identity and animation metadata
- `assets/spritesheet.webp`: approved character spritesheet
- `src/main.js`: Electron window, tray, persistence, idle detection, notifications, and IPC
- `src/preload.js`: safe renderer bridge
- `src/renderer.js`: renderer orchestration
- `src/pet-animator.js`: animation controller
- `src/settings-panel.js`: settings UI controller
- `src/focus-timer.js`: focus session logic
- `src/state-config.js`: sprite atlas and state definitions
- `src/look-direction.js`: 16-direction pointer-to-look-state mapping
- `src/interaction-controller.js`: action, shortcut, priority, and idle behavior decisions
- `src/settings-schema.js`: settings defaults and validation
- `test/*.test.js`: Node test runner coverage

## Privacy

The app works locally and does not upload user data. Reference photos, generation prompts, and QA files are deliberately excluded from this project.
