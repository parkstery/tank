# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Overview

"STEEL SIEGE — Arsenal Tank Survival" — a 20-level top-down tank survival game
in a single self-contained file: `Tank Battle (standalone).html` (HTML + CSS +
vanilla JS, Canvas 2D, Web Audio). UI text is Korean. No build step, no
dependencies beyond Google Fonts.

The `*-handoff.zip` is the original design-tool export the file came from; it is
reference only.

## Running

Open the HTML file directly, or serve the folder (e.g. `npx http-server -p 8765`)
— Playwright blocks `file://`. There is no test suite, linter, or formatter.

`window.__SS` is a debug hook: `__SS.jump(level, mkAll)` starts a level with all
weapons at the given Mk, `__SS.select(i)` switches weapon, `__SS.info()` dumps
state, `__SS.G` is the raw game state.

## Architecture (all inside one IIFE in the `<script>` tag)

- **Canvas layout** — 960×700: top `HUD` band (46px), play field down to `H`
  (640), bottom `BAR` (60px) weapon-slot strip drawn by `renderBar()`. Gameplay
  bounds use `HUD`..`H`.
- **State** — everything lives in the single `G` object (arrays for enemies,
  bullets, ebullets, beams, shells, vortices, drones, bolts, strikes, pulses,
  particles, toasts). `G.up` holds run-long upgrades (`mk[]` per weapon, maxHp,
  maxEn, regen, armor, speed, fireRate, repair, dashCd).
- **Loop** — `loop()` → `update(dt)` (only while `G.screen === 'playing'`) →
  `render()`. Overlays (`ov-start/clear/over/win/pause`) are DOM, toggled by
  `setScreen()`.
- **Player weapons** — `WEAPONS` table (10 entries, unlock level, EN cost,
  cooldown, Mk descriptions). Firing logic is the `switch` in `playerFire()`;
  laser is continuous (cost per second), railgun charges while held and fires
  in `releaseRail()`. Each special weapon has its own update/draw pair
  (`updateShells`/`drawShells`, `updateVortices`, `updateDrones`,
  `updateStrikes`, EMP via `G.pulses`, tesla via `teslaChain`/`G.bolts`).
- **Enemies** — `ENEMY` table: each type has a fixed `weapon` and a `from`
  level. `enemyFire()` switches on weapon; bosses (every 5 levels) use
  `bossAttack()` with patterns that grow with level. Shield tanks block frontal
  hits (`shieldBlocks`), jammers drain EN, carriers spawn `kami` minions
  (minions don't count toward level clear).
- **Progression** — `setupLevel()` unlocks/announces weapons, `onLevelClear()`
  → `rollCards()` (3 upgrade cards, at least one weapon Mk card) →
  `pickCard()` → next level.

## Gotchas

- Never replace `G.ebullets`/`G.bullets` etc. with a new array from code that
  can run inside their update loops (e.g. via `damagePlayer` → `playerDeath`);
  clear with `.length = 0`.
- Damage values can be fractional (laser, swirl apply `dps * dt`).
- Tuning lives in the `WEAPONS`/`ENEMY` tables, `powerMul()` (player damage
  scaling per level) and the HP/damage multipliers in `makeEnemy()`.
