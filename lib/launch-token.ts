import { jwtVerify } from "jose";

// Portal external-module launch token (plan §5): short-TTL JWT, HS256
// signed with the per-module secret. Claims used: profileID + handle/name
// only (Q9).

export interface LaunchClaims {
  profileId: string;
  handle: string;
}

export async function verifyLaunchToken(token: string): Promise<LaunchClaims> {
  const secret = process.env.MODULE_LAUNCH_SECRET;
  if (!secret) throw new Error("MODULE_LAUNCH_SECRET is not set");
  const issuer = process.env.PORTAL_ISSUER;
  if (!issuer) throw new Error("PORTAL_ISSUER is not set");
  const moduleSlug = process.env.MODULE_SLUG;
  if (!moduleSlug) throw new Error("MODULE_SLUG is not set");

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret),
    {
      algorithms: ["HS256"],
      issuer,
      audience: moduleSlug,
    }
  );

  if (payload.typ !== "portal_module_launch") {
    throw new Error("launch token has invalid typ claim");
  }
  if (payload.moduleSlug !== moduleSlug) {
    throw new Error("launch token has invalid moduleSlug claim");
  }

  const profileId = stringClaim(payload.profileID) ?? stringClaim(payload.profileId);
  const userId = stringClaim(payload.userID) ?? stringClaim(payload.userId);
  const subject = stringClaim(payload.sub);
  const identity = profileId ?? userId ?? subject;
  const handle =
    stringClaim(payload.handle) ??
    stringClaim(payload.name) ??
    (identity ? `member-${identity}` : undefined);

  if (!identity || !handle) {
    throw new Error("launch token missing identity/handle claims");
  }
  return { profileId: identity, handle };
}

function stringClaim(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}
