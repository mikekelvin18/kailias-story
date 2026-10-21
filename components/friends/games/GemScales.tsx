'use client';

// ── Gem Scales (Ember · counting) ──
// In Ember's glowing cave stands a golden treasure scale. Ember's gems sit
// on her side; the child taps the treasure chest to drop gems onto the
// other side, and Ember counts each one out loud with them. The beam tips
// like a real scale, so overshooting is just something to notice and
// fix (tap a gem on the scale to put it back), never a "wrong". When it
// sits level, the scale shines and Ember jumps for joy.
// Difficulty: more gems; then gem pairs worth 2; then Ember's side comes
// in two little heaps to put together (early adding).
// Notices: moves beyond the fewest needed, the biggest amount balanced.

import { useEffect, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import Stage from '../kit/Stage';
import Actor, { usePetMood } from '../kit/Actor';
import { useBursts } from '../kit/Burst';
import { speak, tones } from '../voice';

const GEM = '#E0457B';
const PAIR = '#7C5CE0';

function Gem({ size = 22, color = GEM }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}>
      <path d="M6 3h12l4 6-10 12L2 9z" fill={color} stroke="#3b2416" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M2 9h20M6 3l3 6 3 12M18 3l-3 6-3 12M9 9l3-6 3 6" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M7 5 L9 8" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Piece({ value }: { value: 1 | 2 }) {
  return value === 1 ? <Gem /> : (
    <span className="inline-flex -space-x-1.5 rounded-full px-0.5" style={{ background: 'rgba(255,255,255,0.3)' }}>
      <Gem size={20} color={PAIR} /><Gem size={20} color={PAIR} />
    </span>
  );
}

function Chest({ open }: { open: boolean }) {
  return (
    <svg width="74" height="58" viewBox="0 0 74 58" aria-hidden="true">
      <g filter="url(#kp-brush)">
        <rect x="6" y="26" width="62" height="28" rx="5" fill="#B5652E" stroke="#3b2416" strokeWidth="2" />
        <rect x="6" y="34" width="62" height="5" fill="#F2C14E" stroke="#3b2416" strokeWidth="1.2" />
        <g style={{ transform: open ? 'rotate(-24deg)' : 'rotate(0deg)', transformOrigin: '8px 26px', transition: 'transform 0.15s' }}>
          <path d="M6 26 Q6 8 37 8 Q68 8 68 26z" fill="#C97A3D" stroke="#3b2416" strokeWidth="2" />
          <path d="M33 8 V26 M41 8 V26" stroke="#F2C14E" strokeWidth="3" />
        </g>
        <rect x="32" y="31" width="10" height="11" rx="2" fill="#FFD966" stroke="#3b2416" strokeWidth="1.2" />
        {open && <circle cx="37" cy="20" r="9" fill="#FFE9A8" opacity="0.7" />}
      </g>
    </svg>
  );
}

function makeSetup(difficulty: number) {
  const max = Math.min(10, 2 + difficulty);
  const min = Math.max(1, Math.floor(max / 2));
  const target = min + Math.floor(Math.random() * (max - min + 1));
  const pairs = difficulty >= 6;
  const split = difficulty >= 8 && target >= 3;
  const a = split ? 1 + Math.floor(Math.random() * (target - 1)) : target;
  return { target, pairs, heaps: split ? [a, target - a] : [target] };
}

export default function GemScales({ difficulty, say, onDone, pet, reaction }: RoundProps) {
  const [setup] = useState(() => makeSetup(difficulty));
  const [right, setRight] = useState<(1 | 2)[]>([]);
  const [opened, setOpened] = useState<0 | 1 | 2>(0);
  const [level, setLevel] = useState(false);
  const [mood, moodKey, setMood] = usePetMood('idle');
  const { layer, fire } = useBursts();
  const st = useRef({ moves: 0, done: false });

  useEffect(() => {
    say(setup.heaps.length > 1 ? 'I have two little heaps of gems. Make your side the same!' : 'Make your side the same as mine! Tap the chest.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);
  useEffect(() => { if (reaction === 'win') setMood('cheer'); }, [reaction, setMood]);

  const sum = right.reduce((s, v) => s + v, 0);
  const diff = setup.target - sum;                       // >0: Ember's side is heavier
  const tilt = Math.max(-12, Math.min(12, diff * 3));
  const fewest = setup.pairs ? Math.ceil(setup.target / 2) : setup.target;

  function settle(nextSum: number) {
    if (nextSum !== setup.target || st.current.done) return;
    st.current.done = true;
    setLevel(true);
    tones([{ f: 784, t: 0.05, d: 0.2 }, { f: 1047, t: 0.18, d: 0.3 }]);
    setTimeout(() => { setMood('cheer'); fire(58, 30, ['#FFE066', '#FF9EC7', '#FFFFFF', '#FFB347'], 18, 90); }, 250);
    setTimeout(() => onDone({ ok: st.current.moves - fewest <= 2, data: { amount: setup.target, extraMoves: Math.max(0, st.current.moves - fewest) } }), 1000);
  }

  function add(v: 1 | 2) {
    if (st.current.done || right.length >= 12) return;
    st.current.moves++;
    const n = sum + v;
    tones([{ f: 520 + n * 30, t: 0.25, d: 0.12 }]);
    setOpened(v);
    setTimeout(() => setOpened(0), 220);
    setRight(r => [...r, v]);
    if (n > setup.target) { setMood('oops'); say('Whoa, my side went up! Tap a gem on your side to take it off.'); }
    else speak(String(n), { rate: 1, pitch: 1.3 });            // Ember counts along
    settle(n);
  }

  function remove(i: number) {
    if (st.current.done) return;
    st.current.moves++;
    tones([{ f: 420, t: 0, d: 0.1 }]);
    const n = sum - right[i];
    setRight(r => r.filter((_, k) => k !== i));
    speak(String(n), { rate: 1, pitch: 1.3 });
    settle(n);
  }

  return (
    <div className="flex flex-col gap-3">
      <Stage world="ember" className="aspect-[4/4.1]">
        {/* the scale */}
        <div className="absolute" style={{ left: '22%', right: '3%', top: '12%', bottom: '10%', zIndex: 4 }}>
          {/* stand */}
          <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <g filter="url(#kp-brush)">
              <path d="M50 14 L50 74" stroke="#3b2416" strokeWidth="5" />
              <path d="M50 14 L50 74" stroke="#F2C14E" strokeWidth="3.2" />
              <path d="M32 80 Q50 66 68 80z" fill="#F2C14E" stroke="#3b2416" strokeWidth="1.2" />
            </g>
          </svg>
          <svg viewBox="0 0 24 24" width="30" height="30" className="absolute left-1/2 -translate-x-1/2" style={{ top: '6%' }} aria-hidden="true">
            <circle cx="12" cy="12" r="8" fill={level ? '#FFF3B0' : '#F2C14E'} stroke="#3b2416" strokeWidth="1.4" />
            <circle cx="12" cy="12" r="3" fill={level ? '#FFFFFF' : '#C98B1E'} />
          </svg>
          {/* beam with two pans, tilting */}
          <div className="absolute left-0 right-0" style={{ top: '19%', transform: `rotate(${-tilt}deg)`, transition: 'transform 0.6s cubic-bezier(.3,1.7,.5,1)' }}>
            <div className="mx-auto h-3 rounded-full" style={{ background: level ? '#FFF3B0' : '#F2C14E', border: '2px solid #3b2416', boxShadow: level ? '0 0 18px #FFE066' : undefined }} />
            {[0, 1].map(side => (
              <div key={side} className="absolute" style={{ [side ? 'right' : 'left']: '-2%', top: 4, width: '46%', transform: `rotate(${tilt}deg)`, transformOrigin: 'top center', transition: 'transform 0.6s cubic-bezier(.3,1.7,.5,1)' }}>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-7 block" aria-hidden="true">
                  <path d="M50 0 L8 30 M50 0 L92 30" stroke="#3b2416" strokeWidth="2.4" />
                  <path d="M50 0 L8 30 M50 0 L92 30" stroke="#F2C14E" strokeWidth="1.2" />
                </svg>
                <div className="rounded-b-[999px] min-h-[58px] px-1.5 pt-1 pb-3 flex flex-wrap content-start justify-center gap-0.5"
                  style={{ background: 'linear-gradient(#F7D774, #D9A53A)', border: '2.5px solid #3b2416', borderTop: '4px solid #FFE9A8' }}>
                  {side === 0
                    ? setup.heaps.map((n, h) => (
                        <span key={h} className="inline-flex flex-wrap justify-center gap-0.5 px-1 rounded-xl" style={{ background: setup.heaps.length > 1 ? 'rgba(255,255,255,0.35)' : undefined }}>
                          {Array.from({ length: n }, (_, i) => <span key={i} className="fg-bob" style={{ animationDelay: `${-i * 0.3}s` }}><Gem /></span>)}
                        </span>
                      ))
                    : right.map((v, i) => (
                        <button key={i} onClick={() => remove(i)} aria-label={`Take off ${v === 2 ? 'a gem pair' : 'a gem'}`} className="fg-drop">
                          <Piece value={v} />
                        </button>
                      ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Actor art={pet.art} name={pet.name} x={13} y={97} h={92} mood={mood} moodKey={moodKey} z={5} />
        {layer}
      </Stage>

      {/* the treasure chests */}
      <div className="flex gap-3 justify-center">
        <button onClick={() => add(1)} className="flex flex-col items-center rounded-3xl px-4 pt-1 pb-2 transition-transform active:scale-95"
          style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)' }} aria-label="Add a gem">
          <Chest open={opened === 1} />
          <span className="flex items-center gap-1 text-sm font-extrabold"><Gem size={18} /> one gem</span>
        </button>
        {setup.pairs && (
          <button onClick={() => add(2)} className="flex flex-col items-center rounded-3xl px-4 pt-1 pb-2 transition-transform active:scale-95"
            style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)' }} aria-label="Add a gem pair, worth two">
            <Chest open={opened === 2} />
            <span className="flex items-center gap-0.5 text-sm font-extrabold"><Gem size={18} color={PAIR} /><Gem size={18} color={PAIR} /> two gems</span>
          </button>
        )}
      </div>
    </div>
  );
}
