'use client';

// ── The narration player ──
// 4 to 6 year olds can't read, so every story page, game intro and speech
// bubble is read aloud, and a child (or grown-up) can control it:
//   • a big play / pause button
//   • replay from the start
//   • speed: slower 0.8, normal 1, quicker 1.2 (saved on this device, the
//     same setting as the Parent Zone's "Reading speed")
// <NarrationPlayer> reads a list of lines (each with who says it: Kailia in
// her own voice, Noel in his) and highlights the sentence being read in soft
// yellow. Tapping a sentence reads it again.
// <ReadAloudControls> sits under a speech bubble that NoelVoice reads
// (data-read-aloud) and controls that bubble.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { say, hush, onTalking, isTalking, onPaused, voicePaused, pauseVoice, resumeVoice, splitSentences } from '@/lib/voice';
import { A11Y_EVENT, NARRATION_SPEEDS, narrationSpeed, updateA11yPrefs, soundEnabled } from '@/lib/accessibility';
import { replayBubble } from '@/components/NoelVoice';

export type Speaker = 'kailia' | 'noel';
export interface NarrationLine { who: Speaker; text: string }

const subscribeTalking = (cb: () => void) => onTalking(cb);
const subscribePaused = (cb: () => void) => onPaused(cb);
const subscribeSpeed = (cb: () => void) => { window.addEventListener(A11Y_EVENT, cb); return () => window.removeEventListener(A11Y_EVENT, cb); };

function useVoiceState() {
  const talking = useSyncExternalStore(subscribeTalking, isTalking, () => false);
  const paused = useSyncExternalStore(subscribePaused, voicePaused, () => false);
  const speed = useSyncExternalStore(subscribeSpeed, narrationSpeed, () => 1);
  return { talking, paused, speed };
}

function PlayIcon() { return <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />; }
function PauseIcon() { return <><rect x="6.5" y="5" width="4" height="14" rx="1.4" fill="currentColor" /><rect x="13.5" y="5" width="4" height="14" rx="1.4" fill="currentColor" /></>; }
function ReplayIcon() {
  return <path d="M12 5a7 7 0 1 1-6.7 5M5 4.5v5h5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />;
}

const SPEED_LABEL: Record<number, string> = { 0.8: 'Slow', 1: 'Normal', 1.2: 'Quick' };

