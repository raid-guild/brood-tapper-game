import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSession, portalModulesUrl } from "@/lib/session";
import { verifyLaunchToken } from "@/lib/launch-token";

// Portal launch entry point (plan §5):
//   GET /api/auth/callback?token=<JWT>
// Verify, upsert the player (handle is a snapshot — refresh it each
// launch), set the session cookie, land on the start screen. Any
// failure — including the designed back-button-after-TTL revisit —
// goes back to the Portal modules page.

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(portalModulesUrl());
  }

  try {
    const claims = await verifyLaunchToken(token);

    const [player] = await db()
      .insert(schema.players)
      .values({
        profileId: claims.profileId,
        handle: claims.handle,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.players.profileId,
        set: { handle: claims.handle, lastSeenAt: new Date() },
      })
      .returning();

    const session = await getSession();
    session.playerId = player.id;
    session.profileId = claims.profileId;
    session.handle = claims.handle;
    await session.save();

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err) {
    console.error("launch token rejected:", err);
    return NextResponse.redirect(portalModulesUrl());
  }
}
