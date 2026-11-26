'use client';

// ── Parent Zone: senses, talking and breaks ──
// The grown-ups' controls for the child-development features (Grok review,
// 2026-11-25): one slider each for voices, sound effects and music, Gentle
// sounds, Low visual, the vibration on right taps, the "Your turn to talk"
// pauses, break reminders and a "Done for today" time. All are settings of
// this device (lib/accessibility.ts), not child data. When "Sound off" is on
// above, the sound sliders go grey and say they're paused.
// Opens by itself on /family#senses (the /go/senses jump link).

import { useEffect, useRef, useState } from 'react';
import {
  A11Y_EVENT, BREAK_CHOICES, DAILY_CHOICES, TALK_WAITS, loadA11y, updateA11yPrefs, type AccessibilityPrefs,
} from '@/lib/accessibility';
import { canVibrate, buzzGood } from '@/lib/haptics';
import { audioCtx, sfxOut } from '@/lib/sfx';
import { say } from '@/lib/voice';
import { breakMinutes } from '@/lib/wellbeing';
import { useHubTheme } from '@/hooks/useHubTheme';

function testChime() {
  const ctx = audioCtx(true);
  if (!ctx) return;
  [784, 1047, 1319].forEach((f, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const t = ctx.currentTime + i * 0.09;
    g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(sfxOut(ctx)); o.start(t); o.stop(t + 0.32);
  });
}

