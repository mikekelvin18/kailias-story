'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import PopupClose from '@/components/PopupClose';

// ── Grown-up check ──
// Stands in front of every purchase screen and every link that leaves the
// app (Apple Kids category / Google Play Families / COPPA rule: a child must
// never reach a purchase or an outside page on their own).
//
// Two steps, both needed: HOLD a button for 3 seconds (hard to do by
// accident), then answer a times-table question a pre-reader can't. A pass
// is remembered for 10 minutes in this browser tab only (sessionStorage),
// so a parent isn't asked twice in a row; nothing about it is saved
// anywhere else.

const HOLD_MS = 3000;
const PASS_KEY = 'kailia_grownup_pass_v1';
const PASS_FOR_MS = 10 * 60 * 1000;

export function grownUpPassed(): boolean {
  try {
    const t = Number(sessionStorage.getItem(PASS_KEY) ?? 0);
    return t > 0 && Date.now() - t < PASS_FOR_MS;
  } catch { return false; }
}

function rememberPass() {
  try { sessionStorage.setItem(PASS_KEY, String(Date.now())); } catch { /* private mode: ask each time */ }
}

function newQuestion() {
  return { a: 6 + Math.floor(Math.random() * 4), b: 3 + Math.floor(Math.random() * 6) };
}

/** The check itself, as a card. Calls onPass once both steps are done. */
export function GrownUpCheck({ onPass, title = 'Grown-ups only', note }: { onPass: () => void; title?: string; note?: string }) {
  const [step, setStep] = useState<'hold' | 'sum'>('hold');
  const [progress, setProgress] = useState(0);
  const [q, setQ] = useState({ a: 7, b: 6 });
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const raf = useRef<number | null>(null);
  const started = useRef(0);

  // random only after mount, so the server and browser render the same thing
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setQ(newQuestion()); }, []);
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  // one animation-frame loop while the button is held
  function loop() {
    const step = () => {
      const p = Math.min(1, (performance.now() - started.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) { raf.current = null; setStep('sum'); return; }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  function startHold(e: React.PointerEvent) {
    e.preventDefault();
    started.current = performance.now();
    if (raf.current) cancelAnimationFrame(raf.current);
    loop();
  }
  function stopHold() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (step === 'hold') setProgress(0);
  }

  const secondsLeft = Math.ceil((1 - progress) * (HOLD_MS / 1000));

  return (
    <div className="text-center" data-testid="grown-up-check">
      <p className="text-xl font-extrabold text-indigo-950">{title}</p>
      {note && <p className="text-base text-indigo-900/80 mt-1">{note}</p>}

      {step === 'hold' ? (
        <>
          <p className="text-base font-semibold text-indigo-900 mt-3">Step 1 of 2: press and hold the button until the ring fills.</p>
          <button
            onPointerDown={startHold} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}
            onContextMenu={e => e.preventDefault()}
            aria-label="Press and hold for 3 seconds"
            className="relative mx-auto mt-4 flex items-center justify-center rounded-full select-none touch-none"
            style={{ width: 128, height: 128, background: '#EEF2FF', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
            <svg viewBox="0 0 128 128" className="absolute inset-0" aria-hidden>
              <circle cx="64" cy="64" r="56" fill="none" stroke="#C7D2FE" strokeWidth="10" />
              <circle cx="64" cy="64" r="56" fill="none" stroke="#6D28D9" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 56} strokeDashoffset={(1 - progress) * 2 * Math.PI * 56}
                transform="rotate(-90 64 64)" />
            </svg>
            <span className="relative text-lg font-extrabold text-indigo-950 leading-tight">
              {progress > 0 ? `${secondsLeft}…` : <>Hold<br />me</>}
            </span>
          </button>
        </>
      ) : (
        <form className="mt-3" onSubmit={e => {
          e.preventDefault();
          if (Number(answer) === q.a * q.b) { rememberPass(); onPass(); }
          else { setWrong(true); setAnswer(''); setQ(newQuestion()); }
        }}>
          <label className="block text-base font-semibold text-indigo-900">Step 2 of 2: what is {q.a} × {q.b}?
            <input inputMode="numeric" autoComplete="off" value={answer}
              onChange={e => { setAnswer(e.target.value.replace(/\D/g, '').slice(0, 3)); setWrong(false); }}
              className="mt-2 mx-auto block w-32 min-h-[48px] rounded-xl border-2 border-violet-300 px-3 text-xl font-bold text-center text-gray-900 bg-white" />
          </label>
          {wrong && <p className="text-base font-semibold text-violet-800 mt-2">Not quite, here is a new one.</p>}
          <button type="submit" className="mt-3 min-h-[48px] px-6 rounded-full bg-violet-700 text-white text-base font-extrabold">Continue</button>
        </form>
      )}
    </div>
  );
}

/** A floating box with the grown-up check; goes to `href` (or calls onPass) after it. */
export function ParentGateModal({ href, onPass, onClose, note }: { href?: string; onPass?: () => void; onClose: () => void; note?: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pass = () => {
    onPass?.();
    if (!href) return;
    if (/^https?:/i.test(href)) window.open(href, '_blank', 'noopener,noreferrer');
    else router.push(href);
    onClose();
  };

  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true"
      style={{ background: 'rgba(15,23,42,0.6)' }} onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 pt-7 shadow-2xl" onClick={e => e.stopPropagation()}>
        <PopupClose onClose={onClose} />
        <GrownUpCheck onPass={pass} note={note} />
      </div>
    </div>,
    document.body,
  );
}

/** Wraps a page: shows the grown-up check first, then the page. */
export function ParentGatePage({ children, note }: { children: React.ReactNode; note?: string }) {
  const [ok, setOk] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (grownUpPassed()) setOk(true); }, []);
  if (ok) return <>{children}</>;
  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)' }}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <GrownUpCheck onPass={() => setOk(true)} note={note} />
        <p className="text-center mt-4">
          <a href="/play" className="inline-block min-h-[48px] leading-[48px] px-4 text-base font-bold text-indigo-700 underline underline-offset-2">Back to the map</a>
        </p>
      </div>
    </main>
  );
}
