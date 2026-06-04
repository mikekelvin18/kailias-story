'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/context/AssessmentContext';

interface PathPoint { x: number; y: number; }
interface HeatmapPt  { x: number; y: number; inside: boolean; far: boolean; }

// ─── Shapes ───────────────────────────────────────────────────────────────────

interface ShapeConfig {
  name: string;
  emoji: string;
  color: string;
  points: (w: number, h: number) => PathPoint[];
}

const SHAPES: ShapeConfig[] = [
  {
    name: 'Straight Line', emoji: '➡️', color: '#059669',
    points: (w, h) => Array.from({ length: 60 }, (_, i) => ({ x: w*0.1 + (w*0.8)*(i/59), y: h*0.5 })),
  },
  {
    name: 'Big Wave', emoji: '🌊', color: '#2563EB',
    points: (w, h) => Array.from({ length: 80 }, (_, i) => {
      const t = i / 79;
      return { x: w*0.1 + w*0.8*t, y: h*0.5 - h*0.28*Math.sin(t * Math.PI) };
    }),
  },
  {
    name: 'S-Curve', emoji: '🐍', color: '#7C3AED',
    points: (w, h) => Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      return { x: w*0.1 + w*0.8*t, y: h*0.5 - h*0.28*Math.sin(t * 2 * Math.PI) };
    }),
  },
  {
    name: 'Zigzag', emoji: '⚡', color: '#D97706',
    points: (w, h) => {
      const segs = 5;
      const pts: PathPoint[] = [];
      for (let i = 0; i <= segs * 20; i++) {
        const t = i / (segs * 20);
        const seg = Math.floor(t * segs);
        const inSeg = (t * segs) - seg;
        const y = seg % 2 === 0 ? h*0.3 + h*0.4*inSeg : h*0.7 - h*0.4*inSeg;
        pts.push({ x: w*0.08 + w*0.84*t, y });
      }
      return pts;
    },
  },
  {
    name: 'Loop', emoji: '🎡', color: '#EC4899',
    points: (w, h) => {
      const pts: PathPoint[] = [];
      // Go right, do a loop in the middle, continue right
      for (let i = 0; i <= 120; i++) {
        const t = i / 120;
        if (t < 0.35) {
          pts.push({ x: w*0.1 + w*0.35*t/0.35, y: h*0.5 });
        } else if (t < 0.65) {
          const angle = ((t - 0.35) / 0.3) * Math.PI * 2;
          pts.push({ x: w*0.45 + w*0.08*Math.cos(angle - Math.PI/2), y: h*0.5 + w*0.08*Math.sin(angle - Math.PI/2) });
        } else {
          pts.push({ x: w*0.45 + w*0.45*(t - 0.65)/0.35, y: h*0.5 });
        }
      }
      return pts;
    },
  },
];

// ─── Scoring (same engine as assessment) ─────────────────────────────────────

function distToSeg(p: PathPoint, a: PathPoint, b: PathPoint): number {
  const dx = b.x-a.x, dy = b.y-a.y, lenSq = dx*dx+dy*dy;
  if (lenSq === 0) return Math.hypot(p.x-a.x, p.y-a.y);
  const t = Math.max(0, Math.min(1, ((p.x-a.x)*dx+(p.y-a.y)*dy)/lenSq));
  return Math.hypot(p.x-(a.x+t*dx), p.y-(a.y+t*dy));
}
function distToPath(p: PathPoint, tgt: PathPoint[]): number {
  let min = Infinity;
  for (let i = 0; i < tgt.length-1; i++) {
    const d = distToSeg(p, tgt[i], tgt[i+1]);
    if (d < min) min = d;
  }
  return min;
}

function getFineMotorStage(score: number) {
  if (score >= 85) return { stage: 'Precision Pro 🎯', color: '#059669' };
  if (score >= 70) return { stage: 'Pre-Writer ✏️',    color: '#2563EB' };
  if (score >= 50) return { stage: 'Shape Master ⭐',  color: '#D97706' };
  if (score >= 25) return { stage: 'Pathfinder 🧭',    color: '#F59E0B' };
  return             { stage: 'Explorer 🌱',            color: '#EC4899' };
}

const TOLERANCE = 22; // pixels — a little more forgiving in play mode

