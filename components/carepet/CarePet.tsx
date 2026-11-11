'use client';

// ── The daily care pet ──
// The pet sits beside Noel on the world map. Once a day it pops up by
// itself, in the MIDDLE of the screen, as its own little moment: the pet
// drops onto its cushion, says hello, and asks for ONE thing (feed, play
// or care, rotating). Then it celebrates, shows how close it is to
// growing, and rests until tomorrow. Tapping it any time opens the same
// moment.
//
// The rules live in lib/carepet/engine.ts (shareable, no Kailia code);
// Kailia's saving, activities and measurement live in lib/kailiaPet.ts.
// Child-facing rules: no scores, no clocks, no sad or sick pet. A "not
// yet" gets the same warm thank-you as a win; only the hidden difficulty
// step changes.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import LiveArt from '@/components/characters/LiveArt';
import { Sparkle } from '@/components/scenery/SkyDecor';
import PetEgg from './PetEgg';
import PetTrace from './PetTrace';
import PetFood from './PetFood';
import { BreatheGame, CountGame, StepsGame, GrownUpReport, BreathPhase } from './PetGames';
import { pickPlayPet, signupFriend, PlayPet } from '@/components/games/playPet';
import { chime } from '@/components/friends/voice';
import { speak, stopSpeaking } from '@/lib/speak';
import { COMPANIONS, getFocusCompanion, setFocusCompanion } from '@/lib/rewards';
import { CarePetState, Outcome, Stage, stageFor, shouldAutoOpen, taskDoneToday } from '@/lib/carepet/engine';
import { openPet, noteAutoOpened, petLocked, taskFor, finishToday, today, PetTask, PET_CONFIG } from '@/lib/kailiaPet';

type Phase = 'hello' | 'task' | 'eat' | 'thanks' | 'pick' | 'resting' | 'locked' | 'gate';

