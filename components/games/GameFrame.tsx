'use client';

// ── Game frame: the opening and the celebration every game shares ──
// <GameIntro> is the title card a child sees before playing. The game's
// name pops in letter by letter, Kailia runs in from the side and stops
// to say hi, Noel waves, the friend drops in, and Noel tells the story in
// a speech bubble. A big glowing Play button breathes until it is tapped.
//
// <GameFinish> is the party at the end of a level. Confetti falls, light
// rays turn behind the gang, Kailia jumps for joy with her drawn jump,
// the friend dances, and the starlight flies into a counter that counts up.
//
// Each game passes its own colors, words and extras (its level map, its
// potions, its cards...), so every game keeps its own look inside one
// shared, polished frame. Everything respects Reduce motion: the scene
// simply appears, still.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import PandaSprite from '@/components/characters/PandaSprite';
import RunnerSprite from '@/components/characters/RunnerSprite';
import LiveArt from '@/components/characters/LiveArt';
import StarIcon from '@/components/games/StarIcon';
import { seeded } from '@/components/friends/kit/Stage';
import { useReducedMotion } from '@/components/world/useReducedMotion';
import { petWidth } from '@/lib/companionTrails';

interface Pet { art: string; name: string }

interface Theme {
  /** page background (any CSS background) */
  bg: string;
  /** the game's main color: title glow, platform, Play button */
  accent: string;
  /** a second color for the Play button gradient */
  accent2?: string;
  /** text color of the Play button */
  ink?: string;
}

/** The game's name, each letter popping in on its own beat. */
function Title({ text, accent }: { text: string; accent: string }) {
  return (
    <h1 className="gf-title" aria-label={text} style={{ ['--gf-accent' as string]: accent } as CSSProperties}>
      {text.split(' ').map((word, w, words) => (
        <span key={w} className="inline-block whitespace-nowrap" aria-hidden="true">
          {[...word].map((ch, i) => {
            const n = words.slice(0, w).join('').length + i;
            return <span key={i} className="gf-letter" style={{ animationDelay: `${0.05 + n * 0.045}s` }}>{ch}</span>;
          })}
          {w < words.length - 1 && <span className="gf-letter">&nbsp;</span>}
        </span>
      ))}
    </h1>
  );
}

/** Slow sparkles drifting up the whole screen, behind everything. */
function StarDust({ n = 22, seed = 5 }: { n?: number; seed?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const s = 4 + seeded(i, seed) * 7;
        return (
          <span key={i} className="gf-dust absolute rounded-full" style={{
            left: `${seeded(i, seed + 1) * 100}%`, top: `${20 + seeded(i, seed + 2) * 85}%`, width: s, height: s,
            animationDuration: `${7 + seeded(i, seed + 3) * 8}s`, animationDelay: `${-seeded(i, seed + 4) * 14}s`,
          }} />
        );
      })}
    </div>
  );
}

/** Kailia, Noel and the friend standing together on a glowing little stage. */
function Gang({ pet, accent, party, kailiaH = 132 }: { pet: Pet; accent: string; party?: boolean; kailiaH?: number }) {
  const reduced = useReducedMotion();
  // Kailia runs in from the left, then stands (or, at a party, keeps jumping)
  const [kailia, setKailia] = useState<'run' | 'jump' | 'idle'>('idle');
  const [arrived, setArrived] = useState(false);
  const [jumps, setJumps] = useState(0);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- the entrance starts once the screen is on */
    if (reduced) { setArrived(true); return; }
    setKailia('run');
    /* eslint-enable react-hooks/set-state-in-effect */
    const raf = requestAnimationFrame(() => setArrived(true));
    const t = setTimeout(() => setKailia(party ? 'jump' : 'idle'), 950);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [reduced, party]);
  // at a party she hops again and again: each new jump replays the drawn take-off
  useEffect(() => {
    if (!party || reduced || kailia !== 'jump') return;
    const id = setInterval(() => setJumps(j => j + 1), 1250);
    return () => clearInterval(id);
  }, [party, reduced, kailia]);

  const kw = Math.round(kailiaH * 0.82);
  const petH = Math.round(kailiaH * 0.56);
  return (
    <div className="relative mx-auto" style={{ width: 340, maxWidth: '100%', height: kailiaH + 34 }}>
      {/* the glowing stage they stand on */}
      <span aria-hidden="true" className="gf-stage absolute left-1/2 rounded-[50%]" style={{
        bottom: 0, width: 300, height: 46, marginLeft: -150,
        background: `radial-gradient(closest-side, ${accent}AA, ${accent}33 70%, transparent)`,
      }} />
      <div className="absolute flex items-end justify-center gap-1" style={{ left: 0, right: 0, bottom: 18 }}>
        <span className={reduced ? '' : 'gf-enter-right'} style={{ animationDelay: '0.35s' }}>
          <PandaSprite size={Math.round(kailiaH * 0.84)} expression={party ? 'celebrating' : 'excited'} />
        </span>
        <span style={{
          display: 'inline-block', transform: arrived ? 'translateX(0)' : 'translateX(-70vw)',
          transition: reduced ? 'none' : 'transform 0.95s cubic-bezier(.25,.75,.3,1)',
        }}>
          <span key={kailia === 'jump' ? `j${jumps}` : kailia} className={kailia === 'jump' ? 'gf-party-hop inline-block' : 'inline-block'} style={{ transformOrigin: '50% 100%' }}>
            <RunnerSprite character="kailia" action={kailia} width={kw} height={kailiaH} fps={kailia === 'jump' ? 9 : 11} />
          </span>
        </span>
        <span className={reduced ? '' : party ? 'fg-dance inline-block' : 'gf-drop-in inline-block'}
          style={{ animationDelay: party ? '0.2s' : '1.05s', transformOrigin: '50% 100%' }}>
          <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, petH)} kind="pet" />
        </span>
      </div>
    </div>
  );
}

