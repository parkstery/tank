# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Symbolic Tank Warfare by Gemdori" — a minimalist 2D symbol-style top-down tank
game. React 19 + TypeScript + Vite. Originally scaffolded from a Google AI
Studio app. UI text and AI commentary are in Korean.

## Commands

```bash
npm install      # install deps
npm run dev      # Vite dev server on port 3000, host 0.0.0.0
npm run build    # production build
npm run preview  # preview built output
```

There is no test suite, linter, or formatter configured.

### Environment

Set `GEMINI_API_KEY` in `.env.local`. `vite.config.ts` maps it to both
`process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time via
`define`. Without it the Gemini advice feature degrades gracefully (returns
canned fallback strings) but the game runs fine.

## Architecture

The game splits cleanly into a thin React UI shell and a self-contained
imperative game engine.

- **`App.tsx`** — top-level screen state machine only (`START` / `PLAYING` /
  `GAMEOVER`, from `GameStatus` in `types.ts`). Renders overlay menus and
  forwards mobile input down via refs. It does **not** drive the simulation.

- **`components/GameCanvas.tsx`** — the entire game engine. This is the file to
  read first. Key design point: the simulation runs on `requestAnimationFrame`
  and keeps all mutable game data (`playerRef`, `enemiesRef`, `bulletsRef`,
  `particlesRef`, `itemsRef`, `keysRef`, `mouseRef`, `levelRef`) in `useRef`
  — **not** React state — to avoid re-renders per frame. The loop is
  `update()` (physics, AI, collisions, spawning, level-up) then `draw()` /
  `drawUI()` (Canvas 2D rendering, including the in-canvas HUD). State changes
  surface to React only through the `onGameOver` / `onLevelUp` /
  `onScoreUpdate` callbacks. When editing gameplay, mutate the refs inside
  `update()`; don't introduce per-frame `setState`.

- **`components/MobileControls.tsx`** — virtual joystick (movement) + fire
  button. Reports via `onMove`/`onFire` callbacks; App stores them in
  `mobileMoveRef`/`mobileFireRef` and passes the refs into GameCanvas.

- **`services/geminiService.ts`** — `getGemdoriAdvice()` calls `@google/genai`
  (model `gemini-3-flash-preview`) to generate the in-character "겜돌이"
  (Gemdori) coach commentary. Always wrapped in try/catch with Korean fallback
  strings.

- **`services/soundService.ts`** — `soundManager` singleton synthesizes all SFX
  via the Web Audio API (`playTone`); no audio asset files.

- **`constants.ts`** — central gameplay tuning (canvas size, speeds, radii,
  cooldowns, `COLORS` palette). Adjust balance here.

- **`types.ts`** — shared domain types (`Entity`, `Tank`, `Bullet`, `Particle`,
  `GameState`, `GameStatus`).

## Conventions / gotchas

- Tailwind is loaded at runtime via CDN `<script>` in `index.html` (plus a
  CDN font and Font Awesome) — it is **not** part of the build. Utility classes
  work without any Tailwind config file.
- `index.html` also declares an `importmap` pointing React / `@google/genai` at
  esm.sh; the bundled `package.json` deps mirror those versions. Keep versions
  in sync if you change one.
- Canvas internal resolution is `CANVAS_WIDTH`×`CANVAS_HEIGHT` (800×1000); the
  top `UI_HEIGHT` (75px) band is reserved for the in-canvas HUD drawn by
  `drawUI()`.