/** Play/pause, replay and speed buttons. */
export function NarrationControls({ playing, onPlay, onPause, onReplay, tone = 'light', compact = false }: {
  playing: boolean; onPlay: () => void; onPause: () => void; onReplay: () => void;
  tone?: 'light' | 'dark'; compact?: boolean;
}) {
  const { speed } = useVoiceState();
  const ink = tone === 'light' ? '#4C1D95' : '#FFFFFF';
  const soft = tone === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.14)';
  const big = compact ? 52 : 64;
  return (
    <div className="flex items-center justify-center gap-2.5 flex-wrap" data-narration-controls>
      <button type="button" onClick={playing ? onPause : onPlay}
        aria-label={playing ? 'Pause reading' : 'Read it to me'}
        className="grid place-items-center rounded-full shadow-lg active:scale-95 transition-transform"
        style={{ width: big, height: big, background: 'linear-gradient(135deg, #FDE047, #F59E0B)', color: '#3b2416', border: '3px solid #fff' }}>
        <svg width={big * 0.5} height={big * 0.5} viewBox="0 0 24 24" aria-hidden="true">{playing ? <PauseIcon /> : <PlayIcon />}</svg>
      </button>
      <button type="button" onClick={onReplay} aria-label="Read it again from the start"
        className="grid place-items-center rounded-full active:scale-95 transition-transform"
        style={{ width: 48, height: 48, background: soft, color: ink, border: `2px solid ${tone === 'light' ? '#DDD6FE' : 'rgba(255,255,255,0.35)'}` }}>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><ReplayIcon /></svg>
      </button>
      <div role="group" aria-label="Reading speed" className="flex rounded-full p-1 gap-1"
        style={{ background: soft, border: `2px solid ${tone === 'light' ? '#DDD6FE' : 'rgba(255,255,255,0.35)'}` }}>
        {NARRATION_SPEEDS.map(s => (
          <button key={s} type="button" onClick={() => updateA11yPrefs({ narrationSpeed: s })}
            aria-pressed={speed === s} aria-label={`${SPEED_LABEL[s]} reading, ${s} times`}
            className="rounded-full font-extrabold"
            style={{ minWidth: 48, minHeight: 48, padding: '0 8px', fontSize: 16,
              background: speed === s ? '#7C3AED' : 'transparent', color: speed === s ? '#fff' : ink }}>
            {s === 1 ? '1×' : `${s}×`}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Controls for the speech bubble that NoelVoice reads (game intros). */
export function ReadAloudControls({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { talking, paused } = useVoiceState();
  if (!soundEnabled()) return null;
  return (
    <NarrationControls compact tone={tone} playing={talking && !paused}
      onPlay={() => (paused ? resumeVoice() : replayBubble())}
      onPause={pauseVoice}
      onReplay={replayBubble} />
  );
}

/**
 * A story read aloud sentence by sentence, each in its speaker's voice
 * (Kailia's own voice, or Noel's), with the sentence being read highlighted.
 */
export default function NarrationPlayer({ lines, autoPlay = true, className, textClassName }: {
  lines: NarrationLine[]; autoPlay?: boolean; className?: string; textClassName?: string;
}) {
  const { paused } = useVoiceState();
  // every sentence of every line, with who says it
  const parts = lines.flatMap((l, li) => splitSentences(l.text).map(text => ({ who: l.who, text, line: li })));
  const [at, setAt] = useState(-1);      // the sentence being read (-1 = none)
  const [running, setRunning] = useState(false);
  const runRef = useRef(0);              // each new run gets a number; an old run's "done" is ignored
  const key = parts.map(p => p.text).join('|');

  const playFrom = useCallback((i: number, onlyOne = false) => {
    const run = ++runRef.current;
    const step = (k: number) => {
      if (run !== runRef.current) return;
      if (k >= parts.length || (onlyOne && k > i)) { setAt(-1); setRunning(false); return; }
      setAt(k);
      setRunning(true);
      let moved = false;
      const go = () => { if (!moved) { moved = true; setTimeout(() => step(k + 1), 220); } };
      say(parts[k].text, { voice: parts[k].who === 'kailia' ? 'Kailia' : undefined, onDone: go });
      // no voice on this device at all: keep the highlight moving at reading
      // pace (not before the first tap: until then the line waits for it)
      const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
      if (ua && !ua.hasBeenActive) return;
      setTimeout(() => { if (run === runRef.current && !isTalking() && !voicePaused() && !moved) go(); },
        1800 + parts[k].text.split(/\s+/).length * 330 / narrationSpeed());
    };
    step(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // a new page starts reading by itself (it waits for the first tap on a phone)
  useEffect(() => {
    if (autoPlay) playFrom(0);
    return () => { runRef.current++; hush(); };
  }, [key, autoPlay, playFrom]);

  const playing = running && !paused;
  let n = -1;
  return (
    <div className={className}>
      <p className={textClassName}>
        {lines.map((l, li) => (
          <span key={li} className={l.who === 'noel' ? 'kp-noel-line' : undefined}>
            {/* who is talking, shown but not read out */}
            {l.who === 'noel' && <span aria-hidden="true" className="inline-block align-middle mr-1.5 px-2 py-0.5 rounded-full text-base font-extrabold"
              style={{ background: '#EDE9FE', color: '#5B21B6' }}>Noel</span>}
            {splitSentences(l.text).map(s => {
              const k = ++n;
              return (
                <span key={k} role="button" tabIndex={0} onClick={() => playFrom(k, true)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playFrom(k, true); } }}
                  className="kp-sentence cursor-pointer rounded-md"
                  style={k === at ? { background: '#FEF08A', boxShadow: '0 0 0 3px #FEF08A' } : undefined}>
                  {s}{' '}
                </span>
              );
            })}
          </span>
        ))}
      </p>
      <div className="mt-4">
        <NarrationControls playing={playing}
          onPlay={() => (paused ? resumeVoice() : playFrom(at >= 0 ? at : 0))}
          onPause={pauseVoice}
          onReplay={() => playFrom(0)} />
      </div>
    </div>
  );
}
