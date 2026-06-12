import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

// Stateless signed+encrypted cookie session (plan §4) — no session table.

export interface SessionData {
  playerId?: string; // players.id
  profileId?: string;
  handle?: string;
}

const sessionOptions: SessionOptions = {
  cookieName: "brood-tapper-session",
  password: process.env.SESSION_SECRET ?? "dev-only-secret-change-me-32chars!!",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // a week of tavern visits
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export function portalModulesUrl() {
  return process.env.PORTAL_MODULES_URL ?? "https://portal.raidguild.org";
}
