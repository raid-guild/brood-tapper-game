import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getOptionalSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST: record a completed game. Requires an authenticated session;
// no other anti-cheat in v1 (Q12) — the raw games table is the audit trail.
export async function POST(req: NextRequest) {
  const session = await getOptionalSession();
  if (!session.playerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { score, glasses, durationMs } = body as Record<string, unknown>;
  if (
    !isBoundedInt(score, 10_000_000) ||
    !isBoundedInt(glasses, 100_000) ||
    !isBoundedInt(durationMs, 1000 * 60 * 60 * 12)
  ) {
    return NextResponse.json({ error: "invalid fields" }, { status: 400 });
  }

  await db().insert(schema.games).values({
    playerId: session.playerId,
    score,
    glasses,
    durationMs,
  });

  return NextResponse.json({ ok: true });
}

// GET: all-time top 10 + the player's personal best (plan §6).
export async function GET() {
  const session = await getOptionalSession();

  const top = await db()
    .select({
      handle: schema.players.handle,
      score: schema.games.score,
      glasses: schema.games.glasses,
      playedAt: schema.games.createdAt,
    })
    .from(schema.games)
    .innerJoin(schema.players, eq(schema.games.playerId, schema.players.id))
    .orderBy(desc(schema.games.score))
    .limit(10);

  let personalBest: number | null = null;
  if (session.playerId) {
    const [row] = await db()
      .select({ best: sql<number>`max(${schema.games.score})` })
      .from(schema.games)
      .where(eq(schema.games.playerId, session.playerId));
    personalBest = row?.best ?? null;
  }

  return NextResponse.json({ top, personalBest });
}

function isBoundedInt(v: unknown, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
}
