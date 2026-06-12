import { LANES, LANE_COUNT, CUSTOMER_W } from "../layout";
import { CUSTOMER_BASE_SPEED } from "../constants";
import type { GameState } from "../types";
import type { Difficulty } from "./difficulty";

export const CUSTOMER_SPRITE_COUNT = 15; // the customer pool (Q2)

export function updateSpawning(state: GameState, dt: number, diff: Difficulty) {
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return;
  state.spawnTimer = diff.spawnInterval * (0.8 + Math.random() * 0.4);

  // Pick a lane that has room and a clear doorway.
  const order = shuffled([0, 1, 2, 3]);
  for (const lane of order) {
    const inLane = state.customers.filter((c) => c.lane === lane);
    if (inLane.length >= diff.maxPerLane) continue;
    const doorX = LANES[lane].doorX;
    const doorBlocked = inLane.some((c) => c.s < doorX + CUSTOMER_W * 1.5);
    if (doorBlocked) continue;

    state.customers.push({
      id: state.nextId++,
      lane,
      s: doorX,
      state: "walking",
      speed: CUSTOMER_BASE_SPEED * (0.75 + Math.random() * 0.5),
      drinkTimer: 0,
      knockTarget: 0,
      sprite: Math.floor(Math.random() * CUSTOMER_SPRITE_COUNT),
      distracted: 0,
      bobPhase: Math.random() * Math.PI * 2,
    });
    state.events.push({ type: "door", lane });
    return;
  }
}

function shuffled(arr: number[]): number[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const LANE_INDICES = Array.from({ length: LANE_COUNT }, (_, i) => i);
