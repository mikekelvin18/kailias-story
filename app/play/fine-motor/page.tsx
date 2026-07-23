'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import { usePlayCount } from '@/hooks/usePlayCount';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pt { x: number; y: number; }

interface Level {
  name: string;
  emoji: string;
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
    name: 'Forest Trail', emoji: '🌲', tagline: 'Follow the winding path through the trees!',
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
    name: 'Crystal Caves', emoji: '💎', tagline: 'Navigate the glittering tunnels!',
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
    name: "Dragon's Lair", emoji: '🐉', tagline: 'Brave the fiery tunnels without getting burned!',
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
    name: 'Sky Kingdom', emoji: '☁️', tagline: 'Soar through the clouds without falling!',
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
    name: "Wizard's Tower", emoji: '🔮', tagline: 'Master the ultimate maze!',
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

// ─── Reassessment banner (outside component to avoid lint error) ──────────────

function ReassessBanner({ onGo }: { onGo: () => void }) {
  return (
    <div className="rounded-2xl p-4 mb-4 text-center"
      style={{background:'rgba(245,158,11,0.15)',border:'2px solid rgba(245,158,11,0.5)'}}>
      <p className="text-yellow-300 font-bold text-sm mb-2">
        🎯 You&apos;ve played 10 games! Time for a quick check-up.
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

const CORRIDOR=28, W=600, H=320, MAX_LIVES=3, HIT_CD=650, COLLECT_R=26, GOAL_R=22;
type Phase='intro'|'playing'|'levelcomplete'|'gameover'|'done';

// ─── Component ────────────────────────────────────────────────────────────────

export default function MazeRunnerPage() {
  useAssessment();
  const router = useRouter();
  const { increment } = usePlayCount();

  const [phase, setPhase]           = useState<Phase>('intro');
  const [levelIdx, setLevelIdx]     = useState(0);
  const [lives, setLives]           = useState(MAX_LIVES);
  const [starCount, setStarCount]   = useState(0);
  const [levelStars, setLevelStars] = useState<number[]>([]);
  const [started, setStarted]       = useState(false);
  const [drawing, setDrawing]       = useState(false);
  const [showReassess, setShowReassess] = useState(false);
  // snapshot values for levelcomplete display (avoids ref-in-render)
  const [snapLives, setSnapLives]   = useState(MAX_LIVES);
  const [snapStars, setSnapStars]   = useState(0);

  // Refs — canvas state, not needed for React renders
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const pathRef      = useRef<Pt[]>([]);
  const starPosRef   = useRef<Pt[]>([]);
  const charRef      = useRef<Pt|null>(null);
  const trailRef     = useRef<{x:number;y:number;ok:boolean}[]>([]);
  const collectedRef = useRef<Set<number>>(new Set());
  const livesRef     = useRef(MAX_LIVES);
  const lastHitRef   = useRef(0);
  const hitFlashRef  = useRef(false);
  const doneRef      = useRef(false);
  const levelRef     = useRef(LEVELS[0]);
  const animRef      = useRef(0);
  const headImgRef   = useRef<HTMLImageElement | null>(null);

  // Load one of Kailia's running poses once — drawn into the maze player
  // token instead of a plain blank circle-face. The run frames are close
  // to square, so they drop into the round token without the tall
  // full-body portrait's squish/distortion.
  useEffect(() => {
    const img = new window.Image();
    img.src = '/characters/kailia/run-3.png';
    img.onload = () => { headImgRef.current = img; };
  }, []);

  // Sync levelRef in effect (not during render)
  useEffect(() => { levelRef.current = LEVELS[levelIdx]; }, [levelIdx]);

  // ── Draw — reads everything from refs, empty deps = stable reference ──────────

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const lv   = levelRef.current;
    const path = pathRef.current;
    const trail = trailRef.current;
    const char  = charRef.current;

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = lv.bg; ctx.fillRect(0,0,W,H);

    // Wall grid texture
    ctx.strokeStyle=`${lv.wall}ee`; ctx.lineWidth=1;
    for(let x=0;x<W;x+=22){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=22){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    if (!path.length) return;

    // Outer halo
    ctx.beginPath(); tracePath(ctx,path);
    ctx.shadowBlur=12; ctx.shadowColor=lv.accent;
    ctx.strokeStyle=`${lv.accent}2a`; ctx.lineWidth=(CORRIDOR+10)*2;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke(); ctx.shadowBlur=0;

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

    // Start marker
    const s=path[0];
    ctx.shadowBlur=14; ctx.shadowColor='#10B981';
    ctx.beginPath(); ctx.arc(s.x,s.y,11,0,Math.PI*2); ctx.fillStyle='#10B981'; ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('GO',s.x,s.y);

    // End marker
    const e=path[path.length-1];
    ctx.shadowBlur=14; ctx.shadowColor='#EC4899';
    ctx.beginPath(); ctx.arc(e.x,e.y,13,0,Math.PI*2); ctx.fillStyle='#EC4899'; ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif';
    ctx.fillText('END',e.x,e.y);
    ctx.textAlign='start'; ctx.textBaseline='alphabetic';

    // Stars
    starPosRef.current.forEach((sp,i)=>{
      if (collectedRef.current.has(i)) return;
      drawStar(ctx,sp.x,sp.y,11,'#FFD700');
    });

    // Trail
    for (let i=1;i<trail.length;i++) {
      const c=trail[i].ok?lv.accent:'#EF4444';
      ctx.beginPath(); ctx.moveTo(trail[i-1].x,trail[i-1].y); ctx.lineTo(trail[i].x,trail[i].y);
      ctx.shadowBlur=10; ctx.shadowColor=c; ctx.strokeStyle=c;
      ctx.lineWidth=4; ctx.lineCap='round'; ctx.stroke();
    }
    ctx.shadowBlur=0;

    // Character — the whole running pose, full size, instead of a blank
    // face or a tiny circle-cropped sliver of one
    if (char) {
      const head = headImgRef.current;
      if (head) {
        ctx.shadowBlur=18; ctx.shadowColor=lv.accent;
        const dh = 34, dw = dh * (head.naturalWidth / head.naturalHeight);
        ctx.drawImage(head, char.x - dw/2, char.y - dh/2 + 2, dw, dh);
        ctx.shadowBlur=0;
      } else {
        ctx.shadowBlur=24; ctx.shadowColor=lv.accent;
        ctx.beginPath(); ctx.arc(char.x,char.y,15,0,Math.PI*2); ctx.fillStyle=lv.accent; ctx.fill();
        ctx.shadowBlur=0;
        ctx.beginPath(); ctx.arc(char.x,char.y,8,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
      }
    }

    // Hit flash
    if (hitFlashRef.current) { ctx.fillStyle='rgba(239,68,68,0.28)'; ctx.fillRect(0,0,W,H); }
  }, []); // stable — everything read from refs

  // ── Level setup ───────────────────────────────────────────────────────────────

  const initLevelRefs = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const lv   = levelRef.current;
    const path = lv.path(W,H);
    pathRef.current    = path;
    starPosRef.current = lv.starFracs.map(f => {
      const i = Math.min(Math.floor(f*(path.length-1)), path.length-1);
      return path[i];
    });
    collectedRef.current = new Set();
    livesRef.current     = MAX_LIVES;
    lastHitRef.current   = 0;
    hitFlashRef.current  = false;
    doneRef.current      = false;
    charRef.current      = null;
    trailRef.current     = [];
    setTimeout(drawCanvas, 30);
  }, [drawCanvas]);

  useEffect(() => {
    if (phase === 'playing') {
      /* eslint-disable react-hooks/set-state-in-effect */
      setLives(MAX_LIVES); setStarCount(0); setStarted(false); setDrawing(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      initLevelRefs();
    }
  }, [levelIdx, phase, initLevelRefs]);

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
    setStarted(true); setDrawing(true);
    charRef.current=p; drawCanvas();
  };

  const onMove = useCallback((e: React.MouseEvent|React.TouchEvent) => {
    if (!drawing || doneRef.current) return;
    e.preventDefault();
    const p=getPos(e); if(!p) return;

    const dist=closestOnPath(p,pathRef.current);
    const ok=dist<=CORRIDOR;
    trailRef.current=[...trailRef.current,{x:p.x,y:p.y,ok}];
    charRef.current=p;

    // Wall hit
    if (!ok) {
      const now=Date.now();
      if (now-lastHitRef.current>HIT_CD) {
        lastHitRef.current=now;
        const nl=livesRef.current-1;
        livesRef.current=nl; setLives(nl);
        hitFlashRef.current=true;
        setTimeout(()=>{hitFlashRef.current=false; drawCanvas();},320);
        if (nl<=0){ doneRef.current=true; setTimeout(()=>setPhase('gameover'),250); }
      }
    }

    // Collect stars
    starPosRef.current.forEach((sp,i)=>{
      if(collectedRef.current.has(i)) return;
      if(Math.hypot(p.x-sp.x,p.y-sp.y)<COLLECT_R){
        collectedRef.current=new Set([...collectedRef.current,i]);
        setStarCount(c=>c+1);
      }
    });

    // Reached end?
    const end=pathRef.current[pathRef.current.length-1];
    if (Math.hypot(p.x-end.x,p.y-end.y)<GOAL_R && !doneRef.current) {
      doneRef.current=true;
      const col=collectedRef.current.size, lv=livesRef.current;
      const earned = col>=3&&lv>=2?3 : col>=2||lv>=2?2 : 1;
      setSnapStars(col); setSnapLives(lv);
      setLevelStars(prev=>[...prev,earned]);
      drawCanvas();
      setTimeout(()=>setPhase('levelcomplete'),300);
      return;
    }

    drawCanvas();
  }, [drawing, drawCanvas]);

  const onStop = () => setDrawing(false);

  // ── Navigation ─────────────────────────────────────────────────────────────────

  const nextLevel = () => {
    if (levelIdx+1>=LEVELS.length) {
      const count=increment();
      if (count%10===0) setShowReassess(true);
      setPhase('done');
    } else {
      setLevelIdx(i=>i+1);
      setPhase('playing');
    }
  };

  const retryLevel = () => { setLevelStars(p=>p.slice(0,-1)); setPhase('playing'); };
  const playAgain  = () => { setLevelIdx(0); setLevelStars([]); setPhase('intro'); };

  const lv         = LEVELS[levelIdx];
  const totalStars = levelStars.reduce((a,b)=>a+b,0);
  const maxStars   = LEVELS.length*3;

  // ─ Intro ──────────────────────────────────────────────────────────────────────
  if (phase==='intro') return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{background:'linear-gradient(135deg,#050f05,#020510)'}}>
      <div className="max-w-sm w-full text-center">
        <div className="text-8xl mb-3" style={{filter:'drop-shadow(0 0 28px #4ade80)'}}>🗺️</div>
        <h1 className="text-4xl font-extrabold text-white mb-2" style={{textShadow:'0 0 20px #4ade80'}}>Maze Runner</h1>
        <p className="text-green-300 text-sm mb-5">
          Guide your character through 5 magical mazes.<br/>Collect stars — don&apos;t hit the walls!
        </p>
        <div className="rounded-2xl p-4 mb-4 space-y-2"
          style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>
          {LEVELS.map((l,i)=>(
            <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded-xl"
              style={{background:'rgba(255,255,255,0.04)'}}>
              <span className="text-lg" style={{filter:`drop-shadow(0 0 5px ${l.accent})`}}>{l.emoji}</span>
              <span className="text-white font-semibold text-sm flex-1 text-left">{l.name}</span>
              <span className="text-yellow-300 opacity-25 text-xs">⭐⭐⭐</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-5 mb-5 text-xs text-green-300">
          <span>❤️ 3 lives per maze</span><span>⭐ Collect all 3 stars</span>
        </div>
        <button onClick={()=>setPhase('playing')}
          className="px-10 py-4 rounded-full font-extrabold text-white text-xl transition-all hover:scale-105 active:scale-95"
          style={{background:'linear-gradient(135deg,#059669,#2563eb)',boxShadow:'0 0 30px rgba(74,222,128,0.35)'}}>
          Enter Maze! 🗺️
        </button>
        <div className="mt-4">
          <Link href="/play" className="text-green-400 text-sm hover:text-green-200">← Back to Games</Link>
        </div>
      </div>
    </main>
  );

  // ─ Level complete ──────────────────────────────────────────────────────────────
  if (phase==='levelcomplete') {
    const earned=levelStars[levelStars.length-1]??1;
    const label=earned===3?'🏆 Perfect Run!':earned===2?'🎯 Level Clear!':'✅ You made it!';
    return (
      <main className="min-h-screen flex items-center justify-center px-4"
        style={{background:`linear-gradient(135deg,${lv.bg},${lv.wall})`}}>
        <div className="max-w-sm w-full text-center">
          <div className="text-7xl mb-3" style={{filter:`drop-shadow(0 0 22px ${lv.accent})`}}>{lv.emoji}</div>
          <h2 className="text-3xl font-extrabold text-white mb-1">{label}</h2>
          <p className="font-bold text-sm mb-5" style={{color:lv.accent}}>{lv.name} conquered!</p>
          <div className="flex justify-center gap-4 mb-4">
            {[1,2,3].map(n=>(
              <span key={n} className="text-5xl"
                style={{filter:n<=earned?'drop-shadow(0 0 14px #FFD700)':'grayscale(1) opacity(0.2)'}}>⭐</span>
            ))}
          </div>
          <div className="flex justify-center gap-6 mb-6 text-sm text-white">
            <span>Stars: <strong style={{color:'#FFD700'}}>{snapStars}/3</strong></span>
            <span>Lives left: <strong style={{color:'#EF4444'}}>{snapLives}/{MAX_LIVES}</strong></span>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={retryLevel}
              className="px-5 py-3 rounded-full font-bold text-sm transition-all hover:scale-105"
              style={{border:'2px solid rgba(255,255,255,0.25)',color:'rgba(255,255,255,0.7)',background:'transparent'}}>
              🔄 Try Again
            </button>
            <button onClick={nextLevel}
              className="px-6 py-3 rounded-full font-extrabold text-white text-sm transition-all hover:scale-105"
              style={{background:`linear-gradient(135deg,${lv.accent},#7C3AED)`}}>
              {levelIdx+1>=LEVELS.length?'🏆 Finish!':`Next: ${LEVELS[levelIdx+1].name} ${LEVELS[levelIdx+1].emoji}`}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─ Game over ───────────────────────────────────────────────────────────────────
  if (phase==='gameover') return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{background:'linear-gradient(135deg,#0f0202,#200808)'}}>
      <div className="max-w-sm w-full text-center">
        <div className="text-7xl mb-3">💔</div>
        <h2 className="text-3xl font-extrabold text-white mb-2">Out of lives!</h2>
        <p className="text-red-300 text-sm mb-6">
          You hit the walls too many times in <strong>{lv.name}</strong>.<br/>Take a breath and try again!
        </p>
        <button onClick={retryLevel}
          className="px-8 py-4 rounded-full font-extrabold text-white text-lg transition-all hover:scale-105"
          style={{background:'linear-gradient(135deg,#EF4444,#7C3AED)',boxShadow:'0 0 20px rgba(239,68,68,0.4)'}}>
          Try Again! 💪
        </button>
        <div className="mt-4">
          <Link href="/play" className="text-red-400 text-sm hover:text-red-200">← All Games</Link>
        </div>
      </div>
    </main>
  );

  // ─ Done ────────────────────────────────────────────────────────────────────────
  if (phase==='done') {
    const pct=totalStars/maxStars;
    const [title,medal]=pct===1?['Maze Champion!','🏆']:pct>=0.8?['Maze Master!','🌟']:pct>=0.6?['Pathfinder!','🗺️']:['Explorer!','🧭'];
    return (
      <main className="min-h-screen flex items-center justify-center px-4"
        style={{background:'linear-gradient(135deg,#050f05,#020510)'}}>
        <div className="max-w-sm w-full text-center">
          <div className="text-7xl mb-3">{medal}</div>
          <h1 className="text-3xl font-extrabold text-white mb-1">{title}</h1>
          <p className="text-green-300 text-sm mb-5">All 5 mazes conquered!</p>
          {showReassess && <ReassessBanner onGo={()=>router.push('/assessment/games')} />}
          <div className="rounded-3xl p-5 mb-5 shadow-xl" style={{background:'rgba(255,255,255,0.97)'}}>
            <p className="text-5xl font-extrabold text-green-600 mb-1">
              {totalStars}<span className="text-2xl text-gray-400">/{maxStars}</span>
            </p>
            <p className="text-gray-500 text-xs mb-3">total stars</p>
            <div className="h-2.5 rounded-full mb-4" style={{background:'#E5E7EB'}}>
              <div className="h-2.5 rounded-full transition-all duration-700"
                style={{width:`${(totalStars/maxStars)*100}%`,background:'linear-gradient(90deg,#059669,#2563eb)'}}/>
            </div>
            <div className="space-y-2">
              {LEVELS.map((l,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{l.emoji}</span>
                  <span className="text-gray-700 text-sm flex-1 text-left">{l.name}</span>
                  <span>
                    {'⭐'.repeat(levelStars[i]??0)}
                    <span style={{opacity:0.2}}>{'⭐'.repeat(3-(levelStars[i]??0))}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/play"
              className="px-5 py-3 rounded-full font-bold text-green-300 text-sm transition-all hover:scale-105"
              style={{border:'2px solid rgba(74,222,128,0.35)'}}>
              ← All Games
            </Link>
            <button onClick={playAgain}
              className="px-5 py-3 rounded-full font-extrabold text-white text-sm transition-all hover:scale-105"
              style={{background:'linear-gradient(135deg,#059669,#2563eb)'}}>
              Play Again 🔄
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─ Playing ─────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen px-4 py-5"
      style={{background:`linear-gradient(135deg,${lv.bg},${lv.wall})`}}>
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-3">
          <Link href="/play" className="font-bold text-sm hover:opacity-70" style={{color:lv.accent}}>← Games</Link>
          <div className="flex items-center gap-2">
            {LEVELS.map((_,i)=>(
              <span key={i} className="text-base transition-all"
                style={{opacity:i===levelIdx?1:i<levelIdx?0.85:0.22,
                  filter:i===levelIdx?`drop-shadow(0 0 7px ${lv.accent})`:'none'}}>
                {i<levelIdx?'✅':LEVELS[i].emoji}
              </span>
            ))}
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.8)'}}>
            {levelIdx+1}/{LEVELS.length}
          </span>
        </div>

        {/* HUD */}
        <div className="flex items-center justify-between mb-3 rounded-2xl px-4 py-2.5"
          style={{background:'rgba(0,0,0,0.35)',border:`1px solid ${lv.accent}30`}}>
          <div className="flex gap-1">
            {Array.from({length:MAX_LIVES},(_,i)=>(
              <span key={i} className="text-xl"
                style={{filter:i<lives?'drop-shadow(0 0 4px #EF4444)':'grayscale(1) opacity(0.25)'}}>❤️</span>
            ))}
          </div>
          <div className="text-center">
            <p className="text-white font-extrabold text-base leading-none">{lv.emoji} {lv.name}</p>
            <p className="text-xs mt-0.5" style={{color:lv.accent}}>{lv.tagline}</p>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i=>(
              <span key={i} className="text-xl"
                style={{filter:i<starCount?'drop-shadow(0 0 7px #FFD700)':'grayscale(1) opacity(0.25)'}}>⭐</span>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="rounded-3xl overflow-hidden shadow-2xl mb-3"
          style={{border:`2px solid ${lv.accent}40`,touchAction:'none',boxShadow:`0 0 40px ${lv.accent}18`}}>
          <canvas ref={canvasRef} width={W} height={H}
            style={{width:'100%',height:'auto',display:'block',cursor:'crosshair'}}
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onStop} onMouseLeave={onStop}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onStop}/>
        </div>

        {!started ? (
          <p className="text-center text-sm" style={{color:lv.accent}}>
            {'ontouchstart' in (typeof window!=='undefined'?window:{})
              ? '👆 Trace the path with your finger — collect all 3 ⭐!'
              : '🖱️ Click and drag through the maze — collect all 3 ⭐!'}
          </p>
        ) : (
          <p className="text-center text-xs opacity-60" style={{color:lv.accent}}>
            Stay inside the corridor — hit the wall and lose a ❤️
          </p>
        )}
      </div>
    </main>
  );
}
