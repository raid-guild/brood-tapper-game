import { LANES, CUSTOMER_W } from "../layout";
import {
  DRINK_TIME,
  KNOCKBACK_SPEED,
  SCORE_CLEAR,
  TIP_CHANCE,
} from "../constants";
import type { Customer, GameState } from "../types";
import type { Difficulty } from "./difficulty";

export type LifeLoss = { reason: string } | null;

export function updateCustomers(
  state: GameState,
  dt: number,
  diff: Difficulty
): LifeLoss {
  const removals = new Set<number>();
  let loss: LifeLoss = null;

  // Process front-most first so bunching caps propagate backward.
  const sorted = [...state.customers].sort((a, b) => b.s - a.s);

  for (const c of sorted) {
    const lane = LANES[c.lane];
    c.bobPhase += dt * 6;

    switch (c.state) {
      case "walking": {
        if (state.distraction > 0) break; // tip distraction: everyone pauses
        let next = c.s + c.speed * diff.speedScale * dt;
        // Don't walk through the customer ahead.
        const ahead = blockerAhead(state, c);
        if (ahead !== null) next = Math.min(next, ahead - CUSTOMER_W);
        c.s = next;
        if (c.s + CUSTOMER_W / 2 >= lane.tapX) {
          c.state = "raging";
          loss = { reason: "A THIRSTY RAIDER REACHED THE TAPS" };
        }
        break;
      }
      case "knockback": {
        c.s -= KNOCKBACK_SPEED * dt;
        if (c.s <= c.knockTarget) {
          c.s = c.knockTarget;
          if (c.s <= lane.doorX) {
            c.state = "exiting";
          } else {
            c.state = "drinking";
            c.drinkTimer = DRINK_TIME * (0.8 + Math.random() * 0.4);
          }
        }
        break;
      }
      case "exiting": {
        c.s -= KNOCKBACK_SPEED * dt;
        if (c.s < lane.doorX - CUSTOMER_W) {
          removals.add(c.id);
          state.stats.score += SCORE_CLEAR;
          state.events.push({ type: "clear", lane: c.lane });
        }
        break;
      }
      case "drinking": {
        c.drinkTimer -= dt;
        if (c.drinkTimer <= 0) {
          // Send the empty sliding back toward the taps...
          state.mugs.push({
            id: state.nextId++,
            lane: c.lane,
            s: c.s,
            full: false,
          });
          state.events.push({ type: "slide" });
          // ...sometimes leave a tip on the bar...
          if (Math.random() < TIP_CHANCE) {
            state.tips.push({ id: state.nextId++, lane: c.lane, s: c.s });
          }
          // ...and keep advancing.
          c.state = "walking";
        }
        break;
      }
      case "raging":
        break;
    }
  }

  if (removals.size > 0) {
    state.customers = state.customers.filter((c) => !removals.has(c.id));
  }
  return loss;
}

function blockerAhead(state: GameState, c: Customer): number | null {
  let nearest: number | null = null;
  for (const other of state.customers) {
    if (other.id === c.id || other.lane !== c.lane) continue;
    if (other.s > c.s && (nearest === null || other.s < nearest)) {
      nearest = other.s;
    }
  }
  return nearest;
}
