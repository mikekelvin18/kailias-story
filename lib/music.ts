// ── Soft background music for the games ──
// A gentle, lullaby-lofi loop made right here in code with the browser's
// Web Audio (no music files, no network, nothing to license: the notes
// are written below, so the app owns them outright).
//
// Four layers, all kept quiet so they sit under the game:
//   pad      warm, slow chords (the "bed")
//   bass     one soft low note per chord
//   bells    a sparse music-box / kalimba melody on a calm 5-note scale
//   shaker   a whisper of rhythm on the off-beats
// Each game gets its own little tune (picked from the page's address),
// all in the same calm style. Music dips while Noel is talking.

import { onTalking } from './voice';

type Song = {
  bpm: number;
  /** chords as MIDI notes, one chord per bar */
  chords: number[][];
  /** notes the melody may use (MIDI) */
  scale: number[];
};

const SONGS: Song[] = [
  // F major, drifting down: Fmaj7, Em7, Dm7, Cmaj7
  { bpm: 74, chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
    scale: [72, 74, 77, 79, 81, 84, 86] },
  // C major, sunny: Cmaj9, Am7, Fmaj7, G6
  { bpm: 78, chords: [[48, 55, 59, 62], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 52, 59]],
    scale: [72, 74, 76, 79, 81, 84, 88] },
  // D major, dreamy: Dmaj7, Bm7, Gmaj7, A6
  { bpm: 70, chords: [[50, 57, 61, 64], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 54, 61]],
    scale: [74, 76, 78, 81, 83, 86, 88] },
  // A minor, cosy night: Am9, Fmaj7, Cmaj7, Em7
  { bpm: 68, chords: [[45, 52, 55, 59], [41, 48, 52, 57], [48, 52, 55, 59], [40, 47, 50, 55]],
    scale: [69, 72, 74, 76, 79, 81, 84] },
];

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** A tiny repeatable random generator, so each game's tune is always the same. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Write a melody: 8 bars x 8 eighth-notes. null = rest. Sparse and stepwise, so it stays calm. */
function writeMelody(song: Song, rand: () => number): (number | null)[] {
  const out: (number | null)[] = [];
  let i = Math.floor(song.scale.length / 2);
  for (let bar = 0; bar < 8; bar++) {
    for (let step = 0; step < 8; step++) {
      const onBeat = step % 2 === 0;
      const play = rand() < (onBeat ? 0.42 : 0.14) && !(bar % 4 === 3 && step > 4); // breathe at phrase ends
      if (!play) { out.push(null); continue; }
      const move = Math.round((rand() - 0.5) * 3); // -1, 0 or +1 mostly
      i = Math.max(0, Math.min(song.scale.length - 1, i + move));
      out.push(song.scale[i]);
    }
  }
  return out;
}

const VOLUME = 0.9;    // overall: under the sound effects, soft enough to talk over
const DUCKED = 0.32;   // while Noel talks

class ChillPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private duck: GainNode | null = null;
  private dry: GainNode | null = null;
  private wet: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private song: Song = SONGS[0];
  private melody: (number | null)[] = [];
  private step = 0;          // eighth-note counter
  private nextTime = 0;
  private stopTalk: (() => void) | null = null;
  private noise: AudioBuffer | null = null;
  playing = false;

  /** Pick this page's tune. Same page, same tune, every time. */
  choose(key: string) {
    const h = hash(key);
    const song = SONGS[h % SONGS.length];
    this.song = song;
    this.melody = writeMelody(song, seeded(h));
  }

  private build() {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.0001;
    this.duck = ctx.createGain();
    this.duck.gain.value = 1;

    // a soft lowpass takes the edge off everything
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2600;
    tone.Q.value = 0.3;

    // a roomy reverb made from fading noise
    const verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.8);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    verb.buffer = ir;

    this.dry = ctx.createGain(); this.dry.gain.value = 0.75;
    this.wet = ctx.createGain(); this.wet.gain.value = 0.55;
    this.dry.connect(tone);
    this.wet.connect(verb).connect(tone);
    tone.connect(this.duck).connect(this.master).connect(ctx.destination);

    // one second of noise for the shaker
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const n = this.noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  }

  private send(node: AudioNode, wet = 0.5) {
    const d = this.ctx!.createGain(); d.gain.value = 1 - wet * 0.5;
    const w = this.ctx!.createGain(); w.gain.value = wet;
    node.connect(d).connect(this.dry!);
    node.connect(w).connect(this.wet!);
  }

  private pad(notes: number[], t: number, dur: number) {
    const ctx = this.ctx!;
    notes.forEach((m, k) => {
      [-6, 6].forEach(cents => {
        const o = ctx.createOscillator();
        o.type = k === 0 ? 'sine' : 'triangle';
        o.frequency.value = hz(m + 12);
        o.detune.value = cents;
        const g = ctx.createGain();
        const peak = 0.028;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + dur * 0.35);
        g.gain.linearRampToValueAtTime(peak * 0.7, t + dur * 0.8);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 900;
        o.connect(f).connect(g);
        this.send(g, 0.6);
        o.start(t); o.stop(t + dur + 0.7);
      });
    });
  }

  private bass(m: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(m - 12 < 33 ? m : m - 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.03, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    this.send(g, 0.15);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /** A music-box / kalimba pluck: a pure tone plus a quiet bell overtone, fading fast. */
  private bell(m: number, t: number) {
    const ctx = this.ctx!;
    const f0 = hz(m);
    [[1, 0.07, 1.6], [3.01, 0.012, 0.5], [4.2, 0.006, 0.3]].forEach(([mult, peak, decay]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f0 * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g);
      this.send(g, 0.7);
      o.start(t); o.stop(t + decay + 0.05);
    });
  }

  private shaker(t: number, accent: boolean) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 6500;
    const g = ctx.createGain();
    const peak = accent ? 0.018 : 0.009;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(hp).connect(g);
    this.send(g, 0.3);
    src.start(t, Math.random() * 0.8); src.stop(t + 0.12);
  }

  private schedule = () => {
    const ctx = this.ctx;
    if (!ctx) return;
    const eighth = 60 / this.song.bpm / 2;
    const bars = this.song.chords.length;
    while (this.nextTime < ctx.currentTime + 0.4) {
      const t = this.nextTime;
      const s = this.step % 64;          // 8-bar loop
      const inBar = s % 8;
      const bar = Math.floor(s / 8);
      const chord = this.song.chords[bar % bars];
      if (inBar === 0) {
        this.pad(chord, t, eighth * 8);
        this.bass(chord[0], t, eighth * 5);
      }
      if (inBar === 5) this.bass(chord[0] + 7, t, eighth * 3); // a soft "and" note on the fifth
      // drums stay out for the first 2 bars of the first time round, then join quietly
      if (this.step >= 16 && inBar % 2 === 1) this.shaker(t, inBar === 3 || inBar === 7);
      const note = this.melody[s];
      if (note != null && this.step >= 8) this.bell(note, t + (inBar % 2 ? eighth * 0.08 : 0)); // a little swing
      this.nextTime += eighth;
      this.step++;
    }
  };

  start() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) this.build();
      const ctx = this.ctx!;
      if (ctx.state === 'suspended') void ctx.resume();
      if (this.playing) return;
      this.playing = true;
      this.step = 0;
      this.nextTime = ctx.currentTime + 0.15;
      const now = ctx.currentTime;
      this.master!.gain.cancelScheduledValues(now);
      this.master!.gain.setValueAtTime(Math.max(0.0001, this.master!.gain.value), now);
      this.master!.gain.linearRampToValueAtTime(VOLUME, now + 2.5); // fade in gently
      this.timer = setInterval(this.schedule, 100);
      this.schedule();
      this.stopTalk = onTalking(talking => {
        const d = this.duck; const c = this.ctx;
        if (!d || !c) return;
        const t = c.currentTime;
        d.gain.cancelScheduledValues(t);
        d.gain.setValueAtTime(d.gain.value, t);
        d.gain.linearRampToValueAtTime(talking ? DUCKED / VOLUME : 1, t + (talking ? 0.25 : 1.2));
      });
    } catch { this.playing = false; /* music is a bonus */ }
  }

  stop() {
    if (!this.playing || !this.ctx) return;
    this.playing = false;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setValueAtTime(this.master!.gain.value, now);
    this.master!.gain.linearRampToValueAtTime(0.0001, now + 0.8);
    const timer = this.timer;
    this.timer = null;
    this.stopTalk?.(); this.stopTalk = null;
    setTimeout(() => {
      if (timer) clearInterval(timer);
      if (!this.playing) void ctx.suspend().catch(() => {});
    }, 900);
  }

  /** Pause while the app is in the background, pick up when it's back. */
  pause() { if (this.ctx && this.playing) void this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.playing) void this.ctx.resume().catch(() => {}); }
}

let player: ChillPlayer | null = null;
export function music() {
  player = player ?? new ChillPlayer();
  return player;
}