function Switch({ label, note, checked, onChange, disabled }: { label: string; note?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-xl p-3 min-h-[48px] mb-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`} style={{ background: '#F1F5F9' }}>
      <span className="text-sm font-semibold text-gray-700">{label}
        {note && <span className="block text-xs font-normal text-gray-500">{note}</span>}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} className="w-5 h-5 shrink-0" />
    </label>
  );
}

function Choices<T extends string | number>({ label, note, value, options, onPick, name }: {
  label: string; note?: string; value: T; options: { v: T; text: string }[]; onPick: (v: T) => void; name: string;
}) {
  return (
    <div className="rounded-xl p-3 mb-2" style={{ background: '#F1F5F9' }}>
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      {note && <p className="text-xs text-gray-500 mb-2">{note}</p>}
      <div role="group" aria-label={name} className="flex gap-2 flex-wrap mt-1">
        {options.map(o => (
          <button key={String(o.v)} type="button" onClick={() => onPick(o.v)} aria-pressed={value === o.v}
            className="flex-1 min-w-[64px] min-h-[48px] rounded-xl font-extrabold text-base"
            style={value === o.v ? { background: '#7C3AED', color: '#fff' } : { background: '#fff', color: '#4C1D95', border: '2px solid #DDD6FE' }}>
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, disabled, onTry }: { label: string; value: number; onChange: (v: number) => void; disabled: boolean; onTry: () => void }) {
  return (
    <div className={`rounded-xl p-3 mb-2 ${disabled ? 'opacity-50' : ''}`} style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-gray-700" htmlFor={`vol-${label}`}>{label}</label>
        <span className="text-xs font-bold text-gray-500 tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <input id={`vol-${label}`} type="range" min={0} max={100} step={5} value={Math.round(value * 100)} disabled={disabled}
          onChange={e => onChange(Number(e.target.value) / 100)} onPointerUp={() => !disabled && onTry()} onKeyUp={() => !disabled && onTry()}
          className="flex-1 h-12 accent-violet-600" aria-valuetext={`${Math.round(value * 100)} percent`} />
      </div>
    </div>
  );
}

export default function PlaySettings() {
  const { theme } = useHubTheme();
  const [a, setA] = useState<AccessibilityPrefs | null>(null);
  const [vibrates, setVibrates] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const read = () => { setA(loadA11y()); setVibrates(canVibrate()); };
    read();
    window.addEventListener(A11Y_EVENT, read);
    return () => window.removeEventListener(A11Y_EVENT, read);
  }, []);
  // the /go/senses jump link: open this section and bring it into view
  const ready = !!a;
  useEffect(() => {
    if (!ready || window.location.hash !== '#senses' || !ref.current) return;
    ref.current.open = true;
    const t = setTimeout(() => ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 400);
    return () => clearTimeout(t);
  }, [ready]);
  if (!a) return null;
  const set = (p: Partial<AccessibilityPrefs>) => setA(updateA11yPrefs(p));
  const soundOff = a.reducedSound;
  const autoBreak = breakMinutes();

  return (
    <details ref={ref} id="senses" className="group rounded-3xl mb-3 overflow-hidden scroll-mt-4" style={{ background: theme.surface }}>
      <summary className="flex items-center gap-3 p-4 min-h-[64px] cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
        <span className="text-2xl w-9 text-center flex-shrink-0" aria-hidden="true">🌿</span>
        <span className="flex-1 min-w-0">
          <span className="block font-extrabold text-gray-800 leading-tight">Senses, talking &amp; breaks</span>
          <span className="block text-sm text-gray-500 leading-snug">Volume for each sound, gentler visuals, talking pauses and play time</span>
        </span>
        <span className="text-gray-400 text-lg flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
      </summary>
      <div className="px-4 pb-5 pt-1">
        {/* ── Sounds ── */}
        <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500 mt-1 mb-2 px-1">Sounds</p>
        {soundOff && (
          <p className="text-xs font-semibold text-amber-800 rounded-xl p-2.5 mb-2" style={{ background: '#FEF3C7' }}>
            Paused while &ldquo;Sound off&rdquo; is on (in Display &amp; accessibility).
          </p>
        )}
        <Slider label="Voices (Kailia, Noel, friends)" value={a.voiceVolume} disabled={soundOff}
          onChange={v => set({ voiceVolume: v })} onTry={() => say("Hi! I'm Noel. Is this a good loudness?")} />
        <Slider label="Sound effects" value={a.effectsVolume} disabled={soundOff}
          onChange={v => set({ effectsVolume: v })} onTry={testChime} />
        <Slider label="Music" value={a.musicVolume} disabled={soundOff}
          onChange={v => set({ musicVolume: v })} onTry={() => { /* music plays in the games */ }} />
        <Switch label="Gentle sounds" disabled={soundOff}
          note="Softens sharp sound effects and plays celebrations quieter. Good for children who are sensitive to sound."
          checked={a.gentleSounds} onChange={v => { set({ gentleSounds: v }); setTimeout(testChime, 60); }} />

        {/* ── Seeing & feeling ── */}
        <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500 mt-4 mb-2 px-1">Seeing &amp; feeling</p>
        <Switch label="Low visual"
          note="Everything Calm mode does, plus no confetti (one still star instead), fewer moving things, and calmer, less busy scenes in Where's Noel? and Reef Explorer."
          checked={a.lowVisual} onChange={v => set({ lowVisual: v })} />
        <Switch label="Little buzz on right taps"
          note={vibrates ? 'A tiny vibration when your child gets something right. Never on a miss.' : "This device can't vibrate (iPhones and most computers), so nothing happens here."}
          checked={a.haptics !== false} disabled={!vibrates} onChange={v => { set({ haptics: v }); if (v) setTimeout(buzzGood, 50); }} />
        <p className="text-xs text-gray-500 px-1 mb-1">
          This device&apos;s own &ldquo;reduce motion&rdquo; and &ldquo;increase contrast&rdquo; settings are followed automatically.
        </p>

        {/* ── Talking ── */}
        <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500 mt-4 mb-2 px-1">Talking</p>
        <Switch label="Pause for my child to talk"
          note="Now and then Kailia stops and says &quot;Your turn!&quot; (a sound, a word, or the story in their own words, by age). Nothing is recorded: the app never uses the microphone. Tap the small Grown-up button to note how it went."
          checked={a.talkPauses !== false} onChange={v => set({ talkPauses: v })} />
        {a.talkPauses !== false && (
          <Choices name="Talking wait time" label="How long Kailia waits" value={TALK_WAITS.includes(a.talkWait as 3 | 5 | 8) ? a.talkWait : 5}
            options={TALK_WAITS.map(w => ({ v: w as number, text: `${w} seconds` }))} onPick={v => set({ talkWait: v })} />
        )}

        {/* ── Breaks ── */}
        <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500 mt-4 mb-2 px-1">Breaks &amp; play time</p>
        <Choices name="Break reminder" label="Break reminder"
          note={`Kailia suggests resting our eyes and a movement quest with a grown-up. Recommended: ${autoBreak || 15} minutes${a.breakMinutes === 'auto' ? ' (chosen for your child’s age)' : ''}.`}
          value={a.breakMinutes === 'auto' ? 'auto' : String(a.breakMinutes)}
          options={[{ v: 'auto', text: 'Auto' }, ...BREAK_CHOICES.map(b => ({ v: String(b), text: b === 0 ? 'Off' : `${b} min` }))]}
          onPick={v => set({ breakMinutes: v === 'auto' ? 'auto' : (Number(v) as 0 | 10 | 15 | 20) })} />
        <Choices name="Done for today" label="Done for today"
          note="After this much play in a day, Noel yawns and the map gets cozy: &quot;See you tomorrow!&quot; A game in progress is always finished first. You can give 10 more minutes."
          value={DAILY_CHOICES.includes(a.dailyMinutes as 0) ? a.dailyMinutes : 0}
          options={DAILY_CHOICES.map(d => ({ v: d as number, text: d === 0 ? 'Off' : `${d} min` }))} onPick={v => set({ dailyMinutes: v })} />
      </div>
    </details>
  );
}
