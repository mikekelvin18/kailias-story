'use client';

// ── Feelings check-in (after each land) ──
// Kailia says how SHE felt in the land ("I felt a little nervous in the
// dragon's cave!"), then asks the child to tap one of four big faces:
// happy, calm, worried, sad. Every answer is welcome. Worried or sad opens a
// short breathing bubble with Noel ("breathe in... breathe out"). The tap is
// kept on this device as a note for grown-ups (lib/wellbeing.ts). The faces
// are drawn here (no emoji art).

import { useEffect, useRef, useState } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { OnTop } from '@/components/PopupClose';
import { GoArrow } from '@/components/games/GameFrame';
import { say, hush } from '@/lib/voice';
import { useReducedMotion } from '@/components/world/useReducedMotion';
import {
  FEELINGS, LAND_FEELING, FEELING_ASK, FEELING_REPLY, BREATHE_LINES, BREATHE_DONE,
  recordFeeling, type Feeling,
} from '@/lib/wellbeing';

const INK = '#3b2416';

/** A big round painted face for each feeling. */
export function FeelingFace({ feeling, size = 84 }: { feeling: Feeling; size?: number }) {
  const color = FEELINGS.find(f => f.id === feeling)!.color;
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
      <circle cx="40" cy="40" r="35" fill={color} stroke={INK} strokeWidth="3.5" />
      <ellipse cx="28" cy="27" rx="9" ry="6" fill="#FFFFFF" opacity="0.35" />
      {/* eyes */}
      {feeling === 'calm'
        ? <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round"><path d="M22 36 Q28 40 34 36" /><path d="M46 36 Q52 40 58 36" /></g>
        : <g fill={INK}><circle cx="28" cy="34" r="4.2" /><circle cx="52" cy="34" r="4.2" /></g>}
      {/* brows for worried and sad */}
      {/* worried: brows raised in the middle; sad: brows sloping down at the sides, and a tear */}
      {feeling === 'worried' && <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round"><path d="M21 26 Q27 24 33 21" /><path d="M59 26 Q53 24 47 21" /></g>}
      {feeling === 'sad' && <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round"><path d="M21 27 Q27 23 33 23" /><path d="M59 27 Q53 23 47 23" /></g>}
      {feeling === 'sad' && <path d="M56 41 Q53 47 56 49 Q59 47 56 41Z" fill="#E0F2FE" stroke={INK} strokeWidth="1.6" />}
      {/* mouth */}
      {feeling === 'happy' && <path d="M24 48 Q40 66 56 48 Q40 56 24 48Z" fill="#7F1D1D" stroke={INK} strokeWidth="3" strokeLinejoin="round" />}
      {feeling === 'calm' && <path d="M29 52 Q40 59 51 52" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />}
      {feeling === 'worried' && <path d="M28 55 Q34 50 40 55 Q46 60 52 55" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />}
      {feeling === 'sad' && <path d="M28 58 Q40 47 52 58" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />}
      {/* rosy cheeks */}
      {(feeling === 'happy' || feeling === 'calm') && <g fill="#FB7185" opacity="0.45"><circle cx="20" cy="46" r="5" /><circle cx="60" cy="46" r="5" /></g>}
    </svg>
  );
}

/** Noel's breathing bubble: it grows as we breathe in and shrinks as we breathe out, three times. */
export function BreathingBubble({ onDone, rounds = 3 }: { onDone: () => void; rounds?: number }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);         // half-breaths done
  const [finished, setFinished] = useState(false);
  const inhale = n % 2 === 0;
  useEffect(() => {
    if (finished) return;
    if (n >= rounds * 2) {
      say(BREATHE_DONE);
      const t = setTimeout(() => setFinished(true), 0);
      return () => clearTimeout(t);
    }
    say(BREATHE_LINES[n % 2]);
    const t = setTimeout(() => setN(x => x + 1), 4000);
    return () => clearTimeout(t);
  }, [n, rounds, finished]);
  const big = finished ? 1 : inhale ? 1 : 0.55;
  return (
    <div className="text-center" data-testid="breathing">
      <div className="relative mx-auto grid place-items-center" style={{ width: 220, height: 220 }}>
        <span aria-hidden="true" className="absolute rounded-full" style={{
          width: 210, height: 210,
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(186,230,253,0.85) 45%, rgba(125,211,252,0.55))',
          border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 0 40px rgba(125,211,252,0.6)',
          transform: `scale(${reduced ? 0.85 : big})`, transition: reduced ? 'none' : 'transform 3.8s ease-in-out',
        }} />
        <span className="relative"><PandaSprite size={96} expression={finished ? 'happy' : 'sleepy'} /></span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-white" aria-live="polite">
        {finished ? 'You did it!' : BREATHE_LINES[n % 2]}
      </p>
      {finished && (
        <button type="button" onClick={onDone}
          className="mt-4 inline-flex items-center justify-center min-h-[56px] px-8 rounded-full text-lg font-extrabold active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)', color: INK, boxShadow: '0 5px 0 #92400E' }}>
          I feel better <GoArrow />
        </button>
      )}
    </div>
  );
}

