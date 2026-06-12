import {
  LOGICAL_W,
  LOGICAL_H,
  LANES,
  BAR_THICKNESS,
  CUSTOMER_W,
  BARTENDER_W,
  MUG_W,
  MUG_H,
  CHARACTER_H,
  SIGN_RECT,
  STATUS_STRIP_Y,
} from "./layout";
import { LIFE_LOST_TIME } from "./constants";
import { drawSprite, type SpriteSheet } from "./sprites";
import type { GameState, Customer } from "./types";

// Raid Guild-flavored arcade palette (composition per the reference captures,
// colors rebranded: crimson/maroon/gold over the original's blue/red).
const PAL = {
  wall: "#170d14",
  wallEdge: "#33121d",
  floor: "#4d4350",
  floorDark: "#3c3440",
  barTop: "#a8302e",
  barFront: "#6e1b1c",
  barEdge: "#e8b34b",
  door: "#c33d2e",
  doorDark: "#7a1f18",
  brass: "#e8b34b",
  brassDark: "#9a7426",
  brood: "#1d0f0a", // the stout itself
  foam: "#f5efe2",
  glass: "#c9b9a6",
  text: "#f3cf63",
  textDim: "#9a8a4a",
  red: "#ff4a3d",
  white: "#f5efe2",
  neonRed: "#ff5a45",
  neonGold: "#ffd24a",
  tip: "#ffd24a",
};

const CUSTOMER_COLORS = [
  "#c98e3c",
  "#5fae5a",
  "#b04a4a",
  "#7a5fae",
  "#ae8a5f",
  "#4a8ab0",
  "#b0a44a",
  "#8a4ab0",
  "#4ab08a",
  "#b04a8a",
  "#6e6eb0",
  "#b06e4a",
  "#4ab04a",
  "#b0b06e",
  "#6eb0b0",
];

export interface RenderOpts {
  font: string; // pixel font family name
  sprites: SpriteSheet | null;
  highScore: number;
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  opts: RenderOpts,
) {
  ctx.imageSmoothingEnabled = false;
  drawBackground(ctx);
  drawSign(ctx, opts);

  // Bars + fixtures back-to-front (top lane first).
  for (let i = 0; i < LANES.length; i++) {
    drawDoor(ctx, i);
    drawBarSurface(ctx, i);
    drawTap(ctx, i);
  }

  if (state.phase !== "attract" && state.phase !== "loading") {
    for (const tip of state.tips) drawTip(ctx, tip.s, LANES[tip.lane].barY);
    for (const c of state.customers) drawCustomer(ctx, c, opts);
    drawBartender(ctx, state, opts);
    for (const mug of state.mugs)
      drawMug(ctx, mug.s, LANES[mug.lane].barY, mug.full);
  }

  drawHud(ctx, state, opts);
  drawPhaseOverlay(ctx, state, opts);
}

/* ---------------------------------- scene --------------------------------- */

function boundaryX(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  y: number,
) {
  return p1.x + ((p2.x - p1.x) * (y - p1.y)) / (p2.y - p1.y);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = PAL.wall;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Floor: a diagonal slab bounded by the door line (left) and tap line
  // (right), extrapolated from the lane constants — matches the staggered
  // composition of the reference captures.
  const top = LANES[0].barY - 58;
  const bottom = LOGICAL_H;
  const dl = { x: LANES[0].doorX, y: LANES[0].barY };
  const dr = { x: LANES[3].doorX, y: LANES[3].barY };
  const tl = { x: LANES[0].tapX, y: LANES[0].barY };
  const tr = { x: LANES[3].tapX, y: LANES[3].barY };

  ctx.fillStyle = PAL.floor;
  ctx.beginPath();
  ctx.moveTo(boundaryX(dl, dr, top) - 34, top);
  ctx.lineTo(boundaryX(tl, tr, top) + 26, top);
  ctx.lineTo(boundaryX(tl, tr, bottom) + 26, bottom);
  ctx.lineTo(boundaryX(dl, dr, bottom) - 34, bottom);
  ctx.closePath();
  ctx.fill();

  // Right wall (keg wall) beyond the tap line.
  ctx.fillStyle = PAL.wallEdge;
  ctx.beginPath();
  ctx.moveTo(boundaryX(tl, tr, top) + 26, top);
  ctx.lineTo(LOGICAL_W, top);
  ctx.lineTo(LOGICAL_W, bottom);
  ctx.lineTo(boundaryX(tl, tr, bottom) + 26, bottom);
  ctx.closePath();
  ctx.fill();

  // Jukebox screen on the left wall (per reference).
  ctx.save();
  ctx.translate(18, 130);
  ctx.transform(1, -0.22, 0, 1, 0, 0); // tilted panel
  ctx.fillStyle = PAL.brassDark;
  ctx.fillRect(0, 0, 62, 88);
  ctx.fillStyle = "#1e2a26";
  ctx.fillRect(5, 6, 52, 70);
  ctx.fillStyle = "#2e443c";
  for (let y = 10; y < 72; y += 6) ctx.fillRect(7, y, 48, 2);
  ctx.restore();
}

