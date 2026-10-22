'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import { usePlayCount } from '@/hooks/usePlayCount';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { characterArt } from '@/components/characters/characters.config';
import { loadRewards, awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { logQuestMetric } from '@/lib/metrics';
import { chapterFor, LEVELS_PER_CHAPTER } from '@/lib/levels';
import LevelPath from '@/components/LevelPath';
import SkillIntro from '@/components/SkillIntro';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime } from '@/components/friends/voice';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pt { x: number; y: number; }

interface Level {
  name: string;
  kind: 'pine' | 'spire' | 'rock' | 'cloud';
  tagline: string;
  bg: string;
  wall: string;
  floor: string;
  accent: string;
  accentDim: string;
  path: (w: number, h: number) => Pt[];
  starFracs: number[];
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

function seg(a: Pt, b: Pt, n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({
    x: a.x + (b.x - a.x) * (i / n),
    y: a.y + (b.y - a.y) * (i / n),
  }));
}

function tracePath(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
}

// ─── Levels ───────────────────────────────────────────────────────────────────

const LEVELS: Level[] = [
  {
    name: 'Forest Trail', kind: 'pine', tagline: 'Follow the winding path through the trees!',
    bg: '#050f05', wall: '#0c1f0c', floor: '#1a5c1a', accent: '#4ade80', accentDim: '#16a34a',
    path: (w, h) => [
      ...seg({x:w*.06,y:h*.38}, {x:w*.45,y:h*.38}, 30),
      ...seg({x:w*.45,y:h*.38}, {x:w*.45,y:h*.72}, 18),
      ...seg({x:w*.45,y:h*.72}, {x:w*.94,y:h*.72}, 32),
      {x:w*.94,y:h*.72},
    ],
    starFracs: [0.22, 0.52, 0.82],
  },
  {
    name: 'Crystal Caves', kind: 'spire', tagline: 'Navigate the glittering tunnels!',
    bg: '#020510', wall: '#060d28', floor: '#1e3a8a', accent: '#60a5fa', accentDim: '#2563eb',
    path: (w, h) => [
      ...seg({x:w*.06,y:h*.28}, {x:w*.52,y:h*.28}, 30),
      ...seg({x:w*.52,y:h*.28}, {x:w*.52,y:h*.72}, 20),
      ...seg({x:w*.52,y:h*.72}, {x:w*.27,y:h*.72}, 14),
      ...seg({x:w*.27,y:h*.72}, {x:w*.27,y:h*.5},  10),
      ...seg({x:w*.27,y:h*.5},  {x:w*.94,y:h*.5},  40),
      {x:w*.94,y:h*.5},
    ],
    starFracs: [0.2, 0.5, 0.82],
  },
  {
    name: "Dragon's Lair", kind: 'rock', tagline: 'Brave the fiery tunnels without getting burned!',
    bg: '#0f0202', wall: '#200808', floor: '#7f1d1d', accent: '#f97316', accentDim: '#b45309',
    path: (w, h) => [
      ...seg({x:w*.06,y:h*.62}, {x:w*.28,y:h*.62}, 14),
      ...seg({x:w*.28,y:h*.62}, {x:w*.28,y:h*.26}, 16),
      ...seg({x:w*.28,y:h*.26}, {x:w*.68,y:h*.26}, 24),
      ...seg({x:w*.68,y:h*.26}, {x:w*.68,y:h*.74}, 22),
      ...seg({x:w*.68,y:h*.74}, {x:w*.52,y:h*.74}, 10),
      ...seg({x:w*.52,y:h*.74}, {x:w*.52,y:h*.5},  10),
      ...seg({x:w*.52,y:h*.5},  {x:w*.94,y:h*.5},  24),
      {x:w*.94,y:h*.5},
    ],
    starFracs: [0.15, 0.48, 0.8],
  },
  {
    name: 'Sky Kingdom', kind: 'cloud', tagline: 'Soar through the clouds without falling!',
    bg: '#020810', wall: '#051428', floor: '#075985', accent: '#38bdf8', accentDim: '#0369a1',
    path: (w, h) => [
      ...seg({x:w*.06,y:h*.72}, {x:w*.24,y:h*.72}, 12),
      ...seg({x:w*.24,y:h*.72}, {x:w*.24,y:h*.28}, 20),
      ...seg({x:w*.24,y:h*.28}, {x:w*.52,y:h*.28}, 18),
      ...seg({x:w*.52,y:h*.28}, {x:w*.52,y:h*.72}, 20),
      ...seg({x:w*.52,y:h*.72}, {x:w*.76,y:h*.72}, 14),
      ...seg({x:w*.76,y:h*.72}, {x:w*.76,y:h*.28}, 20),
      ...seg({x:w*.76,y:h*.28}, {x:w*.94,y:h*.28}, 12),
      {x:w*.94,y:h*.28},
    ],
    starFracs: [0.18, 0.5, 0.82],
  },
  {
    name: "Wizard's Tower", kind: 'spire', tagline: 'Master the ultimate maze!',
    bg: '#06020f', wall: '#100520', floor: '#5b21b6', accent: '#c084fc', accentDim: '#7c3aed',
    path: (w, h) => [
      ...seg({x:w*.06,y:h*.5},  {x:w*.2,y:h*.5},   8),
      ...seg({x:w*.2,y:h*.5},   {x:w*.2,y:h*.22},  12),
      ...seg({x:w*.2,y:h*.22},  {x:w*.52,y:h*.22}, 18),
      ...seg({x:w*.52,y:h*.22}, {x:w*.52,y:h*.78}, 24),
      ...seg({x:w*.52,y:h*.78}, {x:w*.34,y:h*.78}, 12),
      ...seg({x:w*.34,y:h*.78}, {x:w*.34,y:h*.5},  12),
      ...seg({x:w*.34,y:h*.5},  {x:w*.72,y:h*.5},  22),
      ...seg({x:w*.72,y:h*.5},  {x:w*.72,y:h*.22}, 12),
      ...seg({x:w*.72,y:h*.22}, {x:w*.94,y:h*.22}, 14),
      {x:w*.94,y:h*.22},
    ],
    starFracs: [0.15, 0.48, 0.82],
  },
];

