// ── Creature drawings ──
// The side creatures of the adventure, drawn to sit beside Kelvin's own
// pet pictures: soft chibi shapes, a clean dark-brown outline, big glossy
// eyes with a sparkle, blush, a tiny open smile, fluffy cheeks, and gentle
// cel shading (a darker crescent underneath, a soft light on top).
// No brush filter here: the pet pictures are clean, so these are too.
//
// Every drawing lives on a 120-wide grid (viewBox -4 -16 128 136).
// `a` = animated (wag / flutter / blink loops from globals.css).

import type { ReactNode } from 'react';

export const SK = '#4a2c17';
const W = 2.6;

/** one silhouette from several shapes: outline pass, then fill pass, so
 *  overlapping parts read as one body with no inner lines */
function Sil({ fill, children, w = W }: { fill: string; children: ReactNode; w?: number }) {
  return (
    <>
      <g fill={SK} stroke={SK} strokeWidth={w * 2} strokeLinejoin="round" strokeLinecap="round">{children}</g>
      <g fill={fill} stroke={fill} strokeWidth={0.6} strokeLinejoin="round">{children}</g>
    </>
  );
}

/** a glossy chibi eye: dark rim, coloured iris that glows at the bottom,
 *  one big and one small highlight, a little star sparkle, a lash line */
function Eye({ x, y, r = 9.5, iris, out = 1 }: { x: number; y: number; r?: number; iris: string; out?: number }) {
  const k = r / 9.5;
  return (
    <g>
      <ellipse cx={x} cy={y - 0.5 * k} rx={8.6 * k} ry={10.2 * k} fill="#2a160c" />
      <ellipse cx={x} cy={y + 0.8 * k} rx={7.2 * k} ry={8.4 * k} fill={iris} />
      <ellipse cx={x} cy={y - 3.6 * k} rx={6.6 * k} ry={4.2 * k} fill="#2a160c" opacity="0.32" />
      <ellipse cx={x} cy={y + 0.6 * k} rx={3.9 * k} ry={5 * k} fill="#1c0e07" />
      <ellipse cx={x} cy={y + 5.8 * k} rx={4.6 * k} ry={2.4 * k} fill="#FFFFFF" opacity="0.45" />
      <circle cx={x - 2.8 * k} cy={y - 4.2 * k} r={3.3 * k} fill="#FFFFFF" />
      <circle cx={x + 3.3 * k} cy={y + 3.4 * k} r={1.6 * k} fill="#FFFFFF" />
      <path d={`M ${x + 7.6 * k * out} ${y - 5.4 * k} q ${3.4 * k * out} ${-1.6 * k} ${4.4 * k * out} ${-4.4 * k}`} fill="none" stroke="#2a160c" strokeWidth={2 * k} strokeLinecap="round" />
    </g>
  );
}

function Eyes({ x1, x2, y, r, iris, a }: { x1: number; x2: number; y: number; r?: number; iris: string; a: boolean }) {
  return (
    <g className={a ? 'critter-blink' : ''} style={{ transformOrigin: `${(x1 + x2) / 2}px ${y}px` }}>
      <Eye x={x1} y={y} r={r} iris={iris} out={-1} />
      <Eye x={x2} y={y} r={r} iris={iris} out={1} />
    </g>
  );
}

const Blush = ({ x1, x2, y, rx = 6, ry = 3.6 }: { x1: number; x2: number; y: number; rx?: number; ry?: number }) => (
  <>
    <ellipse cx={x1} cy={y} rx={rx} ry={ry} fill="#FF8FA3" opacity="0.5" />
    <ellipse cx={x2} cy={y} rx={rx} ry={ry} fill="#FF8FA3" opacity="0.5" />
  </>
);

