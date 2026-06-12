// Minimal chiptune SFX, synthesized with WebAudio (assets-as-code, per
// plan §7/Q13): pour, slide, catch, break, door, tip. No audio files.

import type { GameEvent } from "./types";

type SfxName = "pour" | "slide" | "catch" | "break" | "door" | "tip" | "lost";

export class Sfx {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  muted = false;

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock() {
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctor();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.18;
    this.gain.connect(this.ctx.destination);
  }

  handle(events: GameEvent[]) {
    for (const e of events) {
      switch (e.type) {
        case "pour":
          this.play("pour");
          break;
        case "slide":
          this.play("slide");
          break;
        case "serve":
        case "catch":
          this.play("catch");
          break;
        case "break":
          this.play("break");
          break;
        case "door":
        case "clear":
          this.play("door");
          break;
        case "tip":
          this.play("tip");
          break;
        case "life-lost":
        case "game-over":
          this.play("lost");
          break;
      }
    }
  }

  private play(name: SfxName) {
    if (!this.ctx || !this.gain || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case "pour":
        this.tone("square", 90, 60, t, 0.3, 0.05);
        break;
      case "slide":
        this.tone("square", 220, 520, t, 0.12, 0.08);
        break;
      case "catch":
        this.tone("square", 660, 880, t, 0.08, 0.08);
        this.tone("square", 880, 1320, t + 0.08, 0.08, 0.08);
        break;
      case "break":
        this.noise(t, 0.25);
        this.tone("sawtooth", 300, 80, t, 0.2, 0.06);
        break;
      case "door":
        this.tone("triangle", 392, 392, t, 0.07, 0.06);
        this.tone("triangle", 523, 523, t + 0.07, 0.09, 0.06);
        break;
      case "tip":
        this.tone("square", 1047, 1047, t, 0.06, 0.07);
        this.tone("square", 1319, 1319, t + 0.06, 0.06, 0.07);
        this.tone("square", 1568, 1568, t + 0.12, 0.12, 0.07);
        break;
      case "lost":
        this.tone("sawtooth", 440, 110, t, 0.5, 0.08);
        break;
    }
  }

  private tone(
    type: OscillatorType,
    from: number,
    to: number,
    at: number,
    dur: number,
    vol: number
  ) {
    if (!this.ctx || !this.gain) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + dur);
    env.gain.setValueAtTime(vol, at);
    env.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(env).connect(this.gain);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private noise(at: number, dur: number) {
    if (!this.ctx || !this.gain) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const env = this.ctx.createGain();
    env.gain.value = 0.12;
    src.connect(env).connect(this.gain);
    src.start(at);
  }
}
