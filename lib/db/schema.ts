import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// Data model per plan §6. Every completed game is recorded (Q11/Q12):
// powers the leaderboard, difficulty tuning, and manual anomaly audits.

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: text("profile_id").unique().notNull(), // from launch token
  handle: text("handle").notNull(), // refreshed each launch
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .references(() => players.id)
      .notNull(),
    score: integer("score").notNull(),
    glasses: integer("glasses").notNull(),
    durationMs: integer("duration_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("games_score_idx").on(t.score.desc())]
);
