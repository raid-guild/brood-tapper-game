import type { InputFrame } from "./types";

// Keyboard state with edge detection. `frame()` returns the input snapshot
// for one fixed-timestep update and clears the edge-triggered flags.

const TRACKED = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyS",
  "KeyA",
  "KeyD",
  "Space",
  "Enter",
]);

export class Input {
  private held = new Set<string>();
  private pourReleased = false;
  private startPressed = false;
  private upPressed = false;
  private downPressed = false;

  private onKeyDown = (e: KeyboardEvent) => {
    if (!TRACKED.has(e.code)) return;
    e.preventDefault();
    if (e.repeat) return;
    this.held.add(e.code);
    if (e.code === "Enter") this.startPressed = true;
    if (e.code === "ArrowUp" || e.code === "KeyW") this.upPressed = true;
    if (e.code === "ArrowDown" || e.code === "KeyS") this.downPressed = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (!TRACKED.has(e.code)) return;
    e.preventDefault();
    this.held.delete(e.code);
    if (e.code === "Space") this.pourReleased = true;
  };

  attach(target: Window) {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
  }

  detach(target: Window) {
    target.removeEventListener("keydown", this.onKeyDown);
    target.removeEventListener("keyup", this.onKeyUp);
  }

  frame(): InputFrame {
    const f: InputFrame = {
      // lane switches are edge-triggered (one bar per press)
      up: this.upPressed,
      down: this.downPressed,
      left: this.held.has("ArrowLeft") || this.held.has("KeyA"),
      right: this.held.has("ArrowRight") || this.held.has("KeyD"),
      pourHeld: this.held.has("Space"),
      pourReleased: this.pourReleased,
      start: this.startPressed,
    };
    this.pourReleased = false;
    this.startPressed = false;
    this.upPressed = false;
    this.downPressed = false;
    return f;
  }
}
