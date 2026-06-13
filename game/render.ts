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
import {
  drawDoorSprite,
  drawMugSprite,
  drawSignSprite,
  drawSprite,
  drawTapSprite,
  drawTipSprite,
  type DoorSpriteSheet,
  type MugSpriteSheet,
  type SignSpriteSheet,
  type SpriteSheet,
  type TapSpriteSheet,
  type TipSpriteSheet,
} from "./sprites";
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

const ACTOR_BAR_SINK = 9;

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
  doorSprites: DoorSpriteSheet | null;
  mugSprites: MugSpriteSheet | null;
  signSprites: SignSpriteSheet | null;
  tapSprites: TapSpriteSheet | null;
  tipSprites: TipSpriteSheet | null;
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
    drawDoor(ctx, i, opts);
    drawBarTop(ctx, i);
    drawTap(ctx, i, opts);
  }

  if (state.phase !== "attract" && state.phase !== "loading") {
    for (const c of state.customers) drawCustomer(ctx, c, opts);
    if (!state.bartender.pouring) drawBartender(ctx, state, opts);
    for (let i = 0; i < LANES.length; i++) drawBarFront(ctx, i);
    for (const tip of state.tips) drawTip(ctx, tip.s, LANES[tip.lane].barY, opts);
    for (const mug of state.mugs)
      drawMug(ctx, mug.s, LANES[mug.lane].barY, mug.full, opts);
    if (state.bartender.pouring) drawBartender(ctx, state, opts);
  } else {
    for (let i = 0; i < LANES.length; i++) drawBarFront(ctx, i);
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

  // Room planes: a back wall for the banner, a central floor, and two darker
  // side walls. The side walls follow the lane perspective without adding the
  // old loose diagonal panel near the doors.
  const top = LANES[0].barY - 40;
  const bottom = LOGICAL_H;
  const dl = { x: LANES[0].doorX, y: LANES[0].barY };
  const dr = { x: LANES[3].doorX, y: LANES[3].barY };
  const tl = { x: LANES[0].tapX, y: LANES[0].barY };
  const tr = { x: LANES[3].tapX, y: LANES[3].barY };
  const leftTop = boundaryX(dl, dr, top) - 14;
  const leftBottom = boundaryX(dl, dr, bottom) - 20;
  const rightTop = boundaryX(tl, tr, top) + 24;
  const rightBottom = boundaryX(tl, tr, bottom) + 26;

  ctx.fillStyle = "#211620";
  ctx.fillRect(0, 0, LOGICAL_W, top);

  ctx.fillStyle = "#130a12";
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(leftTop, top);
  ctx.lineTo(leftBottom, bottom);
  ctx.lineTo(0, bottom);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.wallEdge;
  ctx.beginPath();
  ctx.moveTo(rightTop, top);
  ctx.lineTo(LOGICAL_W, top);
  ctx.lineTo(LOGICAL_W, bottom);
  ctx.lineTo(rightBottom, bottom);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.floor;
  ctx.beginPath();
  ctx.moveTo(leftTop, top);
  ctx.lineTo(rightTop, top);
  ctx.lineTo(rightBottom, bottom);
  ctx.lineTo(leftBottom, bottom);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.floorDark;
  ctx.beginPath();
  ctx.moveTo(leftTop, top);
  ctx.lineTo(rightTop, top);
  ctx.lineTo(rightTop, top + 4);
  ctx.lineTo(leftTop, top + 4);
  ctx.closePath();
  ctx.fill();
}

