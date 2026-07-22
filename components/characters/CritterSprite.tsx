// ── Critter Sprite ──
// Animated chibi-style creature illustrations, drawn in the same bold
// sticker style as Kailia and Noel (thick dark outline, big shiny eyes,
// blush cheeks) — replacing plain animal emoji everywhere a "wild
// creature" appears in the adventure games. One flexible SVG builder
// covers every species so adding a new one is a config entry, not a
// new drawing from scratch.
//
// Every critter idly bobs and blinks; species with wings/tails/ears get
// their own extra motion (flutter, wag) layered on top.

import type { CSSProperties } from 'react';

export type SpeciesKey =
  | 'dragon' | 'owl' | 'raccoon' | 'parrot' | 'peacock' | 'rabbit' | 'koala'
  | 'deer' | 'swan' | 'fox' | 'frog' | 'turtle' | 'squirrel' | 'hedgehog'
  | 'bee' | 'butterfly';

// Maps the exact emoji characters used throughout lib/creatureChallenges.ts
// to a species drawing. Anything not listed here (gems, colors, flags…)
// simply isn't a critter and should keep rendering as plain emoji.
export const EMOJI_SPECIES: Record<string, SpeciesKey> = {
  '🐉': 'dragon', '🐲': 'dragon', '🦉': 'owl', '🦝': 'raccoon', '🦜': 'parrot',
  '🦚': 'peacock', '🐰': 'rabbit', '🐨': 'koala', '🦌': 'deer', '🦢': 'swan',
  '🦊': 'fox', '🐸': 'frog', '🐢': 'turtle', '🐿️': 'squirrel', '🦔': 'hedgehog',
  '🐝': 'bee', '🦋': 'butterfly',
};

interface SpeciesConfig {
  body: string; accent: string; belly?: string;
  ear: 'round' | 'long' | 'point' | 'tuft' | 'none';
  extra?: 'horn' | 'mask' | 'antler' | 'shell' | 'spike' | 'tail-bushy' | 'tail-ring' | 'fan' | 'wings-bird' | 'wings-bug' | 'beak-curve' | 'beak-long';
}

const SPECIES: Record<SpeciesKey, SpeciesConfig> = {
  dragon:    { body: '#4ADE80', accent: '#16A34A', belly: '#ECFDF5', ear: 'point', extra: 'horn' },
  owl:       { body: '#B08968', accent: '#7C5A3C', belly: '#F5E6D3', ear: 'tuft' },
  raccoon:   { body: '#9CA3AF', accent: '#374151', belly: '#F3F4F6', ear: 'round', extra: 'mask' },
  parrot:    { body: '#4ADE80', accent: '#DC2626', belly: '#FEF08A', ear: 'none', extra: 'beak-curve' },
  peacock:   { body: '#22D3EE', accent: '#0891B2', belly: '#A5F3FC', ear: 'none', extra: 'fan' },
  rabbit:    { body: '#F3F4F6', accent: '#E5E7EB', belly: '#FFFFFF', ear: 'long' },
  koala:     { body: '#9CA3AF', accent: '#6B7280', belly: '#E5E7EB', ear: 'round' },
  deer:      { body: '#D2A679', accent: '#A9724F', belly: '#FDF3E7', ear: 'point', extra: 'antler' },
  swan:      { body: '#FFFFFF', accent: '#F472B6', belly: '#F8FAFC', ear: 'none', extra: 'beak-long' },
  fox:       { body: '#FB923C', accent: '#C2410C', belly: '#FFF7ED', ear: 'point', extra: 'tail-bushy' },
  frog:      { body: '#4ADE80', accent: '#15803D', belly: '#ECFCCB', ear: 'none' },
  turtle:    { body: '#65A30D', accent: '#3F6212', belly: '#D9F99D', ear: 'none', extra: 'shell' },
  squirrel:  { body: '#C2793B', accent: '#92400E', belly: '#FEF3C7', ear: 'round', extra: 'tail-bushy' },
  hedgehog:  { body: '#A78B5B', accent: '#78350F', belly: '#F5E6D3', ear: 'round', extra: 'spike' },
  bee:       { body: '#FDE047', accent: '#1a1108', belly: '#FEF9C3', ear: 'none', extra: 'wings-bug' },
  butterfly: { body: '#C084FC', accent: '#7C3AED', belly: '#F5D0FE', ear: 'none', extra: 'wings-bug' },
};

interface Props {
  species: SpeciesKey;
  size?: number;
  className?: string;
  style?: CSSProperties;
  animate?: boolean; // set false for tiny inline usages (option buttons) to save motion
}

const SK = '#1a1108';

