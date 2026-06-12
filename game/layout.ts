// Screen geometry transcribed from the reference captures
// (tapper-images/screens/game-1.png / game-2.png), scaled to the
// fixed logical resolution. All gameplay positions are in logical px;
// the canvas is integer-scaled to the viewport at render time.

export const LOGICAL_W = 512;
export const LOGICAL_H = 448;

export const LANE_COUNT = 4;

export interface Lane {
  /** y of the bar's top surface (mugs slide on this line) */
  barY: number;
  /** x of the door end (left). Customers enter here; full mugs fall off here. */
  doorX: number;
  /** x of the tap end (right). Bartender pours here; empties fall off here. */
  tapX: number;
}

// Four bars staggered diagonally: each lower bar starts further left
// and reaches further right, per the reference layout.
export const LANES: Lane[] = Array.from({ length: LANE_COUNT }, (_, i) => ({
  barY: 122 + i * 72,
  doorX: 124 - i * 28,
  tapX: 372 + i * 38,
}));

export const BAR_THICKNESS = 22;

// Entity footprint widths along the lane (collision is interval overlap).
export const CUSTOMER_W = 26;
export const BARTENDER_W = 26;
export const MUG_W = 14;
export const TIP_W = 12;

// Sprite draw heights (sprites stand on the bar surface line).
export const CHARACTER_H = 40;
export const MUG_H = 16;

// HUD regions
export const SCORE_Y = 18;
export const SIGN_RECT = { x: 176, y: 8, w: 160, h: 76 };
export const STATUS_STRIP_Y = LOGICAL_H - 26;