function drawSign(ctx: CanvasRenderingContext2D, opts: RenderOpts) {
  const { x, y, w, h } = SIGN_RECT;
  ctx.fillStyle = "#23101c";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PAL.neonGold;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = PAL.neonRed;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);

  ctx.textAlign = "center";
  ctx.fillStyle = PAL.neonRed;
  ctx.font = `16px ${opts.font}`;
  ctx.fillText("BROOD", x + w / 2, y + 30);
  ctx.fillText("BEER", x + w / 2, y + 50);
  ctx.fillStyle = PAL.neonGold;
  ctx.font = `8px ${opts.font}`;
  ctx.fillText("ON TAP", x + w / 2, y + 65);
}

function drawBarSurface(ctx: CanvasRenderingContext2D, lane: number) {
  const { barY, doorX, tapX } = LANES[lane];
  const left = doorX - 26;
  const right = tapX + 14;
  // top surface
  ctx.fillStyle = PAL.barTop;
  ctx.fillRect(left, barY, right - left, 8);
  ctx.fillStyle = PAL.barEdge;
  ctx.fillRect(left, barY, right - left, 2);
  // front face
  ctx.fillStyle = PAL.barFront;
  ctx.fillRect(left, barY + 8, right - left, BAR_THICKNESS - 8);
  ctx.fillStyle = "#3f0f10";
  ctx.fillRect(left, barY + BAR_THICKNESS - 3, right - left, 3);
}

function drawDoor(ctx: CanvasRenderingContext2D, lane: number) {
  const { barY, doorX } = LANES[lane];
  const x = doorX - 30;
  const y = barY - 50;
  ctx.fillStyle = PAL.doorDark;
  ctx.fillRect(x - 3, y - 3, 28, 53);
  ctx.fillStyle = PAL.door;
  ctx.fillRect(x, y, 22, 50);
  ctx.fillStyle = PAL.doorDark;
  ctx.fillRect(x + 3, y + 4, 16, 18);
  ctx.fillRect(x + 3, y + 26, 16, 18);
  ctx.fillStyle = PAL.brass;
  ctx.fillRect(x + 17, y + 24, 3, 3); // handle
}