function drawSign(ctx: CanvasRenderingContext2D, opts: RenderOpts) {
  const { x, y, w, h } = SIGN_RECT;
  if (opts.signSprites) {
    drawSignSprite(ctx, opts.signSprites, "brood-beer", x, y, w, h);
    return;
  }

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

function barBounds(lane: number) {
  const { barY, doorX, tapX } = LANES[lane];
  const left = doorX - 26;
  const right = tapX + 14;
  return { barY, left, right };
}

function drawBarTop(ctx: CanvasRenderingContext2D, lane: number) {
  const { barY, left, right } = barBounds(lane);
  // top surface
  ctx.fillStyle = "#4a0f0f";
  ctx.fillRect(left, barY + 8, right - left, 3);
  ctx.fillStyle = PAL.barTop;
  ctx.fillRect(left, barY, right - left, 8);
  ctx.fillStyle = PAL.barEdge;
  ctx.fillRect(left, barY, right - left, 2);
}

function drawBarFront(ctx: CanvasRenderingContext2D, lane: number) {
  const { barY, left, right } = barBounds(lane);
  const frontY = barY + 6;
  // front face
  ctx.fillStyle = "#651818";
  ctx.fillRect(left, frontY, right - left, BAR_THICKNESS - 6);
  for (let x = left + 5; x < right - 3; x += 10) {
    ctx.fillStyle = "#3e0e0f";
    ctx.fillRect(x, frontY + 2, 4, BAR_THICKNESS - 11);
    ctx.fillStyle = "#8b241b";
    ctx.fillRect(x + 4, frontY + 2, 2, BAR_THICKNESS - 11);
  }
  ctx.fillStyle = "#821d19";
  ctx.fillRect(left, frontY, right - left, 2);
  ctx.fillStyle = "#3f0f10";
  ctx.fillRect(left, barY + BAR_THICKNESS - 4, right - left, 2);
  ctx.fillStyle = PAL.barEdge;
  ctx.fillRect(left - 1, barY + BAR_THICKNESS - 2, right - left + 2, 2);
}

function drawDoor(ctx: CanvasRenderingContext2D, lane: number, opts: RenderOpts) {
  const { barY, doorX } = LANES[lane];
  if (opts.doorSprites) {
    drawDoorSprite(
      ctx,
      opts.doorSprites,
      "open-arch",
      doorX - 34,
      barY - 56,
      34,
      56
    );
    return;
  }

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

function drawTap(ctx: CanvasRenderingContext2D, lane: number, opts: RenderOpts) {
  const { barY, tapX } = LANES[lane];
  if (opts.tapSprites) {
    drawTapSprite(
      ctx,
      opts.tapSprites,
      "wall-cask",
      tapX + 12,
      barY - 34,
      40,
      32
    );
    return;
  }

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
  const y = Math.round(barY - CHARACTER_H + ACTOR_BAR_SINK + bob);

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
    drawMug(ctx, c.s + CUSTOMER_W / 2 + 2, barY, true, opts);
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
  const sink = b.pouring ? 4 : ACTOR_BAR_SINK;
  const y = Math.round(barY - CHARACTER_H + sink);

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
    drawFillingMug(ctx, tapX, barY, Math.min(1, b.pour), opts);
  }
}

function drawMug(
  ctx: CanvasRenderingContext2D,
  s: number,
  barY: number,
  full: boolean,
  opts: RenderOpts,
) {
  const drawW = opts.mugSprites ? 16 : MUG_W;
  const drawH = opts.mugSprites ? 16 : MUG_H;
  const x = Math.round(s - drawW / 2);
  const y = Math.round(barY - drawH);
  if (opts.mugSprites) {
    drawMugSprite(ctx, opts.mugSprites, full ? "full" : "empty", x, y, drawW, drawH);
    return;
  }

  const legacyX = Math.round(s - MUG_W / 2);
  const legacyY = Math.round(barY - MUG_H);
  ctx.fillStyle = PAL.glass;
  ctx.fillRect(legacyX, legacyY, MUG_W - 3, MUG_H);
  if (full) {
    ctx.fillStyle = PAL.brood; // dark stout body
    ctx.fillRect(legacyX + 1, legacyY + 4, MUG_W - 5, MUG_H - 5);
    ctx.fillStyle = PAL.foam; // foamy head
    ctx.fillRect(legacyX - 1, legacyY, MUG_W - 1, 4);
  } else {
    ctx.fillStyle = "#8a7d6d";
    ctx.fillRect(legacyX + 1, legacyY + 1, MUG_W - 5, MUG_H - 2);
  }
  ctx.fillStyle = PAL.glass; // handle
  ctx.fillRect(legacyX + MUG_W - 3, legacyY + 4, 3, 3);
  ctx.fillRect(legacyX + MUG_W - 3, legacyY + 10, 3, 3);
}

function drawFillingMug(
  ctx: CanvasRenderingContext2D,
  tapX: number,
  barY: number,
  fill: number,
  opts: RenderOpts,
) {
  const drawW = opts.mugSprites ? 16 : MUG_W;
  const drawH = opts.mugSprites ? 16 : MUG_H;
  const x = Math.round(tapX - drawW / 2) + 4;
  const y = Math.round(barY - drawH);
  if (opts.mugSprites) {
    const name = fill >= 1 ? "full" : fill >= 0.55 ? "filling-2" : "filling-1";
    drawMugSprite(ctx, opts.mugSprites, name, x, y, drawW, drawH);

    // pour stream from the tap
    ctx.fillStyle = fill < 1 ? PAL.brood : PAL.foam;
    ctx.fillRect(x + 4, y - 8, 3, 8);
    return;
  }

  const legacyX = Math.round(tapX - MUG_W / 2) + 4;
  const legacyY = Math.round(barY - MUG_H);
  ctx.fillStyle = PAL.glass;
  ctx.fillRect(legacyX, legacyY, MUG_W - 3, MUG_H);
  const level = Math.round((MUG_H - 4) * fill);
  ctx.fillStyle = PAL.brood;
  ctx.fillRect(legacyX + 1, legacyY + MUG_H - 1 - level, MUG_W - 5, level);
  if (fill >= 1) {
    ctx.fillStyle = PAL.foam;
    ctx.fillRect(legacyX - 1, legacyY, MUG_W - 1, 4);
  }
  // pour stream from the tap
  ctx.fillStyle = fill < 1 ? PAL.brood : PAL.foam;
  ctx.fillRect(legacyX + 3, legacyY - 8, 3, 8);
}

function drawTip(
  ctx: CanvasRenderingContext2D,
  s: number,
  barY: number,
  opts?: RenderOpts,
) {
  if (opts?.tipSprites) {
    const w = 20;
    const h = 16;
    const x = Math.round(s - w / 2);
    const y = Math.round(barY - h + 2);
    drawTipSprite(ctx, opts.tipSprites, "coin-stack", x, y, w, h);
    return;
  }

  const x = Math.round(s - 7);
  const y = barY - 10;
  ctx.fillStyle = PAL.tip;
  ctx.fillRect(x, y, 14, 10);
  ctx.fillStyle = PAL.brassDark;
  ctx.fillRect(x + 4, y + 3, 6, 4);
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
    drawMug(ctx, 64 + i * 20, 56, true, opts);
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
