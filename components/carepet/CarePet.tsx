'use client';

// ── The daily care pet ──
// The pet sits beside Noel on the world map. Once a day it pops up by
// itself with ONE short task (feed, play or care, rotating), then rests
// until tomorrow. Tapping it any time opens the same sheet.
//
// The rules live in lib/carepet/engine.ts (shareable, no Kailia code);
// Kailia's saving, activities and measurement live in lib/kailiaPet.ts.
// Child-facing rules: no scores, no clocks, no sad or sick pet. A "not
// yet" gets the same warm thank-you as a win; only the hidden difficulty
// step changes.

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import LiveArt from '@/components/characters/LiveArt';
import PetEgg from './PetEgg';
import PetTrace from './PetTrace';
import { pickPlayPet, PlayPet } from '@/components/games/playPet';
import { chime } from '@/components/friends/voice';
import { speak, stopSpeaking } from '@/lib/speak';
import { COMPANIONS, getFocusCompanion, setFocusCompanion } from '@/lib/rewards';
import { CarePetState, Outcome, Stage, stageFor, shouldAutoOpen, taskDoneToday } from '@/lib/carepet/engine';
import { openPet, noteAutoOpened, petLocked, taskFor, finishToday, today, PetTask, PET_CONFIG } from '@/lib/kailiaPet';

type Phase = 'task' | 'thanks' | 'pick' | 'resting' | 'locked' | 'gate';

const STAGE_SCALE: Record<Stage, number> = { egg: 1, baby: 0.62, little: 0.8, grown: 1 };

// small = the map button: a plain breathing picture (no moving-parts rig,
// so the map never runs two pet canvases at once)
function PetPicture({ friend, stage, size, crack, small }: { friend: PlayPet; stage: Stage; size: number; crack?: boolean; small?: boolean }) {
  if (stage === 'egg') return <PetEgg size={size * 0.8} crack={crack} />;
  const w = Math.round(size * STAGE_SCALE[stage]);
  // eslint-disable-next-line @next/next/no-img-element
  if (small) return <img src={friend.art} alt="" width={w} className="art-breathe" style={{ display: 'block', width: w, height: 'auto', transformOrigin: '50% 100%' }} />;
  return <LiveArt src={friend.art} alt={friend.name} size={w} />;
}

