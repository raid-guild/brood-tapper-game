"use client";

import { useEffect, useRef, useState } from "react";
import { LOGICAL_W, LOGICAL_H } from "@/game/layout";
import { createGame, step } from "@/game/state";
import { render } from "@/game/render";
import { startLoop } from "@/game/loop";
import { Input } from "@/game/input";
import { Sfx } from "@/game/audio";
import { loadCharacterSprites, type SpriteSheet } from "@/game/sprites";

const PIXEL_FONT = `"Press Start 2P", monospace`;

interface LeaderboardRow {
  handle: string;
  score: number;
  glasses: number;
}

interface Leaderboard {
  top: LeaderboardRow[];
  personalBest: number | null;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState<{
    score: number;
    glasses: number;
  } | null>(null);
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const game = createGame();
    const input = new Input();
    const sfx = new Sfx();
    let sprites: SpriteSheet | null = null;
    let highScore = 0;
    let isAuthed = false;

    loadCharacterSprites().then((s) => (sprites = s));
    fetch("/api/session")
      .then((r) => r.json())
      .then((s) => {
        isAuthed = Boolean(s.authenticated);
        setAuthed(isAuthed);
      })
      .catch(() => setAuthed(false));
    fetch("/api/scores")
      .then((r) => (r.ok ? r.json() : null))
      .then((b: Leaderboard | null) => {
        if (b?.top?.[0]) highScore = b.top[0].score;
      })
      .catch(() => {});

    // Integer scaling with letterbox (plan §4).
    const fit = () => {
      const scale = Math.max(
        1,
        Math.floor(
          Math.min(
            window.innerWidth / LOGICAL_W,
            window.innerHeight / LOGICAL_H
          )
        )
      );
      canvas.width = LOGICAL_W;
      canvas.height = LOGICAL_H;
      canvas.style.width = `${LOGICAL_W * scale}px`;
      canvas.style.height = `${LOGICAL_H * scale}px`;
    };
    fit();
    window.addEventListener("resize", fit);

    input.attach(window);
    const unlockAudio = () => sfx.unlock();
    window.addEventListener("keydown", unlockAudio, { once: true });

    const finishGame = async (score: number, glasses: number, durationMs: number) => {
      setGameOver({ score, glasses });
      if (isAuthed) {
        await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score, glasses, durationMs }),
        }).catch(() => {});
      }
      const res = await fetch("/api/scores").catch(() => null);
      if (res?.ok) {
        const b = (await res.json()) as Leaderboard;
        setBoard(b);
        if (b.top?.[0]) highScore = Math.max(highScore, b.top[0].score);
      }
    };

    const loop = startLoop(
      (dt) => {
        step(game, dt, input.frame());
        // Drain transient events: sfx + game-over side effects.
        for (const e of game.events) {
          if (e.type === "game-over") {
            void finishGame(
              game.stats.score,
              game.stats.glasses,
              Math.max(0, Date.now() - game.stats.startedAt)
            );
          }
        }
        sfx.handle(game.events);
        game.events.length = 0;
        if (game.phase !== "game-over") {
          setGameOver((prev) => (prev ? null : prev));
          setBoard((prev) => (prev ? null : prev));
        }
      },
      () => {
        render(ctx, game, { font: PIXEL_FONT, sprites, highScore });
      }
    );

    return () => {
      loop.stop();
      input.detach(window);
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  return (
    <div className="stage">
      <canvas ref={canvasRef} />
      {gameOver && board && (
        <div className="overlay">
          <h2>HIGH SCORES</h2>
          <div className="board">
            {board.top.length === 0 && <div>NO SCORES YET — BE FIRST</div>}
            {board.top.map((row, i) => (
              <div key={i}>
                {String(i + 1).padStart(2, " ")}. {row.handle.toUpperCase()}{" "}
                — {row.score}
              </div>
            ))}
            {board.personalBest !== null && (
              <div className="me">YOUR BEST — {board.personalBest}</div>
            )}
            {authed === false && (
              <div className="me">LAUNCH FROM THE PORTAL TO RANK</div>
            )}
          </div>
          <p className="dim">PRESS ENTER TO POUR AGAIN</p>
        </div>
      )}
    </div>
  );
}
