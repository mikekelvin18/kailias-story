'use client';

// ── Kailia's Garden: the playable place ──
// The home base and its first quest, The Lost Star Ball. This is the game
// layer: it draws the garden, walks Kailia where the child taps, lets the
// pet follow, sniff and react, runs the quest from its data
// (lib/world/quest.ts) and reports what happens as WorldEvents. It never
// touches storage and never interprets anything; the page around it does
// (app/play/garden/page.tsx).
//
// The quest, step by step (all data-driven):
//   notice → the pet finds its toy chest empty
//   water  → drag the watering can to Sunny and hold it there
//   bridge → drag stepping stones into the stream
//   search → tap bushes in the back garden (the pet helps after a few tries)
//   give   → drag the star ball to the pet
// then the pet celebrates and fetch is open for as long as the child likes.
// Off the path: three ladybugs, the frog, the leaf pile, the toy chest,
// Noel (who repeats the current step when tapped).

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { advanceQuest, currentStep, freshProgress, isDone, LOST_STAR_BALL, type QuestProgress, type StepId } from '@/lib/world/quest';
import type { Demands, PetInfo, Via, WorldEvent } from '@/lib/world/events';
import { INK, PALETTE as P, SIZES, TIMING } from '@/lib/world/artBible';
import { characterArt } from '@/components/characters/characters.config';
import { petWidth } from '@/lib/companionTrails';
import { speak, chime, tones } from '@/components/friends/voice';
import { useBursts } from '@/components/friends/kit/Burst';
import WorldStage from '../WorldStage';
import { act, body, depthScale, face, step, walkTo, type Body, type BodyState } from '../motion';
import { WorldKailia, WorldNoel, WorldPet } from '../WorldCharacters';
import { DragThing, Thing } from '../WorldThings';
import { useReducedMotion } from '../useReducedMotion';
import { CROSS_Y, GardenFar, GardenFront, GardenGround, GardenGroundLife, GardenMid, GardenSky, streamEdges, WORLD_H, WORLD_W } from './GardenScene';
import { Bush, Butterfly, Frog, Ladybug, LeafPile, Snail, StarBall, Stone, StoneSlot, Sunflower, ToyChest, TreasureShelf, WateringCan } from './GardenProps';

const QUEST = LOST_STAR_BALL;
type Pt = { x: number; y: number };

// ── where things are (world px; feet / bottom-centre) ──
const HOME = { kailia: { x: 430, y: 790 }, pet: { x: 570, y: 836 } };
const NOEL = { x: 560, y: 700 };
const CHEST = { x: 770, y: 706 };
const CAN_HOME = { x: 880, y: 910 };
const FLOWER = { x: 1110, y: 712 };
/** where the can has to be to water Sunny */
const POUR_AT = { x: 1020, y: 700 };
const STONE_HOMES: Pt[] = [{ x: 1196, y: 905 }, { x: 1290, y: 952 }, { x: 1300, y: 868 }, { x: 1190, y: 985 }];
const BUSHES: Pt[] = [{ x: 1780, y: 700 }, { x: 2030, y: 900 }, { x: 2180, y: 690 }, { x: 1820, y: 915 }, { x: 2290, y: 880 }, { x: 1990, y: 680 }];
const LADYBUGS = [{ id: 'fence', x: 700, y: 614 }, { id: 'flowers', x: 300, y: 862 }, { id: 'birdhouse', x: 1950, y: 596 }];
const FROG = { x: 1492, y: 965 };
const LEAVES = { x: 640, y: 950 };
const SHELF = { x: 400, y: 648 };
const BANK = { x: 1262, y: 812 };
/** the thing the child needs right now is never hidden behind a character */
const ACTIVE_Z = 1500;
/** where Kailia goes when a step begins, so a small screen frames the task */
const STEP_SPOT: Partial<Record<StepId, Pt>> = { water: { x: 900, y: 800 }, bridge: BANK, search: { x: 1660, y: 820 } };

const START = { k: body(HOME.kailia.x, HOME.kailia.y), p: body(HOME.pet.x, HOME.pet.y) };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ── walking: stay on the lawn, and cross the stream only on the bridge ──
function clampWalk(p: Pt, bridge: boolean): Pt {
  const y = clamp(p.y, 668, 955);
  let x = clamp(p.x, 140, 2330);
  const e = streamEdges(y);
  if (!bridge) return { x: Math.min(x, e.l - 36), y };
  if (x > e.l - 36 && x < e.r + 36) {
    const b = streamEdges(CROSS_Y);
    x = clamp(x, b.l + 12, b.r - 12);
    return { x, y: CROSS_Y };
  }
  return { x, y };
}
function sideOf(p: Pt) {
  const e = streamEdges(p.y);
  return p.x < e.l - 10 ? -1 : p.x > e.r + 10 ? 1 : 0;
}
function route(from: Pt, to: Pt, bridge: boolean): Pt[] {
  const t = clampWalk(to, bridge);
  const a = sideOf(from), b = sideOf(t);
  if (a === b && a !== 0) return [t];
  const e = streamEdges(CROSS_Y);
  const L = { x: e.l - 40, y: CROSS_Y }, R = { x: e.r + 40, y: CROSS_Y };
  if (a === 0) return [{ x: from.x, y: CROSS_Y }, ...(b < 0 ? [L] : b > 0 ? [R] : []), t];
  if (b === 0) return [a < 0 ? L : R, t];
  return a < 0 ? [L, R, t] : [R, L, t];
}
function slotsFor(n: number): Pt[] {
  const { l, r } = streamEdges(CROSS_Y);
  const w = r - l;
  return Array.from({ length: n }, (_, i) => ({ x: l + (i + 0.5) * (w / n), y: CROSS_Y + 8 }));
}
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

