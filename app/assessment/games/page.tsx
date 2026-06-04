'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import type { InputMethod, FineMotorSubScores } from '@/context/AssessmentContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  text: string;
  type: 'choice' | 'input';
  options?: { label: string; correct: boolean }[];
  correctAnswer?: string;
  points: { correct: number; partial?: number; wrong: number };
}

interface DomainGame {
  key: 'reading' | 'writing' | 'communication' | 'math';
  label: string;
  emoji: string;
  scenario: string;
  color: string;
  light: string;
  questions: Question[];
}

interface PathPoint { x: number; y: number; }
interface HeatmapPoint { x: number; y: number; inside: boolean; far: boolean; }

interface TraceResult {
  composite: number;   // 0-100, difficulty-adjusted
  accuracy: number;    // 0-100
  precision: number;   // 0-100
  smoothness: number;  // 0-100
  speed: number;       // 0-100
  liftPenalty: number; // 0-100
  domainScore: number; // 0-10 for overall stage calculation
}

interface RunningState {
  totalPoints: number;
  insidePoints: number;
  totalError: number;
  velocities: number[];
  liftCount: number;
  prevPoint: PathPoint | null;
  prevTimeMs: number;
}

// ─── Regular games (Reading, Communication, Math) ─────────────────────────────

const GAMES: DomainGame[] = [
  {
    key: 'reading', label: "Kailia's Treasure Hunt", emoji: '📖',
    scenario: 'Kailia is packing her backpack for a treasure hunt. Help her find the right things!',
    color: '#2563EB', light: '#EFF6FF',
    questions: [
      { text: 'Kailia found three things: an 🍎 apple, a ⚽ ball, and a 🐱 cat. Can you tap the BALL?', type: 'choice',
        options: [{ label: '🍎 Apple', correct: false }, { label: '⚽ Ball', correct: true }, { label: '🐱 Cat', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Which word starts with the same sound as "ball"?', type: 'choice',
        options: [{ label: '🦁 Lion', correct: false }, { label: '🦋 Butterfly', correct: true }, { label: '🐠 Fish', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Read this sentence: "The dog runs fast." What is the dog doing?', type: 'choice',
        options: [{ label: 'Sleeping 😴', correct: false }, { label: 'Running 🏃', correct: true }, { label: 'Eating 🍖', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia sees a sign that says STOP. What does it mean?', type: 'choice',
        options: [{ label: 'Go fast!', correct: false }, { label: "Don't move forward", correct: true }, { label: 'Turn around', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia reads: "The sky is blue. The grass is green." What color is the sky?', type: 'choice',
        options: [{ label: '🟢 Green', correct: false }, { label: '🔵 Blue', correct: true }, { label: '🟡 Yellow', correct: false }],
        points: { correct: 2, wrong: 0 } },
    ],
  },
  {
    key: 'communication', label: "Kailia's Talking Friend", emoji: '🗣️',
    scenario: "Kailia loves to chat! She has some questions for you. Help her understand the world.",
    color: '#7C3AED', light: '#F5F3FF',
    questions: [
      { text: 'Kailia shows you a picture of someone with tears on their face. How is this person feeling?', type: 'choice',
        options: [{ label: '😄 Happy', correct: false }, { label: '😢 Sad', correct: true }, { label: '😠 Angry', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia lost her backpack. What would you say to help her?', type: 'choice',
        options: [{ label: '"That\'s funny!"', correct: false }, { label: '"Where did you last see it? I can help you look!"', correct: true }, { label: '"I don\'t know."', correct: false }],
        points: { correct: 2, partial: 1, wrong: 0 } },
      { text: 'Put these in order: Kailia woke up. She ate breakfast. She went to school. What did she do SECOND?', type: 'choice',
        options: [{ label: 'Went to school 🏫', correct: false }, { label: 'Woke up 😴', correct: false }, { label: 'Ate breakfast 🥣', correct: true }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia says "I went to the park and I saw a..." Which ending makes the most sense?', type: 'choice',
        options: [{ label: 'flying car going to the moon', correct: false }, { label: 'puppy playing with a ball', correct: true }, { label: 'sandwich jumping', correct: false }],
        points: { correct: 2, partial: 1, wrong: 0 } },
      { text: "Kailia's friend says \"I feel scared.\" What's the kindest thing to do?", type: 'choice',
        options: [{ label: 'Laugh at them', correct: false }, { label: 'Walk away', correct: false }, { label: '"I\'m here for you. Do you want to talk?"', correct: true }],
        points: { correct: 2, wrong: 0 } },
    ],
  },
  {
    key: 'math', label: "Kailia's Cookie Quest", emoji: '🍪',
    scenario: "Kailia is sharing snacks with her friends! Help her count, add, and share fairly.",
    color: '#D97706', light: '#FFFBEB',
    questions: [
      { text: 'Kailia has these cookies: 🍪🍪🍪. How many cookies does she have?', type: 'choice',
        options: [{ label: '2', correct: false }, { label: '3', correct: true }, { label: '4', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia has 2 cookies 🍪🍪. She gets 3 more 🍪🍪🍪. How many does she have now?', type: 'choice',
        options: [{ label: '4', correct: false }, { label: '5', correct: true }, { label: '6', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia has 10 cookies. She eats 4. How many are left?', type: 'choice',
        options: [{ label: '5', correct: false }, { label: '6', correct: true }, { label: '7', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia shares 12 cookies equally among 3 friends (including herself). How many each?', type: 'choice',
        options: [{ label: '3', correct: true }, { label: '4', correct: false }, { label: '6', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia baked 2 trays of cookies. Each tray has 8 cookies. How many total?', type: 'choice',
        options: [{ label: '10', correct: false }, { label: '14', correct: false }, { label: '16', correct: true }],
        points: { correct: 2, wrong: 0 } },
    ],
  },
];

// ─── Grasp Patterns ───────────────────────────────────────────────────────────

const GRASP_PATTERNS = [
  { key: 'palmar',          emoji: '✊', label: 'Palmar / Fist Grip',    description: 'Whole hand wraps the pencil — thumb may fold over fingers', milestone: '~1–2 years',  color: '#EC4899' },
  { key: 'digital_pronate', emoji: '👇', label: 'Digital Pronate',       description: 'Fingers point downward, whole arm moves to draw',           milestone: '~2–3 years',  color: '#F97316' },
  { key: 'quadrupod',       emoji: '🖐️', label: 'Quadrupod (4 fingers)', description: '4 fingers on pencil with thumb, wrist starting to stabilise', milestone: '~3.5–4 yrs', color: '#F59E0B' },
  { key: 'immature_tripod', emoji: '🤌', label: 'Immature Tripod',       description: '3-finger hold but rests on ring finger — less precise',     milestone: '~4–5 years',  color: '#3B82F6' },
  { key: 'dynamic_tripod',  emoji: '✏️', label: 'Dynamic Tripod (mature)', description: 'Thumb, index & middle finger — precise wrist-driven movement', milestone: '~5–6+ yrs', color: '#059669' },
];

// ─── Fine Motor Scoring Helpers ───────────────────────────────────────────────

// Age-calibrated tolerance band width in canvas pixels (W=560)
function getToleranceWidth(age: number): number {
  if (age <= 3) return 40;
  if (age <= 5) return 28;
  if (age <= 7) return 20;
  if (age <= 9) return 14;
  return 10;
}

// Expected completion time in seconds for this path complexity
function getExpectedTime(age: number): number {
  if (age <= 5) return 12;
  if (age <= 7) return 10;
  if (age <= 9) return 8;
  return 6;
}

// Difficulty multiplier: straight=0, arc=0.5, S-curve=1
function getPathComplexity(age: number): number {
  if (age <= 7) return 0;
  if (age <= 10) return 0.5;
  return 1;
}

function getFineMotorStage(score: number) {
  if (score >= 85) return { stage: 'Precision Pro',  emoji: '🎯', description: 'Excellent pencil control and steady movement!',               color: '#059669' };
  if (score >= 70) return { stage: 'Pre-Writer',     emoji: '✏️', description: 'Great tracing — almost ready for letter writing!',           color: '#2563EB' };
  if (score >= 50) return { stage: 'Shape Master',   emoji: '⭐', description: 'Good effort — keep tracing and drawing every day.',          color: '#D97706' };
  if (score >= 25) return { stage: 'Pathfinder',     emoji: '🧭', description: 'Building those tracing skills — practice makes perfect!',   color: '#F59E0B' };
  return             { stage: 'Explorer',            emoji: '🌱', description: 'Just starting the fine motor journey — every trace counts!', color: '#EC4899' };
}

function getTargetPath(age: number, w: number, h: number): PathPoint[] {
  const pts: PathPoint[] = [];
  const steps = 200;
  if (age <= 7) {
    for (let i = 0; i <= steps; i++) {
      pts.push({ x: w * (0.1 + 0.8 * (i / steps)), y: h * 0.5 });
    }
  } else if (age <= 10) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push({ x: w * (0.1 + 0.8 * t), y: h * 0.5 - h * 0.28 * Math.sin(t * Math.PI) });
    }
  } else {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push({ x: w * (0.1 + 0.8 * t), y: h * 0.5 - h * 0.28 * Math.sin(t * 2 * Math.PI) });
    }
  }
  return pts;
}

// Point-to-segment distance
function distToSegment(p: PathPoint, a: PathPoint, b: PathPoint): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function distanceToPath(p: PathPoint, target: PathPoint[]): number {
  let min = Infinity;
  for (let i = 0; i < target.length - 1; i++) {
    const d = distToSegment(p, target[i], target[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

// ─── 5-Test Fine Motor Battery (Fine motor.rtf) ──────────────────────────────

const FM_WEIGHTS = { straight: 0.15, curves: 0.20, shapes: 0.25, maze: 0.25, dots: 0.15 } as const;

interface FMTestConfig {
  key: keyof typeof FM_WEIGHTS;
  name: string;
  emoji: string;
  hint: string;
  pathWidth: number;
  buildPath: (w: number, h: number) => PathPoint[];
  dotPositions?: (w: number, h: number) => PathPoint[];
}

const FM_TESTS: FMTestConfig[] = [
  {
    key: 'straight', name: 'Straight Line', emoji: '➡️',
    hint: 'Trace the dotted line from START to END!',
    pathWidth: 30,
    buildPath: (w, h) => Array.from({ length: 60 }, (_, i) => ({ x: w*0.1+w*0.8*(i/59), y: h*0.5 })),
  },
  {
    key: 'curves', name: 'Gentle Wave', emoji: '🌊',
    hint: 'Follow the wave path from START to END!',
    pathWidth: 20,
    buildPath: (w, h) => Array.from({ length: 80 }, (_, i) => {
      const t = i/79; return { x: w*0.1+w*0.8*t, y: h*0.5-h*0.3*Math.sin(t*Math.PI) };
    }),
  },
  {
    key: 'shapes', name: 'Circle', emoji: '⭕',
    hint: 'Trace all the way around the circle — full loop!',
    pathWidth: 20,
    buildPath: (w, h) => {
      const cx=w*0.5, cy=h*0.5, r=Math.min(h*0.37, w*0.17);
      return Array.from({ length: 120 }, (_, i) => {
        const a=(i/119)*Math.PI*2-Math.PI/2;
        return { x: cx+r*Math.cos(a), y: cy+r*Math.sin(a) };
      });
    },
  },
  {
    key: 'maze', name: 'Maze Path', emoji: '🧭',
    hint: 'Stay inside the narrow corridor — slow and steady!',
    pathWidth: 12,
    buildPath: (w, h) => {
      const pts: PathPoint[] = [];
      for (let i=0;i<=30;i++) pts.push({ x: w*0.08+w*0.34*(i/30), y: h*0.28 });
      for (let i=1;i<=20;i++) pts.push({ x: w*0.42, y: h*0.28+h*0.44*(i/20) });
      for (let i=1;i<=30;i++) pts.push({ x: w*0.42+w*0.50*(i/30), y: h*0.72 });
      return pts;
    },
  },
  {
    key: 'dots', name: 'Dot to Dot', emoji: '🎯',
    hint: 'Connect the numbered dots in order — 1 to 4!',
    pathWidth: 20,
    dotPositions: (w, h) => [
      { x: w*0.10, y: h*0.50 },
      { x: w*0.37, y: h*0.20 },
      { x: w*0.63, y: h*0.80 },
      { x: w*0.88, y: h*0.50 },
    ],
    buildPath: (w, h) => {
      const dots = [{ x:w*0.10,y:h*0.50 },{ x:w*0.37,y:h*0.20 },{ x:w*0.63,y:h*0.80 },{ x:w*0.88,y:h*0.50 }];
      const pts: PathPoint[] = [];
      for (let s=0;s<dots.length-1;s++) {
        const a=dots[s], b=dots[s+1];
        for (let i=0;i<=25;i++) { const t=i/25; pts.push({ x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t }); }
      }
      return pts;
    },
  },
];

// ─── Fine Motor Tracing Component (5-test battery) ────────────────────────────

function TracingGame({
  age,
  onComplete,
}: {
  age: number;
  onComplete: (result: TraceResult, method: InputMethod, grasp: string | null) => void;
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const targetRef    = useRef<PathPoint[]>([]);
  const heatmapRef   = useRef<HeatmapPoint[]>([]);
  const startTimeRef = useRef<number>(0);
  const runningRef   = useRef<RunningState>({
    totalPoints: 0, insidePoints: 0, totalError: 0,
    velocities: [], liftCount: 0, prevPoint: null, prevTimeMs: 0,
  });

  const [inputMethod, setInputMethod] = useState<InputMethod>(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [testIndex, setTestIndex]     = useState(0);
  const [allResults, setAllResults]   = useState<TraceResult[]>([]);
  const [drawing, setDrawing]         = useState(false);
  const [started, setStarted]         = useState(false);
  const [done, setDone]               = useState(false);
  const [testResult, setTestResult]   = useState<TraceResult | null>(null);
  const [showFinal, setShowFinal]     = useState(false);
  const [finalResult, setFinalResult] = useState<TraceResult | null>(null);
  const [graspKey, setGraspKey]       = useState<string | null>(null);

  const W = 560, H = 200;
  const currentTest = FM_TESTS[testIndex];

  useEffect(() => {
    const hasTouch = typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setInputMethod(hasTouch ? 'touch' : 'mouse');
  }, []);

  const drawCanvas = useCallback((heatmap: HeatmapPoint[], test: FMTestConfig) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const tw = test.pathWidth;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#F8F0FF'; ctx.fillRect(0, 0, W, H);
    const target = targetRef.current; if (!target.length) return;

    // Tolerance band
    ctx.save();
    ctx.beginPath(); target.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.strokeStyle='rgba(16,185,129,0.18)'; ctx.lineWidth=tw*2; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
    ctx.restore();

    // Dashed guide line
    ctx.save(); ctx.setLineDash([8,6]);
    ctx.beginPath(); target.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.strokeStyle='#C4B5FD'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.stroke(); ctx.restore();

    if (test.dotPositions) {
      // Numbered dot markers for dot-to-dot
      const dots = test.dotPositions(W, H);
      dots.forEach((d, i) => {
        ctx.beginPath(); ctx.arc(d.x, d.y, 14, 0, Math.PI*2);
        ctx.fillStyle = i===0?'#10B981':i===dots.length-1?'#EC4899':'#7C3AED'; ctx.fill();
        ctx.fillStyle='white'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(i+1), d.x, d.y); ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      });
    } else {
      ctx.beginPath(); ctx.arc(target[0].x,target[0].y,12,0,Math.PI*2); ctx.fillStyle='#10B981'; ctx.fill();
      ctx.beginPath(); ctx.arc(target[target.length-1].x,target[target.length-1].y,12,0,Math.PI*2); ctx.fillStyle='#EC4899'; ctx.fill();
      ctx.fillStyle='#10B981'; ctx.font='bold 13px sans-serif';
      ctx.fillText('START',target[0].x-18,target[0].y+28);
      ctx.fillStyle='#EC4899'; ctx.fillText('END',target[target.length-1].x-14,target[target.length-1].y+28);
    }

    // Heatmap trail
    for (let i=1;i<heatmap.length;i++) {
      ctx.beginPath(); ctx.moveTo(heatmap[i-1].x,heatmap[i-1].y); ctx.lineTo(heatmap[i].x,heatmap[i].y);
      ctx.strokeStyle=heatmap[i].inside?'#10B981':heatmap[i].far?'#EF4444':'#F59E0B';
      ctx.lineWidth=5; ctx.lineCap='round'; ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (confirmed && canvasRef.current) {
      targetRef.current = currentTest.buildPath(W, H);
      drawCanvas([], currentTest);
    }
  }, [confirmed, testIndex, drawCanvas, currentTest]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): PathPoint | null => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx=W/rect.width, sy=H/rect.height;
    if ('touches' in e) { const t=e.touches[0]; return { x:(t.clientX-rect.left)*sx, y:(t.clientY-rect.top)*sy }; }
    return { x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (done) return; e.preventDefault();
    const p = getPos(e); if (!p) return;
    if (!started) { startTimeRef.current=Date.now(); setStarted(true); }
    else { runningRef.current.liftCount++; runningRef.current.prevPoint=null; runningRef.current.prevTimeMs=0; }
    setDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing||done) return; e.preventDefault();
    const p = getPos(e); if (!p) return;
    const tw = currentTest.pathWidth;
    const d = targetRef.current.length>1 ? distanceToPath(p, targetRef.current) : Infinity;
    const inside=d<=tw, far=d>tw*3;
    heatmapRef.current=[...heatmapRef.current,{x:p.x,y:p.y,inside,far}];
    const rs=runningRef.current;
    rs.totalPoints++; if (inside) rs.insidePoints++; else rs.totalError+=d-tw;
    const now=Date.now();
    if (rs.prevPoint&&rs.prevTimeMs>0) {
      const dt=now-rs.prevTimeMs, dist=Math.hypot(p.x-rs.prevPoint.x,p.y-rs.prevPoint.y);
      if (dt>0&&dt<200) rs.velocities.push(dist/dt);
    }
    rs.prevPoint=p; rs.prevTimeMs=now;
    drawCanvas(heatmapRef.current, currentTest);
  };

  const endDraw = () => {
    if (!drawing) return; setDrawing(false); setDone(true);
    const rs=runningRef.current; const tw=currentTest.pathWidth;
    if (rs.totalPoints<5) { setTestResult({ composite:0,accuracy:0,precision:0,smoothness:0,speed:0,liftPenalty:100,domainScore:0 }); return; }
    const elapsed=Math.max(1,(Date.now()-startTimeRef.current)/1000);
    const accuracy=(rs.insidePoints/rs.totalPoints)*100;
    const avgError=rs.totalError/rs.totalPoints;
    const precision=Math.max(0,Math.min(100,100*(1-avgError/tw)));
    const vels=rs.velocities;
    const meanV=vels.length>0?vels.reduce((a,b)=>a+b,0)/vels.length:0;
    const stdV=vels.length>1?Math.sqrt(vels.reduce((a,b)=>a+(b-meanV)**2,0)/vels.length):0;
    const smoothness=Math.max(0,Math.min(100,100*(1-stdV/(meanV+0.001))));
    const speed=Math.min(100,100*getExpectedTime(age)/elapsed);
    const liftPenalty=Math.max(0,100-rs.liftCount*5);
    const raw=0.4*accuracy+0.2*precision+0.15*smoothness+0.15*speed+0.1*liftPenalty;
    const composite=Math.min(100,Math.round(raw));
    setTestResult({ composite, accuracy, precision, smoothness, speed, liftPenalty, domainScore:Math.round(composite/10) });
    drawCanvas(heatmapRef.current, currentTest);
  };

  const resetCurrentTest = () => {
    heatmapRef.current=[];
    runningRef.current={ totalPoints:0,insidePoints:0,totalError:0,velocities:[],liftCount:0,prevPoint:null,prevTimeMs:0 };
    setDone(false); setStarted(false); setTestResult(null);
  };

  const handleNextTest = () => {
    if (!testResult) return;
    const updated=[...allResults, testResult];
    setAllResults(updated);

    if (testIndex===FM_TESTS.length-1) {
      // All 5 done — weighted composite from Fine motor.rtf
      const keys: (keyof typeof FM_WEIGHTS)[]=['straight','curves','shapes','maze','dots'];
      const weighted=updated.reduce((sum,r,i)=>sum+r.composite*FM_WEIGHTS[keys[i]],0);
      const fc=Math.min(100,Math.round(weighted));
      const avg=(fn:(r:TraceResult)=>number)=>updated.reduce((s,r)=>s+fn(r),0)/updated.length;
      const fr: TraceResult={
        composite:fc,
        accuracy:Math.round(avg(r=>r.accuracy)),
        precision:Math.round(avg(r=>r.precision)),
        smoothness:Math.round(avg(r=>r.smoothness)),
        speed:Math.round(avg(r=>r.speed)),
        liftPenalty:Math.round(avg(r=>r.liftPenalty)),
        domainScore:Math.round(fc/10),
      };
      setFinalResult(fr);
      setShowFinal(true);
    } else {
      resetCurrentTest();
      setTestIndex(i=>i+1);
    }
  };

  if (!inputMethod) return null;

  // ── Step 1: Confirm input method ──
  if (!confirmed) {
    return (
      <div className="max-w-2xl w-full mx-auto px-4 py-10 text-center">
        <div className="rounded-3xl p-8 shadow-xl" style={{ background:'white', border:'3px solid #059669' }}>
          <span style={{ fontSize:56 }}>✍️</span>
          <h2 className="text-2xl font-extrabold text-gray-800 mt-3 mb-2">Fine Motor Assessment</h2>
          <p className="text-gray-500 mb-3">5 drawing tasks — straight line, wave, circle, maze, and dot-to-dot!</p>
          <div className="flex gap-3 justify-center mb-5">
            {FM_TESTS.map(t => <span key={t.key} className="text-2xl" title={t.name}>{t.emoji}</span>)}
          </div>
          <div className="rounded-2xl p-4 mb-5" style={{ background:'#ECFDF5', border:'2px solid #10B981' }}>
            <p className="font-bold text-green-800 text-lg mb-1">
              {inputMethod==='touch'?'👆 Touchscreen detected':'🖱️ Mouse detected'}
            </p>
            <p className="text-green-700 text-sm">
              {inputMethod==='touch'
                ?'Tracing with your finger gives the best results!'
                :"Using a mouse — results are still useful."}
            </p>
          </div>
          <div className="flex justify-center gap-3 mb-6">
            {(['touch','mouse'] as InputMethod[]).map(m=>(
              <button key={m!} onClick={()=>setInputMethod(m)}
                className="px-5 py-2 rounded-full font-bold text-sm transition-all hover:scale-105"
                style={{ background:inputMethod===m?'#059669':'#F3F4F6', color:inputMethod===m?'white':'#374151', border:'2px solid '+(inputMethod===m?'#059669':'#E5E7EB') }}>
                {m==='touch'?'👆 Touchscreen':'🖱️ Mouse'}
              </button>
            ))}
          </div>
          <button onClick={()=>setConfirmed(true)}
            className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg hover:scale-105 transition-all"
            style={{ background:'linear-gradient(135deg, #059669, #7C3AED)' }}>
            Start the 5 Tests! ✏️
          </button>
        </div>
      </div>
    );
  }

  // ── Final results screen (after all 5 tests) ──
  if (showFinal && finalResult) {
    const si=getFineMotorStage(finalResult.composite);
    return (
      <div className="max-w-2xl w-full mx-auto px-4 py-6">
        <div className="rounded-3xl p-6 shadow-xl" style={{ background:'white', border:`3px solid ${si.color}` }}>
          <div className="text-center mb-4">
            <span style={{ fontSize:52 }}>{si.emoji}</span>
            <h2 className="text-2xl font-extrabold mt-1" style={{ color:si.color }}>{si.stage}</h2>
            <p className="text-gray-500 text-sm mb-1">{si.description}</p>
            <p className="text-4xl font-extrabold" style={{ color:si.color }}>{finalResult.composite}%</p>
            <p className="text-xs text-gray-400">weighted score across all 5 tests</p>
          </div>

          {/* Per-test breakdown */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {FM_TESTS.map((t,i)=>(
              <div key={t.key} className="text-center p-2 rounded-xl" style={{ background:'#F9FAFB', border:'1.5px solid #E5E7EB' }}>
                <p className="text-xl">{t.emoji}</p>
                <p className="text-xs text-gray-400 font-semibold leading-tight">{t.name}</p>
                <p className="text-sm font-extrabold mt-0.5" style={{ color:si.color }}>{allResults[i]?.composite??0}%</p>
              </div>
            ))}
          </div>

          {/* Avg sub-score bars */}
          <div className="space-y-1.5 mb-4">
            {[
              { label:'Accuracy',   value:finalResult.accuracy,   color:'#10B981' },
              { label:'Smoothness', value:finalResult.smoothness, color:'#3B82F6' },
              { label:'Control',    value:finalResult.precision,  color:'#7C3AED' },
            ].map(s=>(
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600 font-semibold">{s.label}</span>
                  <span className="font-bold" style={{ color:s.color }}>{Math.round(s.value)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background:'#E5E7EB' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width:`${s.value}%`, background:s.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Grasp pattern selector */}
          <p className="text-center font-bold text-gray-700 text-sm mb-3">👀 Parent quick-check: Which grip does your child use?</p>
          <div className="space-y-2 mb-4">
            {GRASP_PATTERNS.map(gp=>(
              <button key={gp.key} onClick={()=>setGraspKey(gp.key)}
                className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.01]"
                style={{ background:graspKey===gp.key?`${gp.color}18`:'#F9FAFB', border:`2px solid ${graspKey===gp.key?gp.color:'#E5E7EB'}` }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize:26, flexShrink:0 }}>{gp.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{gp.label}</p>
                    <p className="text-gray-500 text-xs truncate">{gp.description}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white flex-shrink-0" style={{ background:gp.color }}>{gp.milestone}</span>
                </div>
              </button>
            ))}
            <button onClick={()=>setGraspKey('skip')}
              className="w-full text-center py-2 rounded-xl text-gray-400 text-sm transition-all"
              style={{ border:'2px dashed #E5E7EB', background:graspKey==='skip'?'#F3F4F6':'transparent' }}>
              Not sure / skip
            </button>
          </div>

          {graspKey && (
            <button onClick={()=>onComplete(finalResult, inputMethod!, graspKey==='skip'?null:graspKey)}
              className="w-full py-4 rounded-full font-extrabold text-xl text-white shadow-lg hover:scale-105 transition-all"
              style={{ background:`linear-gradient(135deg, ${si.color}, #EC4899)` }}>
              Next Game! 🚀
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Active test canvas ──
  const stageInfo = testResult ? getFineMotorStage(testResult.composite) : null;
  const zoneLabel = currentTest.pathWidth===30?'wide (easy)':currentTest.pathWidth===20?'medium':'narrow (hard)';

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-6">
      <div className="rounded-3xl p-6 shadow-xl" style={{ background:'white', border:'3px solid #059669' }}>

        {/* Test progress bar */}
        <div className="text-center mb-3">
          <p className="text-xs text-gray-400 mb-2">Test {testIndex+1} of {FM_TESTS.length}</p>
          <div className="flex gap-2 justify-center mb-2">
            {FM_TESTS.map((t,i)=>(
              <div key={t.key} className="flex flex-col items-center gap-1">
                <span style={{ fontSize:22, opacity:i<testIndex?0.45:1 }}>{t.emoji}</span>
                <div className="h-2 w-10 rounded-full transition-all"
                  style={{ background:i<testIndex?'#059669':i===testIndex?'#10B981':'#E5E7EB' }} />
              </div>
            ))}
          </div>
          <h2 className="text-xl font-extrabold text-gray-800">{currentTest.emoji} {currentTest.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{currentTest.hint}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {inputMethod==='touch'?'👆 Trace with your finger':'🖱️ Click and drag to trace'}
            {' · '}Zone: {zoneLabel}
          </p>
        </div>

        {/* Canvas */}
        <div className="rounded-2xl overflow-hidden border-2 border-purple-200 mb-3" style={{ touchAction:'none' }}>
          <canvas ref={canvasRef} width={W} height={H}
            style={{ width:'100%', height:'auto', display:'block', cursor:inputMethod==='mouse'?'crosshair':'default' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        </div>

        <div className="flex gap-4 text-xs text-gray-500 justify-center mb-3">
          <span>🟢 Inside zone</span><span>🟡 Slightly off</span><span>🔴 Far outside</span>
        </div>

        {/* Per-test result badge */}
        {done && testResult!==null && stageInfo && (
          <div className="rounded-2xl p-4 mb-4 bounce-in"
            style={{ background:`${stageInfo.color}10`, border:`2px solid ${stageInfo.color}` }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize:32 }}>{stageInfo.emoji}</span>
              <div className="flex-1">
                <p className="font-extrabold" style={{ color:stageInfo.color }}>{stageInfo.stage}</p>
                <p className="text-gray-500 text-xs">{currentTest.name} — test {testIndex+1} of {FM_TESTS.length}</p>
              </div>
              <p className="text-2xl font-extrabold" style={{ color:stageInfo.color }}>{testResult.composite}%</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          {done ? (
            <>
              <button onClick={()=>{ resetCurrentTest(); drawCanvas([], currentTest); }}
                className="px-6 py-3 rounded-full font-bold text-gray-600 border-2 border-gray-300 hover:scale-105 transition-all">
                🔄 Retry
              </button>
              {testResult!==null && (
                <button onClick={handleNextTest}
                  className="px-8 py-3 rounded-full font-extrabold text-white hover:scale-105 transition-all"
                  style={{ background:'linear-gradient(135deg, #059669, #7C3AED)' }}>
                  {testIndex===FM_TESTS.length-1
                    ? 'See Final Score! 🎉'
                    : `Next: ${FM_TESTS[testIndex+1].name} ${FM_TESTS[testIndex+1].emoji} →`}
                </button>
              )}
            </>
          ) : !started ? (
            <p className="text-gray-400 text-sm">
              {inputMethod==='touch'?'Tap and drag on the canvas above':'Click and drag on the canvas above'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Main Games Page ──────────────────────────────────────────────────────────

const ENCOURAGEMENTS = ['Great thinking! 🌟', "Kailia loves your answer! ✨", "You're amazing! 🎉", 'Keep it up, explorer! 🚀', 'Wonderful! 🌈'];

export default function GamesPage() {
  const { state, setDomainScore, setFineMotorInputMethod, setGraspPattern, setFineMotorSubScores } = useAssessment();
  const router = useRouter();

  const [gameStep, setGameStep]       = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedAnswer, setSelected] = useState<string | null>(null);
  const [inputValue, setInputValue]   = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [domainScore, setLocalScore]  = useState(0);
  const [encourage, setEncourage]     = useState('');

  // gameStep layout: 0=reading, 1=tracing, 2=communication, 3=math
  const regularGameIndex = gameStep < 1 ? gameStep : gameStep - 1;
  const isTracingStep = gameStep === 1;
  const totalSteps = 4;

  const game     = !isTracingStep ? GAMES[regularGameIndex] : null;
  const question = game ? game.questions[questionIdx] : null;
  const isLastQ  = game ? questionIdx === game.questions.length - 1 : false;
  const isLastStep = gameStep === totalSteps - 1;

  const getScore = (): number => {
    if (!question) return 0;
    if (question.type === 'choice') {
      return question.options?.find(o => o.label === selectedAnswer)?.correct
        ? question.points.correct : question.points.wrong;
    }
    if (question.type === 'input') {
      if (question.correctAnswer === '__name__') return inputValue.trim().length >= 1 ? question.points.correct : 0;
      return inputValue.trim().toLowerCase() === question.correctAnswer?.toLowerCase()
        ? question.points.correct : (question.points.partial ?? 0);
    }
    return 0;
  };

  const handleSubmit = () => {
    const s = getScore();
    setLocalScore(prev => prev + s);
    setEncourage(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (!game) return;
    const domainKey = game.key as 'reading' | 'writing' | 'communication' | 'math';
    if (isLastQ) {
      setDomainScore(domainKey, domainScore);
      if (isLastStep) { router.push('/results'); }
      else {
        setGameStep(s => s + 1);
        setQuestionIdx(0); setLocalScore(0);
        setSelected(null); setInputValue(''); setSubmitted(false); setEncourage('');
      }
    } else {
      setQuestionIdx(q => q + 1);
      setSelected(null); setInputValue(''); setSubmitted(false); setEncourage('');
    }
  };

  const handleTracingComplete = (result: TraceResult, method: InputMethod, grasp: string | null) => {
    setDomainScore('writing', result.domainScore);
    setFineMotorSubScores({
      composite: result.composite,
      accuracy: result.accuracy,
      precision: result.precision,
      smoothness: result.smoothness,
      speed: result.speed,
      liftPenalty: result.liftPenalty,
    } as FineMotorSubScores);
    setFineMotorInputMethod(method);
    if (grasp) setGraspPattern(grasp);
    setGameStep(2);
  };

  const stepLabels = ['📖 Reading', '✍️ Fine Motor', '🗣️ Communication', '🔢 Math'];

  if (isTracingStep) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start px-0 py-10" style={{ background: '#FFF9F0' }}>
        <div className="max-w-2xl w-full px-4">
          <div className="flex gap-2 mb-6">
            {stepLabels.map((l, i) => (
              <div key={i} className="flex-1 h-3 rounded-full transition-all"
                style={{ background: i <= gameStep ? '#059669' : '#E5E7EB' }} />
            ))}
          </div>
        </div>
        <TracingGame age={state.childAge ?? 8} onComplete={handleTracingComplete} />
        <p className="text-center text-gray-400 text-xs mt-4">Step {gameStep + 1} of {totalSteps}</p>
      </main>
    );
  }

  if (!game || !question) return null;

  const canSubmit = question.type === 'choice' ? !!selectedAnswer : inputValue.trim().length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10" style={{ background: '#FFF9F0' }}>
      <div className="max-w-2xl w-full">

        <div className="rounded-3xl p-5 mb-5 text-center shadow-lg"
          style={{ background: game.light, border: `3px solid ${game.color}` }}>
          <span style={{ fontSize: 44 }}>{game.emoji}</span>
          <h1 className="text-2xl font-extrabold mt-1" style={{ color: game.color }}>{game.label}</h1>
          <p className="text-gray-600 mt-1 text-sm">{game.scenario}</p>
        </div>

        <div className="flex gap-2 mb-3">
          {stepLabels.map((l, i) => (
            <div key={i} className="flex-1 h-3 rounded-full transition-all"
              style={{ background: i < gameStep ? game.color : i === gameStep ? `${game.color}88` : '#E5E7EB' }} />
          ))}
        </div>
        <div className="flex gap-1 mb-5">
          {game.questions.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i < questionIdx ? game.color : i === questionIdx ? `${game.color}66` : '#E5E7EB' }} />
          ))}
        </div>

        <div className="rounded-3xl p-8 shadow-xl mb-5 bounce-in" key={`${gameStep}-${questionIdx}`} style={{ background: 'white' }}>
          <div className="flex items-start gap-3 mb-5">
            <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-base"
              style={{ background: game.color }}>
              {questionIdx + 1}
            </span>
            <p className="text-gray-800 font-semibold text-lg leading-relaxed">{question.text}</p>
          </div>

          {question.type === 'choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((opt, i) => {
                const sel = selectedAnswer === opt.label;
                let bg = '#F9FAFB', border = '#E5E7EB', textCol = '#374151';
                if (sel && !submitted)  { bg = game.light; border = game.color; textCol = game.color; }
                if (submitted && opt.correct) { bg = '#D1FAE5'; border = '#059669'; textCol = '#065F46'; }
                if (submitted && sel && !opt.correct) { bg = '#FEE2E2'; border = '#DC2626'; textCol = '#991B1B'; }
                return (
                  <button key={i} onClick={() => !submitted && setSelected(opt.label)} disabled={submitted}
                    className="w-full text-left px-5 py-4 rounded-2xl font-semibold text-base transition-all hover:scale-[1.02]"
                    style={{ background: bg, border: `2px solid ${border}`, color: textCol }}>
                    {opt.label}
                    {submitted && opt.correct && ' ✅'}
                    {submitted && sel && !opt.correct && ' ❌'}
                  </button>
                );
              })}
            </div>
          )}

          {question.type === 'input' && (
            <input type="text" value={inputValue}
              onChange={e => !submitted && setInputValue(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full border-2 rounded-2xl px-5 py-3 text-lg text-gray-800 focus:outline-none transition-colors"
              style={{
                borderColor: submitted ? (getScore() > 0 ? '#059669' : '#DC2626') : game.color,
                background: submitted ? (getScore() > 0 ? '#D1FAE5' : '#FEE2E2') : game.light,
              }} />
          )}
        </div>

        {submitted && encourage && (
          <div className="rounded-2xl p-4 text-center mb-4 font-bold text-lg bounce-in"
            style={{ background: game.light, color: game.color }}>
            {encourage}
          </div>
        )}

        <div className="text-center">
          {!submitted ? (
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canSubmit ? `linear-gradient(135deg, ${game.color}, #EC4899)` : '#D1D5DB' }}>
              Check My Answer! 🎯
            </button>
          ) : (
            <button onClick={handleNext}
              className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${game.color}, #EC4899)` }}>
              {isLastQ && isLastStep ? 'See My Results! 🎉' : isLastQ ? 'Next Game! 🚀' : 'Next Question →'}
            </button>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          Step {gameStep + 1} of {totalSteps} • {stepLabels[gameStep]}
          {!isTracingStep && ` • Question ${questionIdx + 1}/${game.questions.length}`}
        </p>
      </div>
    </main>
  );
}
