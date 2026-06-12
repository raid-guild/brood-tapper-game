import GameCanvas from "./GameCanvas";

export default function PlayPage() {
  return (
    <main>
      <div className="desktop-only">
        <GameCanvas />
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
