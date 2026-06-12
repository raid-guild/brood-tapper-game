import type { GameState } from "../types";

// Single-level difficulty curve (plan §3): driven by elapsed time + glasses
// served. This file is the tuning surface for the M1 playtest:
//
//   - `start` values = how hard the shift opens (raise these to begin hotter)
//   - `end` values   = full pressure at the top of the ramp
//   - START_PROGRESS = head start into the ramp (0 = gentle, 1 = maxed)
//
// Customer base walk speed itself lives in constants.ts
// (CUSTOMER_BASE_SPEED) — speedScale below multiplies it.

const START_PROGRESS = 0.15;

const SPAWN = { start: 3.4, end: 1.2 }; // seconds between customers
const SPEED = { start: 1.15, end: 2.2 }; // walk speed multiplier
const KNOCK = { start: 70, end: 35 }; // knockback px per caught mug
const PER_LANE = { start: 2, end: 4 }; // max simultaneous customers per bar

export interface Difficulty {
  spawnInterval: number;
  speedScale: number;
  knockback: number;
  maxPerLane: number;
}

export function difficulty(state: GameState): Difficulty {
  // Progress 0..1 over ~3 minutes of play plus glasses served;
  // whichever pushes harder wins.
  const t = Math.min(1, state.elapsed / 180);
  const g = Math.min(1, state.stats.glasses / 80);
  const p = START_PROGRESS + (1 - START_PROGRESS) * Math.max(t, g);

  return {
    spawnInterval: lerp(SPAWN, p),
    speedScale: lerp(SPEED, p),
    knockback: lerp(KNOCK, p),
    maxPerLane: Math.round(lerp(PER_LANE, p)),
  };
}

function lerp(range: { start: number; end: number }, p: number): number {
  return range.start + (range.end - range.start) * p;
}
