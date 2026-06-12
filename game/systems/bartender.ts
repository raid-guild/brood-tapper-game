import { LANES, LANE_COUNT, BARTENDER_W, TIP_W } from "../layout";
import {
  BARTENDER_SPEED,
  POUR_TIME,
  SCORE_TIP,
  DISTRACTION_TIME,
} from "../constants";
import { overlaps } from "./collision";
import type { GameState, InputFrame } from "../types";

const TAP_ZONE = 8; // how close to the tap end counts as "at the tap"

export function updateBartender(
  state: GameState,
  dt: number,
  input: InputFrame
) {
  const b = state.bartender;

  if (b.pouring) {
    // Locked to the tap while pouring.
    b.pour += dt / POUR_TIME;
    if (input.pourReleased || !input.pourHeld) {
      if (b.pour >= 1) {
        const lane = LANES[b.lane];
        state.mugs.push({
          id: state.nextId++,
          lane: b.lane,
          s: lane.tapX,
          full: true,
        });
        state.events.push({ type: "slide" });
      }
      // Released early: the pour is dumped, no penalty.
      b.pouring = false;
      b.pour = 0;
    }
    return;
  }

  // Lane switching (one bar per press). Keep distance-from-tap so the
  // bartender stays "in place" relative to the staggered bars.
  let lane = b.lane;
  if (input.up) lane = Math.max(0, lane - 1);
  if (input.down) lane = Math.min(LANE_COUNT - 1, lane + 1);
  if (lane !== b.lane) {
    const fromTap = LANES[b.lane].tapX - b.s;
    b.lane = lane;
    b.s = LANES[lane].tapX - fromTap;
  }

  // Walking the bar (to grab tips / intercept empties).
  if (input.left) b.s -= BARTENDER_SPEED * dt;
  if (input.right) b.s += BARTENDER_SPEED * dt;
  const cur = LANES[b.lane];
  b.s = Math.min(cur.tapX, Math.max(cur.doorX + BARTENDER_W, b.s));

  // Start pouring only at the tap.
  if (input.pourHeld && b.s >= cur.tapX - TAP_ZONE) {
    b.s = cur.tapX;
    b.pouring = true;
    b.pour = 0;
    state.events.push({ type: "pour" });
  }

  // Collect tips by walking over them.
  const collected = state.tips.filter(
    (t) => t.lane === b.lane && overlaps(b.s, BARTENDER_W, t.s, TIP_W)
  );
  if (collected.length > 0) {
    const ids = new Set(collected.map((t) => t.id));
    state.tips = state.tips.filter((t) => !ids.has(t.id));
    state.stats.score += SCORE_TIP * collected.length;
    state.distraction = DISTRACTION_TIME;
    state.events.push({ type: "tip", lane: b.lane });
  }
}
