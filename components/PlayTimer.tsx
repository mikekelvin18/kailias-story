'use client';

// ── Break reminders and "Done for today" ──
// Counts play time while the child is actively playing on the map and in
// the games (visible screen, a tap in the last 90 s). Then, only at a calm
// moment (the map, a game's opening or its end party, never mid-round):
//   • Break reminder (grown-ups' setting, default 15 min under 5, 20 from 5):
//     Kailia says "Let's give our eyes a rest!" and a gentle wind-down
//     screen offers a movement quest to do with a grown-up.
//   • Done for today (grown-ups' setting, off unless chosen): Noel yawns,
//     the map gets cozy and Kailia says "See you tomorrow!". A grown-up can
//     give 10 more minutes. A game in progress is always finished first.
// Times live in lib/wellbeing.ts (on this device only).

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import PopupClose, { OnTop } from '@/components/PopupClose';
import { GoArrow } from '@/components/games/GameFrame';
import { say, hush } from '@/lib/voice';
import { A11Y_EVENT } from '@/lib/accessibility';
import {
  addPlayTime, breakMinutes, doneForToday, addExtraMinutes, MOVE_QUEST, BREAK_LINE, DONE_LINE,
} from '@/lib/wellbeing';
import { JUMP_BREAK_KEY } from '@/lib/jump';

const TICK = 10_000;
const SINCE_KEY = 'kailia_break_since_ms';
const INK = '#3b2416';

function sinceBreak(): number { try { return Number(sessionStorage.getItem(SINCE_KEY) ?? 0) || 0; } catch { return 0; } }
function setSinceBreak(ms: number) { try { sessionStorage.setItem(SINCE_KEY, String(ms)); } catch { /* fine */ } }

/** The map, a game's opening card or its end party: places a break never interrupts. */
function calmMoment(path: string): boolean {
  if (path === '/play') return true;
  return !!document.querySelector('[data-game-finish], [data-game-intro]');
}