export default function CarePet({ holdAutoOpen = false }: { holdAutoOpen?: boolean }) {
  const router = useRouter();
  const { state: assessment, totalScore, loaded } = useAssessment();
  const [pet, setPet] = useState<CarePetState | null>(null);
  const [friend, setFriend] = useState<PlayPet>(COMPANIONS[1]);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('task');
  const [task, setTask] = useState<PetTask | null>(null);
  const [line, setLine] = useState('');
  const [hatching, setHatching] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [gate, setGate] = useState<{ a: number; b: number; options: number[] } | null>(null);

  // load (or start) the pet once the assessment is known
  useEffect(() => {
    if (!loaded) return;
    const r = openPet(assessment.ageGroup, totalScore);
    if (!r) return;
    /* eslint-disable react-hooks/set-state-in-effect -- the pet lives in this device's storage, readable only after mount */
    setPet(r.state);
    setFriend(pickPlayPet());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loaded, assessment.ageGroup, totalScore]);

  const stage: Stage = pet ? stageFor(pet.happyDays, PET_CONFIG) : 'egg';
  const doneToday = pet ? taskDoneToday(pet, today()) : false;

  const say = useCallback((text: string) => { setLine(text); speak(text); }, []);

  const openSheet = useCallback((auto: boolean) => {
    // re-read, so a map left open past midnight starts the new day
    const fresh = openPet(assessment.ageGroup, totalScore);
    if (!fresh || !fresh.state.today) return;
    let s = fresh.state;
    const hello = fresh.greeting;
    if (auto) s = noteAutoOpened(s);
    setPet(s);
    setShowTip(false);
    setHatching(false);
    const egg = stageFor(s.happyDays, PET_CONFIG) === 'egg';
    const hi = hello === 'missed-you' ? 'I missed you! Big hug!'
      : hello === 'first' ? 'Look, a magic egg! Something is wiggling inside.'
      : hello === 'hello' ? (egg ? 'The magic egg is wiggling!' : `Hi! It's me, ${friend.name}!`)
      : '';
    if (taskDoneToday(s, today())) {
      setPhase('resting');
      say(egg ? 'The egg is warm and cozy. Come back tomorrow!' : `I'm so happy today! Come back tomorrow for a new game.`);
    } else if (petLocked(s)) {
      setPhase('locked');
      say(`${hi} I love playing with you! Ask a grown-up to keep our daily games going.`.trim());
    } else {
      const t = taskFor(s.today!.need, s.steps[s.today!.need]);
      setTask(t);
      setPhase('task');
      const ask = t.kind === 'feed'
        ? (egg ? `Trace ${t.food} to keep the egg cozy!` : `I'm a little hungry. Will you trace me ${t.food}?`)
        : t.ask;
      say(`${hi} ${ask}`.trim());
    }
    setOpen(true);
    chime.soft();
  }, [assessment.ageGroup, totalScore, friend.name, say]);

  // pop up by itself once a day, after the map has settled
  useEffect(() => {
    if (!pet || open || holdAutoOpen) return;
    if (!shouldAutoOpen(pet, today()) || petLocked(pet)) return;
    const t = setTimeout(() => openSheet(true), 900);
    return () => clearTimeout(t);
  }, [pet, open, holdAutoOpen, openSheet]);

  function close() {
    stopSpeaking();
    setOpen(false);
  }

  function finish(outcome: Outcome, metrics: Record<string, number> = {}) {
    if (!pet || !task) return;
    const r = finishToday(pet, task, outcome, metrics);
    setPet(r.state);
    chime.fanfare();
    const thanks = task.kind === 'feed'
      ? (outcome === 'miss' ? 'Mmm, thank you! We\'ll trace another one tomorrow.' : 'Yum yum! That was delicious. Thank you!')
      : outcome === 'miss' ? 'That\'s okay! We can try it again another day. Thank you for playing with me!'
      : 'You did it! That made me so happy. Thank you!';
    if (r.grewTo === 'baby') {
      setHatching(true);
      setPhase('thanks');
      say('Crack, crack! The egg is hatching!');
      setTimeout(() => {
        const focus = getFocusCompanion();
        if (focus) {
          const f = COMPANIONS.find(c => c.name === focus)!;
          setFriend(f);
          setHatching(false);
          say(`Hi! I'm ${f.name}! Thank you for taking care of my egg!`);
        } else {
          setPhase('pick');
          say('Who is inside the egg? Pick your new friend!');
        }
      }, 1600);
    } else if (r.grewTo === 'little') {
      setPhase('thanks');
      say(`${thanks} Look, I grew bigger!`);
    } else if (r.grewTo === 'grown') {
      setPhase('thanks');
      say(`${thanks} Wow, I'm all grown up! Thank you for taking such good care of me.`);
    } else {
      setPhase('thanks');
      say(`${thanks} See you tomorrow!`);
    }
  }

  function pickFriend(name: string) {
    setFocusCompanion(name);
    const f = COMPANIONS.find(c => c.name === name)!;
    setFriend(f);
    setHatching(false);
    setPhase('thanks');
    chime.good();
    say(`Hi! I'm ${f.name}! Thank you for taking care of my egg. See you tomorrow!`);
  }

  function askGrownUp() {
    const a = 4 + Math.floor(Math.random() * 5), b = 5 + Math.floor(Math.random() * 4);
    const right = a + b;
    const options = [right, right + 2, right - 3].sort(() => Math.random() - 0.5);
    setGate({ a, b, options });
    setPhase('gate');
    stopSpeaking();
  }

  if (!pet) return null;

  const accent = '#7C3AED';
  const big = 'min-h-[60px] px-6 rounded-full text-lg font-extrabold text-white shadow-md active:scale-[0.97] transition-transform';

  return (
    <>
      {/* ── On the map: the pet beside Noel ── */}
      <button onClick={() => openSheet(false)}
        aria-label={doneToday ? 'Your pet friend' : 'Your pet friend has a game for you'}
        className="relative ml-auto flex-shrink-0 flex items-end justify-center"
        style={{ width: 64, minHeight: 64 }}>
        <span className="pointer-events-none">
          <PetPicture friend={friend} stage={stage} size={60} small />
        </span>
        {!doneToday && !petLocked(pet) && (
          <span aria-hidden="true" className="absolute -top-1 -right-1 w-5 h-5 rounded-full soft-pulse"
            style={{ background: '#F59E0B', border: '3px solid #FFFFFF', boxShadow: '0 0 0 3px rgba(245,158,11,0.3)' }} />
        )}
      </button>

      {/* ── The pop-up sheet ── */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Your pet friend"
          onKeyDown={e => { if (e.key === 'Escape') close(); }}>
          <div className="absolute inset-0" style={{ background: 'rgba(30,20,60,0.45)' }} onClick={close} />
          <div className="relative w-full max-w-md rounded-t-[32px] px-5 pt-3 overflow-y-auto slide-up"
            style={{ background: '#FFFBF5', maxHeight: '94dvh', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
            <div className="mx-auto mb-2 w-11 h-1.5 rounded-full" style={{ background: '#E5E7EB' }} />
            <button onClick={() => speak(line)} aria-label="Read it again"
              className="absolute left-4 top-4 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#EDE9FE' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9z" fill={accent} /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
              </svg>
            </button>
            <button onClick={close} aria-label="Close"
              className="absolute right-4 top-4 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>

            <div className="flex justify-center items-end mt-3" style={{ minHeight: phase === 'task' && task?.kind === 'feed' ? 110 : 150 }}>
              {phase !== 'pick' && (
                <span className={phase === 'thanks' ? 'kp-hop' : undefined} key={`${phase}-${stage}-${hatching}`}>
                  <PetPicture friend={friend} stage={hatching ? 'egg' : stage} size={phase === 'task' && task?.kind === 'feed' ? 110 : 150} crack={hatching} />
                </span>
              )}
            </div>

            <p className="text-center text-xl sm:text-2xl font-extrabold leading-snug mt-2 mx-2" style={{ color: '#3B2F63' }} aria-live="polite">
              {phase === 'gate' ? 'For grown-ups' : line}
            </p>

            {/* Feed: trace the food */}
            {phase === 'task' && task?.kind === 'feed' && (
              <div className="mt-4">
                <PetTrace key={task.shape} shape={task.shape} tolerance={task.tolerance} color={accent}
                  onDone={(o, m) => setTimeout(() => finish(o, m), 500)} />
                <p className="text-center text-sm font-semibold text-gray-500 mt-3">Start at the green dot and follow the glow.</p>
              </div>
            )}

            {/* Play / Care: do it for real, then one tap */}
            {phase === 'task' && task && task.kind !== 'feed' && (
              <div className="mt-4">
                {task.title && <p className="text-center text-sm font-bold" style={{ color: accent }}>{task.title}</p>}
                <button onClick={() => setShowTip(v => !v)} aria-expanded={showTip}
                  className="mx-auto mt-2 flex items-center gap-1 min-h-[44px] px-4 rounded-full text-sm font-bold text-gray-600" style={{ background: '#F3F4F6' }}>
                  For a grown-up {showTip ? '▴' : '▾'}
                </button>
                {showTip && (
                  <div className="mt-2 rounded-2xl p-3 text-sm text-gray-700" style={{ background: '#F5F3FF' }}>
                    {task.steps && (
                      <ol className="list-decimal pl-5 space-y-1 mb-2">{task.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                    )}
                    <p><span className="font-bold">What it builds: </span>{task.tip}</p>
                  </div>
                )}
                <div className="grid gap-3 mt-4">
                  <button className={big} style={{ background: '#16A34A' }} onClick={() => finish('win')}>We did it!</button>
                  <button className={big} style={{ background: '#2563EB' }} onClick={() => finish('help')}>We did it with help</button>
                  <button className={`${big} !text-gray-700`} style={{ background: '#E5E7EB' }} onClick={() => finish('miss')}>Not yet</button>
                </div>
              </div>
            )}

            {/* Hatching: who is inside? */}
            {phase === 'pick' && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {COMPANIONS.map(c => (
                  <button key={c.name} onClick={() => pickFriend(c.name)}
                    className="flex flex-col items-center justify-end rounded-3xl p-2 min-h-[120px] active:scale-[0.96] transition-transform"
                    style={{ background: '#F5F3FF', border: '2px solid #DDD6FE' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.art} alt="" width={84} height={84} style={{ width: 84, height: 84, objectFit: 'contain' }} />
                    <span className="mt-1 text-base font-extrabold" style={{ color: '#3B2F63' }}>{c.name}</span>
                  </button>
                ))}
              </div>
            )}

            {(phase === 'thanks' || phase === 'resting') && !hatching && (
              <div className="flex justify-center mt-6">
                <button className={big} style={{ background: accent }} onClick={close}>See you tomorrow!</button>
              </div>
            )}

            {/* After the free days: the pet stays happy; only a grown-up sees the plan */}
            {phase === 'locked' && (
              <div className="flex justify-center mt-6">
                <button className={big} style={{ background: accent }} onClick={askGrownUp}>Ask a grown-up</button>
              </div>
            )}
            {phase === 'gate' && gate && (
              <div className="mt-3 text-center">
                <p className="text-base font-semibold text-gray-600">What is {gate.a} + {gate.b}?</p>
                <div className="flex justify-center gap-3 mt-3">
                  {gate.options.map(n => (
                    <button key={n} className="w-16 h-14 rounded-2xl text-xl font-extrabold" style={{ background: '#F3F4F6', color: '#334155' }}
                      onClick={() => { if (n === gate.a + gate.b) { close(); router.push('/upgrade'); } else { setPhase('locked'); } }}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">Daily pet games are part of the family plan.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
