'use client';

import { useEffect, useState } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import { CHAPTERS, STAR_CHAPTER, LEVELS_PER_CHAPTER, unlockedUpTo, highestBeaten } from '@/lib/levels';

// ── Level map ──
// A small winding path of 5 level stones (one chapter) on every leveled
// game's intro screen. Kailia hops on the chosen stone; beaten stones
// glow, the rest wait behind a little lock. Arrows flip between
// chapters. The child can replay any level they have reached.
//
// Reads saved progress after mount (localStorage), so the server render
// and the first client paint match.

interface Props {
  gameId: string;
  level: number;
  onPick: (level: number) => void;
  startLevel?: number;   // games that place older kids further up the ladder
}

// stone positions along the winding path, in a 300×120 box
const SPOTS = [
  { x: 30, y: 84 }, { x: 90, y: 40 }, { x: 150, y: 80 }, { x: 210, y: 36 }, { x: 270, y: 76 },
];

export default function LevelPath({ gameId, level, onPick, startLevel = 1 }: Props) {
  const [unlocked, setUnlocked] = useState(startLevel);
  const [beaten, setBeaten] = useState(0);
  const [page, setPage] = useState(Math.floor((level - 1) / LEVELS_PER_CHAPTER));

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setUnlocked(unlockedUpTo(gameId, startLevel));
    setBeaten(highestBeaten(gameId));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [gameId, startLevel]);

  // follow the chosen level when the game changes it (e.g. after loading)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(Math.floor((level - 1) / LEVELS_PER_CHAPTER));
  }, [level]);

  const maxPage = Math.floor((Math.max(unlocked, level) - 1) / LEVELS_PER_CHAPTER);
  const chapter = CHAPTERS[page] ?? STAR_CHAPTER;
  const first = page * LEVELS_PER_CHAPTER + 1;
  const levels = Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => first + i);
  const chapterLabel = page < CHAPTERS.length ? `Chapter ${page + 1}` : 'Bonus';

  return (
    <div className="mx-2 mt-4 rounded-3xl px-3 pt-3 pb-2 select-none"
      style={{ background: 'rgba(15,23,42,0.38)', border: '1.5px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)' }}>
      <div className="flex items-center justify-between">
        <button aria-label="Previous chapter" onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="w-11 h-11 rounded-full text-xl font-extrabold text-white disabled:opacity-20"
          style={{ background: 'rgba(255,255,255,0.12)' }}>‹</button>
        <div className="text-center" key={page}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">{chapterLabel}</p>
          <p className="text-lg font-extrabold text-white slide-up">{chapter.emoji} {chapter.name}</p>
        </div>
        <button aria-label="Next chapter" onClick={() => setPage(p => Math.min(maxPage, p + 1))}
          disabled={page >= maxPage}
          className="w-11 h-11 rounded-full text-xl font-extrabold text-white disabled:opacity-20"
          style={{ background: 'rgba(255,255,255,0.12)' }}>›</button>
      </div>

      <div className="relative mx-auto" style={{ width: '100%', maxWidth: 320, aspectRatio: '300 / 132' }}>
        <svg viewBox="0 0 300 132" className="absolute inset-0 w-full h-full" aria-hidden>
          <path d="M30 96 C 60 96, 60 52, 90 52 S 120 92, 150 92 S 180 48, 210 48 S 240 88, 270 88"
            fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="5" strokeDasharray="2 11" strokeLinecap="round"
            className="lp-trail" />
        </svg>
        {levels.map((lv, i) => {
          const done = lv <= beaten;
          const open = lv <= unlocked;
          const chosen = lv === level;
          const s = SPOTS[i];
          return (
            <div key={lv} className="absolute"
              style={{ left: `${(s.x / 300) * 100}%`, top: `${((s.y + 12) / 132) * 100}%`, transform: 'translate(-50%, -50%)' }}>
              <button aria-label={open ? `Level ${lv}` : `Level ${lv}, locked`}
                disabled={!open}
                onClick={() => onPick(lv)}
                className={`relative flex items-center justify-center rounded-full font-extrabold drop-in ${chosen ? 'lp-chosen' : ''}`}
                style={{
                  width: 48, height: 48,
                  animationDelay: `${i * 60}ms`, animationFillMode: 'both',
                  background: done ? chapter.color : open ? 'white' : 'rgba(255,255,255,0.12)',
                  color: done ? 'white' : open ? '#1E293B' : 'rgba(255,255,255,0.45)',
                  border: chosen ? '3px solid #FDE047' : '2px solid rgba(255,255,255,0.35)',
                  boxShadow: done ? `0 0 14px ${chapter.color}` : 'none',
                  fontSize: open ? 17 : 15,
                }}>
                {open ? lv : '🔒'}
                {done && <span className="absolute -top-1.5 -right-1.5 text-sm sparkle" aria-hidden>✨</span>}
              </button>
              {chosen && (
                <span className="absolute pointer-events-none" style={{ bottom: '82%', left: '50%', transform: 'translateX(-50%)' }} aria-hidden>
                  <KailiaSprite size={40} expression="excited" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