// ─── Distance helpers ─────────────────────────────────────────────────────────

function distToSeg(p: Pt, a: Pt, b: Pt): number {
  const dx=b.x-a.x, dy=b.y-a.y, l=dx*dx+dy*dy;
  if (!l) return Math.hypot(p.x-a.x, p.y-a.y);
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));
  return Math.hypot(p.x-(a.x+t*dx), p.y-(a.y+t*dy));
}
function closestOnPath(p: Pt, path: Pt[]): number {
  let min=Infinity;
  for (let i=0;i<path.length-1;i++) { const d=distToSeg(p,path[i],path[i+1]); if(d<min) min=d; }
  return min;
}

// ─── Canvas star helper ───────────────────────────────────────────────────────

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  ctx.shadowBlur=18; ctx.shadowColor=col;
  ctx.beginPath();
  for (let i=0;i<10;i++) {
    const a=(i*Math.PI/5)-Math.PI/2, rad=i%2===0?r:r*0.42;
    if (i===0) ctx.moveTo(x+Math.cos(a)*rad, y+Math.sin(a)*rad);
    else ctx.lineTo(x+Math.cos(a)*rad, y+Math.sin(a)*rad);
  }
  ctx.closePath(); ctx.fillStyle=col; ctx.fill(); ctx.shadowBlur=0;
}

// the finish flag on the END pad, gently waving
function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const wave = Math.sin(t / 260) * 2.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3b2416'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 4, y + 6); ctx.lineTo(x - 4, y - 26); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 26);
  ctx.quadraticCurveTo(x + 6, y - 28 + wave, x + 15, y - 22 + wave);
  ctx.quadraticCurveTo(x + 6, y - 17 + wave, x - 3, y - 15);
  ctx.closePath();
  ctx.fillStyle = '#FDE047'; ctx.fill();
  ctx.lineWidth = 2; ctx.stroke();
}

// ─── Reassessment banner (outside component to avoid lint error) ──────────────

function ReassessBanner({ onGo }: { onGo: () => void }) {
  return (
    <div className="rounded-2xl p-4 mb-4 text-center"
      style={{background:'rgba(245,158,11,0.15)',border:'2px solid rgba(245,158,11,0.5)'}}>
      <p className="text-yellow-300 font-bold text-sm mb-2">
        You&apos;ve played 10 games! Time for a quick check-up.
      </p>
      <button onClick={onGo}
        className="px-5 py-2 rounded-full font-bold text-sm text-white transition-all hover:scale-105"
        style={{background:'linear-gradient(135deg,#F59E0B,#EF4444)'}}>
        Start Reassessment →
      </button>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const W=600, H=320, HIT_CD=650, COLLECT_R=26, GOAL_R=22;
const STAR_LINES=['Ooh, a star!','Sparkly! Keep going!','Another star!','Star catcher!'];
const TOUCH_LINE=()=>typeof window!=='undefined'&&'ontouchstart' in window
  ? 'Put your finger on GO and follow the glowing path to the flag!'
  : 'Press on GO and drag along the glowing path to the flag!';
type Phase='intro'|'playing'|'levelcomplete';

// ─── Living background ───────────────────────────────────────────────────────
// Drawn every frame under the maze: a soft glow, drifting mist, a row of
// swaying trees (or crystal spires / rocks, per maze) and wandering
// fireflies. Calm, slow motion only — nothing flashes. `t` is 0 when the
// grown-ups turned on Reduce motion, which freezes the scene.

const FIREFLIES = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 137.5) % W, y: 20 + ((i * 89) % (H - 40)),
  ax: 18 + (i % 5) * 7, ay: 10 + (i % 4) * 6, sp: 0.00025 + (i % 7) * 0.00006, ph: i * 1.7,
}));