function drawTap(ctx: CanvasRenderingContext2D, lane: number) {
  const { barY, tapX } = LANES[lane];
  const x = tapX + 18;
  const y = barY - 18;
  // keg disc on the wall
  ctx.fillStyle = PAL.brassDark;
  ctx.beginPath();
  ctx.arc(x + 16, y - 4, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.brass;
  ctx.beginPath();
  ctx.arc(x + 16, y - 4, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.brood;
  ctx.beginPath();
  ctx.arc(x + 16, y - 4, 5, 0, Math.PI * 2);
  ctx.fill();
  // tap handle reaching over the bar
  ctx.fillStyle = PAL.brassDark;
  ctx.fillRect(x - 4, y - 6, 10, 4);
  ctx.fillRect(x - 4, y - 6, 4, 14);
  ctx.fillStyle = PAL.red;
  ctx.fillRect(x - 6, y - 12, 8, 8); // handle knob
}

/* --------------------------------- actors --------------------------------- */

function drawCustomer(
  ctx: CanvasRenderingContext2D,
  c: Customer,
  opts: RenderOpts,
) {
  const { barY } = LANES[c.lane];
  const bob =
    c.state === "walking" ? Math.round(Math.sin(c.bobPhase) * 1.5) : 0;
  // Sprite cells are square; collision stays CUSTOMER_W in lane space.
  const w = opts.sprites ? CHARACTER_H : CUSTOMER_W;
  const x = Math.round(c.s - w / 2);
  const y = Math.round(barY - CHARACTER_H + bob);

  ctx.save();
  if (c.state === "knockback" || c.state === "exiting") {
    // brief tilt while sliding back (plan §7: cheap transform, no frames)
    ctx.translate(x + w / 2, y + CHARACTER_H / 2);
    ctx.rotate(-0.12);
    ctx.translate(-(x + w / 2), -(y + CHARACTER_H / 2));
  }
  if (opts.sprites) {
    drawSprite(ctx, opts.sprites, c.sprite, x, y, w, CHARACTER_H);
  } else {
    ctx.fillStyle = CUSTOMER_COLORS[c.sprite % CUSTOMER_COLORS.length];
    ctx.fillRect(x, y + 8, CUSTOMER_W, CHARACTER_H - 8);
    ctx.fillRect(x + 5, y, CUSTOMER_W - 10, 10);
  }
  ctx.restore();

  if (c.state === "drinking") {
    drawMug(ctx, c.s + CUSTOMER_W / 2 + 2, barY, true);
  }
  if (c.state === "raging") {
    ctx.fillStyle = PAL.red;
    ctx.font = `8px ${opts.font}`;
    ctx.textAlign = "center";
    ctx.fillText("!", c.s, y - 4);
  }
}

function drawBartender(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  opts: RenderOpts,
) {
  const b = state.bartender;
  const { barY, tapX } = LANES[b.lane];
  const w = opts.sprites ? CHARACTER_H : BARTENDER_W;
  const x = Math.round(b.s - w / 2);
  const y = Math.round(barY - CHARACTER_H);

  if (opts.sprites) {
    drawSprite(
      ctx,
      opts.sprites,
      opts.sprites.keeperIndex,
      x,
      y,
      w,
      CHARACTER_H,
    );
  } else {
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x, y + 8, BARTENDER_W, CHARACTER_H - 8);
    ctx.fillStyle = "#caa";
    ctx.fillRect(x + 5, y, BARTENDER_W - 10, 10);
  }

  // The mug does the animating while pouring (plan §7).
  if (b.pouring) {
    drawFillingMug(ctx, tapX, barY, Math.min(1, b.pour));
  }
}

function drawMug(
  ctx: CanvasRenderingContext2D,
  s: number,
  barY: number,
  full: boolean,
) {
  const x = Math.round(s - MUG_W / 2);
  const y = Math.round(barY - MUG_H);
  ctx.fillStyle = PAL.glass;
  ctx.fillRect(x, y, MUG_W - 3, MUG_H);
  if (full) {
    ctx.fillStyle = PAL.brood; // dark stout body
    ctx.fillRect(x + 1, y + 4, MUG_W - 5, MUG_H - 5);
    ctx.fillStyle = PAL.foam; // foamy head
    ctx.fillRect(x - 1, y, MUG_W - 1, 4);
  } else {
    ctx.fillStyle = "#8a7d6d";
    ctx.fillRect(x + 1, y + 1, MUG_W - 5, MUG_H - 2);
  }
  ctx.fillStyle = PAL.glass; // handle
  ctx.fillRect(x + MUG_W - 3, y + 4, 3, 3);
  ctx.fillRect(x + MUG_W - 3, y + 10, 3, 3);
}

function drawFillingMug(
  ctx: CanvasRenderingContext2D,
  tapX: number,
  barY: number,
  fill: number,
) {
  const x = Math.round(tapX - MUG_W / 2) + 4;
  const y = Math.round(barY - MUG_H);
  ctx.fillStyle = PAL.glass;
  ctx.fillRect(x, y, MUG_W - 3, MUG_H);
  const level = Math.round((MUG_H - 4) * fill);
  ctx.fillStyle = PAL.brood;
  ctx.fillRect(x + 1, y + MUG_H - 1 - level, MUG_W - 5, level);
  if (fill >= 1) {
    ctx.fillStyle = PAL.foam;
    ctx.fillRect(x - 1, y, MUG_W - 1, 4);
  }
  // pour stream from the tap
  ctx.fillStyle = fill < 1 ? PAL.brood : PAL.foam;
  ctx.fillRect(x + 3, y - 8, 3, 8);
}

function drawTip(ctx: CanvasRenderingContext2D, s: number, barY: number) {
  const x = Math.round(s - 5);
  const y = barY - 7;
  ctx.fillStyle = PAL.tip;
  ctx.fillRect(x, y, 10, 7);
  ctx.fillStyle = PAL.brassDark;
  ctx.fillRect(x + 3, y + 2, 4, 3);
}

/* ----------------------------------- HUD ---------------------------------- */

function drawHud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  opts: RenderOpts,
) {
  ctx.font = `14px ${opts.font}`;
  ctx.fillStyle = PAL.text;
  ctx.textAlign = "left";
  ctx.fillText(String(state.stats.score).padStart(6, "0"), 56, 28);
  ctx.textAlign = "right";
  ctx.fillStyle = PAL.textDim;
  ctx.fillText(
    String(Math.max(opts.highScore, state.stats.score)).padStart(6, "0"),
    LOGICAL_W - 24,
    28,
  );

  // Lives: little mugs under the score.
  for (let i = 0; i < state.lives; i++) {
    drawMug(ctx, 64 + i * 20, 56, true);
  }
}

function drawPhaseOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  opts: RenderOpts,
) {
  const cx = LOGICAL_W / 2;
  const blink = Math.floor(Date.now() / 400) % 2 === 0;
  ctx.textAlign = "center";

  switch (state.phase) {
    case "attract": {
      ctx.fillStyle = "rgba(10,6,10,0.55)";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.fillStyle = PAL.neonRed;
      ctx.font = `32px ${opts.font}`;
      ctx.fillText("BROOD", cx, 190);
      ctx.fillText("TAPPER", cx, 230);
      ctx.fillStyle = PAL.text;
      ctx.font = `12px ${opts.font}`;
      if (blink) ctx.fillText("PRESS ENTER TO SERVE", cx, 290);
      ctx.fillStyle = PAL.textDim;
      ctx.font = `8px ${opts.font}`;
      ctx.fillText("A RAID GUILD TAVERN GAME", cx, 320);
      statusStrip(ctx, opts, "CREDIT 1   PRESS ENTER");
      break;
    }
    case "loading": {
      ctx.fillStyle = PAL.text;
      ctx.font = `16px ${opts.font}`;
      ctx.fillText("GET READY TO SERVE", cx, 230);
      statusStrip(ctx, opts, "POUR THE BLOOD OF MOLOCH!");
      break;
    }
    case "playing": {
      statusStrip(
        ctx,
        opts,
        state.distraction > 0 ? "THE CROWD IS DISTRACTED!" : "",
      );
      break;
    }
    case "life-lost": {
      if (state.phaseTimer > LIFE_LOST_TIME - 0.25) {
        ctx.fillStyle = "rgba(255,74,61,0.25)";
        ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      }
      ctx.fillStyle = PAL.red;
      ctx.font = `12px ${opts.font}`;
      ctx.fillText(state.lifeLostReason, cx, 230);
      statusStrip(ctx, opts, state.lives > 0 ? `${state.lives} MUGS LEFT` : "");
      break;
    }
    case "game-over": {
      ctx.fillStyle = "rgba(10,6,10,0.6)";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.fillStyle = PAL.red;
      ctx.font = `28px ${opts.font}`;
      ctx.fillText("GAME OVER", cx, 160);
      ctx.fillStyle = PAL.text;
      ctx.font = `12px ${opts.font}`;
      ctx.fillText(
        `SCORE ${state.stats.score}   GLASSES ${state.stats.glasses}`,
        cx,
        196,
      );
      if (blink) ctx.fillText("PRESS ENTER TO RESTART", cx, LOGICAL_H - 56);
      break;
    }
  }
}

function statusStrip(
  ctx: CanvasRenderingContext2D,
  opts: RenderOpts,
  text: string,
) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, STATUS_STRIP_Y, LOGICAL_W, LOGICAL_H - STATUS_STRIP_Y);
  if (text) {
    ctx.fillStyle = PAL.text;
    ctx.font = `12px ${opts.font}`;
    ctx.textAlign = "center";
    ctx.fillText(text, LOGICAL_W / 2, STATUS_STRIP_Y + 18);
  }
}
