import Link from "next/link";
import { getSession, portalModulesUrl } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StartScreen() {
  const session = await getSession();

  return (
    <main>
      <div className="screen desktop-only">
        <h1 className="title">
          BROOD
          <br />
          TAPPER
        </h1>
        <p className="subtitle">
          POUR THE RAID BROOD.
          <br />
          KEEP THE GUILD WATERED.
        </p>
        <Link className="coin" href="/play">
          INSERT COIN
        </Link>
        {session.handle ? (
          <p className="dim">TENDING BAR AS {session.handle.toUpperCase()}</p>
        ) : (
          <p className="dim">
            PLAYING AS A STRANGER —{" "}
            <a href={portalModulesUrl()}>LAUNCH FROM THE PORTAL</a> TO GET ON
            THE LEADERBOARD
          </p>
        )}
        <p className="dim">
          ↑↓ CHANGE BAR · ←→ WALK · HOLD SPACE TO POUR · ENTER TO START
        </p>
      </div>

      <div className="screen mobile-notice">
        <h1 className="title">BROOD TAPPER</h1>
        <p className="subtitle">
          THIS TAVERN IS BEST PLAYED ON DESKTOP.
          <br />
          GRAB A KEYBOARD AND COME BACK.
        </p>
      </div>
    </main>
  );
}
