import Link from "next/link";
import {
  SCORE_CLEAR,
  SCORE_EMPTY,
  SCORE_SERVE,
  SCORE_TIP,
} from "@/game/constants";
import { getOptionalSession, portalModulesUrl } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StartScreen() {
  const session = await getOptionalSession();

  return (
    <main>
      <div className="screen desktop-only">
        <h1 className="title">
          BROOD
          <br />
          TAPPER
        </h1>
        <p className="subtitle">
          POUR THE BLOOD OF MOLOCH.
          <br />
          KEEP THE GUILD WATERED.
        </p>
        <Link className="coin" href="/play">
          INSERT COIN
        </Link>
        <div className="score-guide" aria-label="Scoring guide">
          <div className="score-guide__item">
            <span className="score-icon score-icon--mug" aria-hidden="true" />
            <span>FULL MUG {SCORE_SERVE}</span>
          </div>
          <div className="score-guide__item">
            <span className="score-icon score-icon--empty" aria-hidden="true" />
            <span>EMPTY MUG {SCORE_EMPTY}</span>
          </div>
          <div className="score-guide__item">
            <span className="score-icon score-icon--mug" aria-hidden="true" />
            <span>CLEAR {SCORE_CLEAR}</span>
          </div>
          <div className="score-guide__item">
            <span className="score-icon score-icon--coin" aria-hidden="true" />
            <span>TIP {SCORE_TIP}</span>
          </div>
        </div>
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
