import { LANES, CUSTOMER_W, MUG_W, BARTENDER_W } from "../layout";
import {
  MUG_FULL_SPEED,
  MUG_EMPTY_SPEED,
  SCORE_SERVE,
  SCORE_EMPTY,
} from "../constants";
import { overlaps } from "./collision";
import type { GameState, Customer } from "../types";
import type { Difficulty } from "./difficulty";
import type { LifeLoss } from "./customers";

export function updateMugs(
  state: GameState,
  dt: number,
  diff: Difficulty
): LifeLoss {
  const removals = new Set<number>();
  let loss: LifeLoss = null;

  for (const mug of state.mugs) {
    const lane = LANES[mug.lane];

    if (mug.full) {
      mug.s -= MUG_FULL_SPEED * dt;

      // First walker in its path catches it (front-most overlap).
      const catcher = frontMostWalker(state, mug.lane, mug.s);
      if (catcher) {
        removals.add(mug.id);
        state.stats.score += SCORE_SERVE;
        state.stats.glasses += 1;
        catcher.state = "knockback";
        catcher.knockTarget = Math.max(
          lane.doorX - 1, // landing at/past the door means they exit
          catcher.s - diff.knockback
        );
        state.events.push({ type: "serve", lane: mug.lane });
        continue;
      }

      // Off the door end uncaught: glass shatters, life lost.
      if (mug.s <= lane.doorX - MUG_W) {
        removals.add(mug.id);
        state.events.push({ type: "break", lane: mug.lane, s: lane.doorX });
        loss = { reason: "A FULL MUG FLEW OUT THE DOOR" };
      }
    } else {
      mug.s += MUG_EMPTY_SPEED * dt;

      // Bartender catches the empty anywhere along the bar.
      const b = state.bartender;
      if (b.lane === mug.lane && overlaps(b.s, BARTENDER_W, mug.s, MUG_W)) {
        removals.add(mug.id);
        state.stats.score += SCORE_EMPTY;
        state.events.push({ type: "catch", lane: mug.lane });
        continue;
      }

      // Off the tap end uncaught: glass shatters, life lost.
      if (mug.s >= lane.tapX + MUG_W) {
        removals.add(mug.id);
        state.events.push({ type: "break", lane: mug.lane, s: lane.tapX });
        loss = { reason: "AN EMPTY MUG HIT THE FLOOR" };
      }
    }
  }

  if (removals.size > 0) {
    state.mugs = state.mugs.filter((m) => !removals.has(m.id));
  }
  return loss;
}

function frontMostWalker(
  state: GameState,
  lane: number,
  mugS: number
): Customer | null {
  let best: Customer | null = null;
  for (const c of state.customers) {
    if (c.lane !== lane || c.state !== "walking") continue;
    if (!overlaps(c.s, CUSTOMER_W, mugS, MUG_W)) continue;
    if (best === null || c.s > best.s) best = c;
  }
  return best;
}
