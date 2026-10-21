'use client';

// ── Characters standing in a place ──
// Draws a Body (motion.ts) with the character's real painted art and rig:
//   Kailia — runs with her drawn run cycle (RunnerSprite) while walking,
//            stands with her blinking front portrait when idle, turns to
//            her side picture to look or reach toward something, hops
//            when she cheers, and hugs what she carries
//   Pet    — the friend's painted picture with its part rig (LiveArt):
//            bounces along when walking, dips its head to sniff, droops
//            when sad, hops when happy, dances when the quest is won
//   Noel   — the guide, standing in the garden (LiveCharacter)
// Feet sit on (x, y). Lower on screen = closer: drawn bigger and on top.

import type { CSSProperties, ReactNode } from 'react';
import RunnerSprite from '@/components/characters/RunnerSprite';
import LiveArt from '@/components/characters/LiveArt';
import LiveCharacter from '@/components/characters/LiveCharacter';
import { characterArt } from '@/components/characters/characters.config';
import { petWidth } from '@/lib/companionTrails';
import { SIZES } from '@/lib/world/artBible';
import { depthScale, type Body } from './motion';

function place(x: number, y: number, extra?: CSSProperties): CSSProperties {
  return { position: 'absolute', left: x, top: y, zIndex: Math.round(y), ...extra };
}

function Shadow({ w }: { w: number }) {
  return <span aria-hidden="true" className="absolute rounded-[50%]" style={{ left: -w / 2, top: -w * 0.09, width: w, height: w * 0.18, background: 'radial-gradient(ellipse at center, rgba(59,36,22,0.32), rgba(59,36,22,0) 70%)' }} />;
}

export function WorldKailia({ b, holding }: { b: Body; holding?: ReactNode }) {
  const k = depthScale(b.y);
  const H = SIZES.kailiaH;
  const W = 200;
  const side = b.state === 'look' || b.state === 'reach';
  const anim = b.state === 'cheer' ? 'fg-cheer' : b.state === 'dance' ? 'fg-dance' : '';
  return (
    <div style={place(b.x, b.y, { transform: `scale(${k})`, transformOrigin: '0 0', pointerEvents: 'none' })}>
      <Shadow w={120} />
      <div key={`${b.state}-${b.n}`} className={anim} style={{ position: 'absolute', left: -W / 2, top: -H, width: W, height: H, transformOrigin: '50% 100%' }}>
        {side ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={characterArt('kailia', b.facing > 0 ? 'portrait-right' : 'portrait-left')} alt="Kailia" draggable={false}
            className="character-art-shadow live-breathe"
            style={{ width: W, height: H, objectFit: 'contain', transformOrigin: '50% 100%',
              transform: b.state === 'reach' ? `rotate(${b.facing * 6}deg) translateX(${b.facing * 8}px)` : undefined, transition: 'transform 0.18s ease-out' }} />
        ) : (
          <div style={{ transform: `scaleX(${b.state === 'walk' ? b.facing : 1})` }}>
            <RunnerSprite character="kailia" action={b.state === 'walk' ? 'run' : 'idle'} width={W} height={H} />
          </div>
        )}
        {holding && (
          <div style={{ position: 'absolute', left: W / 2 - 34 + (side ? b.facing * 34 : 0), top: H * 0.5, pointerEvents: 'none' }}>{holding}</div>
        )}
      </div>
    </div>
  );
}

const PET_ANIM: Partial<Record<Body['state'], string>> = {
  walk: 'gw-petwalk', sniff: 'gw-sniff', sad: 'gw-sad', cheer: 'fg-cheer', dance: 'fg-dance', look: 'fg-talk',
};

export function WorldPet({ b, art, name, label, carrying, onTap }: {
  b: Body; art: string; name: string; label: string; carrying?: ReactNode; onTap: () => void;
}) {
  const k = depthScale(b.y);
  const h = SIZES.petH;
  const w = petWidth(art, h);
  return (
    <div style={place(b.x, b.y, { transform: `scale(${k})`, transformOrigin: '0 0' })}>
      <Shadow w={w * 0.8} />
      <button type="button" aria-label={label} onClick={e => { e.stopPropagation(); onTap(); }}
        className="gw-touch absolute" style={{ left: -w / 2 - 10, top: -h - 10, width: w + 20, height: h + 20, background: 'none', border: 0, padding: 10, cursor: 'pointer' }}>
        <div style={{ transform: `scaleX(${b.facing})`, transition: 'transform 0.2s' }}>
          <div key={`${b.state}-${b.n}`} className={PET_ANIM[b.state] ?? ''} style={{ transformOrigin: '50% 100%' }}>
            <LiveArt src={art} alt={name} size={w} kind="pet" pokeable={false} />
          </div>
        </div>
        {carrying && <div style={{ position: 'absolute', left: w / 2 - 12 + b.facing * w * 0.22, top: h * 0.36, pointerEvents: 'none' }}>{carrying}</div>}
      </button>
    </div>
  );
}

export function WorldNoel({ x, y, onTap, excited }: { x: number; y: number; onTap: () => void; excited: boolean }) {
  const k = depthScale(y);
  const size = 170;
  const h = size * 1.2;
  return (
    <div style={place(x, y, { transform: `scale(${k})`, transformOrigin: '0 0' })}>
      <button type="button" aria-label="Noel, say that again" onClick={e => { e.stopPropagation(); onTap(); }}
        className="gw-touch absolute" style={{ left: -size / 2, top: -h, width: size, height: h, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
        <LiveCharacter character="noel" src={characterArt('noel', 'portrait-front')} size={size} mood={excited ? 'excited' : 'calm'} />
      </button>
    </div>
  );
}