function drawScenery(ctx: CanvasRenderingContext2D, lv: Level, t: number) {
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, lv.bg); sky.addColorStop(1, lv.wall);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.82, 30, 4, W * 0.82, 30, 150);
  glow.addColorStop(0, `${lv.accent}40`); glow.addColorStop(1, `${lv.accent}00`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // drifting mist bands (wrap around)
  for (let i = 0; i < 3; i++) {
    const x = ((t * (0.008 + i * 0.004) + i * 260) % (W + 300)) - 150;
    ctx.beginPath(); ctx.ellipse(x, 70 + i * 90, 150, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = `${lv.accent}10`; ctx.fill();
  }

  // swaying silhouettes along the top and bottom edges
  const kind = lv.kind;
  const row = (baseY: number, flip: boolean, n: number, size: number, color: string, speed: number) => {
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (W / n) + ((i * 37) % 23) - 11;
      const hgt = size * (0.75 + ((i * 53) % 10) / 20);
      const sway = Math.sin(t * speed + i * 1.3) * 0.06;
      ctx.save();
      ctx.translate(x, baseY);
      if (flip) ctx.scale(1, -1);
      ctx.transform(1, 0, sway, 1, 0, 0);   // shear = sway from the base
      ctx.fillStyle = color;
      ctx.beginPath();
      if (kind === 'pine') {
        for (let k = 0; k < 3; k++) {
          const w = hgt * (0.42 - k * 0.1), y0 = -hgt * k * 0.28;
          ctx.moveTo(-w, y0); ctx.lineTo(0, y0 - hgt * 0.5); ctx.lineTo(w, y0);
        }
      } else if (kind === 'spire') {
        ctx.moveTo(-hgt * 0.16, 0); ctx.lineTo(0, -hgt); ctx.lineTo(hgt * 0.16, 0);
      } else if (kind === 'cloud') {
        ctx.ellipse(0, 0, hgt * 0.5, hgt * 0.22, 0, Math.PI, 0);
        ctx.moveTo(hgt * 0.3, -hgt * 0.1); ctx.arc(0, -hgt * 0.1, hgt * 0.3, 0, Math.PI, true);
      } else {
        ctx.ellipse(0, 0, hgt * 0.5, hgt * 0.42, 0, Math.PI, 0);
      }
      ctx.fill();
      ctx.restore();
    }
  };
  row(H + 4, false, 9, 70, `${lv.floor}55`, 0.0011);
  row(-4, true, 7, 48, `${lv.floor}33`, 0.0009);

  // fireflies
  FIREFLIES.forEach((f, i) => {
    const x = f.x + Math.sin(t * f.sp + f.ph) * f.ax;
    const y = f.y + Math.cos(t * f.sp * 1.3 + f.ph) * f.ay;
    const a = 0.35 + 0.35 * Math.sin(t * 0.002 + i);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
    g.addColorStop(0, `rgba(253,230,138,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(253,230,138,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 9, y - 9, 18, 18);
  });
}


// Endless levels: the five mazes repeat, and each time round the
// corridor gets a little narrower (steadier hands needed) and the maze
// is mirrored so it never feels like the same walk twice.
function mazeFor(level: number) {
  const lap = Math.floor((level - 1) / LEVELS.length);
  return {
    maze: LEVELS[(level - 1) % LEVELS.length],
    corridor: Math.max(13, 28 - lap * 3),
    mirror: lap % 2 === 1,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MazeRunnerPage() {
  useAssessment();
  const router = useRouter();
  const { increment } = usePlayCount();

  const [phase, setPhase]           = useState<Phase>('intro');
  const [level, setLevel]           = useState(1);
  const [starCount, setStarCount]   = useState(0);
  const [earnedLight, setEarnedLight] = useState(0);
  const [started, setStarted]       = useState(false);
  const [drawing, setDrawing]       = useState(false);
  const [showReassess, setShowReassess] = useState(false);
  // Snapshot at mount, before this play could change it — used to trigger
  // a bigger, story-driven celebration the very first time any child ever
  // finishes a quest, since a new player's first win is the moment that
  // decides whether the app feels special enough to come back to.
  const [isFirstEver, setIsFirstEver] = useState(false);
  useEffect(() => { setIsFirstEver(loadRewards().starlight === 0); }, []);
  // snapshot values for levelcomplete display (avoids ref-in-render)
  const [snapStars, setSnapStars]   = useState(0);
  useEffect(() => { setLevel(nextGameLevel('fine-motor')); }, []);

  // Refs — canvas state, not needed for React renders
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const pathRef      = useRef<Pt[]>([]);
  const starPosRef   = useRef<Pt[]>([]);
  const charRef      = useRef<Pt|null>(null);
  const trailRef     = useRef<{x:number;y:number;ok:boolean}[]>([]);
  const collectedRef = useRef<Set<number>>(new Set());
  const touchesRef   = useRef(0);       // wall touches — measured, never punished
  const startedAtRef = useRef(0);
  const corridorRef  = useRef(28);
  const levelNumRef  = useRef(1);
  const lastHitRef   = useRef(0);
  const hitFlashRef  = useRef(false);
  const doneRef      = useRef(false);
  const levelRef     = useRef(LEVELS[0]);
  const animRef      = useRef(0);
  // Kailia on the canvas: a 5-frame run cycle while she follows the
  // finger, a standing pose (breathing) while she waits on GO
  const runImgsRef   = useRef<HTMLImageElement[]>([]);
  const standImgRef  = useRef<HTMLImageElement | null>(null);
  const shownRef     = useRef<Pt|null>(null);   // where Kailia is drawn (eases toward the finger)
  const facingRef    = useRef(1);               // 1 = facing right, -1 = left
  const lastStepRef  = useRef(0);
  const hopAtRef     = useRef(-1e9);            // when Kailia last hopped for a star
  const hintRef      = useRef<(Pt & { until: number }) | null>(null);
  const wallStreakRef = useRef(0);              // wall touches since the last star or hint

  // The friend runs the maze too: it trots along the path a few steps
  // behind Kailia (never on top of her, never ahead on the stars), cheers
  // for every star, wobbles when the light dims, and after two wall
  // touches runs back to the path to show the way. x, y = % of the canvas.
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [petPos, setPetPos] = useState({ x: 8, y: 50, flip: false });
  const [hinting, setHinting] = useState(false);
  const [noelLine, setNoelLine] = useState('');
  const [canvasW, setCanvasW] = useState(366);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { layer: burstLayer, fire } = useBursts();

  useEffect(() => {
    const load = (pose: Parameters<typeof characterArt>[1]) => {
      const img = new window.Image(); img.src = characterArt('kailia', pose); return img;
    };
    runImgsRef.current = (['run-1', 'run-2', 'run-3', 'run-4', 'run-5'] as const).map(load);
    standImgRef.current = load('portrait-right');
  }, []);

  // Sync levelRef in effect (not during render)
  const { maze: lv, corridor, mirror } = mazeFor(level);
  useEffect(() => { levelRef.current = lv; corridorRef.current = corridor; levelNumRef.current = level; }, [lv, corridor, level]);

  // ── Draw — reads everything from refs, empty deps = stable reference ──────────

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const lv   = levelRef.current;
    const CORRIDOR = corridorRef.current;
    const path = pathRef.current;
    const trail = trailRef.current;
    const still = typeof document !== 'undefined' && document.documentElement.dataset.reducedMotion === 'true';
    const now = performance.now();
    const t = still ? 0 : now;

    ctx.clearRect(0,0,W,H);
    drawScenery(ctx, lv, t);

    if (!path.length) return;

    // Outer halo
    ctx.beginPath(); tracePath(ctx,path);
    ctx.shadowBlur=12; ctx.shadowColor=lv.accent;
    ctx.strokeStyle=`${lv.accent}2a`; ctx.lineWidth=(CORRIDOR+10)*2;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke(); ctx.shadowBlur=0;

    // A soft light rim, so the path stands out from the dark scene
    ctx.beginPath(); tracePath(ctx,path);
    ctx.strokeStyle='rgba(255,246,220,0.55)'; ctx.lineWidth=(CORRIDOR+8)*2;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();

    // Wall border
    ctx.beginPath(); tracePath(ctx,path);
    ctx.strokeStyle=lv.wall; ctx.lineWidth=(CORRIDOR+6)*2;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();

    // Floor
    ctx.beginPath(); tracePath(ctx,path);
    ctx.strokeStyle=lv.floor; ctx.lineWidth=CORRIDOR*2;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();

    // Bright inner edge
    ctx.beginPath(); tracePath(ctx,path);
    ctx.strokeStyle=`${lv.accentDim}55`; ctx.lineWidth=(CORRIDOR-2)*2;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();

    // Centre floor
    ctx.beginPath(); tracePath(ctx,path);
    ctx.strokeStyle=lv.floor; ctx.lineWidth=(CORRIDOR-5)*2;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();

    // Start marker — a soft pulsing ring until the child starts
    const s=path[0];
    if (!charRef.current) {
      const r = 16 + Math.sin(t/260)*4;
      ctx.beginPath(); ctx.arc(s.x,s.y,r+6,0,Math.PI*2);
      ctx.strokeStyle='rgba(16,185,129,0.55)'; ctx.lineWidth=3; ctx.stroke();
    }
    ctx.shadowBlur=14; ctx.shadowColor='#10B981';
    ctx.beginPath(); ctx.arc(s.x,s.y,13,0,Math.PI*2); ctx.fillStyle='#10B981'; ctx.fill();
    ctx.shadowBlur=0; ctx.lineWidth=2.5; ctx.strokeStyle='#FFFBEA'; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('GO',s.x,s.y+0.5);
    ctx.textAlign='start'; ctx.textBaseline='alphabetic';

    // End marker: a glowing pad with a little waving flag
    const e=path[path.length-1];
    ctx.shadowBlur=14; ctx.shadowColor='#EC4899';
    ctx.beginPath(); ctx.arc(e.x,e.y,13+Math.sin(t/300)*1.5,0,Math.PI*2); ctx.fillStyle='#EC4899'; ctx.fill();
    ctx.shadowBlur=0; ctx.lineWidth=2.5; ctx.strokeStyle='#FFFBEA'; ctx.stroke();
    drawFlag(ctx, e.x, e.y, t);

    // The friend's hint: a soft ring on the path, just where to go back to
    const hint = hintRef.current;
    if (hint && now < hint.until) {
      const r = 18 + Math.sin(now/180)*4;
      ctx.beginPath(); ctx.arc(hint.x,hint.y,r,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,251,234,0.9)'; ctx.lineWidth=3; ctx.setLineDash([6,5]); ctx.stroke(); ctx.setLineDash([]);
    }

    // Stars
    starPosRef.current.forEach((sp,i)=>{
      if (collectedRef.current.has(i)) return;
      // stars bob and twinkle so they read as treasure, not decoration
      drawStar(ctx,sp.x,sp.y+Math.sin(t/380+i*2)*3,11+Math.sin(t/220+i)*1.6,'#FFD700');
    });

    // Trail
    for (let i=1;i<trail.length;i++) {
      const c=trail[i].ok?lv.accent:'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.moveTo(trail[i-1].x,trail[i-1].y); ctx.lineTo(trail[i].x,trail[i].y);
      ctx.shadowBlur=10; ctx.shadowColor=c; ctx.strokeStyle=c;
      ctx.lineWidth=4; ctx.lineCap='round'; ctx.stroke();
    }
    ctx.shadowBlur=0;

    // Kailia — stands on GO until the child starts, then runs after the
    // finger (eased, so she runs rather than teleports), flipping to face
    // the way she's heading. Standing still she breathes and bobs.
    const target = charRef.current ?? path[0];
    const shown = shownRef.current ?? { ...target };
    const dx = target.x - shown.x, dy = target.y - shown.y;
    shown.x += dx * 0.35; shown.y += dy * 0.35;
    shownRef.current = shown;
    if (Math.abs(dx) > 0.8) facingRef.current = dx > 0 ? 1 : -1;
    if (Math.hypot(dx, dy) > 1.2) lastStepRef.current = now;
    const running = now - lastStepRef.current < 140;
    const runImgs = runImgsRef.current;
    const img = running && runImgs.length ? runImgs[Math.floor(now / 85) % runImgs.length] : standImgRef.current;
    // soft ground shadow
    ctx.beginPath(); ctx.ellipse(shown.x, shown.y + 4, 14, 4.5, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (img && img.complete && img.naturalWidth) {
      const dh = running ? 60 : 66;
      const breathe = running ? 1 : 1 + Math.sin(t/420) * 0.025;
      // a happy hop when she grabs a star
      const hopP = (now - hopAtRef.current) / 420;
      const hop = hopP >= 0 && hopP < 1 ? -Math.sin(hopP * Math.PI) * 16 : 0;
      const bob = (running ? -Math.abs(Math.sin(now/85*Math.PI/2)) * 3 : Math.sin(t/700) * 1.5) + hop;
      const dw = dh * (img.naturalWidth / img.naturalHeight);
      ctx.save();
      ctx.translate(shown.x, shown.y + 4 + bob);
      ctx.scale(facingRef.current / breathe, breathe);
      // a warm light rim (not the maze color), so she pops on every maze
      ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(255,248,225,0.95)';
      ctx.drawImage(img, -dw/2, -dh, dw, dh);
      ctx.restore();
    } else {
      ctx.shadowBlur=24; ctx.shadowColor=lv.accent;
      ctx.beginPath(); ctx.arc(shown.x,shown.y,15,0,Math.PI*2); ctx.fillStyle=lv.accent; ctx.fill();
      ctx.shadowBlur=0;
    }

    // touching a wall just dims the light a moment — no red, no penalty
    if (hitFlashRef.current) { ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(0,0,W,H); }
  }, []); // stable — everything read from refs

  // ── Level setup ───────────────────────────────────────────────────────────────

  const initLevelRefs = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const lv   = levelRef.current;
    const raw  = lv.path(W,H);
    const path = mirror ? raw.map(p => ({ x: W - p.x, y: p.y })) : raw;
    pathRef.current    = path;
    starPosRef.current = lv.starFracs.map(f => {
      const i = Math.min(Math.floor(f*(path.length-1)), path.length-1);
      return path[i];
    });
    collectedRef.current = new Set();
    touchesRef.current   = 0;
    startedAtRef.current = Date.now();
    lastHitRef.current   = 0;
    hitFlashRef.current  = false;
    doneRef.current      = false;
    charRef.current      = null;
    shownRef.current     = null;
    trailRef.current     = [];
    hintRef.current      = null;
    wallStreakRef.current = 0;
    hopAtRef.current     = -1e9;
    setTimeout(drawCanvas, 30);
  }, [drawCanvas, mirror]);

  useEffect(() => {
    if (phase === 'playing') {
      /* eslint-disable react-hooks/set-state-in-effect */
      setStarCount(0); setStarted(false); setDrawing(false); setHinting(false);
      setNoelLine(TOUCH_LINE());
      /* eslint-enable react-hooks/set-state-in-effect */
      initLevelRefs();
    }
  }, [level, phase, initLevelRefs]);

  // Run the scene continuously while playing — fireflies drift, trees
  // sway, stars twinkle and Kailia breathes even when nobody is touching.
  useEffect(() => {
    if (phase !== 'playing') return;
    let id = 0;
    const loop = () => { drawCanvas(); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [phase, drawCanvas]);

  // the friend's size follows the canvas on screen, so it stays in
  // proportion to Kailia on a phone and on a big screen
  useEffect(() => {
    if (phase !== 'playing') return;
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setCanvasW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  // Where the friend may stand (feet, canvas px): never on Kailia (she is
  // drawn about 66 tall above her feet, the friend about 46), never on a
  // star the child still needs, and never off the edge.
  const spotIsFree = useCallback((q: Pt) => {
    const k = shownRef.current ?? pathRef.current[0];
    if (q.x < 22 || q.x > W - 22 || q.y < 50 || q.y > H - 4) return false;
    if (k && Math.abs(q.x - k.x) < 40 && q.y - 46 < k.y + 8 && q.y > k.y - 62) return false;
    return !starPosRef.current.some((sp, i) =>
      !collectedRef.current.has(i) && Math.abs(sp.x - q.x) < 28 && sp.y > q.y - 54 && sp.y < q.y + 10);
  }, []);

  // Where the friend goes: on the ground beside Kailia, on the side she
  // came from (so behind her on the path, or next to it on the way up or
  // down), or sitting just below GO before the run begins. During a hint
  // it holds its spot.
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const path = pathRef.current; if (!path.length) return;
      const hint = hintRef.current;
      if (hint && performance.now() < hint.until) return;
      if (hint) { hintRef.current = null; setHinting(false); }
      const k = shownRef.current ?? path[0];
      const back = -facingRef.current;
      const options: Pt[] = !charRef.current
        ? [{ x: path[0].x, y: path[0].y + 64 }]
        : [
            { x: k.x + back * 46, y: k.y + 4 }, { x: k.x - back * 46, y: k.y + 4 },
            { x: k.x + back * 46, y: k.y + 52 }, { x: k.x - back * 46, y: k.y + 52 },
            { x: k.x + back * 46, y: k.y - 40 }, { x: k.x - back * 46, y: k.y - 40 },
          ];
      const spot = options.find(spotIsFree) ?? options[0];
      const nx = (spot.x / W) * 100, ny = (spot.y / H) * 100;
      setPetPos(p => (Math.abs(p.x - nx) < 0.6 && Math.abs(p.y - ny) < 0.6 ? p : { x: nx, y: ny, flip: nx < p.x }));
    }, 220);
    return () => clearInterval(id);
  }, [phase, spotIsFree]);

  function tickle() {
    setPetMood('dance');
    chime.tap();
    setTimeout(() => setPetMood('idle'), 1300);
  }

  // after two wall touches a soft ring marks the nearest bit of path, and
  // the friend runs a little further along it ("this way!") and bounces
  // there, so the child can find the way back and on
  function friendHint(p: Pt) {
    const path = pathRef.current;
    let bi = 0, bd = Infinity;
    path.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; bi = i; } });
    const ring = path[bi];
    let spot: Pt | null = null;
    for (let j = bi; j < path.length; j++) {
      const q = { x: path[j].x, y: path[j].y + 10 };
      if (Math.hypot(path[j].x - ring.x, path[j].y - ring.y) >= 44 && spotIsFree(q)) { spot = q; break; }
    }
    hintRef.current = { ...ring, until: performance.now() + 2400 };
    setHinting(true);
    if (spot) {
      const s = spot;
      setPetPos(prev => ({ x: (s.x / W) * 100, y: (s.y / H) * 100, flip: (s.x / W) * 100 < prev.x }));
    }
    setNoelLine(`Back to the glowing ring! ${pet.name} shows the way.`);
  }
  // ── Input ─────────────────────────────────────────────────────────────────────

  const getPos = (e: React.MouseEvent|React.TouchEvent): Pt|null => {
    const c=canvasRef.current; if(!c) return null;
    const r=c.getBoundingClientRect();
    if('touches' in e){const t=e.touches[0];return{x:(t.clientX-r.left)*(W/r.width),y:(t.clientY-r.top)*(H/r.height)};}
    return{x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};
  };

  const onStart = (e: React.MouseEvent|React.TouchEvent) => {
    e.preventDefault();
    const p=getPos(e); if(!p) return;
    if (!started) setNoelLine('Nice and steady! Grab the stars on the way.');
    setStarted(true); setDrawing(true);
    charRef.current=p; drawCanvas();
  };

  const onMove = (e: React.MouseEvent|React.TouchEvent) => {
    if (!drawing || doneRef.current) return;
    e.preventDefault();
    const p=getPos(e); if(!p) return;

    const dist=closestOnPath(p,pathRef.current);
    const ok=dist<=corridorRef.current;
    trailRef.current=[...trailRef.current,{x:p.x,y:p.y,ok}];
    charRef.current=p;

    // Wall hit
    if (!ok) {
      const now=Date.now();
      if (now-lastHitRef.current>HIT_CD) {
        lastHitRef.current=now;
        touchesRef.current+=1;
        hitFlashRef.current=true;
        setTimeout(()=>{hitFlashRef.current=false; drawCanvas();},320);
        wallStreakRef.current+=1;
        setPetMood('oops');
        if (wallStreakRef.current>=2) { wallStreakRef.current=0; friendHint(p); }
      }
    }

    // Collect stars
    starPosRef.current.forEach((sp,i)=>{
      if(collectedRef.current.has(i)) return;
      if(Math.hypot(p.x-sp.x,p.y-sp.y)<COLLECT_R){
        collectedRef.current=new Set([...collectedRef.current,i]);
        setStarCount(c=>c+1);
        // a star: Kailia hops, the friend cheers, sparkles pop
        hopAtRef.current=performance.now();
        wallStreakRef.current=0;
        setPetMood('cheer');
        chime.good();
        fire((sp.x/W)*100,(sp.y/H)*100,['#FFE066','#FFFFFF','#FFD700'],12,46);
        setNoelLine(STAR_LINES[collectedRef.current.size % STAR_LINES.length]);
      }
    });

    // Reached end?
    const end=pathRef.current[pathRef.current.length-1];
    if (Math.hypot(p.x-end.x,p.y-end.y)<GOAL_R && !doneRef.current) {
      doneRef.current=true;
      const col=collectedRef.current.size;
      setSnapStars(col);
      const lvl=levelNumRef.current;
      logQuestMetric('fine motor','fine-motor',{
        level:lvl, corridorPx:corridorRef.current, wallTouches:touchesRef.current,
        starsCollected:col, totalMs:Date.now()-startedAtRef.current,
      });
      // ✨ effort floor: wall touches reduce the glow, never to zero
      const light=Math.max(10, 12+lvl*2+col*2-touchesRef.current);
      awardStarlight(light); setEarnedLight(light);
      recordGameLevel('fine-motor',lvl);
      if (lvl%LEVELS_PER_CHAPTER===0 && increment()%10===0) setShowReassess(true);
      hopAtRef.current=performance.now();
      setPetMood('cheer');
      chime.fanfare();
      fire((end.x/W)*100,(end.y/H)*100,['#FFE066','#FF9EC7','#FFFFFF','#8BE3FF'],16,70);
      setNoelLine('You made it to the flag!');
      drawCanvas();
      setTimeout(()=>setPhase('levelcomplete'),900);
      return;
    }

    drawCanvas();
  };

  const onStop = () => setDrawing(false);

  // ── Navigation ─────────────────────────────────────────────────────────────────

  const nextLevel  = () => { setLevel(l => l + 1); setPhase('playing'); };
  const retryLevel = () => setPhase('playing');
  const chapter    = chapterFor(level);

  // ─ Intro ──────────────────────────────────────────────────────────────────────
  // First quest of the whole adventure, so this is many players' very first
  // impression — Kailia, Noel and the friend open it together (matching the
  // story voice used everywhere else) instead of a bare title screen.
  if (phase==='intro') return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6"
      style={{background:'linear-gradient(135deg,#050f05,#020510)'}}>
      <div className="max-w-sm w-full text-center">
        <div className="flex items-end justify-center gap-1 mb-2">
          <PandaSprite size={104} expression="excited" className="float" style={{ animationDelay: '0.2s' }} />
          <KailiaSprite size={84} expression="excited" className="float" />
          <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 62)} kind="pet" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2" style={{textShadow:'0 0 20px #4ade80'}}>Maze Runner</h1>
        <div className="rounded-2xl px-4 py-3 mb-4 text-left" style={{background:'rgba(255,255,255,0.95)'}}>
          <p className="text-gray-900 text-base font-bold leading-snug">
            Ooh, the fireflies lost their way! Trace the glowing trail with your finger to the flag.
            Stay off the walls, and grab every star! {pet.name} will run along with Kailia.
          </p>
        </div>
        <LevelPath gameId="fine-motor" level={level} onPick={setLevel} />
        <p className="mt-3 mb-4 text-sm font-bold text-green-200">
          <span className="inline-block w-3 h-3 rounded-full align-middle mr-1.5" style={{ background: lv.accent, boxShadow: `0 0 8px ${lv.accent}` }} />
          Next up: {lv.name}{corridor < 28 ? ', a narrower path!' : ''}
        </p>
        <button onClick={()=>setPhase('playing')}
          className="px-10 py-4 rounded-full font-extrabold text-white text-xl transition-all hover:scale-105 active:scale-95"
          style={{background:'linear-gradient(135deg,#059669,#2563eb)',boxShadow:'0 0 30px rgba(74,222,128,0.35)'}}>
          <span className="whitespace-nowrap">Play level {level}</span>
        </button>
        <div className="mt-4">
          <Link href="/play" className="text-green-400 text-sm hover:text-green-200">← Back to the map</Link>
        </div>
        <SkillIntro gameId="fine-motor" />
      </div>
    </main>
  );

  // ─ Level complete ──────────────────────────────────────────────────────────────
  if (phase==='levelcomplete') {
    const earned=Math.max(1,snapStars);
    // A brand-new player's very first quest win gets a bigger celebration —
    // confetti and a story line — since this exact moment decides whether
    // the app feels worth coming back to.
    const bigWin = isFirstEver && level===1;
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-6 relative overflow-hidden"
        style={{background:`linear-gradient(135deg,${lv.floor},${lv.wall})`}}>
        {bigWin && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="absolute confetti-fall" style={{
                left: `${(i * 41) % 100}%`,
                top: -40,
                animationDelay: `${(i % 8) * 0.15}s`,
                animationDuration: `${2.2 + (i % 5) * 0.3}s`,
              }}>
                {i % 2 === 0
                  ? <StarIcon size={18 + (i % 3) * 7} />
                  : <span className="block rounded-full" style={{ width: 12 + (i % 3) * 3, height: 12 + (i % 3) * 3, background: ['#FF9EC7', '#8BE3FF', '#86EFAC'][i % 3], border: '2px solid #3b2416' }} />}
              </span>
            ))}
          </div>
        )}
        <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(115vh) rotate(360deg);opacity:0.9}} .confetti-fall{animation:confettiFall linear forwards}`}</style>
        <div className="max-w-sm w-full text-center relative bounce-in" style={{ zIndex: 2 }}>
          <div className="flex items-end justify-center gap-2 mb-4">
            <PandaSprite size={112} expression="celebrating" className="float" />
            <KailiaSprite size={88} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 80)} kind="pet" />
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-1 drop-shadow-lg">
            {bigWin ? 'You did it, Kailia!' : `Level ${level} complete!`}
          </h2>
          <p className="font-bold text-base mb-4 text-white/90">
            {bigWin ? `Level ${level} complete! Your very first quest: ${lv.name} conquered!` : `${lv.name} conquered! ${pet.name} is doing a happy dance.`}
          </p>
          {/* only the stars found are shown: something to celebrate, never a grade */}
          <div className="flex justify-center gap-3 mb-3">
            {Array.from({ length: earned }, (_, n) => (
              <span key={n} className="star-burst inline-block" style={{ animationDelay: `${n * 0.15}s`, filter: 'drop-shadow(0 0 10px #FFD700)' }}>
                <StarIcon size={48} />
              </span>
            ))}
          </div>
          <p className="text-yellow-300 font-extrabold text-lg mb-2"><StarIcon /> +{earnedLight} starlight</p>
          <p className="text-white/80 text-sm mb-6">{snapStars === 3 ? 'Every star! ' : ''}{chapter.name} path-finder!</p>
          {showReassess && <ReassessBanner onGo={()=>router.push('/assessment/games')} />}
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={retryLevel}
              className="px-6 py-3.5 rounded-full font-extrabold text-lg transition-all hover:scale-105"
              style={{border:'2px solid rgba(255,255,255,0.6)',color:'#FFFFFF',background:'rgba(255,255,255,0.12)'}}>
              <span className="whitespace-nowrap">Play again</span>
            </button>
            <button onClick={nextLevel}
              className="px-8 py-3.5 rounded-full font-extrabold text-lg shadow-xl transition-all hover:scale-105"
              style={{background:'white',color:'#14532d'}}>
              <span className="whitespace-nowrap">Level {level+1} ▶</span>
            </button>
            <Link href="/play"
              className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105 inline-block"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              <span className="whitespace-nowrap">Back to the map</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ─ Playing ─────────────────────────────────────────────────────────────────────
  const petH = Math.round(canvasW * (46 / W));
  return (
    <main className="min-h-screen px-3 py-4"
      style={{background:`linear-gradient(135deg,${lv.bg},${lv.wall})`}}>
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-3">
          <Link href="/play" className="font-bold text-sm hover:opacity-70" style={{color:lv.accent}}>← Map</Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.85)'}}>
            Lv {level}
          </span>
        </div>

        {/* HUD */}
        <div className="flex items-center justify-between mb-3 rounded-2xl px-4 py-2.5"
          style={{background:'rgba(0,0,0,0.35)',border:`1px solid ${lv.accent}30`}}>
          <span className="w-20" />
          <div className="text-center">
            <p className="text-white font-extrabold text-base leading-none">{lv.name}</p>
            <p className="text-xs mt-0.5" style={{color:lv.accent}}>{lv.tagline}</p>
          </div>
          <div className="flex gap-1 w-20 justify-end" aria-label={`${starCount} stars found`}>
            {[0,1,2].map(i=>(
              <span key={i} className={i < starCount ? 'star-burst inline-block' : 'inline-block'}
                style={{filter:i<starCount?'drop-shadow(0 0 6px #FFD700)':'grayscale(1) opacity(0.35)'}}>
                <StarIcon size={20} />
              </span>
            ))}
          </div>
        </div>

        {/* Canvas, with the friend and the sparkles laid over it */}
        <div ref={wrapRef} className="relative rounded-3xl overflow-hidden shadow-2xl mb-3"
          style={{border:`2px solid ${lv.accent}40`,touchAction:'none',boxShadow:`0 0 40px ${lv.accent}18`}}>
          <canvas ref={canvasRef} width={W} height={H}
            style={{width:'100%',height:'auto',display:'block',cursor:'crosshair'}}
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onStop} onMouseLeave={onStop}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onStop}/>
          {/* a warm light rim keeps the friend visible on the dark mazes; it
              can only be tickled while no one is tracing, so a passing
              finger or mouse never gets caught on it */}
          <div data-pet className="absolute inset-0 pointer-events-none"
            style={{ filter: 'drop-shadow(0 0 1.5px #FFF8E1) drop-shadow(0 0 5px rgba(255,240,200,0.55))' }}>
            <Actor art={pet.art} name={pet.name} x={petPos.x} y={petPos.y} h={petH}
              mood={hinting ? 'talk' : petMood} moodKey={petMoodKey} moveMs={hinting ? 700 : 420}
              flip={petPos.flip} onTap={drawing ? undefined : tickle} z={7} />
          </div>
          {burstLayer}
        </div>

        {/* Noel's guide bar */}
        <div className="flex items-center gap-3 rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
          <PandaSprite size={46} expression={hinting ? 'thinking' : started ? 'excited' : 'happy'} style={{ flexShrink: 0 }} />
          <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white">{noelLine}</div>
        </div>
      </div>
    </main>
  );
}
