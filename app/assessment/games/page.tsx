'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAssessment } from '@/context/AssessmentContext';
import type { InputMethod, FineMotorSubScores } from '@/context/AssessmentContext';
import StepGuide from '@/components/ui/StepGuide';
import type { Evidence, MilestoneDomain } from '@/lib/milestones';
import { fineMotorStage, TRACE_MEASURES, traceNextStep } from '@/lib/fineMotor';

// ─── Types ────────────────────────────────────────────────────────────────────

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

import { testing } from '@/lib/testHooks';
import { GAMES, BANK, QUESTIONS_PER_GAME, CHALLENGE_QS, CHALLENGE_STEPS, firstQuestion, nextChallenge, maxChallengeLen, nextPlacementQuestion } from '@/lib/placementBank';

// Noel's one-line "why" after a miss (Muse round 4), matched by how the
// question starts. Plain words a child can follow.
const WHY: [string, string][] = [
  ["Kailia found three things", "A ball is round and bounces, like ⚽."],
  ["Which word starts with the same sound as \"ball\"?", "Ball and butterfly both start with the \"b\" sound."],
  ["Read this sentence: \"The dog runs fast.\"", "\"Runs\" means the dog is running."],
  ["Kailia sees a sign that says STOP.", "STOP means stop: don't move forward."],
  ["Kailia reads: \"The sky is blue.", "The sentence says \"The sky is blue.\""],
  ["Kailia shows you a picture of someone with tears", "Tears usually mean someone feels sad."],
  ["Kailia lost her backpack.", "Asking where she saw it last, and offering to look, helps her find it."],
  ["Put these in order:", "First she woke up, second she ate breakfast, then she went to school."],
  ["Kailia says \"I went to the park and I saw a...\"", "You really can see a puppy playing at the park."],
  ["Kailia's friend says", "Staying close and listening helps a scared friend feel safe."],
  ["Kailia has these cookies: 🍪🍪🍪.", "Count them: one, two, three cookies."],
  ["Kailia has 2 cookies 🍪🍪. She gets 3 more", "2 and 3 more make 5."],
  ["Kailia has 10 cookies. She eats 4.", "10 take away 4 leaves 6."],
  ["Kailia shares 12 cookies equally", "12 shared by 3 friends is 4 each."],
  ["Kailia baked 2 trays of cookies.", "8 and 8 more make 16."],
  ["Which word says \"ship\"?", "\"Ship\" starts with \"sh\", like shh!"],
  ["Read: \"Mia was so unhappy", "\"Unhappy\" means not happy."],
  ["Read: \"Max grabbed his umbrella", "People take umbrellas and rain boots when it is rainy."],
  ["Read: \"Bees carry pollen", "Every sentence is about bees helping plants grow."],
  ["Read: \"During the race", "A heart \"like a drum\" means it was beating hard."],
  ["Read: \"Although Ana practiced", "\"Although\" means both are true: she practiced and still felt nervous."],
  ["Your friend says, \"I went to the beach!\"", "Asking about a favorite part gets them to tell you more."],
  ["Why is this joke funny?", "\"Dino-snore\" sounds like \"dinosaur\", and the dinosaur is snoring."],
  ["Kailia wants to explain to a little 3-year-old", "Little kids understand short, simple words best."],
  ["Noel says, \"It's raining cats and dogs!\"", "It's a saying that means it is raining very hard."],
  ["Kailia drops her ice cream", "She says \"great\", but she means the opposite: she is upset."],
  ["Kailia wants the class to plant a garden.", "A good reason shows how it helps everyone."],
  ["Which plate has MORE cookies?", "Plate A has 5 cookies and Plate B has only 2."],
  ["Kailia has 8 cookies and gets 6 more.", "8 and 6 more make 14."],
  ["Kailia baked 45 cookies on Monday", "45 and 28 more make 73."],
  ["There are 7 bags with 8 cookies", "7 groups of 8 make 56."],
  ["Which is the same amount as ½ of a pizza?", "Two quarters of a pizza is the same as one half."],
  ["Kailia makes 24 cookies a day for 6 days.", "24 six times makes 144."],
  ["What is 0.5 + 0.25?", "Half and a quarter make three quarters: 0.75."],
  ["For every 2 chocolate cookies", "10 chocolate is 5 groups of 2, so 5 groups of 3 sugar make 15."],
];
const whyFor = (text: string) => WHY.find(([k]) => text.startsWith(k))?.[1] ?? '';