/** little nose, "w" lips and an open smile with a tongue */
function Muzzle({ x = 60, y = 61, nose = '#3a2014', k = 1 }: { x?: number; y?: number; nose?: string; k?: number }) {
  return (
    <g>
      <path d={`M ${x - 6 * k} ${y + 7.6 * k} Q ${x} ${y + 18.5 * k} ${x + 6 * k} ${y + 7.6 * k} Q ${x} ${y + 9.4 * k} ${x - 6 * k} ${y + 7.6 * k} Z`} fill="#8a2f3a" stroke={SK} strokeWidth={1.6} strokeLinejoin="round" />
      <ellipse cx={x} cy={y + 13.4 * k} rx={3 * k} ry={2 * k} fill="#FF9BB0" />
      <path d={`M ${x} ${y + 3 * k} V ${y + 5.6 * k} M ${x - 7 * k} ${y + 5.2 * k} Q ${x - 3.5 * k} ${y + 9.4 * k} ${x} ${y + 5.6 * k} Q ${x + 3.5 * k} ${y + 9.4 * k} ${x + 7 * k} ${y + 5.2 * k}`} fill="none" stroke={SK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${x - 4 * k} ${y - 1.4 * k} Q ${x} ${y - 3.2 * k} ${x + 4 * k} ${y - 1.4 * k} Q ${x + 3.4 * k} ${y + 2.6 * k} ${x} ${y + 3.4 * k} Q ${x - 3.4 * k} ${y + 2.6 * k} ${x - 4 * k} ${y - 1.4 * k} Z`} fill={nose} stroke={SK} strokeWidth={1.2} strokeLinejoin="round" />
      <ellipse cx={x - 1.2 * k} cy={y - 0.4 * k} rx={1.5 * k} ry={0.8 * k} fill="#FFFFFF" opacity="0.6" />
    </g>
  );
}

const Smile = ({ x = 60, y = 68, w = 6 }: { x?: number; y?: number; w?: number }) => (
  <g>
    <path d={`M ${x - w} ${y} Q ${x} ${y + w * 1.5} ${x + w} ${y} Q ${x} ${y + w * 0.35} ${x - w} ${y} Z`} fill="#8a2f3a" stroke={SK} strokeWidth={1.6} strokeLinejoin="round" />
    <ellipse cx={x} cy={y + w * 0.82} rx={w * 0.46} ry={w * 0.3} fill="#FF9BB0" />
  </g>
);

// the fluffy chibi head every furry friend shares: round, wide, with two
// cheek tufts each side and a little tuft on top
const HEAD = 'M 60 21 C 79 21 93 31 96 46 L 102 50 L 96 55 L 101 61 L 94 64 C 89 76 75 82 60 82 C 45 82 31 76 26 64 L 19 61 L 24 55 L 18 50 L 24 46 C 27 31 41 21 60 21 Z';
const TOP_TUFT = 'M 54 23 Q 56 12 60 18 Q 63 10 67 23 Z';
const BODY = 'M 60 74 C 78 74 85 90 83 102 C 81 112 70 115 60 115 C 50 115 39 112 37 102 C 35 90 42 74 60 74 Z';

const headShade = <path d="M 27 65 C 34 84 86 84 93 65 C 84 78 36 78 27 65 Z" fill="#3a1a08" opacity="0.10" />;
const headLight = <ellipse cx="44" cy="31" rx="13" ry="5.5" fill="#FFFFFF" opacity="0.38" transform="rotate(-22 44 31)" />;
const bodyShade = <path d="M 38 100 C 40 116 80 116 82 100 C 78 111 42 111 38 100 Z" fill="#3a1a08" opacity="0.14" />;

interface Furry {
  fur: string; cream: string; iris: string; nose?: string;
  ears: (a: boolean) => ReactNode;
  tail?: (a: boolean) => ReactNode;
  back?: ReactNode;          // behind everything (hedgehog spikes)
  face?: ReactNode;          // markings on the head, under the eyes
  bodyMarks?: ReactNode;     // markings on the body
  topTuft?: boolean;
  eyeR?: number;
  tooth?: boolean;
}

function furry(f: Furry): (a: boolean) => ReactNode {
  return function FurryArt(a: boolean) {
    return (
      <>
        {f.back}
        {f.tail?.(a)}
        <Sil fill={f.fur}>
          <ellipse cx="41" cy="111" rx="10.5" ry="6.5" /><ellipse cx="79" cy="111" rx="10.5" ry="6.5" />
        </Sil>
        <Sil fill={f.fur}><path d={BODY} /></Sil>
        <path d="M 60 82 C 71 82 75 93 73 103 C 71 111 66 113 60 113 C 54 113 49 111 47 103 C 45 93 49 82 60 82 Z" fill={f.cream} />
        {f.bodyMarks}
        {bodyShade}
        <Sil fill={f.fur} w={2.2}>
          <ellipse cx="49" cy="101" rx="5.6" ry="8" transform="rotate(12 49 101)" /><ellipse cx="71" cy="101" rx="5.6" ry="8" transform="rotate(-12 71 101)" />
        </Sil>
        <path d="M 37 113 v 3 M 41 114 v 3 M 45 113 v 3 M 75 113 v 3 M 79 114 v 3 M 83 113 v 3" stroke={SK} strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
        {f.ears(a)}
        <Sil fill={f.fur}>
          <path d={HEAD} />
          {f.topTuft !== false && <path d={TOP_TUFT} />}
        </Sil>
        {f.face}
        {headShade}
        {headLight}
        <Eyes x1={43} x2={77} y={53} r={f.eyeR} iris={f.iris} a={a} />
        <Muzzle nose={f.nose} />
        {f.tooth && <path d="M 57.6 67 v 4.2 h 4.8 v -4.2" fill="#FFFFFF" stroke={SK} strokeWidth="1.3" strokeLinejoin="round" />}
        <Blush x1={31} x2={89} y={65} />
      </>
    );
  };
}

const creamMuzzle = (c: string) => <ellipse cx="60" cy="67" rx="15.5" ry="11.5" fill={c} />;
const wag = (a: boolean, origin: string, children: ReactNode) =>
  <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: origin }}>{children}</g>;
const flutter = (a: boolean, origin: string, children: ReactNode) =>
  <g className={a ? 'critter-flutter' : ''} style={{ transformOrigin: origin }}>{children}</g>;

// ── the furry friends ──

const rabbit = furry({
  fur: '#FFF6EE', cream: '#FFFFFF', iris: '#B4577A', nose: '#F27C9B', topTuft: true,
  ears: a => wag(a, '60px 26px', (
    <>
      <Sil fill="#FFF6EE">
        <path d="M 38 30 C 27 8 29 -10 39 -10 C 49 -10 52 10 51 27 Z" />
        <path d="M 69 27 C 70 8 78 -8 88 -4 C 97 0 92 16 82 31 Z" />
      </Sil>
      <path d="M 41 24 C 33 8 34 -3 39 -3 C 45 -3 47 10 47 23 Z" fill="#FFC2D1" />
      <path d="M 73 24 C 74 10 80 -1 86 2 C 91 5 87 15 79 26 Z" fill="#FFC2D1" />
    </>
  )),
  tail: () => <Sil fill="#FFFFFF"><circle cx="86" cy="103" r="8" /><circle cx="91" cy="98" r="4.5" /><circle cx="92" cy="106" r="4.5" /></Sil>,
  face: creamMuzzle('#FFFFFF'),
  tooth: true,
});

const koala = furry({
  fur: '#B4BDCB', cream: '#F1F4F8', iris: '#5E6B85', nose: '#3d3f4d', topTuft: false,
  ears: a => wag(a, '60px 40px', (
    <>
      <Sil fill="#B4BDCB">
        <path d="M 26 14 L 31 9 L 35 15 C 44 20 46 34 38 42 C 28 50 12 46 9 34 L 3 30 L 9 26 C 9 20 14 13 22 13 Z" />
        <path d="M 94 14 L 89 9 L 85 15 C 76 20 74 34 82 42 C 92 50 108 46 111 34 L 117 30 L 111 26 C 111 20 106 13 98 13 Z" />
      </Sil>
      <path d="M 26 22 C 34 24 36 34 31 38 C 24 43 15 39 15 31 C 15 25 20 21 26 22 Z" fill="#FFFFFF" />
      <path d="M 94 22 C 86 24 84 34 89 38 C 96 43 105 39 105 31 C 105 25 100 21 94 22 Z" fill="#FFFFFF" />
      <path d="M 22 29 C 27 29 29 34 26 36 M 98 29 C 93 29 91 34 94 36" fill="none" stroke="#FFC2D1" strokeWidth="2.4" strokeLinecap="round" />
    </>
  )),
  face: (
    <>
      <path d="M 51 22 Q 55 15 59 21 Q 62 14 66 21 Q 69 16 70 23 Z" fill="#B4BDCB" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M 52 23 H 70" stroke="#B4BDCB" strokeWidth="3.4" />
    </>
  ),
});
// the koala's big soft nose replaces the little one
const koalaArt = (a: boolean) => (
  <>
    {koala(a)}
    <path d="M 60 50 C 67 50 69 57 68 63 C 67 68 64 70 60 70 C 56 70 53 68 52 63 C 51 57 53 50 60 50 Z" fill="#3d3f4d" stroke={SK} strokeWidth="1.6" />
    <ellipse cx="57" cy="56" rx="2" ry="3.4" fill="#FFFFFF" opacity="0.5" />
    <path d="M 55 72 Q 60 76.5 65 72" fill="none" stroke={SK} strokeWidth="1.8" strokeLinecap="round" />
  </>
);

const deer = furry({
  fur: '#E3A86C', cream: '#FFF3E0', iris: '#7A4A21', nose: '#4a2c17',
  ears: a => (
    <>
      <path d="M 45 24 C 43 14 38 12 36 4 M 41 14 C 36 14 33 10 31 6 M 75 24 C 77 14 82 12 84 4 M 79 14 C 84 14 87 10 89 6" fill="none" stroke={SK} strokeWidth="8" strokeLinecap="round" />
      <path d="M 45 24 C 43 14 38 12 36 4 M 41 14 C 36 14 33 10 31 6 M 75 24 C 77 14 82 12 84 4 M 79 14 C 84 14 87 10 89 6" fill="none" stroke="#B7814F" strokeWidth="3.6" strokeLinecap="round" />
      {wag(a, '60px 40px', (
        <>
          <Sil fill="#E3A86C">
            <path d="M 32 40 C 16 40 4 32 4 22 C 16 18 30 24 38 32 Z" />
            <path d="M 88 40 C 104 40 116 32 116 22 C 104 18 90 24 82 32 Z" />
          </Sil>
          <path d="M 28 35 C 18 34 11 29 10 25 C 18 24 26 28 32 33 Z" fill="#FFC2D1" />
          <path d="M 92 35 C 102 34 109 29 110 25 C 102 24 94 28 88 33 Z" fill="#FFC2D1" />
        </>
      ))}
    </>
  ),
  face: (
    <>
      {creamMuzzle('#FFF3E0')}
      <circle cx="52" cy="31" r="2.6" fill="#FFF3E0" /><circle cx="60" cy="27.5" r="3" fill="#FFF3E0" /><circle cx="68" cy="31" r="2.6" fill="#FFF3E0" />
    </>
  ),
  bodyMarks: <><circle cx="42" cy="92" r="2.4" fill="#FFF3E0" /><circle cx="78" cy="92" r="2.4" fill="#FFF3E0" /><circle cx="80" cy="100" r="1.8" fill="#FFF3E0" /><circle cx="40" cy="100" r="1.8" fill="#FFF3E0" /></>,
});

const squirrel = furry({
  fur: '#D4874B', cream: '#FFEFD6', iris: '#6B3B17', nose: '#4a2c17',
  tail: a => wag(a, '80px 108px', (
    <>
      <Sil fill="#D4874B">
        <path d="M 76 110 C 104 114 116 92 110 70 C 106 52 88 46 82 58 C 78 68 92 68 92 78 C 92 90 84 96 74 98 Z" />
        <path d="M 108 62 L 114 56 L 112 66 Z M 96 50 L 100 43 L 103 52 Z" />
      </Sil>
      <path d="M 88 104 C 102 100 108 86 104 72 C 102 64 94 60 90 62 C 96 66 100 74 98 84 C 96 94 90 100 84 104 Z" fill="#F2B37A" />
    </>
  )),
  ears: () => (
    <>
      <Sil fill="#D4874B">
        <path d="M 30 36 C 26 22 28 12 33 6 C 42 12 48 20 49 28 Z" />
        <path d="M 90 36 C 94 22 92 12 87 6 C 78 12 72 20 71 28 Z" />
        <path d="M 33 6 L 31 -2 L 36 3 Z M 87 6 L 89 -2 L 84 3 Z" />
      </Sil>
      <path d="M 34 30 C 32 22 33 17 35 13 C 40 17 43 23 44 28 Z" fill="#FFC2D1" />
      <path d="M 86 30 C 88 22 87 17 85 13 C 80 17 77 23 76 28 Z" fill="#FFC2D1" />
    </>
  ),
  face: creamMuzzle('#FFEFD6'),
  tooth: true,
});

const raccoon = furry({
  fur: '#A7ADBB', cream: '#F4F6FA', iris: '#3F7D8C', nose: '#2f3140',
  tail: a => wag(a, '80px 108px', (
    <>
      <Sil fill="#A7ADBB">
        <path d="M 76 110 C 100 116 116 100 112 80 C 110 70 98 68 96 78 C 94 90 86 96 76 98 Z" />
      </Sil>
      <path d="M 88 100 Q 92 106 96 110 M 97 92 Q 103 98 108 100 M 100 80 Q 106 84 112 84" fill="none" stroke="#4A5063" strokeWidth="5" strokeLinecap="round" />
    </>
  )),
  ears: () => (
    <>
      <Sil fill="#4A5063">
        <path d="M 28 38 C 22 24 24 12 32 8 C 42 10 48 20 50 28 Z" />
        <path d="M 92 38 C 98 24 96 12 88 8 C 78 10 72 20 70 28 Z" />
      </Sil>
      <path d="M 32 32 C 29 24 30 18 33 15 C 39 17 43 23 44 28 Z" fill="#F4F6FA" />
      <path d="M 88 32 C 91 24 90 18 87 15 C 81 17 77 23 76 28 Z" fill="#F4F6FA" />
    </>
  ),
  face: (
    <>
      <path d="M 28 52 C 30 40 46 38 54 46 C 58 52 56 62 48 66 C 38 68 28 62 28 52 Z" fill="#4A5063" />
      <path d="M 92 52 C 90 40 74 38 66 46 C 62 52 64 62 72 66 C 82 68 92 62 92 52 Z" fill="#4A5063" />
      <path d="M 33 40 Q 42 33 52 39 M 87 40 Q 78 33 68 39" fill="none" stroke="#F4F6FA" strokeWidth="3.4" strokeLinecap="round" />
      {creamMuzzle('#F4F6FA')}
      <path d="M 57 30 Q 60 44 60 50 Q 60 44 63 30 Z" fill="#4A5063" opacity="0.5" />
    </>
  ),
});

const hedgehog = furry({
  fur: '#F6DFC0', cream: '#FFF6E8', iris: '#6B3B17', nose: '#3a2014', topTuft: false,
  back: (
    <Sil fill="#8D5B3A">
      <path d={(() => {
        const pts: string[] = [];
        const n = 15;
        for (let i = 0; i <= n; i++) {
          const t = Math.PI * (1.12 - (i / n) * 1.24);          // from lower-left, over the top, to lower-right
          const t2 = Math.PI * (1.12 - ((i + 0.5) / n) * 1.24);
          pts.push(`${(60 + Math.cos(t) * 56).toFixed(1)} ${(66 - Math.sin(t) * 62).toFixed(1)}`);
          if (i < n) pts.push(`${(60 + Math.cos(t2) * 46).toFixed(1)} ${(66 - Math.sin(t2) * 52).toFixed(1)}`);
        }
        return `M ${pts.join(' L ')} C 100 104 90 116 60 116 C 30 116 20 104 ${pts[0]} Z`;
      })()} />
    </Sil>
  ),
  ears: () => (
    <>
      <Sil fill="#F6DFC0"><circle cx="30" cy="34" r="7.5" /><circle cx="90" cy="34" r="7.5" /></Sil>
      <circle cx="31" cy="35" r="3.6" fill="#FFC2D1" /><circle cx="89" cy="35" r="3.6" fill="#FFC2D1" />
    </>
  ),
  face: (
    <>
      <path d="M 27 44 C 30 26 46 21 60 21 C 74 21 90 26 93 44 L 86 34 L 80 42 L 73 31 L 67 40 L 60 29 L 53 40 L 47 31 L 40 42 L 34 34 Z" fill="#8D5B3A" />
      <path d="M 27 44 L 34 34 L 40 42 L 47 31 L 53 40 L 60 29 L 67 40 L 73 31 L 80 42 L 86 34 L 93 44" fill="none" stroke={SK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {creamMuzzle('#FFF6E8')}
    </>
  ),
});

const fox = furry({
  fur: '#F58B3C', cream: '#FFF6EA', iris: '#8A5A1E', nose: '#3a2014',
  tail: a => wag(a, '80px 108px', (
    <>
      <Sil fill="#F58B3C">
        <path d="M 74 110 C 104 118 120 96 114 74 C 112 66 104 60 100 62 C 102 76 96 90 74 96 Z" />
      </Sil>
      <path d="M 100 62 C 104 60 112 66 114 76 C 115 82 114 88 112 92 C 108 84 102 78 99 70 Z" fill="#FFF6EA" />
    </>
  )),
  ears: () => (
    <>
      <Sil fill="#F58B3C">
        <path d="M 27 40 C 20 22 22 6 28 0 C 40 6 50 18 52 28 Z" />
        <path d="M 93 40 C 100 22 98 6 92 0 C 80 6 70 18 68 28 Z" />
      </Sil>
      <path d="M 28 0 C 25 4 23.5 9 23.4 14 L 34 6 Z M 92 0 C 95 4 96.500 9 96.600 14 L 86 6 Z" fill="#5A2E14" />
      <path d="M 31 34 C 27 24 28 15 31 10 C 38 15 44 22 46 29 Z" fill="#FFF6EA" />
      <path d="M 89 34 C 93 24 92 15 89 10 C 82 15 76 22 74 29 Z" fill="#FFF6EA" />
    </>
  ),
  face: <path d="M 24 55 C 30 52 42 56 50 64 C 55 60 65 60 70 64 C 78 56 90 52 96 55 C 94 70 78 82 60 82 C 42 82 26 70 24 55 Z" fill="#FFF6EA" />,
  bodyMarks: <path d="M 48 84 L 52 90 L 56 85 L 60 91 L 64 85 L 68 90 L 72 84 Z" fill="#FFF6EA" />,
});

// ── friends with their own shapes ──

function frog(a: boolean) {
  const G = '#6CCB5F', D = '#3E9B4B', C = '#F2FBD5';
  return (
    <>
      <Sil fill={G}><ellipse cx="29" cy="104" rx="14" ry="10" /><ellipse cx="91" cy="104" rx="14" ry="10" /></Sil>
      <Sil fill={G}><path d="M 60 72 C 80 72 88 96 82 112 L 38 112 C 32 96 40 72 60 72 Z" /></Sil>
      <path d="M 60 80 C 72 80 77 96 73 110 L 47 110 C 43 96 48 80 60 80 Z" fill={C} />
      <Sil fill={G} w={2.2}>
        <path d="M 44 92 C 50 92 52 104 51 111 L 54 116 L 49 114 L 46 118 L 43 114 L 38 116 L 41 110 C 39 102 40 92 44 92 Z" />
        <path d="M 76 92 C 70 92 68 104 69 111 L 66 116 L 71 114 L 74 118 L 77 114 L 82 116 L 79 110 C 81 102 80 92 76 92 Z" />
      </Sil>
      <Sil fill={G}>
        <circle cx="39" cy="30" r="15" /><circle cx="81" cy="30" r="15" />
        <path d="M 60 30 C 90 30 102 46 100 60 C 98 76 80 84 60 84 C 40 84 22 76 20 60 C 18 46 30 30 60 30 Z" />
      </Sil>
      <ellipse cx="39" cy="31" rx="11" ry="11.5" fill="#FFFFFF" /><ellipse cx="81" cy="31" rx="11" ry="11.5" fill="#FFFFFF" />
      <path d="M 22 62 C 28 84 92 84 98 62 C 90 76 30 76 22 62 Z" fill="#1d4a1a" opacity="0.16" />
      <circle cx="30" cy="52" r="2.6" fill={D} opacity="0.7" /><circle cx="90" cy="50" r="2.2" fill={D} opacity="0.7" /><circle cx="60" cy="38" r="2.4" fill={D} opacity="0.6" /><circle cx="68" cy="43" r="1.6" fill={D} opacity="0.6" />
      <Eyes x1={39} x2={81} y={32} r={8.6} iris="#B4701E" a={a} />
      <path d="M 54 52 v 1.4 M 66 52 v 1.4" stroke={SK} strokeWidth="2" strokeLinecap="round" />
      <path d="M 36 60 Q 60 80 84 60 Q 60 66 36 60 Z" fill="#8a2f3a" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="60" cy="70" rx="8" ry="3.6" fill="#FF9BB0" />
      <path d="M 33 58 Q 35 61 38 60 M 87 58 Q 85 61 82 60" fill="none" stroke={SK} strokeWidth="2" strokeLinecap="round" />
      <Blush x1={28} x2={92} y={64} rx={6.5} ry={4} />
      <ellipse cx="50" cy="38" rx="9" ry="3.6" fill="#FFFFFF" opacity="0.3" transform="rotate(-12 50 38)" />
    </>
  );
}

function bee(a: boolean) {
  const Y = '#FFD23F', B = '#5A341B';
  return (
    <>
      {flutter(a, '60px 70px', (
        <>
          <ellipse cx="27" cy="68" rx="20" ry="13" fill="#E6F6FF" stroke="#7FC4E8" strokeWidth="2.4" opacity="0.92" transform="rotate(28 27 68)" />
          <ellipse cx="93" cy="68" rx="20" ry="13" fill="#E6F6FF" stroke="#7FC4E8" strokeWidth="2.4" opacity="0.92" transform="rotate(-28 93 68)" />
          <path d="M 18 62 Q 28 64 36 72 M 102 62 Q 92 64 84 72" fill="none" stroke="#7FC4E8" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ))}
      <path d="M 60 119 L 55 110 L 65 110 Z" fill={B} stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <Sil fill={Y}><ellipse cx="60" cy="92" rx="24" ry="22" /></Sil>
      <path d="M 37 88 Q 60 96 83 88 L 84 97 Q 60 106 36 97 Z M 41 104 Q 60 112 79 104 Q 72 113 60 114 Q 48 113 41 104 Z" fill={B} />
      <path d="M 40 100 C 44 116 76 116 80 100 C 74 110 46 110 40 100 Z" fill="#3a1a08" opacity="0.16" />
      <Sil fill={B} w={2}><ellipse cx="45" cy="96" rx="3.4" ry="6" transform="rotate(20 45 96)" /><ellipse cx="75" cy="96" rx="3.4" ry="6" transform="rotate(-20 75 96)" /></Sil>
      <path d="M 48 26 C 44 14 38 8 32 8 M 72 26 C 76 14 82 8 88 8" fill="none" stroke={SK} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="31" cy="8" r="4.2" fill={B} stroke={SK} strokeWidth="1.6" /><circle cx="89" cy="8" r="4.2" fill={B} stroke={SK} strokeWidth="1.6" />
      <Sil fill={Y}>
        <path d="M 60 20 C 78 20 91 31 93 46 L 99 50 L 93 55 L 97 61 L 91 64 C 86 76 73 81 60 81 C 47 81 34 76 29 64 L 23 61 L 27 55 L 21 50 L 27 46 C 29 31 42 20 60 20 Z" />
        <path d={TOP_TUFT} />
      </Sil>
      {headShade}{headLight}
      <Eyes x1={45} x2={75} y={52} iris="#7A4A21" a={a} />
      <Smile x={60} y={64} w={5.4} />
      <Blush x1={33} x2={87} y={64} />
    </>
  );
}

function butterfly(a: boolean) {
  return (
    <>
      {flutter(a, '60px 66px', (
        <>
          <Sil fill="#C9A7FF">
            <path d="M 56 60 C 44 22 14 10 6 28 C 0 44 14 60 34 66 Z" />
            <path d="M 64 60 C 76 22 106 10 114 28 C 120 44 106 60 86 66 Z" />
          </Sil>
          <Sil fill="#FFB3D1">
            <path d="M 54 70 C 34 66 14 76 16 94 C 18 110 40 112 54 88 Z" />
            <path d="M 66 70 C 86 66 106 76 104 94 C 102 110 80 112 66 88 Z" />
          </Sil>
          <path d="M 50 54 C 40 30 20 20 13 31 C 9 42 20 54 36 60 Z" fill="#E2CCFF" /><path d="M 70 54 C 80 30 100 20 107 31 C 111 42 100 54 84 60 Z" fill="#E2CCFF" />
          <circle cx="24" cy="35" r="6.5" fill="#FFF3B0" /><circle cx="96" cy="35" r="6.5" fill="#FFF3B0" />
          <circle cx="24" cy="35" r="3" fill="#FF9EC4" /><circle cx="96" cy="35" r="3" fill="#FF9EC4" />
          <circle cx="38" cy="48" r="3" fill="#FFFFFF" opacity="0.8" /><circle cx="82" cy="48" r="3" fill="#FFFFFF" opacity="0.8" />
          <circle cx="32" cy="92" r="6" fill="#FFE0EC" /><circle cx="88" cy="92" r="6" fill="#FFE0EC" />
          <circle cx="32" cy="92" r="2.6" fill="#C9A7FF" /><circle cx="88" cy="92" r="2.6" fill="#C9A7FF" />
          <circle cx="43" cy="80" r="2.2" fill="#FFFFFF" opacity="0.8" /><circle cx="77" cy="80" r="2.2" fill="#FFFFFF" opacity="0.8" />
        </>
      ))}
      <path d="M 54 34 C 50 20 44 14 38 16 M 66 34 C 70 20 76 14 82 16" fill="none" stroke={SK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="37" cy="16" r="3.6" fill="#8B5CF6" stroke={SK} strokeWidth="1.6" /><circle cx="83" cy="16" r="3.6" fill="#8B5CF6" stroke={SK} strokeWidth="1.6" />
      <Sil fill="#8B6FE8"><path d="M 60 66 C 68 66 70 86 67 100 C 65 108 55 108 53 100 C 50 86 52 66 60 66 Z" /></Sil>
      <path d="M 53 82 Q 60 85 67 82 M 53.500 92 Q 60 95 66.500 92" fill="none" stroke="#6B4FD0" strokeWidth="2" strokeLinecap="round" />
      <Sil fill="#A892F5"><ellipse cx="60" cy="52" rx="20" ry="18" /></Sil>
      <path d="M 42 58 C 46 72 74 72 78 58 C 72 66 48 66 42 58 Z" fill="#2a1466" opacity="0.14" />
      <ellipse cx="51" cy="40" rx="7" ry="3" fill="#FFFFFF" opacity="0.4" transform="rotate(-20 51 40)" />
      <Eyes x1={51} x2={69} y={52} r={6.4} iris="#5B3FC4" a={a} />
      <Smile x={60} y={60} w={3.6} />
      <Blush x1={43} x2={77} y={60} rx={3.6} ry={2.2} />
    </>
  );
}

function owl(a: boolean) {
  const F = '#B98A5E', D = '#8A5F3A', C = '#FFF1DC';
  return (
    <>
      <path d="M 46 112 l -4 6 M 50 113 v 6 M 54 112 l 4 6 M 66 112 l -4 6 M 70 113 v 6 M 74 112 l 4 6" stroke={SK} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M 46 112 l -4 6 M 50 113 v 6 M 54 112 l 4 6 M 66 112 l -4 6 M 70 113 v 6 M 74 112 l 4 6" stroke="#F6A02D" strokeWidth="2.6" strokeLinecap="round" />
      {flutter(a, '60px 84px', (
        <Sil fill={D}>
          <path d="M 34 70 C 16 76 12 96 20 110 L 26 104 L 30 112 L 35 104 L 40 110 C 44 96 44 80 34 70 Z" />
          <path d="M 86 70 C 104 76 108 96 100 110 L 94 104 L 90 112 L 85 104 L 80 110 C 76 96 76 80 86 70 Z" />
        </Sil>
      ))}
      <Sil fill={F}><path d="M 60 66 C 82 66 90 88 86 102 C 83 113 72 116 60 116 C 48 116 37 113 34 102 C 30 88 38 66 60 66 Z" /></Sil>
      <path d="M 60 76 C 74 76 78 92 76 102 C 74 111 67 113 60 113 C 53 113 46 111 44 102 C 42 92 46 76 60 76 Z" fill={C} />
      {[[52, 88], [60, 88], [68, 88], [56, 96], [64, 96], [52, 104], [60, 104], [68, 104]].map(([x, y], i) => (
        <path key={i} d={`M ${x - 3.4} ${y - 1.6} Q ${x} ${y + 3.6} ${x + 3.4} ${y - 1.6}`} fill="none" stroke="#D9B48A" strokeWidth="1.8" strokeLinecap="round" />
      ))}
      {bodyShade}
      <Sil fill={F}>
        <path d="M 60 20 C 80 20 96 30 98 48 L 104 52 L 98 57 L 102 63 L 95 66 C 90 78 76 84 60 84 C 44 84 30 78 25 66 L 18 63 L 22 57 L 16 52 L 22 48 C 24 30 40 20 60 20 Z" />
        <path d="M 30 32 C 24 22 22 12 24 4 C 34 8 44 16 48 24 Z M 90 32 C 96 22 98 12 96 4 C 86 8 76 16 72 24 Z" />
      </Sil>
      <path d="M 27 21 C 26 16 26 12 27 9 C 32 12 37 16 40 20 Z M 93 21 C 94 16 94 12 93 9 C 88 12 83 16 80 20 Z" fill={D} />
      <path d="M 60 38 C 52 28 34 28 28 42 C 24 56 32 70 46 70 C 54 70 58 66 60 62 C 62 66 66 70 74 70 C 88 70 96 56 92 42 C 86 28 68 28 60 38 Z" fill={C} />
      <path d="M 52 24 L 56 30 L 60 24 L 64 30 L 68 24" fill="none" stroke={D} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {headShade}{headLight}
      <Eyes x1={44} x2={76} y={51} r={10.4} iris="#E08A1E" a={a} />
      <path d="M 55 59 Q 60 56 65 59 Q 64 67 60 71 Q 56 67 55 59 Z" fill="#F6A02D" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <ellipse cx="58.500" cy="61" rx="1.4" ry="2" fill="#FFFFFF" opacity="0.6" />
      <Blush x1={32} x2={88} y={67} rx={5.4} ry={3.2} />
    </>
  );
}

function parrot(a: boolean) {
  const R = '#EF5A4C', Bl = '#3E8BE8', Y = '#FFD23F';
  return (
    <>
      <Sil fill={Bl}><path d="M 52 106 L 44 124 L 54 116 L 60 126 L 66 116 L 76 124 L 68 106 Z" /></Sil>
      <path d="M 57 108 L 60 122 L 63 108 Z" fill={Y} />
      <path d="M 46 112 l -4 6 M 50 113 v 6 M 54 112 l 4 6 M 66 112 l -4 6 M 70 113 v 6 M 74 112 l 4 6" stroke={SK} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M 46 112 l -4 6 M 50 113 v 6 M 54 112 l 4 6 M 66 112 l -4 6 M 70 113 v 6 M 74 112 l 4 6" stroke="#8C8F9C" strokeWidth="2.6" strokeLinecap="round" />
      {flutter(a, '60px 84px', (
        <>
          <Sil fill={Bl}>
            <path d="M 36 72 C 16 78 12 98 20 112 L 26 105 L 30 113 L 35 105 L 40 110 C 44 96 44 82 36 72 Z" />
            <path d="M 84 72 C 104 78 108 98 100 112 L 94 105 L 90 113 L 85 105 L 80 110 C 76 96 76 82 84 72 Z" />
          </Sil>
          <path d="M 34 76 C 24 80 20 90 22 98 C 28 94 34 92 40 94 C 41 86 39 80 34 76 Z" fill={Y} />
          <path d="M 86 76 C 96 80 100 90 98 98 C 92 94 86 92 80 94 C 79 86 81 80 86 76 Z" fill={Y} />
        </>
      ))}
      <Sil fill={R}><path d="M 60 68 C 80 68 88 90 84 102 C 81 113 71 116 60 116 C 49 116 39 113 36 102 C 32 90 40 68 60 68 Z" /></Sil>
      <path d="M 60 78 C 72 78 76 92 74 102 C 72 110 66 113 60 113 C 54 113 48 110 46 102 C 44 92 48 78 60 78 Z" fill="#FF8A73" />
      {bodyShade}
      <Sil fill={R}>
        <path d="M 60 22 C 80 22 94 32 96 48 L 102 52 L 96 57 L 100 63 L 93 66 C 88 78 75 83 60 83 C 45 83 32 78 27 66 L 20 63 L 24 57 L 18 52 L 24 48 C 26 32 40 22 60 22 Z" />
        <path d="M 50 26 C 46 14 48 6 54 4 C 56 10 58 14 60 18 C 60 10 64 2 70 4 C 72 12 70 20 68 26 Z" />
      </Sil>
      <path d="M 34 44 C 38 36 50 36 54 46 C 56 56 50 64 42 64 C 34 62 30 54 34 44 Z M 86 44 C 82 36 70 36 66 46 C 64 56 70 64 78 64 C 86 62 90 54 86 44 Z" fill="#FFFFFF" />
      {headShade}{headLight}
      <Eyes x1={44} x2={76} y={51} r={8.4} iris="#3C6FB8" a={a} />
      <path d="M 50 58 C 54 52 66 52 70 58 C 72 68 66 76 60 80 C 60 72 54 70 50 66 Z" fill="#FFE9B8" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M 50 66 C 54 70 60 72 60 80 C 55 78 51 73 50 66 Z" fill="#4a2c17" />
      <ellipse cx="56" cy="59" rx="3" ry="1.6" fill="#FFFFFF" opacity="0.7" transform="rotate(-20 56 59)" />
      <Blush x1={31} x2={89} y={67} rx={5} ry={3} />
    </>
  );
}

function peacock(a: boolean) {
  const B = '#3F7FE0', T = '#27B8A6';
  return (
    <>
      {wag(a, '60px 96px', (
        <>
          {[-69, -46, -23, 0, 23, 46, 69].map(r => (
            <g key={r} transform={`rotate(${r} 60 96)`}>
              <path d="M 60 96 C 49 66 49 30 60 2 C 71 30 71 66 60 96 Z" fill={T} stroke={SK} strokeWidth="2.4" strokeLinejoin="round" />
              <path d="M 60 92 V 22" stroke="#178F82" strokeWidth="1.6" />
              <ellipse cx="60" cy="17" rx="8" ry="9.5" fill="#FFD23F" stroke={SK} strokeWidth="1.6" />
              <ellipse cx="60" cy="18" rx="5.4" ry="6.6" fill="#3F7FE0" />
              <ellipse cx="60" cy="19.500" rx="2.8" ry="3.4" fill="#231a5c" />
              <circle cx="58.600" cy="16" r="1.4" fill="#FFFFFF" opacity="0.8" />
            </g>
          ))}
        </>
      ))}
      <path d="M 50 112 l -4 6 M 54 113 v 6 M 58 112 l 4 6 M 62 112 l -4 6 M 66 113 v 6 M 70 112 l 4 6" stroke={SK} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M 50 112 l -4 6 M 54 113 v 6 M 58 112 l 4 6 M 62 112 l -4 6 M 66 113 v 6 M 70 112 l 4 6" stroke="#F6A02D" strokeWidth="2.6" strokeLinecap="round" />
      <Sil fill={B}><path d="M 60 76 C 76 76 82 92 80 102 C 78 112 69 115 60 115 C 51 115 42 112 40 102 C 38 92 44 76 60 76 Z" /></Sil>
      <path d="M 60 84 C 69 84 72 95 71 103 C 70 110 65 112 60 112 C 55 112 50 110 49 103 C 48 95 51 84 60 84 Z" fill="#7FB2FF" />
      <path d="M 40 100 C 42 116 78 116 80 100 C 76 111 44 111 40 100 Z" fill="#101a5c" opacity="0.18" />
      <path d="M 60 32 V 18 M 53 33 L 48 20 M 67 33 L 72 20" stroke={SK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="16" r="3.8" fill={T} stroke={SK} strokeWidth="1.6" /><circle cx="47" cy="18.500" r="3.8" fill={T} stroke={SK} strokeWidth="1.6" /><circle cx="73" cy="18.500" r="3.8" fill={T} stroke={SK} strokeWidth="1.6" />
      <Sil fill={B}><path d="M 60 30 C 78 30 88 40 88 54 L 93 58 L 88 62 C 84 74 73 80 60 80 C 47 80 36 74 32 62 L 27 58 L 32 54 C 32 40 42 30 60 30 Z" /></Sil>
      <path d="M 36 48 Q 44 40 54 46 M 84 48 Q 76 40 66 46 M 38 66 Q 46 72 54 68 M 82 66 Q 74 72 66 68" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M 33 62 C 38 80 82 80 87 62 C 80 74 40 74 33 62 Z" fill="#101a5c" opacity="0.16" />
      <ellipse cx="48" cy="38" rx="9" ry="3.6" fill="#FFFFFF" opacity="0.35" transform="rotate(-20 48 38)" />
      <Eyes x1={47} x2={73} y={57} r={7.4} iris="#2E6B4A" a={a} />
      <path d="M 55 63 Q 60 60.500 65 63 Q 63.500 69 60 72 Q 56.500 69 55 63 Z" fill="#F6A02D" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <Blush x1={38} x2={82} y={69} rx={4.4} ry={2.6} />
    </>
  );
}

function swan(a: boolean) {
  const Wt = '#FFFFFF', Sh = '#DCE6F5';
  return (
    <>
      <path d="M 50 112 l -4 6 M 54 113 v 6 M 58 112 l 4 6 M 70 112 l -4 6 M 74 113 v 6 M 78 112 l 4 6" stroke={SK} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M 50 112 l -4 6 M 54 113 v 6 M 58 112 l 4 6 M 70 112 l -4 6 M 74 113 v 6 M 78 112 l 4 6" stroke="#F6A02D" strokeWidth="2.6" strokeLinecap="round" />
      <Sil fill={Wt}>
        <path d="M 22 88 C 22 74 40 70 58 74 C 74 78 86 76 96 68 L 106 60 L 104 72 L 114 70 L 108 80 C 104 100 86 114 60 114 C 38 114 22 104 22 88 Z" />
      </Sil>
      <path d="M 26 98 C 34 112 54 114 62 114 C 84 114 100 102 106 86 C 96 100 78 108 60 108 C 44 108 32 104 26 98 Z" fill={Sh} />
      {flutter(a, '60px 92px', (
        <>
          <Sil fill={Wt} w={2.2}><path d="M 46 84 C 60 76 80 80 94 90 L 86 92 L 90 99 L 80 98 L 80 105 L 70 101 C 58 102 48 96 46 84 Z" /></Sil>
          <path d="M 54 88 Q 64 86 74 92 M 58 94 Q 66 94 72 98" fill="none" stroke={Sh} strokeWidth="2" strokeLinecap="round" />
        </>
      ))}
      <Sil fill={Wt}>
        <path d="M 30 92 C 24 76 30 64 38 54 C 42 48 42 42 40 36 L 58 34 C 62 46 58 56 52 64 C 46 72 46 82 50 92 Z" />
        <path d="M 48 12 C 64 12 74 22 74 34 L 78 38 L 73 41 C 70 50 60 54 48 54 C 36 54 26 46 24 36 L 19 33 L 24 30 C 26 20 34 12 48 12 Z" />
        <path d="M 44 14 Q 46 5 50 10 Q 53 4 56 15 Z" />
      </Sil>
      <path d="M 27 40 C 31 52 62 54 72 40 C 64 49 34 49 27 40 Z" fill="#6f86b8" opacity="0.2" />
      <ellipse cx="38" cy="21" rx="8" ry="3.2" fill="#FFFFFF" opacity="0.5" transform="rotate(-20 38 21)" />
      <Eyes x1={38} x2={60} y={32} r={7} iris="#3C6FB8" a={a} />
      <path d="M 43 39 Q 49 36.500 55 39 Q 54 46 49 50 Q 44 46 43 39 Z" fill="#FF8A3C" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M 45 39.500 Q 49 37.600 53 39.500 Q 49 41.500 45 39.500 Z" fill="#3a2014" />
      <Blush x1={30} x2={68} y={42} rx={4} ry={2.4} />
    </>
  );
}

function dragon(a: boolean) {
  const G = '#5CC98A', D = '#2F9B66', C = '#FFF2C4', H = '#FFE7A8';
  return (
    <>
      {wag(a, '78px 108px', (
        <>
          <Sil fill={G}><path d="M 76 110 C 100 116 114 104 112 88 C 111 80 104 78 100 82 C 102 92 94 98 76 98 Z" /></Sil>
          <Sil fill={H} w={2}><path d="M 104 80 L 116 70 L 114 86 Z" /></Sil>
        </>
      ))}
      {flutter(a, '60px 84px', (
        <>
          <Sil fill="#9BE3B8">
            <path d="M 38 80 C 24 62 10 62 4 70 C 10 72 12 78 10 84 C 16 82 20 86 20 92 C 26 88 32 90 38 94 Z" />
            <path d="M 82 80 C 96 62 110 62 116 70 C 110 72 108 78 110 84 C 104 82 100 86 100 92 C 94 88 88 90 82 94 Z" />
          </Sil>
          <path d="M 36 82 C 26 72 16 70 8 71 M 36 84 C 28 80 22 82 18 86 M 84 82 C 94 72 104 70 112 71 M 84 84 C 92 80 98 82 102 86" fill="none" stroke={D} strokeWidth="1.6" strokeLinecap="round" />
        </>
      ))}
      <Sil fill={G}><ellipse cx="41" cy="111" rx="10.5" ry="6.5" /><ellipse cx="79" cy="111" rx="10.5" ry="6.5" /></Sil>
      <Sil fill={G}><path d={BODY} /></Sil>
      <path d="M 60 82 C 71 82 75 93 73 103 C 71 111 66 113 60 113 C 54 113 49 111 47 103 C 45 93 49 82 60 82 Z" fill={C} />
      <path d="M 48 92 Q 60 96 72 92 M 47.500 100 Q 60 104 72.500 100 M 50 108 Q 60 111 70 108" fill="none" stroke="#E9CF86" strokeWidth="1.8" strokeLinecap="round" />
      {bodyShade}
      <Sil fill={G} w={2.2}><ellipse cx="49" cy="101" rx="5.6" ry="8" transform="rotate(12 49 101)" /><ellipse cx="71" cy="101" rx="5.6" ry="8" transform="rotate(-12 71 101)" /></Sil>
      <Sil fill={H}>
        <path d="M 38 28 C 30 20 28 10 32 2 C 40 8 46 16 48 24 Z" /><path d="M 82 28 C 90 20 92 10 88 2 C 80 8 74 16 72 24 Z" />
      </Sil>
      <Sil fill={G}>
        <path d="M 60 21 C 79 21 93 31 96 46 L 104 46 L 98 54 L 104 60 L 95 63 C 90 76 75 82 60 82 C 45 82 30 76 25 63 L 16 60 L 22 54 L 16 46 L 24 46 C 27 31 41 21 60 21 Z" />
      </Sil>
      <Sil fill={D} w={1.8}><path d="M 52 22 L 55 14 L 58 21 L 60 12 L 62 21 L 65 14 L 68 22 Z" /></Sil>
      <ellipse cx="60" cy="68" rx="19" ry="12" fill="#8EE0AE" />
      <circle cx="33" cy="44" r="2.2" fill={D} opacity="0.55" /><circle cx="87" cy="42" r="2.2" fill={D} opacity="0.55" /><circle cx="29" cy="52" r="1.6" fill={D} opacity="0.55" /><circle cx="91" cy="51" r="1.6" fill={D} opacity="0.55" />
      {headShade}{headLight}
      <Eyes x1={43} x2={77} y={50} iris="#C97A12" a={a} />
      <path d="M 54 62 q 1.4 -2 2.800 0 M 63.200 62 q 1.4 -2 2.800 0" fill="none" stroke={SK} strokeWidth="1.8" strokeLinecap="round" />
      <Smile x={60} y={68} w={6} />
      <path d="M 50 67 Q 52 70 54 68.500 M 70 67 Q 68 70 66 68.500" fill="none" stroke={SK} strokeWidth="1.8" strokeLinecap="round" />
      <Blush x1={32} x2={88} y={64} />
    </>
  );
}

function turtle(a: boolean) {
  const G = '#7DD3C0', D = '#3FA892', S = '#C98A4B', S2 = '#E0AB6E', C = '#FFF2C4';
  return (
    <>
      <Sil fill={S}><path d="M 60 66 C 90 66 102 84 100 98 C 98 112 80 118 60 118 C 40 118 22 112 20 98 C 18 84 30 66 60 66 Z" /></Sil>
      <path d="M 60 70 C 84 70 95 84 94 96 C 92 106 78 112 60 112 C 42 112 28 106 26 96 C 25 84 36 70 60 70 Z" fill={S2} />
      <path d="M 28 86 L 36 80 M 92 86 L 84 80 M 26 100 L 36 100 M 94 100 L 84 100 M 40 72 L 44 80 M 80 72 L 76 80" stroke={S} strokeWidth="2.4" strokeLinecap="round" />
      <Sil fill={G}>
        <path d="M 26 92 C 12 90 6 98 8 104 C 14 108 24 106 32 100 Z" /><path d="M 94 92 C 108 90 114 98 112 104 C 106 108 96 106 88 100 Z" />
        <ellipse cx="44" cy="114" rx="9" ry="5.6" /><ellipse cx="76" cy="114" rx="9" ry="5.6" />
      </Sil>
      <Sil fill={C} w={2.2}><path d="M 60 80 C 74 80 80 90 78 100 C 76 109 68 112 60 112 C 52 112 44 109 42 100 C 40 90 46 80 60 80 Z" /></Sil>
      <path d="M 60 81 V 111 M 43 94 H 77 M 45 103 H 75" stroke="#E9CF86" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 44 102 C 48 113 72 113 76 102 C 72 109 48 109 44 102 Z" fill="#3a1a08" opacity="0.12" />
      {wag(a, '60px 70px', (
        <>
          <Sil fill={G}><path d="M 60 18 C 80 18 94 30 94 48 C 94 66 80 78 60 78 C 40 78 26 66 26 48 C 26 30 40 18 60 18 Z" /></Sil>
          <circle cx="40" cy="30" r="2.6" fill={D} opacity="0.5" /><circle cx="48" cy="25" r="1.8" fill={D} opacity="0.5" /><circle cx="78" cy="28" r="2.4" fill={D} opacity="0.5" /><circle cx="84" cy="36" r="1.6" fill={D} opacity="0.5" />
          <path d="M 28 56 C 34 80 86 80 92 56 C 84 71 36 71 28 56 Z" fill="#0f4a3f" opacity="0.15" />
          <ellipse cx="46" cy="28" rx="11" ry="4.4" fill="#FFFFFF" opacity="0.38" transform="rotate(-22 46 28)" />
          <Eyes x1={45} x2={75} y={48} iris="#2F8F6F" a={a} />
          <Smile x={60} y={61} w={6} />
          <path d="M 50 60 Q 52 63 54 61.500 M 70 60 Q 68 63 66 61.500" fill="none" stroke={SK} strokeWidth="1.8" strokeLinecap="round" />
          <Blush x1={34} x2={86} y={60} />
        </>
      ))}
    </>
  );
}

export type ArtKey =
  | 'dragon' | 'owl' | 'raccoon' | 'parrot' | 'peacock' | 'rabbit' | 'koala'
  | 'deer' | 'swan' | 'fox' | 'frog' | 'turtle' | 'squirrel' | 'hedgehog'
  | 'bee' | 'butterfly';

export const CRITTER_ART: Record<ArtKey, (a: boolean) => ReactNode> = {
  dragon, owl, raccoon, parrot, peacock, rabbit, koala: koalaArt, deer, swan, fox, frog, turtle, squirrel, hedgehog, bee, butterfly,
};
