'use client';

// ── "Your turn!" ──
// Kailia stops, her mouth icon bounces, and she invites the child to talk
// out loud (lib/talk.ts picks what, by age). She waits the grown-ups' wait
// time (3, 5 or 8 s, Parent Zone) while little sound waves ripple, says
// thank you, and the game carries on. Nothing is recorded: no microphone,
// ever. A small "Grown-up" button in the corner opens three taps (Said it /
// Tried / Not yet) that are kept on this device as notes for the parent
// pages. The child can also tap "Keep going" at any time.
//
// A game uses it through useTalkMoment(place): `talk.maybe(next, key)` either
// runs `next` right away (pauses off, or already asked for this key) or
// shows the moment first and runs `next` after it. <TalkHost> (in the play
// layout and the story page) draws it on top of whatever is on screen.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import { OnTop } from '@/components/PopupClose';
import { GoArrow } from '@/components/games/GameFrame';
import { say, hush } from '@/lib/voice';
import { narrationOn, soundEnabled } from '@/lib/accessibility';
import {
  talkBand, talkPrompt, talkPausesOn, talkWaitSeconds, recordTalk,
  TALK_THANKS, TALK_RATING_LABEL, type TalkPlace, type TalkPrompt, type TalkRating,
} from '@/lib/talk';
import { JUMP_TALK_KEY } from '@/lib/jump';

/** A big cartoon mouth, opening and closing, with sound waves beside it. */
export function TalkMouth({ size = 76, listening = false }: { size?: number; listening?: boolean }) {
  return (
    <span className={`tm-mouth-wrap inline-grid place-items-center ${listening ? 'tm-listening' : ''}`} style={{ width: size * 1.7, height: size }} aria-hidden="true">
      <svg viewBox="0 0 120 70" width={size * 1.7} height={size} style={{ overflow: 'visible' }}>
        {/* sound waves on both sides */}
        <g className="tm-waves" fill="none" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round">
          <path d="M14 22 Q6 35 14 48" /><path d="M4 14 Q-8 35 4 56" />
          <path d="M106 22 Q114 35 106 48" /><path d="M116 14 Q128 35 116 56" />
        </g>
        <g className="tm-mouth">
          {/* lips */}
          <path d="M28 30 Q60 4 92 30 Q90 62 60 64 Q30 62 28 30Z" fill="#F472B6" stroke="#3b2416" strokeWidth="4" strokeLinejoin="round" />
          {/* the open mouth and tongue */}
          <path d="M38 32 Q60 22 82 32 Q78 54 60 55 Q42 54 38 32Z" fill="#7F1D1D" />
          <path d="M46 47 Q60 38 74 47 Q68 55 60 55 Q52 55 46 47Z" fill="#FB7185" />
          <path d="M42 31 Q60 26 78 31 L76 35 Q60 31 44 35Z" fill="#FFFFFF" />
        </g>
      </svg>
    </span>
  );
}

type Stage = 'ask' | 'wait' | 'thanks';