const sfx = {
  plop: () => tones([{ f: 330, t: 0, d: 0.1 }, { f: 190, t: 0.06, d: 0.16 }]),
  rustle: () => tones([{ f: 520, t: 0, d: 0.05 }, { f: 470, t: 0.05, d: 0.05 }, { f: 560, t: 0.1, d: 0.05 }], 'triangle'),
  croak: () => tones([{ f: 150, t: 0, d: 0.12 }, { f: 120, t: 0.15, d: 0.14 }], 'triangle'),
  creak: () => tones([{ f: 240, t: 0, d: 0.15 }, { f: 300, t: 0.1, d: 0.12 }], 'triangle'),
  pour: () => tones([{ f: 880, t: 0, d: 0.06 }, { f: 990, t: 0.07, d: 0.06 }]),
};

export interface GardenGameProps {
  pet: PetInfo;
  demands: Demands;
  initialQuest: QuestProgress | null;
  initialLadybugs: string[];
  /** starlight the page will award for finishing (shown on the story card) */
  rewardStarlight: number;
  paused: boolean;
  soundOn: boolean;
  onEvent: (e: WorldEvent) => void;
  onPause: () => void;
  onExit: () => void;
}

type BallMode = 'hidden' | 'held' | 'drag' | 'pet' | 'ground' | 'fly';