const INK = '#3B2F63';
const ACCENT = '#7C3AED';
const STAGES: Stage[] = ['egg', 'baby', 'little', 'grown'];
const STAGE_SCALE: Record<Stage, number> = { egg: 1, baby: 0.66, little: 0.82, grown: 1 };
const HEART_COLORS = ['#F472B6', '#FB7185', '#F9A8D4'];
const CONFETTI = ['#F472B6', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#FB923C'];

// how far along the growth path the pet is: 0 (egg) … 1 (grown up)
function growth(days: number) {
  const at = [0, PET_CONFIG.stageAt.baby, PET_CONFIG.stageAt.little, PET_CONFIG.stageAt.grown];
  for (let i = 0; i < 3; i++) {
    if (days < at[i + 1]) return (i + (days - at[i]) / (at[i + 1] - at[i])) / 3;
  }
  return 1;
}
function daysToGrow(days: number): number | null {
  const next = [PET_CONFIG.stageAt.baby, PET_CONFIG.stageAt.little, PET_CONFIG.stageAt.grown].find(n => n > days);
  return next === undefined ? null : next - days;
}

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
  const { state: assessment, totalScore, devMonths, loaded } = useAssessment();
  const [pet, setPet] = useState<CarePetState | null>(null);
  const [friend, setFriend] = useState<PlayPet>(COMPANIONS[1]);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('hello');
  const [task, setTask] = useState<PetTask | null>(null);
  const [line, setLine] = useState('');
  const [hatching, setHatching] = useState(false);
  const [gate, setGate] = useState<{ a: number; b: number; options: number[] } | null>(null);
  // the little show around the pet
  const [hearts, setHearts] = useState<{ id: number; dx: number; color: string }[]>([]);
  const [confetti, setConfetti] = useState<{ id: number; left: number; dx: number; rot: number; color: string; delay: number }[]>([]);
  const [crumbs, setCrumbs] = useState<{ id: number; dx: number; dy: number; color: string }[]>([]);
  const [chomp, setChomp] = useState(0);
  const [breath, setBreath] = useState<{ scale: number; ms: number }>({ scale: 1, ms: 300 });
  const [count, setCount] = useState(0);
  const [prevGrowth, setPrevGrowth] = useState(0);
  const [flyPx, setFlyPx] = useState(-260);
  const uid = useRef(0);
  const petRef = useRef<HTMLButtonElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // load (or start) the pet once the assessment is known
  useEffect(() => {
    if (!loaded) return;
    const r = openPet(assessment.ageGroup, totalScore, devMonths);
    if (!r) return;
    /* eslint-disable react-hooks/set-state-in-effect -- the pet lives in this device's storage, readable only after mount */
    setPet(r.state);
    setFriend(pickPlayPet());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loaded, assessment.ageGroup, totalScore, devMonths]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); }, []);

  const stage: Stage = pet ? stageFor(pet.happyDays, PET_CONFIG) : 'egg';
  const doneToday = pet ? taskDoneToday(pet, today()) : false;

  const say = useCallback((text: string) => { setLine(text); speak(text); }, []);

  const burstHearts = useCallback((n = 3) => {
    const add = Array.from({ length: n }, (_, i) => ({ id: ++uid.current, dx: (i - (n - 1) / 2) * 34 + (Math.random() * 16 - 8), color: HEART_COLORS[i % 3] }));
    setHearts(h => [...h, ...add]);
    later(() => setHearts(h => h.filter(x => !add.includes(x))), 1700);
  }, [later]);

  const openMoment = useCallback((auto: boolean) => {
    // re-read, so a map left open past midnight starts the new day
    const fresh = openPet(assessment.ageGroup, totalScore, devMonths);
    if (!fresh || !fresh.state.today) return;
    let s = fresh.state;
    const hello = fresh.greeting;
    if (auto) s = noteAutoOpened(s);
    setPet(s);
    setHatching(false);
    setHearts([]); setConfetti([]); setCrumbs([]); setCount(0);
    setBreath({ scale: 1, ms: 300 });
    setPrevGrowth(growth(s.happyDays));
    const egg = stageFor(s.happyDays, PET_CONFIG) === 'egg';
    const hi = hello === 'missed-you' ? 'I missed you! Big hug!'
      : hello === 'first' ? 'Look, a magic egg! Something is wiggling inside.'
      : hello === 'hello' ? (egg ? 'The magic egg is wiggling!' : `Hi! It's me, ${friend.name}!`)
      : '';
    if (taskDoneToday(s, today())) {
      setPhase('resting');
      say(egg ? 'The egg is warm and cozy. Come back tomorrow!' : 'I\'m so happy today! Come back tomorrow for a new game.');
    } else if (petLocked(s)) {
      setPhase('locked');
      say(`${hi} I love playing with you! Ask a grown-up to keep our daily games going.`.trim());
    } else {
      const t = taskFor(s.today!.need, s.steps[s.today!.need]);
      setTask(t);
      setPhase('hello');
      const ask = t.kind === 'feed'
        ? (egg ? `Trace ${t.food} to keep the egg cozy!` : `I'm a little hungry. Will you trace me ${t.food}?`)
        : t.ask;
      say(`${hi} ${ask}`.trim());
    }
    setOpen(true);
    chime.soft();
  }, [assessment.ageGroup, totalScore, devMonths, friend.name, say]);

  // pop up by itself once a day, after the map has settled
  useEffect(() => {
    if (!pet || open || holdAutoOpen) return;
    if (!shouldAutoOpen(pet, today()) || petLocked(pet)) return;
    const t = setTimeout(() => openMoment(true), 900);
    return () => clearTimeout(t);
  }, [pet, open, holdAutoOpen, openMoment]);

  function close() {
    stopSpeaking();
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setOpen(false);
  }

  function celebrate() {
    const bits = Array.from({ length: 34 }, (_, i) => ({
      id: ++uid.current, left: Math.random() * 100, dx: Math.random() * 120 - 60,
      rot: Math.random() * 720 - 360, color: CONFETTI[i % CONFETTI.length], delay: Math.random() * 0.35,
    }));
    setConfetti(bits);
    later(() => setConfetti([]), 2800);
    burstHearts(5);
  }

  function finish(outcome: Outcome, metrics: Record<string, number> = {}) {
    if (!pet || !task) return;
    const r = finishToday(pet, task, outcome, metrics);
    setPrevGrowth(growth(pet.happyDays));
    setPet(r.state);
    setBreath({ scale: 1, ms: 300 });
    chime.fanfare();
    celebrate();
    const left = daysToGrow(r.state.happyDays);
    const soon = left === null ? 'See you tomorrow!'
      : left === 1 ? 'One more day and I\'ll grow!'
      : `${left} more days and I'll grow!`;
    const thanks = task.kind === 'feed'
      ? (outcome === 'miss' ? 'Mmm, thank you! We\'ll trace another one tomorrow.' : 'Yum yum! That was delicious. Thank you!')
      : outcome === 'miss' ? 'That\'s okay! We can try it again another day. Thank you for playing with me!'
      : 'You did it! That made me so happy. Thank you!';
    if (r.grewTo === 'baby') {
      setHatching(true);
      setPhase('thanks');
      say('Crack, crack! The egg is hatching!');
      later(() => {
        // the friend picked as the practice focus, else the buddy picked
        // at sign-up, hatches straight away; only with neither (e.g. the
        // Noel buddy) does the child choose who is inside
        const focus = getFocusCompanion() ?? signupFriend();
        if (focus) {
          const f = COMPANIONS.find(c => c.name === focus)!;
          setFocusCompanion(f.name);
          setFriend(f);
          setHatching(false);
          chime.fanfare();
          celebrate();
          say(`Hi! I'm ${f.name}! Thank you for taking care of my egg!`);
        } else {
          setPhase('pick');
          say('Who is inside the egg? Pick your new friend!');
        }
      }, 1800);
    } else if (r.grewTo === 'little') {
      setPhase('thanks');
      say(`${thanks} Look, I grew bigger!`);
    } else if (r.grewTo === 'grown') {
      setPhase('thanks');
      say(`${thanks} Wow, I'm all grown up! Thank you for taking such good care of me.`);
    } else {
      setPhase('thanks');
      say(`${thanks} ${soon}`);
    }
  }

  // Feed: the traced food flies to the pet, it chomps, crumbs fly, then thanks
  function eat(outcome: Outcome, metrics: Record<string, number>) {
    // fly from the plate's centre to the pet's mouth (upper part of the pet)
    const plate = plateRef.current?.getBoundingClientRect(), body = petRef.current?.getBoundingClientRect();
    if (plate && body) setFlyPx(Math.round(body.top + body.height * 0.45 - (plate.top + plate.height / 2)));
    setPhase('eat');
    later(() => {
      setChomp(c => c + 1);
      chime.good();
      setCrumbs(Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return { id: ++uid.current, dx: Math.cos(a) * 70, dy: Math.sin(a) * 50 - 20, color: ['#D9A066', '#FCD34D', '#B45309'][i % 3] };
      }));
    }, 1150);
    later(() => { setCrumbs([]); finish(outcome, metrics); }, 2300);
  }

  function pickFriend(name: string) {
    const switching = stage !== 'egg' && !hatching;
    setFocusCompanion(name);
    const f = COMPANIONS.find(c => c.name === name)!;
    setFriend(f);
    setHatching(false);
    setPhase(switching ? 'resting' : 'thanks');
    chime.good();
    burstHearts(3);
    say(switching
      ? `Hi! I'm ${f.name}! Let's be friends. See you tomorrow!`
      : `Hi! I'm ${f.name}! Thank you for taking care of my egg. See you tomorrow!`);
  }

  function askGrownUp() {
    const a = 4 + Math.floor(Math.random() * 5), b = 5 + Math.floor(Math.random() * 4);
    const right = a + b;
    const options = [right, right + 2, right - 3].sort(() => Math.random() - 0.5);
    setGate({ a, b, options });
    setPhase('gate');
    stopSpeaking();
  }

  const onBreath = useCallback((p: BreathPhase, ms: number) => {
    setBreath({ scale: p === 'in' || p === 'hold' ? 1.12 : 0.94, ms });
  }, []);

  function countTap() {
    if (!task || task.kind === 'feed' || task.game?.type !== 'count') return;
    const reps = task.game.reps;
    if (count >= reps) return;
    const n = count + 1;
    setCount(n);
    chime.good();
    burstHearts(2);
    if (n >= reps) later(() => finish('win', { reps: n }), 900);
  }

  function petTapped() {
    if (phase === 'task' && task && task.kind !== 'feed' && task.game?.type === 'count') { countTap(); return; }
    if (phase === 'resting' || phase === 'thanks' || phase === 'hello') { chime.soft(); burstHearts(3); }
  }

  if (!pet) return null;

  const big = 'min-h-[64px] px-10 rounded-full text-xl font-extrabold text-white shadow-lg active:scale-[0.97] transition-transform';
  const feeding = task?.kind === 'feed' && (phase === 'task' || phase === 'eat');
  const shownStage: Stage = hatching ? 'egg' : stage;
  const petSize = feeding ? 120 : phase === 'task' ? 150 : 200;
  const move = phase === 'task' && task && task.kind !== 'feed' && task.game?.type === 'count' && count < task.game.reps ? task.game.move : null;
  const g = growth(pet.happyDays);

  return (
    <>
      {/* ── On the map: the pet beside Noel ── */}
      <button onClick={() => openMoment(false)}
        aria-label={doneToday ? 'Your pet friend' : 'Your pet friend has a game for you'}
        className="relative ml-auto flex-shrink-0 flex items-end justify-center active:scale-95 transition-transform"
        style={{ width: 74, minHeight: 74 }}>
        <span className="pointer-events-none">
          <PetPicture friend={friend} stage={stage} size={72} small />
        </span>
        {!doneToday && !petLocked(pet) && <WaitingBubble />}
      </button>

      {/* ── The pet moment, in the middle of the screen ── */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="Your pet friend"
          onKeyDown={e => { if (e.key === 'Escape') close(); }}>
          <div className="absolute inset-0 fade-in" style={{ background: 'rgba(30,20,60,0.55)', backdropFilter: 'blur(4px)' }} onClick={close} />
          <div className="pm-card relative w-full h-full sm:h-auto sm:max-w-[480px] sm:rounded-[36px] overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #C9E3FF 0%, #E3EEFF 26%, #FFF1E2 52%, #FFFBF5 70%)',
              maxHeight: '100dvh', boxShadow: '0 24px 70px rgba(20,10,50,0.45)',
            }}>
            {/* top bar: read again · growth path · close */}
            <div className="relative z-10 flex items-center gap-3 px-4" style={{ paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
              <RoundButton label="Read it again" onClick={() => speak(line)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 9v6h4l5 4V5L8 9z" fill={ACCENT} /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
                </svg>
              </RoundButton>
              <GrowthPath friend={friend} value={g} from={prevGrowth} stage={stage} />
              <RoundButton label="Close" onClick={close}>
                <svg width="20" height="20" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </RoundButton>
            </div>

            <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-5" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
              {/* centred on tall screens, scrolls on short ones */}
              <div className="min-h-full flex flex-col justify-center pb-6">
              {/* the stage: sky sparkles, speech bubble, pet on its cushion */}
              <div className="relative flex flex-col items-center pt-3">
                <Sparkle size={22} className="absolute sparkle" style={{ left: '8%', top: 30 }} />
                <Sparkle size={14} className="absolute sparkle" style={{ right: '12%', top: 18, animationDelay: '0.7s' }} color="#FFFFFF" />
                <Sparkle size={18} className="absolute sparkle" style={{ right: '6%', top: 120, animationDelay: '1.3s' }} />

                {phase !== 'gate' && line && (
                  <div key={line} className="pm-bubble relative max-w-[360px] rounded-[28px] px-5 py-3 text-center text-[21px] sm:text-[22px] font-extrabold leading-snug"
                    style={{ background: '#FFFFFF', color: INK, boxShadow: '0 6px 18px rgba(59,47,99,0.14)' }} aria-live="polite">
                    {line}
                    <span aria-hidden="true" className="absolute left-1/2 -bottom-[11px] -translate-x-1/2 w-6 h-6 rotate-45" style={{ background: '#FFFFFF', borderRadius: 4 }} />
                  </div>
                )}
                {phase === 'gate' && <p className="text-2xl font-extrabold mt-2" style={{ color: INK }}>For grown-ups</p>}

                {phase !== 'pick' && (
                  <div className="relative flex items-end justify-center mt-4" style={{ height: petSize + 26, width: '100%' }}>
                    <span aria-hidden="true" className="pm-glow absolute rounded-full" style={{ width: petSize * 1.25, height: petSize * 1.25, bottom: 0, background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)' }} />
                    <Cushion width={Math.max(150, petSize * 1.05)} />
                    <button type="button" ref={petRef} onClick={petTapped} aria-label={move ? 'I did one' : `Pat ${friend.name}`}
                      className="relative z-[1] pb-3" style={{ cursor: 'pointer' }}>
                      <span key={`${shownStage}-${hatching}-${friend.name}`} className="pm-enter block">
                        <span key={chomp} className={chomp ? 'pm-chomp block' : 'block'}>
                          <span className={move ? `pm-move-${move} block` : phase === 'thanks' ? 'kp-hop block' : 'block'}
                            style={{ transform: `scale(${breath.scale})`, transition: `transform ${breath.ms}ms ease-in-out`, transformOrigin: '50% 100%' }}>
                            <PetPicture friend={friend} stage={shownStage} size={petSize} crack={hatching} />
                          </span>
                        </span>
                      </span>
                    </button>
                    {/* hearts and crumbs float up from the pet */}
                    {hearts.map(h => (
                      <span key={h.id} aria-hidden="true" className="pm-heart absolute z-[2] pointer-events-none" style={{ bottom: petSize * 0.55, left: '50%', marginLeft: -14, ['--dx' as string]: `${h.dx}px` }}>
                        <Heart color={h.color} />
                      </span>
                    ))}
                    {crumbs.map(c => (
                      <span key={c.id} aria-hidden="true" className="pm-crumb absolute z-[2] rounded-full pointer-events-none" style={{ width: 9, height: 9, background: c.color, border: '1.5px solid #3b2416', bottom: petSize * 0.45, left: '50%', ['--dx' as string]: `${c.dx}px`, ['--dy' as string]: `${c.dy}px` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Hello: one big button to start ── */}
              {phase === 'hello' && (
                <div className="flex flex-col items-center mt-6 pm-card">
                  <button className={big} style={{ background: ACCENT }} onClick={() => { chime.good(); setPhase('task'); }}>
                    {task?.kind === 'feed' ? 'Let\'s make it!' : 'Let\'s play!'}
                  </button>
                </div>
              )}

              {/* ── Feed: trace the food on a plate, then it flies to the pet ── */}
              {feeding && task?.kind === 'feed' && (
                <div className="mt-4 flex flex-col items-center">
                  {phase === 'task' ? (
                    <>
                      <div ref={plateRef} className="rounded-[40px] p-3" style={{ background: '#FFFFFF', boxShadow: '0 10px 24px rgba(59,47,99,0.15)' }}>
                        <PetTrace key={task.shape} shape={task.shape} tolerance={task.tolerance} color={ACCENT}
                          onDone={(o, m) => later(() => eat(o, m), 350)} />
                      </div>
                      <p className="text-center text-base font-bold mt-3" style={{ color: '#6D5FA0' }}>Start at the green dot and follow the glow.</p>
                    </>
                  ) : (
                    <div className="relative flex items-center justify-center w-full" style={{ height: 'calc(min(78vw, 300px) + 24px + 44px)' }}>
                      {/* same height as the plate + hint above, so nothing jumps */}
                      <PetFood shape={task.shape} size={200} className="pm-food relative z-10" style={{ ['--pm-fly' as string]: `${flyPx}px` }} />
                    </div>
                  )}
                </div>
              )}

              {/* ── Play / Care ── */}
              {phase === 'task' && task && task.kind !== 'feed' && (
                <div className="mt-4 pm-card">
                  {task.game?.type === 'breathe' && (
                    <BreatheGame pattern={task.game.pattern} rounds={task.game.rounds} onBreath={onBreath} onDone={o => finish(o)} />
                  )}
                  {task.game?.type === 'count' && (
                    <CountGame reps={task.game.reps} tapLabel={task.game.tapLabel} count={count} onTap={countTap} onDone={o => finish(o, { reps: count })} />
                  )}
                  {task.game?.type === 'steps' && <StepsGame steps={task.game.steps} onDone={o => finish(o)} />}
                  {!task.game && <GrownUpReport title={task.title} steps={task.steps} tip={task.tip} onDone={o => finish(o)} />}
                </div>
              )}

              {/* ── Hatching: who is inside? ── */}
              {phase === 'pick' && (
                <div className="grid grid-cols-3 gap-3 mt-5 pm-card">
                  {COMPANIONS.map(c => (
                    <button key={c.name} onClick={() => pickFriend(c.name)}
                      className="flex flex-col items-center justify-end rounded-3xl p-2 min-h-[124px] active:scale-[0.96] transition-transform"
                      style={{ background: '#FFFFFF', border: `3px solid ${c.name === friend.name ? '#A78BFA' : '#EDE9FE'}`, boxShadow: '0 4px 12px rgba(59,47,99,0.08)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.art} alt="" width={84} height={84} style={{ width: 84, height: 84, objectFit: 'contain' }} />
                      <span className="mt-1 text-base font-extrabold" style={{ color: INK }}>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {(phase === 'thanks' || phase === 'resting') && !hatching && (
                <div className="flex flex-col items-center mt-6 pm-card">
                  <button className={big} style={{ background: ACCENT }} onClick={close}>See you tomorrow!</button>
                  {stage !== 'egg' && (
                    <button className="mt-3 min-h-[44px] px-4 rounded-full text-base font-bold" style={{ color: ACCENT }}
                      onClick={() => { setPhase('pick'); say('Who do you want to play with?'); }}>
                      Pick a different friend
                    </button>
                  )}
                </div>
              )}

              {/* After the free days: the pet stays happy; only a grown-up sees the plan */}
              {phase === 'locked' && (
                <div className="flex justify-center mt-6">
                  <button className={big} style={{ background: ACCENT }} onClick={askGrownUp}>Ask a grown-up</button>
                </div>
              )}
              {phase === 'gate' && gate && (
                <div className="mt-6 text-center">
                  <p className="text-lg font-semibold text-gray-600">What is {gate.a} + {gate.b}?</p>
                  <div className="flex justify-center gap-3 mt-3">
                    {gate.options.map(n => (
                      <button key={n} className="w-20 h-16 rounded-2xl text-2xl font-extrabold" style={{ background: '#FFFFFF', color: '#334155', border: '2px solid #E5E7EB' }}
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

            {/* confetti falls over everything */}
            {confetti.length > 0 && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                {confetti.map(c => (
                  <span key={c.id} className="pm-confetti absolute" style={{
                    left: `${c.left}%`, top: 40, width: 10, height: 14, borderRadius: 3, background: c.color,
                    animationDelay: `${c.delay}s`, ['--dx' as string]: `${c.dx}px`, ['--rot' as string]: `${c.rot}deg`,
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Pieces ──

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label}
      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform"
      style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(59,47,99,0.12)' }}>
      {children}
    </button>
  );
}

// egg → baby → little one → grown up, with the pet's own picture growing
// along it. Shown as pictures only: no numbers, no score.
function GrowthPath({ friend, value, from, stage }: { friend: PlayPet; value: number; from: number; stage: Stage }) {
  const reached = STAGES.indexOf(stage);
  const [shown, setShown] = useState(from);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 500);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="flex-1 relative h-12 flex items-center" aria-label={`Growing up: ${['egg', 'baby', 'little one', 'grown up'][reached]}`} role="img">
      <div className="absolute left-4 right-4 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.85)', boxShadow: 'inset 0 1px 3px rgba(59,47,99,0.15)' }}>
        <div className="h-full rounded-full" style={{ width: `${shown * 100}%`, background: 'linear-gradient(90deg, #FBBF24, #F472B6)', transition: 'width 1.2s cubic-bezier(.3,1.2,.5,1)' }} />
      </div>
      <div className="relative w-full flex justify-between items-center">
        {STAGES.map((s, i) => {
          const on = i <= reached;
          const d = [30, 32, 36, 40][i];
          return (
            <span key={s} className={`${on && i === reached ? 'pm-node' : ''} rounded-full flex items-center justify-center overflow-hidden`}
              style={{ width: d, height: d, background: on ? '#FFFFFF' : 'rgba(255,255,255,0.6)', border: `3px solid ${on ? '#F59E0B' : '#D8CFF5'}`, boxShadow: on ? '0 2px 6px rgba(245,158,11,0.35)' : 'none' }}>
              {s === 'egg'
                ? <MiniEgg dim={!on} />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={friend.art} alt="" style={{ width: d * [0, 0.55, 0.7, 0.85][i], height: 'auto', opacity: on ? 1 : 0.35, filter: on ? 'none' : 'grayscale(1)' }} />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MiniEgg({ dim }: { dim?: boolean }) {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true" style={{ opacity: dim ? 0.4 : 1 }}>
      <path d="M8 1.5C4.2 1.5 1.5 7.5 1.5 12a6.5 6.5 0 0 0 13 0C14.5 7.5 11.8 1.5 8 1.5Z" fill="#FFF7E6" stroke="#3b2416" strokeWidth="1.4" />
      <path d="M3 11l2.5-1.5L8 11l2.5-1.5L13 11" fill="none" stroke="#F472B6" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// a soft round cushion the pet sits on
function Cushion({ width }: { width: number }) {
  const h = width * 0.3;
  return (
    <svg aria-hidden="true" className="absolute bottom-0" width={width} height={h} viewBox="0 0 200 60" preserveAspectRatio="none">
      <g filter="url(#kp-brush)">
        <ellipse cx="100" cy="36" rx="96" ry="22" fill="#C4B5FD" stroke="#3b2416" strokeWidth="2.5" />
        <ellipse cx="100" cy="30" rx="86" ry="16" fill="#DDD6FE" />
        <path d="M30 32 Q100 44 170 32" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Heart({ color }: { color: string }) {
  return (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden="true">
      <path d="M14 24C6 18 1.5 13.5 1.5 8.2A6.2 6.2 0 0 1 14 5.6a6.2 6.2 0 0 1 12.5 2.6C26.5 13.5 22 18 14 24Z" fill={color} stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  );
}

// a little white "..." speech bubble: the pet has something to ask
function WaitingBubble() {
  return (
    <span aria-hidden="true" className="absolute -top-2 -right-2 soft-pulse">
      <svg width="34" height="28" viewBox="0 0 34 28">
        <path d="M6 2h22a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H14l-6 6v-6H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="11" cy="11" r="2.2" fill="#7C3AED" /><circle cx="17" cy="11" r="2.2" fill="#7C3AED" /><circle cx="23" cy="11" r="2.2" fill="#7C3AED" />
      </svg>
    </span>
  );
}