export default function FineMotorPlayPage() {
  const { state } = useAssessment();
  const [shapeIdx, setShapeIdx]     = useState(0);
  const [done, setDone]             = useState(false);
  const [composite, setComposite]   = useState<number|null>(null);
  const [drawing, setDrawing]       = useState(false);
  const [started, setStarted]       = useState(false);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const targetRef    = useRef<PathPoint[]>([]);
  const liveRef      = useRef<PathPoint[]>([]);
  const heatmapRef   = useRef<HeatmapPt[]>([]);
  const startTimeRef = useRef<number>(0);
  const runRef       = useRef({ total:0, inside:0, error:0, vels:[] as number[], prev:null as PathPoint|null, prevT:0, lifts:0 });

  const shape = SHAPES[shapeIdx];
  const W = 560, H = 200;

  const draw = useCallback((heatmap: HeatmapPt[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#F0F9FF'; ctx.fillRect(0,0,W,H);

    const tgt = targetRef.current;
    if (!tgt.length) return;

    // Tolerance band
    ctx.beginPath(); tgt.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.strokeStyle = `${shape.color}25`; ctx.lineWidth = TOLERANCE*2; ctx.lineCap = 'round'; ctx.lineJoin='round'; ctx.stroke();

    // Guide line
    ctx.save(); ctx.setLineDash([8,6]);
    ctx.beginPath(); tgt.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.strokeStyle = `${shape.color}88`; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();

    // Start/end dots
    ctx.beginPath(); ctx.arc(tgt[0].x, tgt[0].y, 10, 0, Math.PI*2); ctx.fillStyle='#10B981'; ctx.fill();
    ctx.beginPath(); ctx.arc(tgt[tgt.length-1].x, tgt[tgt.length-1].y, 10, 0, Math.PI*2); ctx.fillStyle='#EC4899'; ctx.fill();

    // Heatmap
    for (let i = 1; i < heatmap.length; i++) {
      ctx.beginPath(); ctx.moveTo(heatmap[i-1].x, heatmap[i-1].y); ctx.lineTo(heatmap[i].x, heatmap[i].y);
      ctx.strokeStyle = heatmap[i].inside ? '#10B981' : heatmap[i].far ? '#EF4444' : '#F59E0B';
      ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
    }

    ctx.fillStyle = '#10B981'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('START', tgt[0].x-16, tgt[0].y+24);
    ctx.fillStyle = '#EC4899'; ctx.fillText('END', tgt[tgt.length-1].x-12, tgt[tgt.length-1].y+24);
  }, [shape.color]);

  useEffect(() => {
    if (canvasRef.current) {
      targetRef.current = shape.points(W, H);
      draw([]);
    }
  }, [shapeIdx, draw]);

  const getPos = (e: React.MouseEvent|React.TouchEvent): PathPoint|null => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const sx = W/r.width, sy = H/r.height;
    if ('touches' in e) { const t = e.touches[0]; return { x:(t.clientX-r.left)*sx, y:(t.clientY-r.top)*sy }; }
    return { x:(e.clientX-r.left)*sx, y:(e.clientY-r.top)*sy };
  };

  const startDraw = (e: React.MouseEvent|React.TouchEvent) => {
    if (done) return; e.preventDefault();
    const p = getPos(e); if (!p) return;
    if (liveRef.current.length===0) { startTimeRef.current = Date.now(); setStarted(true); }
    else { runRef.current.lifts++; runRef.current.prev=null; }
    liveRef.current = [...liveRef.current, p]; setDrawing(true);
  };

  const drawMove = (e: React.MouseEvent|React.TouchEvent) => {
    if (!drawing || done) return; e.preventDefault();
    const p = getPos(e); if (!p) return;
    const d = targetRef.current.length>1 ? distToPath(p, targetRef.current) : Infinity;
    const inside = d <= TOLERANCE, far = d > TOLERANCE*3;
    heatmapRef.current = [...heatmapRef.current, {x:p.x,y:p.y,inside,far}];
    const rs = runRef.current;
    rs.total++; if (inside) rs.inside++; else rs.error += d-TOLERANCE;
    const now = Date.now();
    if (rs.prev && rs.prevT>0) {
      const dt=now-rs.prevT, dist=Math.hypot(p.x-rs.prev.x,p.y-rs.prev.y);
      if (dt>0&&dt<200) rs.vels.push(dist/dt);
    }
    rs.prev=p; rs.prevT=now;
    liveRef.current=[...liveRef.current,p];
    draw(heatmapRef.current);
  };

  const endDraw = () => {
    if (!drawing) return; setDrawing(false); setDone(true);
    const rs = runRef.current;
    if (rs.total<5) { setComposite(0); return; }
    const elapsed = Math.max(1,(Date.now()-startTimeRef.current)/1000);
    const accuracy  = (rs.inside/rs.total)*100;
    const avgErr    = rs.error/rs.total;
    const precision = Math.max(0, Math.min(100, 100*(1-avgErr/TOLERANCE)));
    const meanV = rs.vels.length>0 ? rs.vels.reduce((a,b)=>a+b,0)/rs.vels.length : 0;
    const stdV  = rs.vels.length>1 ? Math.sqrt(rs.vels.reduce((a,b)=>a+(b-meanV)**2,0)/rs.vels.length) : 0;
    const smoothness = Math.max(0,Math.min(100,100*(1-stdV/(meanV+0.001))));
    const speed = Math.min(100, 100*10/elapsed);
    const liftPenalty = Math.max(0, 100-rs.lifts*5);
    const raw = 0.4*accuracy+0.2*precision+0.15*smoothness+0.15*speed+0.1*liftPenalty;
    const cx = shapeIdx === 0 ? 0 : shapeIdx <= 2 ? 0.5 : 1;
    setComposite(Math.min(100, Math.round(raw*(1+0.25*cx))));
    draw(heatmapRef.current);
  };

  const retry = () => {
    liveRef.current=[]; heatmapRef.current=[];
    runRef.current={total:0,inside:0,error:0,vels:[],prev:null,prevT:0,lifts:0};
    setDone(false); setStarted(false); setComposite(null);
    draw([]);
  };

  const nextShape = () => {
    const next = (shapeIdx+1)%SHAPES.length;
    setShapeIdx(next); retry();
  };

  const stageInfo = composite !== null ? getFineMotorStage(composite) : null;

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg, #064e3b, #059669, #34d399)' }}>
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <Link href="/play" className="text-emerald-100 text-sm font-bold hover:text-white">← Games</Link>
          <h1 className="text-2xl font-extrabold text-white">✨ Shape Magic</h1>
          <span className="text-3xl">{shape.emoji}</span>
        </div>

        {/* Shape selector */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {SHAPES.map((s, i) => (
            <button key={i} onClick={() => { setShapeIdx(i); retry(); }}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 flex items-center gap-1"
              style={{
                background: i===shapeIdx ? shape.color : 'rgba(255,255,255,0.15)',
                color: i===shapeIdx ? 'white' : 'rgba(255,255,255,0.8)',
                border: `1.5px solid ${i===shapeIdx ? shape.color : 'rgba(255,255,255,0.25)'}`,
              }}>
              {s.emoji} {s.name}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="rounded-3xl overflow-hidden mb-4 shadow-xl" style={{ border: `3px solid ${shape.color}`, touchAction:'none' }}>
          <canvas ref={canvasRef} width={W} height={H}
            style={{ width:'100%', height:'auto', display:'block', cursor:'crosshair' }}
            onMouseDown={startDraw} onMouseMove={drawMove} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={drawMove} onTouchEnd={endDraw} />
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center text-xs text-emerald-100 mb-4">
          <span>🟢 Inside zone</span><span>🟡 Slightly off</span><span>🔴 Far off</span>
        </div>

        {/* Result */}
        {done && composite !== null && stageInfo && (
          <div className="rounded-3xl p-6 mb-4 text-center bounce-in shadow-xl"
            style={{ background: 'rgba(255,255,255,0.95)', border: `3px solid ${stageInfo.color}` }}>
            <p className="text-4xl font-extrabold mb-1" style={{ color: stageInfo.color }}>{composite}%</p>
            <p className="font-bold text-lg" style={{ color: stageInfo.color }}>{stageInfo.stage}</p>
            <div className="h-3 rounded-full my-3" style={{ background: '#E5E7EB' }}>
              <div className="h-3 rounded-full transition-all" style={{ width:`${composite}%`, background: stageInfo.color }} />
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={retry}
                className="px-5 py-2.5 rounded-full font-bold text-gray-600 border-2 border-gray-300 hover:scale-105 transition-all text-sm">
                🔄 Try Again
              </button>
              <button onClick={nextShape}
                className="px-5 py-2.5 rounded-full font-extrabold text-white hover:scale-105 transition-all text-sm"
                style={{ background: `linear-gradient(135deg, ${shape.color}, #EC4899)` }}>
                Next Shape →
              </button>
            </div>
          </div>
        )}

        {!started && !done && (
          <p className="text-center text-emerald-100 text-sm">
            {typeof window !== 'undefined' && 'ontouchstart' in window
              ? '👆 Trace the path with your finger!'
              : '🖱️ Click and drag to trace the path!'}
          </p>
        )}

        <p className="text-center text-emerald-200 text-xs mt-3">
          💡 Stay inside the green zone — slow and steady wins!
        </p>
      </div>
    </main>
  );
}