// ─── Grasp Patterns ───────────────────────────────────────────────────────────

const GRASP_PATTERNS = [
  { key: 'palmar',          label: 'Palmar / Fist Grip',      description: 'A fist around the pencil, thumb on top. The whole arm moves.',      milestone: '~1–2 years',  color: '#EC4899' },
  { key: 'digital_pronate', label: 'Digital Pronate',          description: 'Palm faces down, pointer finger points along the pencil. The arm moves.',                milestone: '~2–3 years',  color: '#F97316' },
  { key: 'quadrupod',       label: 'Quadrupod (4 fingers)',    description: 'Thumb + 3 fingers touch the pencil (count 4 fingertips). The hand moves.',    milestone: '~3.5–4 yrs', color: '#F59E0B' },
  { key: 'immature_tripod', label: 'Immature Tripod',          description: 'Thumb + 2 fingers, but the thumb presses flat: no open circle. The hand moves.',          milestone: '~4–5 years',  color: '#3B82F6' },
  { key: 'dynamic_tripod',  label: 'Dynamic Tripod (mature)',  description: 'Thumb + 2 fingers make an open circle (an "O"). Only the fingers move.',   milestone: '~5–6+ yrs',  color: '#059669' },
];

// ─── Grasp Illustrations ──────────────────────────────────────────────────────
// Kelvin's cartoon picture of a child's hand in each grip
// (public/grasp/{key}.webp, cropped from his labelled originals), plus a
// dot for each finger on the pencil.

function GraspIllustration({ graspKey, color }: { graspKey: string; color: string }) {
  // Finger labels: T=thumb, 1=index, 2=middle, 3=ring, 4=pinky
  // Which fingers are actively on the pencil for each grip:
  const FINGER_MAP: Record<string, boolean[]> = {
    palmar:          [true,  true,  true,  true,  true ],
    digital_pronate: [true,  true,  true,  true,  true ],
    quadrupod:       [true,  true,  true,  true,  false],
    immature_tripod: [true,  true,  true,  false, false],
    dynamic_tripod:  [true,  true,  true,  false, false],
  };
  const active = FINGER_MAP[graspKey] ?? FINGER_MAP.dynamic_tripod;

  return (
    <div style={{ width: 88, flexShrink: 0 }}>
      <Image src={`/grasp/${graspKey}.webp`} alt="" width={88} height={88}
        style={{ width: 88, height: 88, borderRadius: 12, display: 'block', border: '1.5px solid #E5E7EB' }} />
      <div style={{ display: 'flex', gap: 2, marginTop: 4, justifyContent: 'center' }}>
        {['T', '1', '2', '3', '4'].map((lbl, i) => (
          <div key={lbl} style={{
            width: 16, height: 16, borderRadius: '50%',
            background: active[i] ? color : '#D1D5DB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 'bold', color: active[i] ? 'white' : '#9CA3AF',
          }}>{lbl}</div>
        ))}
      </div>
    </div>
  );
}

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