export default function FeelingsCheck({ land, onDone }: { land: string; onDone: () => void }) {
  const [picked, setPicked] = useState<Feeling | null>(null);
  const [breathing, setBreathing] = useState(false);
  const spoke = useRef(false);
  const kailiaLine = LAND_FEELING[land] ?? 'That was a big adventure!';

  useEffect(() => {
    if (spoke.current) return;
    spoke.current = true;
    say(`${kailiaLine} ${FEELING_ASK}`, { voice: 'kailia' });
    return () => hush();
  }, [kailiaLine]);

  function pick(f: Feeling) {
    if (picked) return;
    setPicked(f);
    say(FEELING_REPLY[f], { voice: 'kailia' });
    if (f === 'worried' || f === 'sad') {
      setTimeout(() => setBreathing(true), 2600);
    } else {
      recordFeeling(land, f, false);
    }
  }
  function breathed() {
    if (picked) recordFeeling(land, picked, true);
    onDone();
  }

  return (
    <OnTop>
      <div className="fixed inset-0 z-[70] flex p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="How do you feel?"
        data-testid="feelings-check" style={{ background: 'linear-gradient(160deg, rgba(49,46,129,0.985), rgba(30,27,75,0.99))' }}>
        <div className="m-auto w-full max-w-md [@media(max-height:520px)]:max-w-3xl text-center py-2">
          {breathing ? <BreathingBubble onDone={breathed} /> : (
            <div className="flex flex-col [@media(max-height:520px)]:flex-row [@media(max-height:520px)]:items-center gap-5">
              {/* on a phone held sideways: Kailia and her words on the left, the faces on the right */}
              <div className="flex-1 min-w-0">
              <div className="flex items-end justify-center">
                <KailiaSprite size={120} expression={picked === 'worried' || picked === 'sad' ? 'thinking' : 'happy'} />
              </div>
              <div className="mt-3 rounded-3xl bg-white px-5 py-4 text-left shadow-xl">
                <p className="text-lg font-bold leading-snug text-gray-900">{picked ? FEELING_REPLY[picked] : kailiaLine}</p>
                {!picked && <p className="mt-2 text-lg font-extrabold text-violet-800">{FEELING_ASK}</p>}
              </div>
              </div>
              <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 gap-3">
                {FEELINGS.map(f => (
                  <button key={f.id} type="button" onClick={() => pick(f.id)} aria-label={f.label}
                    data-feeling={f.id}
                    className="flex flex-col items-center justify-center rounded-3xl min-h-[132px] [@media(max-height:520px)]:min-h-[112px] active:scale-95 transition-transform"
                    style={{
                      background: picked === f.id ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)',
                      border: `3px solid ${picked === f.id ? '#FDE68A' : 'rgba(255,255,255,0.25)'}`,
                      opacity: picked && picked !== f.id ? 0.45 : 1,
                    }}>
                    <FeelingFace feeling={f.id} size={88} />
                    <span className="mt-1 text-lg font-extrabold text-white">{f.label}</span>
                  </button>
                ))}
              </div>
              {picked && picked !== 'worried' && picked !== 'sad' && (
                <button type="button" onClick={onDone}
                  className="mt-4 inline-flex items-center justify-center min-h-[56px] px-8 rounded-full text-lg font-extrabold active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)', color: INK, boxShadow: '0 5px 0 #92400E' }}>
                  Keep exploring <GoArrow />
                </button>
              )}
              {!picked && (
                <button type="button" onClick={onDone} className="mt-4 min-h-[48px] px-5 text-base font-bold text-indigo-200 underline underline-offset-4">
                  Maybe later
                </button>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </OnTop>
  );
}