export default function GardenGame({ pet, demands, initialQuest, initialLadybugs, rewardStarlight, paused, soundOn, onEvent, onPause, onExit }: GardenGameProps) {
  const reduced = useReducedMotion();
  const { layer: burstLayer, fire } = useBursts();
  const fill = useCallback((t: string) => t.replaceAll('{pet}', pet.name), [pet.name]);

  // ── quest ──
  const [quest, setQuest] = useState<QuestProgress>(() => initialQuest ?? freshProgress(QUEST));
  const stepNow = currentStep(QUEST, quest);
  const watered = isDone(quest, 'water');
  const bridgeBuilt = isDone(quest, 'bridge');
  const found = isDone(quest, 'search');
  const given = isDone(quest, 'give');

  // ── bodies ──
  const bodiesRef = useRef(START);
  const [bodies, setBodies] = useState(START);
  const arriveK = useRef<(() => void) | null>(null);
  const arriveP = useRef<(() => void) | null>(null);
  const petBusy = useRef(false);

  // ── props ──
  const [chestOpen, setChestOpen] = useState(false);
  const [can, setCan] = useState({ ...CAN_HOME, drag: false, parked: false });
  const [pourMs, setPourMs] = useState(0);
  const slots = useMemo(() => slotsFor(demands.stones), [demands.stones]);
  const [stones, setStones] = useState(() => {
    const placed = isDone(initialQuest ?? freshProgress(QUEST), 'bridge') ? demands.stones : (initialQuest?.counts.bridge ?? 0);
    return STONE_HOMES.slice(0, demands.stones).map((h, i) => (
      i < placed ? { ...slotsFor(demands.stones)[i], slot: i as number | null, drag: false } : { ...h, slot: null as number | null, drag: false }));
  });
  const [searched, setSearched] = useState<number[]>([]);
  const [ballSpot] = useState(() => Math.floor(Math.random() * demands.spots));
  const [rustle, setRustle] = useState<{ i: number; n: number } | null>(null);
  const [surprise, setSurprise] = useState<{ i: number; kind: 'butterfly' | 'snail'; n: number } | null>(null);
  const [ball, setBall] = useState<{ mode: BallMode } & Pt>(() => {
    const q = initialQuest;
    if (q && isDone(q, 'give')) return { mode: 'ground', x: HOME.pet.x + 70, y: HOME.pet.y + 20 };
    if (q && isDone(q, 'search')) return { mode: 'held', x: 0, y: 0 };
    return { mode: 'hidden', x: 0, y: 0 };
  });
  const [ladybugs, setLadybugs] = useState<string[]>(initialLadybugs);
  const [frogHop, setFrogHop] = useState(0);
  const [leavesOut, setLeavesOut] = useState(false);
  const [wiggle, setWiggle] = useState<string | null>(null);
  const [line, setLine] = useState<{ who: 'noel' | 'pet'; text: string; n: number } | null>(null);
  const [askHelp, setAskHelp] = useState(false);
  const [card, setCard] = useState(false);
  const [petHinted, setPetHinted] = useState(false);
  const [tappedPetOnce, setTappedPetOnce] = useState(false);
  const misses = useRef(0);

  // refs the loop and timers read
  const live = useRef({ paused, reduced, bridgeBuilt, soundOn, demands });
  useLayoutEffect(() => { live.current = { paused, reduced, bridgeBuilt, soundOn, demands }; });
  const lastAction = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)); }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const touch = () => { lastAction.current = performance.now(); };

  // ── speech ──
  const say = useCallback((who: 'noel' | 'pet', text: string) => {
    const t = fill(text);
    setLine(l => ({ who, text: t, n: (l?.n ?? 0) + 1 }));
    if (live.current.soundOn) speak(t);
  }, [fill]);

  // ── bodies: helpers ──
  const commit = (k: Body, p: Body) => { bodiesRef.current = { k, p }; setBodies(bodiesRef.current); };
  const walkK = useCallback((to: Pt, then?: () => void) => {
    const { k, p } = bodiesRef.current;
    const path = route(k, to, live.current.bridgeBuilt);
    const end = path.at(-1)!;
    if (dist(k, end) < 8) { arriveK.current = null; then?.(); return; }
    arriveK.current = then ?? null;
    commit(walkTo(k, path), p);
  }, []);
  const walkP = useCallback((to: Pt, then?: () => void) => {
    const { k, p } = bodiesRef.current;
    const path = route(p, to, live.current.bridgeBuilt);
    const end = path.at(-1)!;
    if (dist(p, end) < 8) { arriveP.current = null; then?.(); return; }
    arriveP.current = then ?? null;
    commit(k, walkTo(p, path));
  }, []);
  const actK = useCallback((s: BodyState, ms: number, toward?: number) => {
    const { k, p } = bodiesRef.current;
    arriveK.current = null;
    commit(act(k, s, ms, performance.now(), toward), p);
  }, []);
  const actP = useCallback((s: BodyState, ms: number, toward?: number) => {
    const { k, p } = bodiesRef.current;
    arriveP.current = null;
    commit(k, act(p, s, ms, performance.now(), toward));
  }, []);
  /** send the pet somewhere to do something, then back to following */
  const petGo = useCallback((to: Pt, then: () => void) => {
    petBusy.current = true;
    walkP(to, () => { then(); later(1600, () => { petBusy.current = false; }); });
  }, [walkP, later]);

  const burst = useCallback((x: number, y: number, colors?: string[], n = 12) => {
    if (live.current.reduced) return;
    fire((x / WORLD_W) * 100, (y / WORLD_H) * 100, colors, n, 120);
  }, [fire]);

  // ── the quest engine: feed events, react to finished steps ──
  const emit = useCallback((e: WorldEvent) => {
    onEvent(e);
    setQuest(q => advanceQuest(QUEST, q, e, live.current.demands));
  }, [onEvent]);

  function stepDone(id: StepId) {
    const { k } = bodiesRef.current;
    if (id === 'notice') {
      actP('look', 900, k.x);
      actK('cheer', 1100);
    } else if (id === 'water') {
      chime.good();
      burst(FLOWER.x, FLOWER.y - 260, [P.petal, '#FFFFFF', P.blush]);
      actK('cheer', 1100);
      later(500, () => setCan({ ...CAN_HOME, drag: false, parked: false }));
      later(1200, () => walkK(BANK));
      later(1400, () => { if (!petBusy.current) walkP({ x: BANK.x - 120, y: BANK.y + 40 }); });
    } else if (id === 'bridge') {
      chime.fanfare();
      slots.forEach((s, i) => later(i * 120, () => burst(s.x, s.y, ['#FFFFFF', '#BFE9F7', P.petal], 8)));
      actK('cheer', 1100);
      later(1100, () => {
        petGo({ x: 1720, y: 800 }, () => actP('sniff', 1400, 1900));
        walkK({ x: 1660, y: 820 });
      });
    } else if (id === 'give') {
      chime.fanfare();
      actP('dance', 2600);
      actK('cheer', 1100);
      const { p } = bodiesRef.current;
      burst(p.x, p.y - 120, [P.starGold, '#FFFFFF', P.blush], 16);
      later(400, () => say('pet', 'My star ball! Thank you, thank you!'));
    }
  }

  function runIntro() {
    petBusy.current = true;
    walkP({ x: CHEST.x + 90, y: CHEST.y + 50 }, () => {
      setChestOpen(true);
      sfx.creak();
      actP('look', 700, CHEST.x);
      later(800, () => {
        actP('sad', 600000);
        say('pet', QUEST.steps[0].intro.line);
        setAskHelp(true);
      });
    });
  }

  const prevDone = useRef<StepId[] | null>(null);
  const started = useRef<StepId | null>(null);
  useEffect(() => {
    const first = prevDone.current === null;
    const prev = prevDone.current ?? quest.done;
    const newly = quest.done.filter(d => !prev.includes(d));
    prevDone.current = quest.done;
    newly.forEach(id => onEvent({ type: 'step-complete', step: id }));
    onEvent({ type: 'progress', quest, ladybugs });

    newly.forEach(id => stepDone(id));
    if (newly.length && quest.complete) {
      onEvent({ type: 'quest-complete' });
      later(2600, () => setCard(true));
    }
    const cur = currentStep(QUEST, quest);
    if (cur && cur.id !== started.current) {
      started.current = cur.id;
      onEvent({ type: 'step-start', step: cur.id });
      lastAction.current = performance.now();
      if (cur.id === 'notice') later(500, runIntro);
      else later(first ? 900 : 1300, () => say(cur.intro.who, cur.intro.line));
      const spot = STEP_SPOT[cur.id];
      if (spot && (first || cur.id === 'water')) later(first ? 400 : 1000, () => walkK(spot));
    }
    if (first && !cur) later(900, () => say('pet', 'Throw my star ball! I\'ll fetch it!'));
    // stepDone/runIntro read only refs and stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest]);

  useEffect(() => {
    if (prevDone.current === null) return;
    onEvent({ type: 'progress', quest, ladybugs });
    // only ladybugs: quest changes are reported above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ladybugs]);

  const helpPet = useCallback(() => {
    if (isDone(quest, 'notice')) return;
    touch();
    setAskHelp(false);
    petBusy.current = false;
    later(600, () => setChestOpen(false));
    emit({ type: 'intro-done' });
  }, [quest, emit, later]);

  // ── the loop: walking, following, pouring ──
  const pour = useRef({ ms: 0, active: false });
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let followAt = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const L = live.current;
      if (!L.paused) {
        const sp = L.reduced ? 2.4 : 1;
        const { k, p } = bodiesRef.current;
        const nk = step(k, dt, TIMING.walkSpeed * sp, now);
        let np = step(p, dt, TIMING.petSpeed * sp, now);
        const kArrived = k.state === 'walk' && nk.state !== 'walk';
        const pArrived = p.state === 'walk' && np.state !== 'walk';
        // the pet keeps close, a little behind Kailia
        if (!petBusy.current && now > followAt && (np.state === 'idle' || (np.state === 'walk' && !arriveP.current))) {
          followAt = now + 250;
          // stay on the side the pet is already on, so it never cuts across her
          const sideX = Math.sign(np.x - nk.x) || -nk.facing;
          const target = clampWalk({ x: nk.x + sideX * 130, y: nk.y + 34 }, L.bridgeBuilt);
          if (dist(np, nk) > 190 || (np.state === 'walk' && dist(np.path.at(-1) ?? np, target) > 80)) {
            np = walkTo(np, route(np, target, L.bridgeBuilt));
          } else if (np.state === 'idle') {
            np = face(np, nk.x);
          }
        }
        if (nk !== k || np !== p) commit(nk, np);
        if (kArrived) { const f = arriveK.current; arriveK.current = null; f?.(); }
        if (pArrived) { const f = arriveP.current; arriveP.current = null; f?.(); }
        // pouring: the can over Sunny while the child holds it
        if (pour.current.active) {
          pour.current.ms += dt * 1000;
          setPourMs(pour.current.ms);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── reminders when the child seems stuck, and a pet with a mind of its own ──
  useEffect(() => {
    const id = setInterval(() => {
      const L = live.current;
      if (L.paused || card) return;
      const cur = currentStep(QUEST, quest);
      const idle = (performance.now() - lastAction.current) / 1000;
      if (cur && cur.id !== 'notice' && idle > L.demands.remindAfterS) {
        lastAction.current = performance.now();
        onEvent({ type: 'hint', step: cur.id, level: 1 });
        say(cur.remind.who, cur.remind.line);
        const spot = cur.id === 'water' ? { ...CAN_HOME, x: CAN_HOME.x + 80 } : cur.id === 'bridge' ? { x: 1150, y: 930 } : null;
        const wig = cur.id === 'water' ? 'can' : cur.id === 'bridge' ? 'stones' : null;
        if (wig) { setWiggle(wig); later(1800, () => setWiggle(null)); }
        if (spot && !petBusy.current) petGo(spot, () => actP('sniff', 1400, spot.x - 80));
      } else if (!petBusy.current && idle > 7 && Math.random() < 0.18) {
        // wander over to something nearby and sniff it
        const { k } = bodiesRef.current;
        const near = [{ x: LEAVES.x + 90, y: LEAVES.y - 10 }, { x: FROG.x - 140, y: FROG.y - 40 }, { x: 330, y: 905 }, { x: CHEST.x + 90, y: CHEST.y + 40 }]
          .filter(s => Math.abs(s.x - k.x) < 500 && (L.bridgeBuilt || sideOf(s) < 0));
        const s = near[Math.floor(Math.random() * near.length)];
        if (s) petGo(s, () => actP('sniff', 1300, s.x - 90));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [quest, card, onEvent, say, petGo, actP, later]);

  // keyboard: arrows walk, Escape pauses
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (live.current.paused) return;
      const { k } = bodiesRef.current;
      const d = { ArrowLeft: [-220, 0], ArrowRight: [220, 0], ArrowUp: [0, -90], ArrowDown: [0, 90] }[e.key];
      if (d) { e.preventDefault(); touch(); walkK({ x: k.x + d[0], y: k.y + d[1] }); }
      if (e.key === 'Escape') onPause();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [walkK, onPause]);

  // ── ground taps walk Kailia ──
  const onGround = useCallback((x: number, y: number) => {
    touch();
    walkK({ x, y: y < 640 ? 700 : y });
  }, [walkK]);

  // ── the watering can ──
  const canNearFlower = (c: Pt) => dist(c, POUR_AT) < demands.snap + 30;
  const [pourOn, setPourOn] = useState(false);
  const pourVia = useRef<Via>('drag');
  const pourDone = useRef(false);
  const startPour = (on: boolean, via: Via) => {
    if (watered) return;
    if (on && !pour.current.active) sfx.pour();
    pour.current.active = on;
    pourVia.current = via;
    setPourOn(on);
  };
  const full = pourMs >= demands.holdMs;
  useEffect(() => {
    if (!full || watered) return;
    pour.current.active = false;
    pourDone.current = true;
    later(0, () => { setPourOn(false); emit({ type: 'flower-watered', via: pourVia.current }); });
    // fires once when the pour fills up
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  const canActive = stepNow?.id === 'water';
  const canHandlers = {
    onStart: () => {
      touch();
      setCan(c => ({ ...c, drag: true, parked: false }));
      actK('reach', 600000, CAN_HOME.x);
    },
    onMove: (p: Pt) => {
      const c = { x: p.x, y: p.y + 45 };
      setCan(s => ({ ...s, ...c }));
      startPour(canNearFlower(c), 'drag');
    },
    onDrop: (p: Pt) => {
      touch();
      const c = { x: p.x, y: p.y + 45 };
      const on = canNearFlower(c);
      // the pour may already have finished while the can hovered over Sunny
      if (!pourDone.current) emit({ type: 'can-drop', onTarget: on, via: 'drag' });
      startPour(false, 'drag');
      actK('idle', 0);
      if (on) setCan({ ...POUR_AT, drag: false, parked: true });
      else { setCan({ ...CAN_HOME, drag: false, parked: false }); sfx.plop(); }
    },
    onPress: (down: boolean) => {
      if (can.parked) startPour(down, 'drag');
    },
    onTap: (from: 'pointer' | 'key') => {
      touch();
      if (!canActive) { say('noel', watered ? 'Sunny is happy now!' : 'Let\'s help ' + pet.name + ' first!'); return; }
      if (from === 'key' || demands.tapToMove) {
        // assisted: the can floats to Sunny and pours by itself
        setCan({ ...POUR_AT, drag: false, parked: true });
        emit({ type: 'can-drop', onTarget: true, via: 'tap' });
        later(450, () => startPour(true, 'tap'));
        return;
      }
      if (!can.parked) {
        setWiggle('can'); later(1400, () => setWiggle(null));
        say('noel', 'Hold the can and slide it to Sunny!');
      }
    },
  };
  const pouring = !watered && pourOn;
  const lift = watered ? 1 : Math.min(1, pourMs / demands.holdMs);

  // ── stepping stones ──
  const bridgeActive = stepNow?.id === 'bridge';
  const placeStone = (i: number, at: Pt | null, via: Via) => {
    touch();
    const free = slots.map((s, j) => ({ s, j })).filter(({ j }) => !stones.some(st => st.slot === j));
    const target = at
      ? free.filter(({ s }) => dist(s, at) < demands.snap + 24).sort((a, b) => dist(a.s, at) - dist(b.s, at))[0]
      : free[0];
    if (target) {
      setStones(ss => ss.map((s, k) => (k === i ? { ...target.s, slot: target.j, drag: false } : s)));
      sfx.plop();
      burst(target.s.x, target.s.y - 10, ['#FFFFFF', '#BFE9F7'], 7);
      emit({ type: 'stone-drop', placed: true, via });
    } else {
      setStones(ss => ss.map((s, k) => (k === i ? { ...STONE_HOMES[i], slot: null, drag: false } : s)));
      chime.soft();
      emit({ type: 'stone-drop', placed: false, via });
    }
    actK('idle', 0);
  };

  // ── bushes ──
  const searchActive = stepNow?.id === 'search';
  const searchBush = (i: number) => {
    touch();
    if (!bridgeBuilt) { say('noel', 'The bushes are across the stream. We need a bridge!'); return; }
    const b = BUSHES[i];
    walkK({ x: b.x - 130, y: b.y + 14 }, () => {
      const { k } = bodiesRef.current;
      commit(face(k, b.x), bodiesRef.current.p);
      setRustle({ i, n: Date.now() });
      sfx.rustle();
      burst(b.x, b.y - 90, ['#6CC07F', '#9ED36A', '#3F9152'], 8);
      if (!searchActive) return;
      if (i === ballSpot) {
        setSearched(s => [...s, i]);
        setBall({ mode: 'fly', x: b.x, y: b.y - 150 });
        later(450, () => setBall({ mode: 'held', x: 0, y: 0 }));
        chime.good();
        burst(b.x, b.y - 150, [P.starGold, '#FFFFFF'], 14);
        actK('cheer', 1100);
        emit({ type: 'bush-search', found: true });
        return;
      }
      if (searched.includes(i)) return;
      setSearched(s => [...s, i]);
      const kind = misses.current % 2 ? 'snail' : 'butterfly';
      setSurprise({ i, kind, n: Date.now() });
      misses.current += 1;
      emit({ type: 'bush-search', found: false });
      later(500, () => say('pet', kind === 'butterfly' ? 'A butterfly! Not my ball… let\'s keep looking.' : 'Hello, snail! My ball must be somewhere else.'));
      if (misses.current >= demands.hintAfter && !petHinted) {
        setPetHinted(true);
        const t = BUSHES[ballSpot];
        later(1800, () => {
          onEvent({ type: 'hint', step: 'search', level: 2 });
          petGo({ x: t.x + 110, y: t.y + 20 }, () => { actP('sniff', 2400, t.x); say('noel', 'Look where {pet} is sniffing!'); });
        });
      }
    });
  };

  // ── the ball ──
  const { k, p } = bodies;
  const kScale = depthScale(k.y), pScale = depthScale(p.y);
  const holdPt = { x: k.x + (k.state === 'walk' ? k.facing * 20 : 18) * kScale, y: k.y - 112 * kScale };
  const pw = petWidth(pet.art, SIZES.petH);
  // a carried ball sits by its front paws, so it never covers the face
  const mouthPt = { x: p.x + p.facing * pw * 0.34 * pScale, y: p.y - SIZES.petH * 0.04 * pScale };
  const ballPos: Pt = ball.mode === 'held' ? holdPt : ball.mode === 'pet' ? mouthPt : ball;
  const petCenter = { x: p.x, y: p.y - SIZES.petH * 0.5 * pScale };

  const giveBall = (via: Via) => {
    touch();
    setBall({ mode: 'pet', x: 0, y: 0 });
    emit({ type: 'ball-given', via });
  };
  const throwBall = (from: Pt, vel: Pt) => {
    touch();
    const land = clampWalk({ x: from.x + clamp(vel.x * 0.35, -600, 600), y: from.y + 60 + clamp(vel.y * 0.2, -150, 150) }, true);
    setBall({ mode: 'fly', ...land });
    later(560, () => setBall({ mode: 'ground', ...land }));
    onEvent({ type: 'fetch' });
    petGo({ x: land.x - 40, y: land.y }, () => {
      setBall({ mode: 'pet', x: 0, y: 0 });
      actP('cheer', 700);
      later(500, () => {
        petBusy.current = true;
        const { k: kk } = bodiesRef.current;
        walkP({ x: kk.x + kk.facing * 110, y: kk.y + 30 }, () => {
          const { p: pp } = bodiesRef.current;
          setBall({ mode: 'ground', x: pp.x + pp.facing * 40, y: pp.y + 12 });
          actP('dance', 1400);
          later(1400, () => { petBusy.current = false; });
        });
      });
    });
  };
  const ballHandlers = {
    onStart: () => { touch(); if (ball.mode === 'held' || ball.mode === 'ground') setBall(b => ({ ...b, mode: 'drag', ...ballPos })); },
    onMove: (q: Pt) => setBall(b => (b.mode === 'drag' ? { ...b, x: q.x, y: q.y + 30 } : b)),
    onDrop: (q: Pt, vel: Pt) => {
      const at = { x: q.x, y: q.y + 30 };
      if (!given) {
        if (dist(at, petCenter) < 130 + demands.snap * 0.5) giveBall('drag');
        else { setBall({ mode: 'held', x: 0, y: 0 }); emit({ type: 'give-miss' }); chime.soft(); }
        return;
      }
      throwBall(at, vel);
    },
    onTap: (from: 'pointer' | 'key') => {
      touch();
      if (!given) {
        if (from === 'key' || demands.tapToMove) giveBall('tap');
        else say('noel', 'Slide the star ball over to {pet}!');
        return;
      }
      if (ball.mode === 'ground') throwBall(ballPos, { x: (Math.random() < 0.5 ? -1 : 1) * 900, y: 200 });
    },
  };

  const tapPet = () => {
    touch();
    if (!isDone(quest, 'notice')) { if (askHelp) helpPet(); return; }
    if (stepNow?.id === 'give' && ball.mode === 'held') {
      if (demands.tapToMove || tappedPetOnce) { giveBall('tap'); return; }
      setTappedPetOnce(true);
      onEvent({ type: 'hint', step: 'give', level: 1 });
      say('noel', 'Slide the star ball over to {pet}!');
      return;
    }
    chime.tap();
    actP('cheer', 900);
    burst(p.x, p.y - 140, [P.blush, '#FFFFFF'], 6);
  };

  const tapNoel = () => {
    touch();
    onEvent({ type: 'explore', thing: 'noel' });
    if (stepNow && stepNow.id !== 'notice') say('noel', stepNow.remind.line);
    else if (!stepNow) say('noel', 'What a good friend you are! Want to throw the ball for {pet}?');
    else say('noel', '{pet} looks sad. Tap {pet} to help!');
  };

  const findLadybug = (id: string, at: Pt) => {
    touch();
    if (ladybugs.includes(id)) return;
    setLadybugs(l => [...l, id]);
    chime.good();
    burst(at.x, at.y - 20, ['#E9534A', '#FFFFFF', INK], 9);
    onEvent({ type: 'ladybug', id });
    if (ladybugs.length + 1 === LADYBUGS.length) later(400, () => say('noel', 'All three ladybugs! They can live on your shelf now.'));
  };

  // ── hud ──
  const objective = stepNow ? fill(stepNow.objective) : `Play fetch with ${pet.name}`;
  const placedCount = stones.filter(s => s.slot !== null).length;
  const showShelfBall = given || quest.complete;

  const hud = (
    <>
      <div className="absolute left-3 top-3 sm:left-5 sm:top-5 flex gap-2" style={{ zIndex: 10 }}>
        <HudButton label="Back to the map" onClick={onExit}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </HudButton>
        <HudButton label="Pause" onClick={onPause}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill={INK}><rect x="6" y="5" width="4.2" height="14" rx="1.6" /><rect x="13.8" y="5" width="4.2" height="14" rx="1.6" /></svg>
        </HudButton>
      </div>

      <div className="absolute left-1/2 top-[76px] sm:top-5 -translate-x-1/2 flex items-center gap-2 rounded-full pl-2 pr-4 py-1.5 font-extrabold"
        style={{ zIndex: 10, background: P.paper, border: `2.5px solid ${INK}`, boxShadow: `0 4px 0 rgba(59,36,22,0.25)`, color: INK, maxWidth: 'calc(100vw - 24px)' }}
        aria-live="polite">
        <StepIcon step={stepNow?.id ?? 'done'} />
        <span className="text-base sm:text-xl whitespace-nowrap overflow-hidden text-ellipsis">{objective}</span>
        {stepNow?.id === 'bridge' && (
          <span className="flex gap-1 ml-1" aria-label={`${placedCount} of ${demands.stones} stones`}>
            {slots.map((_, i) => <span key={i} className="inline-block rounded-full" style={{ width: 12, height: 12, background: i < placedCount ? P.stoneDeep : 'transparent', border: `2px solid ${INK}` }} />)}
          </span>
        )}
      </div>

      {/* Noel talks from the empty sky, so nothing on the ground is ever covered */}
      {line && (
        <div key={line.n} className="absolute left-3 right-3 sm:left-5 sm:right-auto top-[124px] sm:top-[88px] flex items-center gap-2 gw-say"
          style={{ zIndex: 10, maxWidth: 560 }}>
          <span className="flex-shrink-0 rounded-full overflow-hidden" style={{ width: 64, height: 64, background: P.paper, border: `2.5px solid ${INK}` }} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={line.who === 'noel' ? characterArt('noel', 'portrait-front') : pet.art} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%', transform: 'scale(1.5)', transformOrigin: '50% 10%' }} />
          </span>
          <div className="flex items-center gap-2 rounded-3xl px-4 py-2.5 font-bold text-base sm:text-lg leading-snug"
            style={{ background: P.paper, border: `2.5px solid ${INK}`, color: INK, boxShadow: `0 4px 0 rgba(59,36,22,0.25)` }} role="status">
            <span><b>{line.who === 'noel' ? 'Noel' : pet.name}:</b> {line.text}</span>
            <button type="button" aria-label="Say it again" onClick={() => speak(line.text)}
              className="flex-shrink-0 rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: '#FFE7B8', border: `2px solid ${INK}` }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill={INK} /><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11" /></svg>
            </button>
          </div>
        </div>
      )}

      {askHelp && (
        <div className="absolute left-1/2 -translate-x-1/2 bounce-in" style={{ zIndex: 11, top: '36%' }}>
          <button type="button" onClick={helpPet} className="rounded-full px-8 py-3 font-extrabold text-xl sm:text-2xl"
            style={{ background: P.starGold, color: INK, border: `3px solid ${INK}`, boxShadow: `0 5px 0 ${INK}`, minHeight: 60 }}>
            Let&apos;s help!
          </button>
        </div>
      )}

      {/* the pocket: what Kailia carries and what she found */}
      <div className="absolute right-3 top-3 sm:right-5 sm:top-5 flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-1.5"
        style={{ zIndex: 10, background: P.paper, border: `2.5px solid ${INK}`, boxShadow: `0 4px 0 rgba(59,36,22,0.25)` }}
        aria-label={`Pocket: ${ball.mode === 'held' ? 'the star ball, ' : ''}${ladybugs.length} of 3 ladybugs`}>
        <span className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, background: '#FFF0C8', border: `2px dashed ${P.woodDeep}` }}>
          {ball.mode === 'held' && <StarBall size={32} glow={false} />}
        </span>
        {LADYBUGS.map(l => (
          <span key={l.id} style={{ opacity: ladybugs.includes(l.id) ? 1 : 0.22, filter: ladybugs.includes(l.id) ? 'none' : 'grayscale(1)' }}><Ladybug size={22} /></span>
        ))}
      </div>

      {card && (
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ zIndex: 20, background: 'rgba(59,36,22,0.35)' }}>
          <div className="bounce-in rounded-[32px] p-6 sm:p-8 text-center w-full" role="dialog" aria-label="Quest complete"
            style={{ maxWidth: 440, background: P.paper, border: `3px solid ${INK}`, boxShadow: `0 8px 0 ${INK}`, color: INK }}>
            <div className="flex items-end justify-center gap-3 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pet.art} alt="" style={{ height: 120, width: 'auto' }} className="fg-dance" />
              <StarBall size={70} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{pet.name}&apos;s star ball is home!</h2>
            <p className="mt-2 text-lg font-semibold">It&apos;s on your treasure shelf now.</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-lg font-extrabold rounded-full px-4 py-1" style={{ background: '#FFF0C8' }}>
              <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l3 7 7.5.6-5.7 5 1.8 7.4L12 18l-6.6 4 1.8-7.4L1.5 9.6 9 9z" fill={P.starGold} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" /></svg>
              {rewardStarlight} starlight
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button type="button" className="rounded-full py-3 text-xl font-extrabold" style={{ background: P.starGold, border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`, minHeight: 56 }}
                onClick={() => { setCard(false); touch(); say('pet', 'Throw my star ball! I\'ll fetch it!'); const { p: pp } = bodiesRef.current; setBall({ mode: 'ground', x: pp.x + pp.facing * 50, y: pp.y + 14 }); }}>
                Play fetch
              </button>
              <button type="button" className="rounded-full py-3 text-lg font-extrabold" style={{ background: '#FFFFFF', border: `3px solid ${INK}`, minHeight: 56 }} onClick={onExit}>
                Back to the map
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const focusX = k.x;
  const freeze = can.drag || stones.some(s => s.drag) || ball.mode === 'drag';

  return (
    <WorldStage width={WORLD_W} height={WORLD_H} focusX={focusX} freeze={freeze} reducedMotion={reduced}
      sky={<GardenSky />} back={[{ node: <GardenFar />, factor: 0.3 }, { node: <GardenMid />, factor: 0.6 }, { node: <GardenGround />, factor: 1 }, { node: <GardenGroundLife />, factor: 1 }]}
      front={[{ node: <GardenFront />, factor: 1.15 }]} onGround={onGround} hud={hud}>

      {/* the treasure shelf by the cottage */}
      <div className="absolute pointer-events-none" style={{ left: SHELF.x - 65, top: SHELF.y - 60, zIndex: 640 }} aria-hidden="true">
        <TreasureShelf ball={showShelfBall} ladybugs={ladybugs.length} />
      </div>

      <WorldNoel x={NOEL.x} y={NOEL.y} onTap={tapNoel} excited={!!card} />

      <Thing x={CHEST.x} y={CHEST.y} w={150} h={130} label="Toy chest" onTap={() => { touch(); sfx.creak(); setChestOpen(o => !o); onEvent({ type: 'explore', thing: 'chest' }); }}>
        <ToyChest open={chestOpen} />
      </Thing>

      <Thing x={FLOWER.x} y={FLOWER.y} w={220} h={340} label={watered ? 'Sunny the sunflower' : 'Sunny the sunflower, asleep'}
        onTap={() => { touch(); if (watered) { chime.tap(); say('noel', 'Sunny is pointing across the stream!'); } else say('noel', 'Sunny is sleepy and thirsty. Bring her the watering can!'); }}>
        <Sunflower lift={lift} bloomed={watered} />
      </Thing>

      {/* sparkle trail from Sunny to the stream once she points */}
      {watered && !found && [0, 1, 2, 3, 4, 5].map(i => (
        <span key={i} aria-hidden="true" className="absolute fg-twinkle pointer-events-none" style={{
          left: 1170 + i * 52, top: 760 + Math.sin(i) * 18, width: 16, height: 16, zIndex: 700, animationDelay: `${-i * 0.3}s`,
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="#FFF3B0" stroke={P.starGoldDeep} strokeWidth="1.5" /></svg>
        </span>
      ))}

      <DragThing x={can.x} y={can.y} w={140} h={110} label="Watering can" glide={can.drag ? 0 : 450}
        dragging={can.drag} disabled={!canActive} z={can.drag ? 2000 : can.parked ? FLOWER.y + 4 : canActive ? ACTIVE_Z : undefined}
        className={wiggle === 'can' ? 'gw-wiggle' : ''} {...canHandlers}>
        <WateringCan tilt={pouring} />
      </DragThing>

      {/* the bridge: glowing gaps, then stones */}
      {bridgeActive && slots.map((s, j) => !stones.some(st => st.slot === j) && (
        <div key={j} className="absolute pointer-events-none" style={{ left: s.x - 48, top: s.y - 30, zIndex: 790 }} aria-hidden="true"><StoneSlot /></div>
      ))}
      {stones.map((s, i) => (
        <DragThing key={i} x={s.x} y={s.y + 20} w={96} h={64} label={s.slot !== null ? 'Stepping stone in the stream' : 'Stepping stone'}
          glide={s.drag ? 0 : 350} dragging={s.drag} disabled={!bridgeActive || s.slot !== null}
          z={s.drag ? 2000 : s.slot !== null ? 795 : bridgeActive ? ACTIVE_Z : undefined} className={wiggle === 'stones' && s.slot === null ? 'gw-wiggle' : ''}
          onStart={() => { touch(); setStones(ss => ss.map((t, k2) => (k2 === i ? { ...t, drag: true } : t))); actK('reach', 600000, s.x); }}
          onMove={q => setStones(ss => ss.map((t, k2) => (k2 === i ? { ...t, x: q.x, y: q.y + 10 } : t)))}
          onDrop={q => placeStone(i, { x: q.x, y: q.y + 10 }, 'drag')}
          onTap={from => {
            touch();
            if (!bridgeActive) { if (!watered) say('noel', 'Let\'s wake up Sunny first!'); return; }
            if (from === 'key' || demands.tapToMove) placeStone(i, null, 'tap');
            else { setWiggle('stones'); later(1400, () => setWiggle(null)); say('noel', 'Hold a stone and slide it into a glowing spot!'); }
          }}>
          <Stone v={i} />
        </DragThing>
      ))}

      <Thing x={FROG.x} y={FROG.y} w={120} h={80} label="Frog" onTap={() => { touch(); setFrogHop(n => n + 1); sfx.croak(); onEvent({ type: 'explore', thing: 'frog' }); }}>
        <span key={frogHop} className="block"><Frog hop={frogHop > 0} /></span>
      </Thing>

      <Thing x={LEAVES.x} y={LEAVES.y} w={140} h={70} label="Pile of leaves" onTap={() => {
        touch(); if (leavesOut) return; setLeavesOut(true); sfx.rustle(); burst(LEAVES.x, LEAVES.y - 40, ['#F7B267', '#F4845F', '#E9C46A'], 10);
        onEvent({ type: 'explore', thing: 'leaves' }); later(5000, () => setLeavesOut(false));
      }}>
        <LeafPile scattered={leavesOut} />
      </Thing>

      {LADYBUGS.filter(l => !ladybugs.includes(l.id)).map(l => (
        <Thing key={l.id} x={l.x} y={l.y + 30} w={40} h={34} label="Ladybug" z={l.id === 'flowers' ? 900 : 700} onTap={() => findLadybug(l.id, l)}>
          <span className="block gw-crawl"><Ladybug /></span>
        </Thing>
      ))}

      {BUSHES.slice(0, demands.spots).map((b, i) => (
        <Thing key={i} x={b.x} y={b.y} w={190} h={140} label={searched.includes(i) ? 'Bush, already searched' : 'Bush'}
          onTap={() => searchBush(i)}>
          {/* the star ball peeking out of its bush */}
          {i === ballSpot && !found && (
            <span className="absolute" style={{ left: 95 - 26, top: 24 - 52 * demands.peek + 10, zIndex: 0 }} aria-hidden="true">
              <StarBall size={52} glow={demands.peek > 0.4} />
            </span>
          )}
          <span key={rustle?.i === i ? rustle.n : 0} className={`absolute inset-0 ${rustle?.i === i ? 'gw-shake' : ''}`} style={{ zIndex: 1 }}>
            <Bush v={i} searched={searched.includes(i)} />
          </span>
          {i === ballSpot && !found && (
            <span className="absolute fg-twinkle" style={{ left: 95 + 18, top: 14 - 40 * demands.peek, zIndex: 2, width: 18, height: 18 }} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="#FFFFFF" /></svg>
            </span>
          )}
          {surprise?.i === i && (
            <span key={surprise.n} className={`absolute ${surprise.kind === 'butterfly' ? 'gw-flyaway' : 'gw-peek'}`} style={{ left: 70, top: -10, zIndex: 3 }} aria-hidden="true">
              {surprise.kind === 'butterfly' ? <Butterfly /> : <Snail />}
            </span>
          )}
        </Thing>
      ))}

      <WorldKailia b={k} />
      <WorldPet b={p} art={pet.art} name={pet.name}
        label={stepNow?.id === 'give' ? `Give the star ball to ${pet.name}` : stepNow?.id === 'notice' ? `Help ${pet.name}` : `Tickle ${pet.name}`}
        onTap={tapPet} />

      {/* the star ball, wherever it is */}
      {ball.mode !== 'hidden' && (
        ball.mode === 'held' || ball.mode === 'drag' || ball.mode === 'ground' ? (
          <DragThing x={ballPos.x} y={ballPos.y + 30} w={56} h={56} label={given ? 'Star ball: throw it' : `Star ball: slide it to ${pet.name}`}
            z={ball.mode === 'drag' ? 2000 : Math.round(ball.mode === 'held' ? k.y + 2 : ballPos.y)} dragging={ball.mode === 'drag'}
            disabled={ball.mode === 'held' && stepNow?.id !== 'give'} {...ballHandlers}>
            <StarBall size={56} glow={ball.mode !== 'held'} />
          </DragThing>
        ) : (
          <div className="absolute pointer-events-none" aria-hidden="true" style={{
            left: ballPos.x - 28, top: ballPos.y - 56, zIndex: ball.mode === 'pet' ? Math.round(p.y + 2) : 1500,
            transition: ball.mode === 'fly' ? 'left 0.55s cubic-bezier(.2,.6,.4,1), top 0.55s cubic-bezier(.3,-0.6,.6,1)' : undefined,
          }}>
            <StarBall size={56} glow={false} />
          </div>
        )
      )}

      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3000 }}>{burstLayer}</div>
    </WorldStage>
  );
}

function HudButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className="flex items-center justify-center rounded-full active:translate-y-0.5"
      style={{ width: 56, height: 56, background: P.paper, border: `2.5px solid ${INK}`, boxShadow: `0 4px 0 rgba(59,36,22,0.25)` }}>
      {children}
    </button>
  );
}

function StepIcon({ step }: { step: string }) {
  const s = { width: 34, height: 34 };
  switch (step) {
    case 'water':
      return <svg viewBox="0 0 32 32" {...s} aria-hidden="true"><path d="M16 4 Q24 15 24 20 a8 8 0 01-16 0 Q8 15 16 4z" fill="#7CC6E0" stroke={INK} strokeWidth="2.2" /></svg>;
    case 'bridge':
      return <svg viewBox="0 0 32 32" {...s} aria-hidden="true"><path d="M2 24 H30" stroke="#58AFCF" strokeWidth="5" strokeLinecap="round" /><ellipse cx="9" cy="20" rx="6" ry="4" fill={P.stone} stroke={INK} strokeWidth="2" /><ellipse cx="22" cy="20" rx="6" ry="4" fill={P.stone} stroke={INK} strokeWidth="2" /></svg>;
    case 'search':
      return <svg viewBox="0 0 32 32" {...s} aria-hidden="true"><circle cx="13" cy="13" r="8" fill="#E6F7FC" stroke={INK} strokeWidth="2.6" /><path d="M19 19 L28 28" stroke={INK} strokeWidth="4" strokeLinecap="round" /></svg>;
    case 'notice':
      return <svg viewBox="0 0 32 32" {...s} aria-hidden="true"><path d="M16 27 C6 20 3 14 6 9 a6 6 0 0110 0 a6 6 0 0110 0 c3 5 0 11 -10 18z" fill={P.blush} stroke={INK} strokeWidth="2.2" /></svg>;
    default:
      return <StarBall size={32} glow={false} />;
  }
}