const getFineMotorStage = fineMotorStage;

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
    } else if (test.key === 'shapes') {
      // Circle is a loop — START and END are the same point, so only show START + direction cue
      ctx.beginPath(); ctx.arc(target[0].x, target[0].y, 12, 0, Math.PI*2);
      ctx.fillStyle='#10B981'; ctx.fill();
      ctx.fillStyle='#10B981'; ctx.font='bold 12px sans-serif';
      ctx.fillText('START', target[0].x + 16, target[0].y - 4);
      ctx.font='11px sans-serif'; ctx.fillStyle='#10B981';
      ctx.fillText('→ trace the whole circle!', target[0].x + 16, target[0].y + 14);
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
          <h2 className="text-2xl font-extrabold text-gray-800 mt-3 mb-2">Fine Motor Assessment ✏️</h2>
          <p className="text-gray-500 mb-3">5 drawing tasks — straight line, wave, circle, maze, and dot-to-dot! (v2)</p>
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
            <p className="text-xs text-gray-500">
              For grown-ups: all 5 traces combined, compared with what&apos;s typical at this age
              (the path is wider for younger children). About 70% and up is typical.
            </p>
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
              { key:'accuracy' as const,   value:finalResult.accuracy,   color:'#10B981' },
              { key:'smoothness' as const, value:finalResult.smoothness, color:'#3B82F6' },
              { key:'precision' as const,  value:finalResult.precision,  color:'#7C3AED' },
            ].map(s=>(
              <div key={s.key}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600 font-semibold">{TRACE_MEASURES[s.key].label}</span>
                  <span className="font-bold" style={{ color:s.color }}>{Math.round(s.value)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background:'#E5E7EB' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width:`${s.value}%`, background:s.color }} />
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{TRACE_MEASURES[s.key].what}</p>
              </div>
            ))}
            {(() => {
              const next = traceNextStep(finalResult);
              return next && (
                <p className="text-xs rounded-xl p-2.5 mt-2" style={{ background:'#F0FDF4', color:'#166534' }}>
                  <strong>Try next ({next.skill.toLowerCase()}):</strong> {next.tip}
                </p>
              );
            })()}
          </div>

          {/* Grasp pattern selector */}
          <p className="text-center font-bold text-gray-700 text-sm mb-3">👀 Parent quick-check: Which grip does your child use?</p>
          <div className="space-y-3 mb-4">
            {GRASP_PATTERNS.map(gp=>(
              // Picture + name in the tappable card; the "what to look for"
              // line sits outside it in plain text: beside it on wider
              // screens, under it on phones.
              <div key={gp.key} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                <button onClick={()=>setGraspKey(gp.key)}
                  className="w-full sm:w-72 flex-shrink-0 text-left p-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ background:graspKey===gp.key?`${gp.color}18`:'#F9FAFB', border:`2px solid ${graspKey===gp.key?gp.color:'#E5E7EB'}` }}>
                  <div className="flex items-center gap-3">
                    <GraspIllustration graspKey={gp.key} color={gp.color} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{gp.label}</p>
                      <span className="inline-block mt-1 text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background:gp.color }}>{gp.milestone}</span>
                    </div>
                  </div>
                </button>
                <p className="text-gray-700 text-sm sm:text-base leading-snug px-1 sm:px-0 sm:flex-1">{gp.description}</p>
              </div>
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

// Contingent feedback: a right answer is celebrated, a miss gets warm
// effort praise and a nudge on. Never "wrong", never the same words for both.
const ENCOURAGEMENTS = ['Yes! You got it! 🌟', 'That\'s it! Kailia cheers! ✨', 'Spot on, explorer! 🎉', 'You figured it out! 🚀', 'Exactly right! 🌈'];
const GOOD_TRIES = ['Good try! Let\'s keep going together. 🐼', 'Nice thinking! On to the next one. 🌱', 'Thanks for trying! Noel is proud of you. 💛'];

// Pencil grip as evidence: each grip is a rung on the classic grasp
// progression (age most children use it by). A child using grip N "passes"
// every rung up to N and hasn't reached the next one yet.
const GRIP_MONTHS: [string, number][] = [
  ['palmar', 18], ['digital_pronate', 36], ['quadrupod', 48], ['immature_tripod', 60], ['dynamic_tripod', 72],
];
function gripEvidence(grip: string | null): Evidence[] {
  const at = GRIP_MONTHS.findIndex(([k]) => k === grip);
  if (at < 0) return [];
  const ev: Evidence[] = GRIP_MONTHS.slice(0, at + 1).map(([k, m]) => ({ id: `grip-${k}`, months: m, r: 1, kind: 'observed' }));
  // A quadrupod is a functional mature variant for many children (Schwellnus
  // et al., 2012), so it isn't counted as "not yet" for the tripod.
  const next = GRIP_MONTHS[at + 1];
  if (next && grip !== 'quadrupod') ev.push({ id: `grip-${next[0]}`, months: next[1], r: 0, kind: 'observed' });
  return ev;
}

export default function GamesPage() {
  const { state, loaded, chronoMonths, setDomainScore, setDomainEvidence, setChallengeRound, setPlacementRun, setFineMotorInputMethod, setGraspPattern, setFineMotorSubScores, completeAssessment } = useAssessment();
  const router = useRouter();
  const age = chronoMonths ?? (state.childAge ?? 8) * 12;

  const [gameStep, setGameStep]       = useState(0);
  const [asked, setAsked]             = useState<number[]>(() => [firstQuestion(BANK[GAMES[0].key], age)]);
  const [evidence, setEvidence]       = useState<Evidence[]>([]);
  const [selectedAnswer, setSelected] = useState<string | null>(null);
  const [inputValue, setInputValue]   = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [encourage, setEncourage]     = useState('');
  // After a miss the child may try once more, just for practice: only the
  // first answer is measured (a retry would change what the check measures).
  const [retrying, setRetrying]       = useState(false);
  const [retried, setRetried]         = useState(false);
  const [missed, setMissed]           = useState(false);

  // 'unknown' for one tick while the address is read (no flash of the
  // normal placement when a grown-up opened the Challenge round).
  const [mode, setMode] = useState<'unknown' | 'normal' | 'challenge'>('unknown');
  /** First unfinished game after a break (4 = all four games done), or null. */
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  /** A challenge round left part way, offered to carry on (Muse round 5). */
  const [challengeResume, setChallengeResume] = useState<{ step: number; asked: number[]; evidence: Evidence[] } | null>(null);
  const challenge = mode === 'challenge';
  /** Placement items already answered in this area (never asked again in the challenge). */
  const placedIdx = (key: string) => (state.evidence?.[key as MilestoneDomain] ?? [])
    .filter(e => e.id.startsWith(`${key}-`)).map(e => Number(e.id.split('-').pop()));

  // gameStep layout: 0=reading, 1=tracing, 2=communication, 3=math
  const regularGameIndex = gameStep < 1 ? gameStep : gameStep - 1;
  const isTracingStep = gameStep === 1;
  const totalSteps = 4;

  const game     = !isTracingStep ? GAMES[regularGameIndex] : null;
  const bank     = game ? BANK[game.key] : [];
  const cur      = asked[asked.length - 1];
  const question = game ? bank[cur] : null;
  const questionIdx = asked.length - 1;
  const isLastQ  = challenge
    ? asked.length >= CHALLENGE_QS || (!!game && submitted
      && nextChallenge(bank, age, placedIdx(game.key), asked, cur, evidence[evidence.length - 1]?.r === 1) == null)
    : asked.length >= Math.min(QUESTIONS_PER_GAME, bank.length);
  const isLastStep = gameStep === totalSteps - 1;
  /** Challenge areas that have harder questions for this child (others are skipped). */
  const liveChallengeSteps = CHALLENGE_STEPS.filter(st => {
    const key = GAMES[st < 1 ? st : st - 1].key;
    return nextChallenge(BANK[key], age, placedIdx(key), [], -1, true) != null;
  });
  const isLastChallengeGame = liveChallengeSteps[liveChallengeSteps.length - 1] === gameStep;
  /** Honest question count for this challenge area (Muse round 5: it said
   *  "1/4" when the area ended after one question). Once the answer is in
   *  and the area ends, the count is exactly the questions asked. */
  const challengeTotal = !challenge || !game ? 0
    : submitted && isLastQ ? asked.length
    : Math.max(asked.length, maxChallengeLen(bank, age, placedIdx(game.key), asked));

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
    if (!game || !question) return;
    const r = getScore() >= question.points.correct ? 1 : 0;
    if (retrying) {
      // practice try: celebrated, never recorded
      const rightOpt = question.options?.find(o => o.correct);
      setEncourage(r === 1 ? 'You got it! ⭐ Great learning!' : `Good trying! The answer is "${rightOpt?.label ?? ''}". ${whyFor(question.text)}`);
      setRetrying(false); setRetried(true); setMissed(r === 0);
      setSubmitted(true);
      return;
    }
    const entry: Evidence = { id: `${challenge ? 'challenge-' : ''}${game.key}-${cur}`, months: question.months, r, kind: 'choice3' };
    setEvidence(ev => [...ev, entry]);
    // the challenge saves every answer, so leaving part way can carry on
    if (challenge) setChallengeRound({ step: gameStep, asked, evidence: [...evidence, entry] });
    // every placement answer is saved too, so leaving after one question
    // carries on from there (Muse round 7: it restarted at Question 1)
    else setPlacementRun({ step: gameStep, asked, evidence: [...evidence, entry] });
    const pool = r === 1 ? ENCOURAGEMENTS : GOOD_TRIES;
    let line = pool[Math.floor(Math.random() * pool.length)];
    // A miss gets a gentle "here's the one Kailia picked" so the child
    // learns something, never a red X (and no retry: a retry would change
    // what the check measures).
    const rightOpt = question.options?.find(o => o.correct);
    // Muse retest #3: clearly different from praise, and honest about the answer.
    if (r === 0 && rightOpt) line = `Nice try! Noel shows you: the answer is "${rightOpt.label}". ${whyFor(question.text)} 🐼`;
    setMissed(r === 0);
    setEncourage(line);
    setSubmitted(true);
  };

  const resetQuestion = () => { setSelected(null); setInputValue(''); setSubmitted(false); setEncourage(''); setRetrying(false); setRetried(false); setMissed(false); };
  const tryAgain = () => { setSelected(null); setInputValue(''); setSubmitted(false); setEncourage(''); setRetrying(true); };

  const startGame = (step: number) => {
    setGameStep(step);
    setEvidence([]);
    const g = step === 1 ? null : GAMES[step < 1 ? step : step - 1];
    setAsked(g ? [firstQuestion(BANK[g.key], age)] : []);
    resetQuestion();
  };

  /** First challenge area at or after `from` that has a question to ask; else back to results. */
  const startChallenge = (from: number) => {
    for (const step of CHALLENGE_STEPS.filter(st => st >= from)) {
      const key = GAMES[step < 1 ? step : step - 1].key;
      const first = nextChallenge(BANK[key], age, placedIdx(key), [], -1, true);
      if (first != null) {
        setGameStep(step); setEvidence([]); setAsked([first]); resetQuestion();
        setChallengeRound({ step, asked: [first], evidence: [] });
        return;
      }
    }
    setChallengeRound(null);
    router.push('/results');
  };

  useEffect(() => {
    if (!loaded || mode !== 'unknown') return;
    const wants = new URLSearchParams(window.location.search).get('challenge') === '1';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the address once, after the profile loads
    setMode(wants ? 'challenge' : 'normal');
    // a challenge left part way: offer to carry on (Muse round 5)
    if (wants && state.challengeRound && (state.challengeRound.evidence.length > 0 || state.challengeRound.step > 0)) setChallengeResume(state.challengeRound);
    else if (wants) startChallenge(0);
    else {
      setAsked([firstQuestion(BANK[GAMES[0].key], age)]);
      // Came back after a break (Muse round 4): offer to pick up where the
      // child stopped. Each finished game saved its answers already.
      if (!state.assessmentCompleted) {
        const order: MilestoneDomain[] = ['reading', 'writing', 'communication', 'math'];
        const done = order.map(d => (state.evidence?.[d]?.length ?? 0) > 0);
        const at = done.every(Boolean) ? 4 : done.indexOf(false);
        // a game left part way (Muse round 7) counts as a spot to come back to
        const run = state.placementRun;
        const midGame = !!run && run.step === at && run.evidence.length > 0;
        if (done.some(Boolean) || midGame) setResumeAt(at);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // A child acing everything above their age gets up to 2 extra rungs to find their ceiling.
  const aceExtra = evidence.length >= QUESTIONS_PER_GAME && evidence.filter(e => e.months >= age).every(e => e.r === 1)
    && evidence.some(e => e.months >= age) && asked.length < QUESTIONS_PER_GAME + 2;
  /** The question that comes next in this (normal) placement game, or null when it ends. */
  const plannedNext = (): number | null => {
    if (!game) return null;
    // the same rule the automatic checks use (lib/placementBank.ts): six
    // questions, plus up to two extra rungs for a child who aced everything
    // above their age
    return nextPlacementQuestion(bank, evidence.map((e, i) => ({ idx: asked[i], right: e.r === 1, months: e.months })), age);
  };
  // The counter always says the same number (Muse round 7: the dashes said
  // "6 of 6" while the footer said "/8"). Every game is 6 questions; a child
  // who aced everything above their age may then get up to 2 BONUS questions,
  // counted on their own ("Bonus question 1"), never stretching the 6.
  void aceExtra;
  const mainTotal = Math.min(bank.length, QUESTIONS_PER_GAME);
  const bonusIdx = questionIdx + 1 - mainTotal; // 1, 2 on a bonus question; else ≤ 0
  const shownTotal = mainTotal;

  const handleNext = () => {
    if (!game) return;
    const domainKey = game.key as 'reading' | 'communication' | 'math';
    if (challenge) {
      const last = evidence[evidence.length - 1];
      const next = isLastQ ? null : nextChallenge(bank, age, placedIdx(game.key), asked, cur, last?.r === 1);
      if (next != null) {
        setAsked(a => [...a, next]); resetQuestion();
        setChallengeRound({ step: gameStep, asked: [...asked, next], evidence });
        return;
      }
      // Keep the placement answers; a new challenge replaces an older one.
      const kept = (state.evidence?.[domainKey] ?? []).filter(e => !e.id.startsWith('challenge-'));
      setDomainEvidence(domainKey, [...kept, ...evidence]);
      startChallenge(gameStep + 1);
      return;
    }
    const next = plannedNext();
    if (next == null) {
      setDomainEvidence(domainKey, evidence);
      setPlacementRun(null);
      // Legacy 0–10 score (share right) — still drives the stage name and the bars.
      setDomainScore(domainKey, Math.round((evidence.reduce((t, e) => t + e.r, 0) / Math.max(1, evidence.length)) * 10));
      // Then a few attention / memory questions for the grown-up (checklist page, processing only).
      if (isLastStep) router.push('/assessment/checklist');
      else startGame(gameStep + 1);
    } else {
      setAsked(a => [...a, next]);
      setPlacementRun({ step: gameStep, asked: [...asked, next], evidence });
      resetQuestion();
    }
  };

  const handleTracingComplete = (result: TraceResult, method: InputMethod, grasp: string | null) => {
    setDomainScore('writing', result.domainScore);
    // Tracing is scored against an age-calibrated path width, so a strong
    // trace means "at least age-level control"; the grip adds rungs below.
    const trace: Evidence = { id: 'trace', months: age, r: result.composite >= 70 ? 1 : result.composite >= 45 ? 0.5 : 0, kind: 'observed' };
    setDomainEvidence('writing', [trace, ...gripEvidence(grasp)]);
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
    startGame(2);
  };

  const stepLabels = ['📖 Reading', '✍️ Fine Motor', '🗣️ Communication', '🔢 Math'];

  if (challengeResume) {
    const areaNames: Record<number, string> = { 0: 'reading', 2: 'talking', 3: 'counting' };
    const carryOn = () => {
      const r = challengeResume; setChallengeResume(null);
      setGameStep(r.step); setAsked(r.asked); setEvidence(r.evidence); resetQuestion();
      // the last question was already answered: show it answered, ready for Next
      if (r.evidence.length >= r.asked.length && r.asked.length) { setSubmitted(true); setEncourage('Welcome back! Tap below to keep going. ⭐'); }
    };
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: '#FFF9F0' }}>
        <div data-challenge-resume className="max-w-md w-full rounded-3xl p-8 shadow-xl text-center bg-white">
          <p className="text-5xl mb-2" aria-hidden="true">🐼</p>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Welcome back!</h1>
          <p className="text-gray-600 mb-6">
            Noel saved your spot in the challenge round: the {areaNames[challengeResume.step] ?? 'next'} questions
            {challengeResume.evidence.length ? `, ${challengeResume.evidence.length} answered so far` : ''}.
          </p>
          <button onClick={carryOn}
            className="w-full px-8 py-4 rounded-full font-extrabold text-xl text-white shadow-lg mb-3"
            style={{ background: 'linear-gradient(135deg, #059669, #7C3AED)' }}>
            Carry on →
          </button>
          <button onClick={() => { setChallengeResume(null); startChallenge(0); }} className="text-sm font-bold text-gray-500 underline">
            Start the challenge over
          </button>
        </div>
      </main>
    );
  }

  if (resumeAt !== null) {
    const names = ['the reading game', 'the tracing game', 'the talking game', 'the counting game'];
    const midRun = state.placementRun && state.placementRun.step === resumeAt && state.placementRun.evidence.length > 0 ? state.placementRun : null;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: '#FFF9F0' }}>
        <div className="max-w-md w-full rounded-3xl p-8 shadow-xl text-center bg-white">
          <p className="text-5xl mb-2" aria-hidden="true">🐼</p>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Welcome back!</h1>
          <p data-placement-resume className="text-gray-600 mb-6">
            Noel saved your spot. {resumeAt >= 4
              ? 'All four games are done, just the grown-up questions are left.'
              : midRun
                ? `${resumeAt} of 4 games are done. You were on question ${midRun.asked.length} of ${names[resumeAt]}.`
                : `${resumeAt} of 4 games are done. Next up: ${names[resumeAt]}.`}
          </p>
          <button onClick={() => {
              const at = resumeAt; setResumeAt(null);
              if (at >= 4) { router.push('/assessment/checklist'); return; }
              if (midRun) {
                // back on the very question the child left: answered ones stay answered
                setGameStep(midRun.step); setAsked(midRun.asked); setEvidence(midRun.evidence); resetQuestion();
                if (midRun.evidence.length >= midRun.asked.length) { setSubmitted(true); setEncourage('Welcome back! Tap below to keep going. ⭐'); }
                return;
              }
              startGame(at);
            }}
            className="w-full px-8 py-4 rounded-full font-extrabold text-xl text-white shadow-lg mb-3"
            style={{ background: 'linear-gradient(135deg, #059669, #7C3AED)' }}>
            Keep going →
          </button>
          <button onClick={() => { setResumeAt(null); setPlacementRun(null); }} className="text-sm font-bold text-gray-500 underline">
            Start the games over
          </button>
        </div>
      </main>
    );
  }

  if (isTracingStep) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start px-0 py-10" style={{ background: '#FFF9F0' }}>
        <div className="max-w-2xl w-full px-4">
          <StepGuide step={3} className="mb-6" />
          <div className="flex gap-2 mb-6">
            {stepLabels.map((l, i) => (
              <div key={i} className="flex-1 h-3 rounded-full transition-all"
                style={{ background: i <= gameStep ? '#059669' : '#E5E7EB' }} />
            ))}
          </div>
        </div>
        <TracingGame age={state.childAge ?? 8} onComplete={handleTracingComplete} />
        <p className="text-center text-gray-500 text-sm font-semibold mt-4">Game {gameStep + 1} of {totalSteps}</p>
      </main>
    );
  }

  if (mode === 'unknown' || !game || !question) return null;

  const canSubmit = question.type === 'choice' ? !!selectedAnswer : inputValue.trim().length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10" style={{ background: '#FFF9F0' }}>
      <div className="max-w-2xl w-full">
        {challenge ? (
          <p className="text-center text-sm font-extrabold tracking-wide uppercase mb-4" style={{ color: game.color }}>
            Challenge round · harder questions
          </p>
        ) : <StepGuide step={3} className="mb-6" />}

        <div className="rounded-3xl p-5 mb-5 text-center shadow-lg"
          style={{ background: game.light, border: `3px solid ${game.color}` }}>
          <span style={{ fontSize: 44 }}>{game.emoji}</span>
          <h1 className="text-2xl font-extrabold mt-1" style={{ color: game.color }}>{game.label}</h1>
          <p className="text-gray-600 mt-1 text-sm">{game.scenario}</p>
        </div>

        <div className="flex gap-2 mb-3">
          {stepLabels.map((l, i) => (challenge && i === 1) ? null : (
            <div key={i} className="flex-1 h-3 rounded-full transition-all"
              style={{ background: i < gameStep ? game.color : i === gameStep ? `${game.color}88` : '#E5E7EB' }} />
          ))}
        </div>
        <div className="flex gap-1 mb-5">
          {Array.from({ length: challenge ? challengeTotal : shownTotal }, (_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i < questionIdx ? game.color : i === questionIdx ? `${game.color}66` : '#E5E7EB' }} />
          ))}
          {/* bonus questions: little gold stars after the six, only once reached */}
          {!challenge && bonusIdx > 0 && Array.from({ length: bonusIdx }, (_, i) => (
            <div key={`b${i}`} className="w-3 h-1.5 rounded-full" style={{ background: '#F59E0B' }} />
          ))}
        </div>

        <div className="rounded-3xl p-8 shadow-xl mb-5 bounce-in" key={`${gameStep}-${questionIdx}`} style={{ background: 'white' }}>
          <div className="flex items-start gap-3 mb-5">
            <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-base"
              style={{ background: game.color }}>
              {!challenge && bonusIdx > 0 ? '★' : questionIdx + 1}
            </span>
            <p className="text-gray-800 font-semibold text-lg leading-relaxed">{question.text}</p>
          </div>

          {question.type === 'choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((opt, i) => {
                const sel = selectedAnswer === opt.label;
                let bg = '#F9FAFB', border = '#E5E7EB', textCol = '#374151';
                if (sel && !submitted)  { bg = game.light; border = game.color; textCol = game.color; }
                // No right/wrong marks for the child (CLAUDE.md: never show
                // failure) — their pick just stays highlighted.
                if (submitted && sel) { bg = game.light; border = game.color; textCol = game.color; }
                // After a miss the right answer is shown softly in green.
                const showRight = submitted && opt.correct && !sel;
                if (showRight) { bg = '#ECFDF5'; border = '#10B981'; textCol = '#047857'; }
                return (
                  <button key={i} onClick={() => !submitted && setSelected(opt.label)} disabled={submitted}
                    {...(testing() ? { 'data-correct': String(opt.correct), 'data-picked': String(sel), 'data-shown-right': String(showRight) } : {})}
                    className="w-full text-left px-5 py-4 rounded-2xl font-semibold text-base transition-all hover:scale-[1.02]"
                    style={{ background: bg, border: `2px solid ${border}`, color: textCol }}>
                    {opt.label}
                    {showRight && <span className="ml-2 text-xs font-extrabold uppercase tracking-wide">· the answer</span>}
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
                borderColor: game.color,
                background: game.light,
              }} />
          )}
        </div>

        {submitted && encourage && (
          <div data-feedback className="rounded-2xl p-4 text-center mb-4 font-bold text-lg bounce-in"
            style={{ background: game.light, color: game.color }}>
            {encourage}
          </div>
        )}

        <div className="text-center">
          {submitted && missed && !retried && question.type === 'choice' && (
            <button onClick={tryAgain}
              className="block mx-auto mb-3 px-6 py-2 rounded-full font-bold text-base border-2 transition-all hover:scale-105"
              style={{ borderColor: game.color, color: game.color, background: 'white' }}>
              Try it again 🔁
            </button>
          )}
          {!submitted ? (
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canSubmit ? `linear-gradient(135deg, ${game.color}, #EC4899)` : '#D1D5DB' }}>
              That’s my answer! 🎯
            </button>
          ) : (
            <button onClick={handleNext}
              className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${game.color}, #EC4899)` }}>
              {challenge ? (isLastQ ? (isLastChallengeGame ? 'See My Results! 🎉' : 'Next Game! 🚀') : 'Next Question →')
                : plannedNext() != null ? (asked.length >= mainTotal ? 'Bonus question! ⭐' : 'Next Question →')
                : isLastStep ? (state.sensoryCompleted ? 'See My Results! 🎉' : 'Great job! Last part →') : 'Next Game! 🚀'}
            </button>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm font-semibold mt-4">
          {challenge
            ? <span data-challenge-counter>{`Game ${liveChallengeSteps.indexOf(gameStep) + 1} of ${liveChallengeSteps.length} • ${stepLabels[gameStep]} • Question ${questionIdx + 1}${challengeTotal > questionIdx + 1 ? ' of up to ' : '/'}${challengeTotal}`}</span>
            : <>Game {gameStep + 1} of {totalSteps} • {stepLabels[gameStep]}
              {!isTracingStep && <span data-placement-counter>{bonusIdx > 0
                ? ` • Bonus question ${bonusIdx}`
                : ` • Question ${questionIdx + 1} of ${shownTotal}`}</span>}</>}
        </p>
      </div>
    </main>
  );
}
