import { LANES } from "./layout";
import { LIVES, LOADING_TIME, LIFE_LOST_TIME } from "./constants";
import { difficulty } from "./systems/difficulty";
import { updateSpawning } from "./systems/spawning";
import { updateCustomers } from "./systems/customers";
import { updateMugs } from "./systems/sliding";
import { updateBartender } from "./systems/bartender";
import type { GameState, InputFrame } from "./types";

// attract → (coin) → loading "GET READY TO SERVE" → playing
//   → life-lost → loading | game-over → (coin) → loading → ...

export function createGame(): GameState {
  return {
    phase: "attract",
    phaseTimer: 0,
    lives: LIVES,
    stats: { score: 0, glasses: 0, startedAt: 0 },
    elapsed: 0,
    bartender: { lane: 0, s: LANES[0].tapX, pour: 0, pouring: false },
    customers: [],
    mugs: [],
    tips: [],
    spawnTimer: 1.2, // first customer arrives quickly
    distraction: 0,
    lifeLostReason: "",
    nextId: 1,
    events: [],
  };
}

function resetBoard(state: GameState) {
  state.customers = [];
  state.mugs = [];
  state.tips = [];
  state.spawnTimer = 1.2;
  state.distraction = 0;
  state.bartender = { lane: 0, s: LANES[0].tapX, pour: 0, pouring: false };
}

function startRun(state: GameState) {
  state.lives = LIVES;
  state.stats = { score: 0, glasses: 0, startedAt: Date.now() };
  state.elapsed = 0;
  resetBoard(state);
  state.phase = "loading";
  state.phaseTimer = LOADING_TIME;
}

export function step(state: GameState, dt: number, input: InputFrame) {
  switch (state.phase) {
    case "attract": {
      if (input.start) startRun(state);
      break;
    }

    case "loading": {
      state.phaseTimer -= dt;
      if (state.phaseTimer <= 0) state.phase = "playing";
      break;
    }

    case "playing": {
      state.elapsed += dt;
      if (state.distraction > 0) state.distraction -= dt;

      const diff = difficulty(state);
      updateBartender(state, dt, input);
      updateSpawning(state, dt, diff);
      const mugLoss = updateMugs(state, dt, diff);
      const custLoss = updateCustomers(state, dt, diff);

      const loss = mugLoss ?? custLoss;
      if (loss) {
        state.lives -= 1;
        state.lifeLostReason = loss.reason;
        state.phase = "life-lost";
        state.phaseTimer = LIFE_LOST_TIME;
        state.events.push({ type: "life-lost" });
      }
      break;
    }

    case "life-lost": {
      state.phaseTimer -= dt;
      if (state.phaseTimer <= 0) {
        resetBoard(state);
        if (state.lives > 0) {
          state.phase = "loading";
          state.phaseTimer = LOADING_TIME;
        } else {
          state.phase = "game-over";
          state.events.push({ type: "game-over" });
        }
      }
      break;
    }

    case "game-over": {
      if (input.start) startRun(state); // instant restart
      break;
    }
  }
}