/** A soft numbered step for the movement quest (clean and calm, no drawn doodles). */
function MoveIcon({ i }: { i: number }) {
  const [bg, fg] = [['#BBF7D0', '#065F46'], ['#FDE68A', '#92400E'], ['#FBCFE8', '#9D174D'], ['#BAE6FD', '#075985']][i % 4];
  return (
    <span aria-hidden="true" className="grid place-items-center shrink-0 rounded-full text-xl font-extrabold"
      style={{ width: 40, height: 40, background: bg, color: fg, boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.08)' }}>
      {i + 1}
    </span>
  );
}

/** Little drawn "z z Z" drifting up beside sleepy Noel. */
function SleepyZs() {
  return (
    <svg aria-hidden="true" className="dt-zzz absolute" style={{ left: 'calc(50% - 120px)', top: -6 }} width="54" height="60" viewBox="0 0 54 60">
      <g fill="none" stroke="#FEF3C7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 6 h12 l-12 12 h12" /><path d="M14 26 h10 l-10 10 h10" /><path d="M4 44 h7 l-7 7 h7" />
      </g>
    </svg>
  );
}

// Muse round 7: the break screen covered the whole map with only one way out
// ("We moved!"). It is now easy to set aside: the same big X as every other
// pop-up, Escape, or a tap on the dimmed space around it. Setting it aside
// only snoozes it (it comes back after 5 more minutes of play).
function BreakScreen({ onDone, onLater }: { onDone: () => void; onLater: () => void }) {
  useEffect(() => { say(BREAK_LINE, { voice: 'kailia' }); return () => hush(); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onLater(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onLater]);
  return (
    <OnTop>
      <div className="fixed inset-0 z-[85] flex p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Time for a little break"
        data-testid="break-screen" style={{ background: 'linear-gradient(170deg, rgba(30,58,95,0.9), rgba(23,37,84,0.94))' }}
        onClick={e => { if (e.target === e.currentTarget) onLater(); }}>
        <div className="fixed top-1 right-1 w-16 h-16 z-30" data-break-close>
          <PopupClose onClose={onLater} label="Not now, back to play" color="#7DD3FC" />
        </div>
        <div className="m-auto w-full max-w-sm [@media(max-height:520px)]:max-w-3xl text-center py-2 flex flex-col [@media(max-height:520px)]:flex-row [@media(max-height:520px)]:items-center gap-5">
          <div className="flex-1 min-w-0">
          <div className="flex items-end justify-center gap-1">
            <KailiaSprite size={110} expression="happy" />
            <PandaSprite size={104} expression="sleepy" />
          </div>
          <div className="mt-3 rounded-3xl bg-white px-5 py-4 text-left shadow-xl">
            <p className="text-lg font-bold leading-snug text-gray-900">{BREAK_LINE}</p>
          </div>
          </div>
          <div className="flex-1 min-w-0">
          <p className="mt-0 text-sm font-extrabold uppercase tracking-wide text-sky-200">Movement quest</p>
          <ul className="mt-2 space-y-2 text-left">
            {MOVE_QUEST.map((m, i) => (
              <li key={m} className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <MoveIcon i={i} /><span className="text-base font-bold text-white">{m}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onDone}
            className="mt-5 inline-flex items-center justify-center min-h-[56px] px-8 rounded-full text-lg font-extrabold active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)', color: INK, boxShadow: '0 5px 0 #92400E' }}>
            We moved! Back to play <GoArrow />
          </button>
          <p className="mt-4 text-xs text-sky-100/80">Grown-ups: change or turn off break reminders in the Parent Zone.</p>
          </div>
        </div>
      </div>
    </OnTop>
  );
}

function DoneScreen({ onMore }: { onMore: () => void }) {
  const router = useRouter();
  const path = usePathname();
  useEffect(() => { say(DONE_LINE, { voice: 'kailia' }); return () => hush(); }, []);
  return (
    <OnTop>
      <div className="fixed inset-0 z-[85] flex p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Done for today"
        data-testid="done-today" style={{ background: 'radial-gradient(120% 80% at 50% 30%, rgba(124,45,18,0.88), rgba(30,20,50,0.95))' }}>
        {/* a few still stars and a moon: the map gets cozy for the night */}
        <svg aria-hidden="true" className="absolute inset-x-0 top-0 mx-auto" width="360" height="140" viewBox="0 0 360 140">
          <path d="M290 30a26 26 0 1 0 18 44a21 21 0 0 1 -18 -44z" fill="#FDE68A" />
          {[[40, 40], [90, 80], [150, 30], [210, 70], [250, 20], [330, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 2 : 3} fill="#FEF3C7" opacity="0.8" />)}
        </svg>
        <div className="relative m-auto w-full max-w-sm text-center py-2">
          <div className="relative flex items-end justify-center gap-1">
            <SleepyZs />
            <PandaSprite size={130} expression="sleepy" />
            <KailiaSprite size={104} expression="happy" />
          </div>
          <div className="mt-3 rounded-3xl px-5 py-4 shadow-xl" style={{ background: '#FFF7ED' }}>
            <p className="text-xl font-extrabold text-amber-900">See you tomorrow!</p>
            <p className="mt-1 text-base font-bold leading-snug text-amber-950">We played so much today! Noel is getting sleepy.</p>
          </div>
          {path !== '/play' && (
            <button type="button" onClick={() => router.push('/play')}
              className="mt-6 inline-flex items-center justify-center min-h-[56px] px-8 rounded-full text-lg font-extrabold active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)', color: INK, boxShadow: '0 5px 0 #92400E' }}>
              Back to the map <GoArrow />
            </button>
          )}
          <button type="button" onClick={onMore}
            className="mt-6 block mx-auto min-h-[48px] px-5 rounded-full text-sm font-bold text-orange-100"
            style={{ border: '1.5px solid rgba(254,215,170,0.5)' }}>
            Grown-ups: 10 more minutes
          </button>
        </div>
      </div>
    </OnTop>
  );
}

export default function PlayTimer() {
  const path = usePathname() ?? '';
  const pathRef = useRef(path);
  useEffect(() => { pathRef.current = path; }, [path]);
  const [show, setShow] = useState<'break' | 'done' | null>(null);
  const showRef = useRef(show);
  useEffect(() => { showRef.current = show; }, [show]);
  const lastTap = useRef(0);

  useEffect(() => {
    const tapped = () => { lastTap.current = Date.now(); };
    tapped(); // opening a screen counts as being here
    window.addEventListener('pointerdown', tapped, { passive: true });
    window.addEventListener('keydown', tapped);
    const check = () => {
      if (showRef.current) return;
      if (!calmMoment(pathRef.current)) return;
      if (doneForToday()) { setShow('done'); return; }
      const b = breakMinutes();
      if (b > 0 && sinceBreak() >= b * 60_000) setShow('break');
    };
    const id = window.setInterval(() => {
      const active = !document.hidden && Date.now() - lastTap.current < 90_000;
      if (active && !showRef.current) {
        addPlayTime(TICK);
        setSinceBreak(sinceBreak() + TICK);
      }
      check();
    }, TICK);
    // a game's end party or the map can appear between ticks: look then too
    const mo = new MutationObserver(() => { if (!showRef.current && document.querySelector('[data-game-finish]')) check(); });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener(A11Y_EVENT, check);
    check();
    return () => {
      clearInterval(id); mo.disconnect();
      window.removeEventListener('pointerdown', tapped); window.removeEventListener('keydown', tapped);
      window.removeEventListener(A11Y_EVENT, check);
    };
  }, []);

  // a preview jump link (/go/break, /go/done-today) shows one straight away
  useEffect(() => {
    let hint: string | null = null;
    try { hint = sessionStorage.getItem(JUMP_BREAK_KEY); } catch { /* fine */ }
    if (hint !== 'break' && hint !== 'done') return;
    const t = setTimeout(() => {
      try { sessionStorage.removeItem(JUMP_BREAK_KEY); } catch { /* fine */ }
      setShow(hint as 'break' | 'done');
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // the map is a calm moment as soon as it opens
  useEffect(() => {
    if (path !== '/play' || show) return;
    const t = setTimeout(() => {
      if (doneForToday()) setShow('done');
      else { const b = breakMinutes(); if (b > 0 && sinceBreak() >= b * 60_000) setShow('break'); }
    }, 1200);
    return () => clearTimeout(t);
  }, [path, show]);

  if (show === 'break') return <BreakScreen onDone={() => { setSinceBreak(0); setShow(null); }}
    onLater={() => { setSinceBreak(Math.max(0, (breakMinutes() - 5) * 60_000)); setShow(null); }} />;
  if (show === 'done') return <DoneScreen onMore={() => { addExtraMinutes(10); setSinceBreak(0); setShow(null); }} />;
  return null;
}