export function CritterSprite({ species, size = 64, className, style, animate = true }: Props) {
  const c = SPECIES[species];
  const SW = 3;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${animate ? 'critter-bob' : ''} ${className ?? ''}`}
      style={style} xmlns="http://www.w3.org/2000/svg">

      {/* ── tails, drawn behind the body ── */}
      {c.extra === 'tail-bushy' && (
        <g className={animate ? 'critter-wag' : ''} style={{ transformOrigin: '78px 62px' }}>
          <ellipse cx="82" cy="55" rx="16" ry="11" fill={c.body} stroke={SK} strokeWidth={SW} transform="rotate(35 82 55)" />
          <ellipse cx="86" cy="50" rx="8" ry="6" fill={species === 'fox' ? '#fff' : c.accent} transform="rotate(35 86 50)" />
        </g>
      )}
      {c.extra === 'tail-ring' && (
        <g className={animate ? 'critter-wag' : ''} style={{ transformOrigin: '80px 60px' }}>
          <ellipse cx="84" cy="52" rx="14" ry="9" fill={c.body} stroke={SK} strokeWidth={SW} transform="rotate(30 84 52)" />
          <ellipse cx="87" cy="49" rx="5" ry="9" fill={c.accent} transform="rotate(30 87 49)" />
        </g>
      )}
      {c.extra === 'fan' && (
        <g>
          {[-30, -15, 0, 15, 30].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 60)`}>
              <ellipse cx="50" cy="20" rx="7" ry="16" fill={c.body} stroke={c.accent} strokeWidth="1.5" opacity="0.9" />
              <circle cx="50" cy="16" r="4" fill={c.accent} />
              <circle cx="50" cy="16" r="1.8" fill="#FDE047" />
            </g>
          ))}
        </g>
      )}

      {/* ── shell (turtle) sits behind body ── */}
      {c.extra === 'shell' && (
        <ellipse cx="50" cy="66" rx="30" ry="20" fill={c.accent} stroke={SK} strokeWidth={SW} />
      )}
      {c.extra === 'shell' && (
        <>
          <path d="M 30 66 L 50 56 L 70 66 L 50 76 Z" fill={c.body} stroke={SK} strokeWidth="1.5" />
          <ellipse cx="50" cy="66" rx="9" ry="7" fill={c.body} stroke={SK} strokeWidth="1.5" />
        </>
      )}

      {/* ── legs / feet ── */}
      {species !== 'butterfly' && species !== 'bee' && (
        <>
          <ellipse cx="36" cy="88" rx="9" ry="6" fill={c.accent} />
          <ellipse cx="64" cy="88" rx="9" ry="6" fill={c.accent} />
        </>
      )}

      {/* ── body ── */}
      <ellipse cx="50" cy="70" rx="26" ry="22" fill={c.body} stroke={SK} strokeWidth={SW} />
      {c.belly && <ellipse cx="50" cy="74" rx="14" ry="13" fill={c.belly} />}

      {/* dragon back ridge */}
      {species === 'dragon' && (
        <>
          <path d="M 38 50 L 42 42 L 46 50 Z" fill={c.accent} stroke={SK} strokeWidth="1.5" />
          <path d="M 48 46 L 52 36 L 56 46 Z" fill={c.accent} stroke={SK} strokeWidth="1.5" />
          <path d="M 58 50 L 62 42 L 66 50 Z" fill={c.accent} stroke={SK} strokeWidth="1.5" />
        </>
      )}
      {/* hedgehog spikes */}
      {c.extra === 'spike' && (
        <>
          <path d="M 26 58 L 18 50 L 30 50 Z" fill={c.accent} />
          <path d="M 36 48 L 30 38 L 42 42 Z" fill={c.accent} />
          <path d="M 50 44 L 46 32 L 56 36 Z" fill={c.accent} />
          <path d="M 64 48 L 62 36 L 72 44 Z" fill={c.accent} />
          <path d="M 74 58 L 74 46 L 84 54 Z" fill={c.accent} />
        </>
      )}

      {/* wings for bee/butterfly, drawn beside the body */}
      {c.extra === 'wings-bug' && (
        <g className={animate ? 'critter-flutter' : ''}>
          <ellipse cx="30" cy="58" rx="14" ry="18" fill={species === 'butterfly' ? c.body : 'rgba(255,255,255,0.75)'}
            stroke={c.accent} strokeWidth="2" opacity={species === 'butterfly' ? 0.95 : 0.6} />
          <ellipse cx="70" cy="58" rx="14" ry="18" fill={species === 'butterfly' ? c.body : 'rgba(255,255,255,0.75)'}
            stroke={c.accent} strokeWidth="2" opacity={species === 'butterfly' ? 0.95 : 0.6} />
          {species === 'butterfly' && (
            <>
              <circle cx="30" cy="54" r="4" fill={c.belly} />
              <circle cx="70" cy="54" r="4" fill={c.belly} />
            </>
          )}
        </g>
      )}
      {/* bee stripes */}
      {species === 'bee' && (
        <>
          <rect x="34" y="60" width="32" height="7" fill={c.accent} />
          <rect x="34" y="74" width="32" height="7" fill={c.accent} />
        </>
      )}

      {/* neck/head connector for swan's long neck */}
      {c.extra === 'beak-long' && (
        <path d="M 58 54 Q 70 34 62 20" fill="none" stroke={SK} strokeWidth={SW} />
      )}
      {c.extra === 'beak-long' && (
        <path d="M 58 54 Q 70 34 62 20" fill="none" stroke={c.body} strokeWidth={SW - 1} />
      )}

      {/* ── head ── */}
      <circle cx={c.extra === 'beak-long' ? 62 : 50} cy={c.extra === 'beak-long' ? 20 : 38} r="26" fill={c.body} stroke={SK} strokeWidth={SW} />

      {/* ears */}
      {(() => {
        const hx = c.extra === 'beak-long' ? 62 : 50, hy = c.extra === 'beak-long' ? 20 : 38;
        if (c.ear === 'round') return <>
          <circle cx={hx - 20} cy={hy - 18} r="10" fill={c.body} stroke={SK} strokeWidth={SW} />
          <circle cx={hx + 20} cy={hy - 18} r="10" fill={c.body} stroke={SK} strokeWidth={SW} />
          <circle cx={hx - 20} cy={hy - 18} r="5" fill={c.accent} />
          <circle cx={hx + 20} cy={hy - 18} r="5" fill={c.accent} />
        </>;
        if (c.ear === 'point') return <>
          <path d={`M ${hx - 24} ${hy - 12} L ${hx - 30} ${hy - 32} L ${hx - 12} ${hy - 20} Z`} fill={c.body} stroke={SK} strokeWidth={SW} />
          <path d={`M ${hx + 24} ${hy - 12} L ${hx + 30} ${hy - 32} L ${hx + 12} ${hy - 20} Z`} fill={c.body} stroke={SK} strokeWidth={SW} />
        </>;
        if (c.ear === 'long') return <g className={animate ? 'critter-wag' : ''} style={{ transformOrigin: `${hx}px ${hy - 10}px` }}>
          <ellipse cx={hx - 14} cy={hy - 38} rx="7" ry="24" fill={c.body} stroke={SK} strokeWidth={SW} />
          <ellipse cx={hx + 14} cy={hy - 38} rx="7" ry="24" fill={c.body} stroke={SK} strokeWidth={SW} />
          <ellipse cx={hx - 14} cy={hy - 36} rx="3.5" ry="17" fill="#FBCFE8" />
          <ellipse cx={hx + 14} cy={hy - 36} rx="3.5" ry="17" fill="#FBCFE8" />
        </g>;
        if (c.ear === 'tuft') return <>
          <path d={`M ${hx - 20} ${hy - 16} L ${hx - 26} ${hy - 34} L ${hx - 12} ${hy - 24} Z`} fill={c.accent} stroke={SK} strokeWidth="2" />
          <path d={`M ${hx + 20} ${hy - 16} L ${hx + 26} ${hy - 34} L ${hx + 12} ${hy - 24} Z`} fill={c.accent} stroke={SK} strokeWidth="2" />
        </>;
        return null;
      })()}

      {/* horns (dragon) / antlers (deer) */}
      {c.extra === 'horn' && (
        <>
          <path d="M 40 18 L 36 6 L 44 14 Z" fill={c.accent} stroke={SK} strokeWidth="1.5" />
          <path d="M 60 18 L 64 6 L 56 14 Z" fill={c.accent} stroke={SK} strokeWidth="1.5" />
        </>
      )}
      {c.extra === 'antler' && (
        <>
          <path d="M 40 16 L 32 2 M 32 2 L 26 4 M 32 2 L 30 8" fill="none" stroke={c.accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M 60 16 L 68 2 M 68 2 L 74 4 M 68 2 L 70 8" fill="none" stroke={c.accent} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* mask (raccoon) */}
      {c.extra === 'mask' && (
        <path d="M 26 34 Q 50 24 74 34 Q 66 44 50 44 Q 34 44 26 34 Z" fill={c.accent} opacity="0.85" />
      )}

      {/* eyes — bigger for owl, closed-happy for frog optional; blink animation */}
      <g className={animate ? 'critter-blink' : ''} style={{ transformOrigin: `${c.extra === 'beak-long' ? 62 : 50}px ${(c.extra === 'beak-long' ? 20 : 38)}px` }}>
        {species === 'owl' ? (
          <>
            <circle cx="38" cy="38" r="13" fill="#fff" stroke={SK} strokeWidth={SW} />
            <circle cx="62" cy="38" r="13" fill="#fff" stroke={SK} strokeWidth={SW} />
            <circle cx="38" cy="39" r="7" fill={SK} /><circle cx="62" cy="39" r="7" fill={SK} />
            <circle cx="41" cy="35" r="2.2" fill="#fff" /><circle cx="65" cy="35" r="2.2" fill="#fff" />
          </>
        ) : species === 'frog' ? (
          <>
            <circle cx="36" cy="22" r="9" fill="#fff" stroke={SK} strokeWidth={SW} />
            <circle cx="64" cy="22" r="9" fill="#fff" stroke={SK} strokeWidth={SW} />
            <circle cx="36" cy="23" r="4.5" fill={SK} /><circle cx="64" cy="23" r="4.5" fill={SK} />
          </>
        ) : (
          <>
            <circle cx={(c.extra === 'beak-long' ? 62 : 50) - 12} cy={(c.extra === 'beak-long' ? 20 : 38)} r="8" fill="#fff" stroke={SK} strokeWidth={SW - 0.5} />
            <circle cx={(c.extra === 'beak-long' ? 62 : 50) + 12} cy={(c.extra === 'beak-long' ? 20 : 38)} r="8" fill="#fff" stroke={SK} strokeWidth={SW - 0.5} />
            <circle cx={(c.extra === 'beak-long' ? 62 : 50) - 12} cy={(c.extra === 'beak-long' ? 20 : 38) + 1} r="4.5" fill={SK} />
            <circle cx={(c.extra === 'beak-long' ? 62 : 50) + 12} cy={(c.extra === 'beak-long' ? 20 : 38) + 1} r="4.5" fill={SK} />
            <circle cx={(c.extra === 'beak-long' ? 62 : 50) - 10} cy={(c.extra === 'beak-long' ? 20 : 38) - 1.5} r="1.6" fill="#fff" />
            <circle cx={(c.extra === 'beak-long' ? 62 : 50) + 14} cy={(c.extra === 'beak-long' ? 20 : 38) - 1.5} r="1.6" fill="#fff" />
          </>
        )}
      </g>

      {/* beak (parrot/swan) or snout/nose */}
      {c.extra === 'beak-curve' && (
        <path d="M 50 44 Q 62 48 58 58 Q 50 56 46 48 Z" fill="#FBBF24" stroke={SK} strokeWidth="2" />
      )}
      {c.extra === 'beak-long' && (
        <path d="M 82 16 L 94 20 L 82 24 Z" fill="#F59E0B" stroke={SK} strokeWidth="1.5" />
      )}
      {!c.extra && species !== 'owl' && species !== 'frog' && (
        <ellipse cx="50" cy="48" rx="3.5" ry="2.5" fill={c.accent} />
      )}

      {/* mouth */}
      {species !== 'bee' && species !== 'butterfly' && (
        <path d={`M 42 ${c.extra === 'beak-long' ? 62 : 50} Q 50 ${c.extra === 'beak-long' ? 68 : 57} 58 ${c.extra === 'beak-long' ? 62 : 50}`}
          stroke={SK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* blush */}
      {species !== 'bee' && species !== 'butterfly' && (
        <>
          <circle cx={(c.extra === 'beak-long' ? 62 : 50) - 20} cy={(c.extra === 'beak-long' ? 20 : 38) + 10} r="6" fill="#FFB3C6" opacity="0.5" />
          <circle cx={(c.extra === 'beak-long' ? 62 : 50) + 20} cy={(c.extra === 'beak-long' ? 20 : 38) + 10} r="6" fill="#FFB3C6" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

// Convenience wrapper: pass the emoji already used throughout the game
// data, get back the matching animated critter — or the raw emoji if
// it isn't a creature (gems, colors, flags, etc.), so callers never
// need an if/else at the call site.
export function Critter({ emoji, size = 64, className, style, animate = true }:
  { emoji: string; size?: number; className?: string; style?: CSSProperties; animate?: boolean }) {
  const species = EMOJI_SPECIES[emoji];
  if (!species) return <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1, ...style }}>{emoji}</span>;
  return <CritterSprite species={species} size={size} className={className} style={style} animate={animate} />;
}
