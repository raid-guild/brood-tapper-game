export type Phase =
  | "attract"
  | "loading"
  | "playing"
  | "life-lost"
  | "game-over";

export type CustomerState =
  | "walking"
  | "drinking"
  | "knockback"
  | "exiting"
  | "raging"; // reached the taps — triggers life loss

export interface Customer {
  id: number;
  lane: number;
  /** position along the lane in logical px (doorX..tapX) */
  s: number;
  state: CustomerState;
  /** base walk speed, px/s (individually jittered, scaled by ramp) */
  speed: number;
  /** seconds remaining in drinking state */
  drinkTimer: number;
  /** knockback animation: target s and remaining distance */
  knockTarget: number;
  /** which character sprite from the pool */
  sprite: number;
  /** distraction pause remaining, seconds */
  distracted: number;
  /** vertical bob phase for the walk animation */
  bobPhase: number;
}

export interface Mug {
  id: number;
  lane: number;
  s: number;
  /** full mugs slide door-ward (-x), empties slide tap-ward (+x) */
  full: boolean;
}

export interface Tip {
  id: number;
  lane: number;
  s: number;
}

export interface Bartender {
  lane: number;
  s: number;
  /** 0..1 while holding the tap; mug is sent when released at >= 1 */
  pour: number;
  pouring: boolean;
}

export interface GameStats {
  score: number;
  glasses: number; // mugs caught by customers (served)
  startedAt: number; // ms timestamp when this run began
}

export interface GameState {
  phase: Phase;
  phaseTimer: number; // seconds remaining in timed phases (loading, life-lost)
  lives: number;
  stats: GameStats;
  elapsed: number; // seconds in "playing" this run (drives the ramp)
  bartender: Bartender;
  customers: Customer[];
  mugs: Mug[];
  tips: Tip[];
  spawnTimer: number;
  distraction: number; // global pause remaining after a tip is collected
  lifeLostReason: string;
  nextId: number;
  /** transient render events (sfx hooks, flashes) drained each frame */
  events: GameEvent[];
}

export type GameEvent =
  | { type: "pour" }
  | { type: "slide" }
  | { type: "catch"; lane: number }
  | { type: "serve"; lane: number }
  | { type: "clear"; lane: number }
  | { type: "break"; lane: number; s: number }
  | { type: "door"; lane: number }
  | { type: "tip"; lane: number }
  | { type: "life-lost" }
  | { type: "game-over" };

export interface InputFrame {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pourHeld: boolean;
  pourReleased: boolean;
  start: boolean; // Enter, edge-triggered
}