export default function TalkMoment({ place, prompt, onDone }: { place: TalkPlace; prompt: TalkPrompt; onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('ask');
  const [grownUp, setGrownUp] = useState(false);
  const [noted, setNoted] = useState<TalkRating | null>(null);
  const doneRef = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clear = () => { timers.current.forEach(t => clearTimeout(t)); timers.current = []; };

  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    clear();
    hush();
    onDoneRef.current();
  }, []);

  const thanks = useCallback(() => {
    clear();
    setStage('thanks');
    const line = TALK_THANKS[Math.floor(Math.random() * TALK_THANKS.length)];
    let ended = false;
    const go = () => { if (!ended) { ended = true; later(finish, 400); } };
    if (narrationOn() && soundEnabled()) say(line, { voice: 'kailia', onDone: go });
    later(go, 2600); // never wait on a voice that doesn't come
  }, [finish]);

  const startWait = useCallback(() => {
    setStage(s => (s === 'ask' ? 'wait' : s));
    clear();
    later(thanks, talkWaitSeconds() * 1000);
  }, [thanks]);

  // Kailia asks; the wait starts when she's finished speaking (or soon, if she can't)
  useEffect(() => {
    let started = false;
    const begin = () => { if (!started) { started = true; startWait(); } };
    if (narrationOn() && soundEnabled()) say(prompt.text, { voice: 'kailia', onDone: begin });
    later(begin, Math.min(6500, 1500 + prompt.text.length * 55));
    return () => { clear(); };
  }, [prompt.text, startWait]);

  // the grown-up's panel holds the wait until they've chosen
  function openGrownUp() { clear(); setGrownUp(true); }
  function rate(r: TalkRating) {
    recordTalk(place, prompt, r);
    setNoted(r);
    setGrownUp(false);
    later(thanks, 500);
  }
  function closeGrownUp() { setGrownUp(false); startWait(); }

  const listening = stage === 'wait';
  return (
    <OnTop>
      <div className="fixed inset-0 z-[80] flex p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Your turn to talk"
        data-testid="talk-moment" style={{ background: 'rgba(10,8,40,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
        {/* grown-ups' corner button: small, out of the child's way */}
        <button type="button" onClick={openGrownUp} data-testid="talk-grownup"
          className="absolute top-3 right-3 min-h-[44px] px-3 rounded-full text-sm font-bold"
          style={{ background: 'rgba(255,255,255,0.16)', color: '#F1F5F9', border: '1.5px solid rgba(255,255,255,0.4)', top: 'max(12px, env(safe-area-inset-top))' }}>
          Grown-up
        </button>

        <div className="relative m-auto w-full max-w-sm rounded-3xl px-5 pt-5 pb-6 text-center bounce-in"
          style={{ background: 'linear-gradient(180deg, #4C1D95, #312E81)', border: '3px solid rgba(253,224,71,0.5)', boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }}>
          <div className="flex items-center justify-center gap-1">
            <KailiaSprite size={112} expression={stage === 'thanks' ? 'celebrating' : 'excited'} />
            <TalkMouth listening={listening} />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-amber-200 drop-shadow">Your turn!</p>
          <p className="mt-1 text-lg font-bold leading-snug text-white">
            {stage === 'thanks' ? (noted === 'notyet' ? 'Thanks for listening! On we go.' : 'Thank you! I love hearing you.') : prompt.text.replace(/^Your turn!\s*/, '')}
          </p>
          {prompt.word && stage !== 'thanks' && (
            <p className="mt-3 inline-block rounded-2xl px-5 py-2 text-3xl font-extrabold" style={{ background: '#FEF3C7', color: '#3b2416' }}>
              {prompt.word}
            </p>
          )}
          {stage !== 'thanks' && (
            <button type="button" onClick={thanks}
              className="mt-5 inline-flex items-center justify-center min-h-[56px] px-7 rounded-full text-lg font-extrabold active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)', color: '#3b2416', boxShadow: '0 5px 0 #92400E' }}>
              Keep going <GoArrow />
            </button>
          )}
        </div>

        {grownUp && (
          <div className="fixed inset-0 z-[81] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={closeGrownUp}>
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-left" onClick={e => e.stopPropagation()} data-testid="talk-rate">
              <p className="text-base font-extrabold text-slate-800">For grown-ups: how did it go?</p>
              <p className="text-sm text-slate-600 mt-1">Kept on this device as a gentle note for you. Nothing is recorded.</p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {(['said', 'tried', 'notyet'] as TalkRating[]).map(r => (
                  <button key={r} type="button" onClick={() => rate(r)}
                    className="min-h-[56px] rounded-2xl text-base font-extrabold"
                    style={{ background: r === 'said' ? '#DCFCE7' : r === 'tried' ? '#FEF3C7' : '#EDE9FE', color: r === 'said' ? '#065F46' : r === 'tried' ? '#92400E' : '#5B21B6' }}>
                    {TALK_RATING_LABEL[r]}
                  </button>
                ))}
              </div>
              <button type="button" onClick={closeGrownUp} className="mt-3 w-full min-h-[48px] rounded-full text-base font-bold text-slate-600 bg-slate-100">
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </OnTop>
  );
}

// One talking moment at a time, shown by <TalkHost> (mounted in the play
// layout and on the story page), so it appears on top of any screen of a
// game, whatever phase the game is in.
type Pending = { place: TalkPlace; prompt: TalkPrompt; next: () => void } | null;
let pending: Pending = null;
const hostListeners = new Set<() => void>();
function setPending(p: Pending) { pending = p; hostListeners.forEach(l => l()); }
const subscribeHost = (l: () => void) => { hostListeners.add(l); return () => { hostListeners.delete(l); }; };

/** Shows the talking moment a game asked for. Mount once per page. */
export function TalkHost() {
  const p = useSyncExternalStore(subscribeHost, () => pending, () => null);
  if (!p) return null;
  return <TalkMoment key={p.prompt.id + p.prompt.text} place={p.place} prompt={p.prompt}
    onDone={() => { const n = p.next; setPending(null); n(); }} />;
}

/** Lets a game pause for a talking moment between rounds. */
export function useTalkMoment(place: TalkPlace) {
  const asked = useRef(new Set<string>());

  const maybe = useCallback((next: () => void, key?: string) => {
    if (!talkPausesOn() || (key != null && asked.current.has(key))) { next(); return; }
    if (key != null) asked.current.add(key);
    // a different invitation each time, across the whole visit
    let n = 0;
    try { n = Number(sessionStorage.getItem(`kailia_talk_turn_${place}`) ?? 0) || 0; sessionStorage.setItem(`kailia_talk_turn_${place}`, String(n + 1)); } catch { /* fine */ }
    setPending({ place, prompt: talkPrompt(place, talkBand(), n), next });
  }, [place]);

  // a preview jump link (/go/talk, lib/jump.ts) opens one straight away
  useEffect(() => {
    let hint: string | null = null;
    try { hint = sessionStorage.getItem(JUMP_TALK_KEY); } catch { /* fine */ }
    if (hint !== place) return;
    // the hint is used up only once the moment really shows (the page can mount twice)
    const t = setTimeout(() => {
      try { sessionStorage.removeItem(JUMP_TALK_KEY); } catch { /* fine */ }
      maybe(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [place, maybe]);

  // leaving the game drops a moment that hasn't been answered
  useEffect(() => () => { if (pending?.place === place) setPending(null); }, [place]);

  return { maybe, layer: null as ReactNode, showing: false };
}