/** The big round Play button: it breathes, shines, and squishes when pressed. */
export function PlayButton({ onClick, children, theme, href }: { onClick?: () => void; children: ReactNode; theme: Theme; href?: string }) {
  const style: CSSProperties = {
    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2 ?? theme.accent})`,
    color: theme.ink ?? '#FFFFFF',
    ['--gf-accent' as string]: theme.accent,
  } as CSSProperties;
  const inner = <><span className="gf-shine" aria-hidden="true" /><span className="relative whitespace-nowrap">{children}</span></>;
  return href
    ? <Link href={href} className="gf-cta" style={style}>{inner}</Link>
    : <button type="button" onClick={onClick} className="gf-cta" style={style}>{inner}</button>;
}

interface IntroProps {
  title: string;
  theme: Theme;
  pet: Pet;
  /** what Noel says: the story of this game, a few short sentences */
  story: ReactNode;
  /** the game's own things to show off (its pieces, a picker...) */
  extras?: ReactNode;
  /** usually <LevelPath .../> */
  levels?: ReactNode;
  startLabel: ReactNode;
  onStart: () => void;
  /** anything under the button: a back link, the grown-ups' note */
  footer?: ReactNode;
  backHref?: string;
}

export function GameIntro({ title, theme, pet, story, extras, levels, startLabel, onStart, footer, backHref = '/play' }: IntroProps) {
  return (
    <main className="gf-screen" style={{ background: theme.bg }}>
      <StarDust />
      <div className="relative max-w-sm w-full mx-auto px-4 pt-3 pb-8 text-center">
        <div className="flex justify-start">
          <Link href={backHref} className="gf-back">← Map</Link>
        </div>
        <Title text={title} accent={theme.accent} />
        <Gang pet={pet} accent={theme.accent} />
        <div className="gf-bubble mt-3 text-left" style={{ animationDelay: '1.25s' }}>
          <span className="gf-bubble-tail" aria-hidden="true" />
          <div className="text-gray-900 text-[17px] font-bold leading-snug space-y-2">{story}</div>
        </div>
        {extras && <div className="gf-rise-in mt-4" style={{ animationDelay: '1.45s' }}>{extras}</div>}
        {levels && <div className="gf-rise-in mt-4" style={{ animationDelay: '1.6s' }}>{levels}</div>}
        <div className="gf-rise-in mt-5" style={{ animationDelay: '1.75s' }}>
          <PlayButton onClick={onStart} theme={theme}>{startLabel}</PlayButton>
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </main>
  );
}

/** Confetti falling over the whole screen: paper bits, stars and ribbons. */
function Confetti({ n = 60, colors }: { n?: number; colors: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" style={{ zIndex: 1 }}>
      {Array.from({ length: n }, (_, i) => {
        const kind = i % 4;
        const s = 8 + seeded(i, 41) * 9;
        const c = colors[i % colors.length];
        return (
          <span key={i} className="gf-confetti absolute" style={{
            left: `${seeded(i, 42) * 100}%`, top: '-6%',
            animationDuration: `${3.2 + seeded(i, 43) * 2.6}s`, animationDelay: `${seeded(i, 44) * 2.4 - (i > n / 2 ? 2.5 : 0)}s`,
            ['--sway' as string]: `${(seeded(i, 45) - 0.5) * 140}px`,
            ['--spin' as string]: `${(seeded(i, 46) > 0.5 ? 1 : -1) * (360 + seeded(i, 47) * 720)}deg`,
          } as CSSProperties}>
            {kind === 0 && <span className="block gf-flutter" style={{ width: s, height: s * 0.55, background: c, borderRadius: 2 }} />}
            {kind === 1 && <span className="block rounded-full" style={{ width: s * 0.7, height: s * 0.7, background: c }} />}
            {kind === 2 && (
              <svg viewBox="0 0 24 24" width={s * 1.3} height={s * 1.3} className="block">
                <path d="M12 1.8l2.9 6.6 7.2.7-5.4 4.8 1.6 7.1L12 17.3 5.7 21l1.6-7.1L1.9 9.1l7.2-.7z" fill={c} stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            )}
            {kind === 3 && <span className="block gf-flutter" style={{ width: s * 0.35, height: s * 1.6, background: c, borderRadius: 4 }} />}
          </span>
        );
      })}
    </div>
  );
}

/** Starlight earned: little stars fly in and the number counts up with a pop. */
function StarCounter({ earned, accent }: { earned: number; accent: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const [pops, setPops] = useState(0);
  const last = useRef(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- no count-up with Reduce motion
    if (reduced) { setShown(earned); return; }
    let raf = 0;
    const t0 = performance.now() + 900;            // after the stars land
    const step = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / 1100));
      const v = Math.round(earned * (1 - Math.pow(1 - k, 3)));
      if (v !== last.current) { last.current = v; setShown(v); setPops(p => p + 1); }
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [earned, reduced]);
  return (
    <div className="relative inline-flex items-center justify-center mt-2" style={{ height: 64 }}>
      {!reduced && Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="gf-fly-star absolute" style={{
          animationDelay: `${0.15 + i * 0.1}s`,
          ['--from-x' as string]: `${(seeded(i, 61) - 0.5) * 260}px`, ['--from-y' as string]: `${-110 - seeded(i, 62) * 80}px`,
        } as CSSProperties}>
          <StarIcon size={26} />
        </span>
      ))}
      <span key={pops} className="gf-counter" style={{ ['--gf-accent' as string]: accent } as CSSProperties}>
        <StarIcon size={30} /> <span className="tabular-nums">+{shown}</span> <span className="text-base font-extrabold opacity-80">starlight</span>
      </span>
    </div>
  );
}

interface FinishProps {
  /** big ribbon words, e.g. "Level 3 complete!" */
  title: string;
  theme: Theme;
  pet: Pet;
  /** one or two short happy lines */
  message?: ReactNode;
  earned?: number;
  /** the game's own trophy (its potions, its gems...), shown above the gang */
  trophy?: ReactNode;
  /** buttons: usually next level + back to the map */
  actions: ReactNode;
}

export function GameFinish({ title, theme, pet, message, earned, trophy, actions }: FinishProps) {
  const reduced = useReducedMotion();
  return (
    <main className="gf-screen flex items-center" style={{ background: theme.bg }}>
      {!reduced && <Confetti colors={['#FDE047', '#F472B6', '#60A5FA', '#4ADE80', '#FFFFFF', '#FB923C', theme.accent]} />}
      <div className="relative max-w-sm w-full mx-auto px-4 py-8 text-center" style={{ zIndex: 2 }}>
        <div className="relative">
          <span aria-hidden="true" className="gf-rays absolute left-1/2 top-1/2" />
          <div className="gf-ribbon relative" style={{ ['--gf-accent' as string]: theme.accent } as CSSProperties}>
            <span className="relative">{title}</span>
          </div>
          {trophy && <div className="gf-drop-in relative mt-3 inline-block" style={{ animationDelay: '0.3s' }}>{trophy}</div>}
          <div className="relative mt-2"><Gang pet={pet} accent={theme.accent} party kailiaH={140} /></div>
        </div>
        {message && <div className="gf-rise-in mt-3 text-white font-bold text-lg leading-snug drop-shadow" style={{ animationDelay: '0.6s' }}>{message}</div>}
        {earned != null && earned > 0 && <StarCounter earned={earned} accent={theme.accent} />}
        <div className="gf-rise-in mt-5 flex gap-3 justify-center flex-wrap" style={{ animationDelay: '1.1s' }}>{actions}</div>
      </div>
    </main>
  );
}

/** A quieter second button (e.g. "Back to the map") that matches the frame. */
export function SoftButton({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const inner = <span className="whitespace-nowrap">{children}</span>;
  return href
    ? <Link href={href} className="gf-soft">{inner}</Link>
    : <button type="button" onClick={onClick} className="gf-soft">{inner}</button>;
}
