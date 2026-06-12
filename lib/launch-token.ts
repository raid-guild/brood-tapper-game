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

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret),
    {
      algorithms: ["HS256"],
      issuer: process.env.PORTAL_ISSUER,
      audience: process.env.MODULE_SLUG,
      typ: "JWT",
    }
  );

  const profileId =
    (payload.profileID as string | undefined) ??
    (payload.profileId as string | undefined) ??
    (payload.sub as string | undefined);
  const handle =
    (payload.handle as string | undefined) ??
    (payload.name as string | undefined);

  if (!profileId || !handle) {
    throw new Error("launch token missing profileID/handle claims");
  }
  return { profileId, handle };
}
