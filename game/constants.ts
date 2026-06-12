// Gameplay tuning constants (plan §3). The difficulty ramp lives in
// systems/difficulty.ts; everything here is constant for the whole run.

export const LIVES = 3;

// Scoring
export const SCORE_SERVE = 50; // mug caught by a customer
export const SCORE_CLEAR = 100; // customer knocked out the door
export const SCORE_EMPTY = 25; // empty mug caught by the bartender
export const SCORE_TIP = 1500; // tip collected

// Speeds, logical px/s
export const MUG_FULL_SPEED = 170; // sliding door-ward
export const MUG_EMPTY_SPEED = 130; // sliding tap-ward
export const BARTENDER_SPEED = 150; // walking along the bar
export const KNOCKBACK_SPEED = 240; // customer sliding back after a catch
export const CUSTOMER_BASE_SPEED = 16; // before jitter + ramp

// Timers, seconds
export const POUR_TIME = 0.55; // hold Space this long for a full mug
export const DRINK_TIME = 2.6;
export const DISTRACTION_TIME = 3.0; // customer pause after a tip
export const LOADING_TIME = 2.0; // "GET READY TO SERVE"
export const LIFE_LOST_TIME = 2.0;

export const TIP_CHANCE = 0.15; // per finished drink
