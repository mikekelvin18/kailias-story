// ── Mesh rig ──
// Makes parts of one flat picture move on their own (a wing flaps, a tail
// wags, the head tilts, the eyes blink) without cutting the picture into
// pieces. The picture is laid on a fine grid of triangles (WebGL) and each
// moving part bends the grid around its joint, fading out softly toward
// the rest of the body, so there are no seams, gaps or sliding parts.
//
// Plain TypeScript, no React: RigCanvas.tsx mounts it. The numbers for each
// pet (where its joints and eyes are) live in rigs.ts, not in code.

/** An oval area of the picture, in fractions of its width/height (0–1). */
export interface RigRegion {
  cx: number; cy: number;
  rx: number; ry: number;
  /** how soft the edge is: 0 = hard, 0.5 = fades over half the radius */
  soft: number;
}

/** A part that swings around a joint, e.g. a wing around the shoulder. */
export interface RigBone {
  name: string;
  /** the joint it turns around (fractions of width/height) */
  pivot: [number, number];
  /** which part of the picture moves with it */
  region: RigRegion;
  /** gentle idle swing: degrees either way, seconds per swing */
  swing: { deg: number; period: number; phase?: number };
  /** bigger, quicker swing for a moment after a tap */
  poke?: { deg: number; period: number };
}

/** An eye that blinks by closing toward its middle line. */
export interface RigEye {
  cx: number; cy: number;
  rx: number; ry: number;
}

export interface PetRig {
  /** empty margin around the picture so a part can move past its edge (fraction of width) */
  pad: number;
  /** for a drawn cycle (e.g. run-1…run-5): pictures per second */
  fps?: number;
  /** soft light from the upper left and shade toward the lower right, so a
      flat picture reads as rounded (as LiveCharacter's overlays did) */
  shade?: boolean;
  bones: RigBone[];
  eyes: RigEye[];
}

const GRID = 56;               // squares per side; fine enough to bend smoothly
const POKE_SECONDS = 1.3;
const BLINK = { close: 0.07, hold: 0.04, open: 0.09 };

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function regionWeight(r: RigRegion, x: number, y: number, w: number, h: number) {
  const dx = (x - r.cx * w) / (r.rx * w);
  const dy = (y - r.cy * h) / (r.ry * h);
  const d = Math.sqrt(dx * dx + dy * dy);
  return 1 - smoothstep(1 - r.soft, 1 + r.soft, d);
}

const VERT = `
attribute vec2 aPos; attribute vec2 aUv; varying vec2 vUv;
void main() { vUv = aUv; gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `
precision mediump float; varying vec2 vUv; uniform sampler2D uTex; uniform float uShade;
void main() {
  vec4 c = texture2D(uTex, vUv);
  float light = (1.0 - smoothstep(0.0, 0.75, distance(vUv, vec2(0.28, 0.18)))) * 0.10;
  float shade = smoothstep(0.45, 1.1, vUv.x * 0.45 + vUv.y * 0.75) * 0.14;
  c.rgb = min(c.rgb * (1.0 + uShade * (light - shade)), vec3(c.a));
  gl_FragColor = c;
}`;

export interface RigPlayer {
  /** bigger moves for a moment, e.g. on tap */
  poke(): void;
  destroy(): void;
}

/**
 * Starts the rig on a canvas. Returns null when WebGL is unavailable, so
 * the caller keeps showing the plain picture. With `still` it draws one
 * resting frame and never animates (Reduce motion).
 */
export function startRig(canvas: HTMLCanvasElement, pictures: HTMLImageElement | HTMLCanvasElement | (HTMLImageElement | HTMLCanvasElement)[], rig: PetRig, still: boolean, seed = 0): RigPlayer | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return null;

  // several pictures (all the same size) = a drawn cycle, played at rig.fps
  // with the same bends on top, e.g. Kailia's run frames with her hair and
  // cape streaming behind her
  const frames = Array.isArray(pictures) ? pictures : [pictures];
  const img = frames[0];
  const W = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const H = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  const padX = rig.pad * W, padY = rig.pad * W;     // same margin on every side
  const CW = W + 2 * padX, CH = H + 2 * padY;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.uniform1f(gl.getUniformLocation(prog, 'uShade'), rig.shade ? 1 : 0);

  // grid: rest positions (picture pixels), texture coords, triangles
  const n = GRID + 1;
  const rest = new Float32Array(n * n * 2);
  const uv = new Float32Array(n * n * 2);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = (j * n + i) * 2;
    uv[k] = i / GRID; uv[k + 1] = j / GRID;
    rest[k] = uv[k] * W; rest[k + 1] = uv[k + 1] * H;
  }
  const idx = new Uint16Array(GRID * GRID * 6);
  let q = 0;
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
    const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
    idx.set([a, b, c, b, d, c], q); q += 6;
  }

  // how strongly each grid point follows each bone / eye (fixed, so precomputed)
  const boneW = rig.bones.map(bn => {
    const w = new Float32Array(n * n);
    for (let p = 0; p < n * n; p++) w[p] = regionWeight(bn.region, rest[p * 2], rest[p * 2 + 1], W, H);
    return w;
  });
  const eyeW = rig.eyes.map(e => {
    const r: RigRegion = { cx: e.cx, cy: e.cy, rx: e.rx, ry: e.ry, soft: 0.35 };
    const w = new Float32Array(n * n);
    for (let p = 0; p < n * n; p++) w[p] = regionWeight(r, rest[p * 2], rest[p * 2 + 1], W, H);
    return w;
  });

  const pos = new Float32Array(n * n * 2);
  const posBuf = gl.createBuffer();
  const uvBuf = gl.createBuffer();
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  const aUv = gl.getAttribLocation(prog, 'aUv');
  gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const textures = frames.map(f => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  });
  const fps = rig.fps ?? 10;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  // blinking: random gaps, now and then a double blink
  const rand = mulberry(seed || 1);
  let nextBlink = 1 + rand() * 2.5;
  let blinkAt = -10;
  let pokeAt = -10;
  const blinkAmount = (t: number) => {
    if (t >= nextBlink) {
      blinkAt = nextBlink;
      nextBlink = t + (rand() < 0.2 ? 0.35 : 2.4 + rand() * 3);
    }
    const s = t - blinkAt;
    if (s < 0) return 0;
    if (s < BLINK.close) return s / BLINK.close;
    if (s < BLINK.close + BLINK.hold) return 1;
    if (s < BLINK.close + BLINK.hold + BLINK.open) return 1 - (s - BLINK.close - BLINK.hold) / BLINK.open;
    return 0;
  };

  const draw = (t: number) => {
    resize();
    const blink = still ? 0 : blinkAmount(t);
    const sincePoke = t - pokeAt;
    const excite = still ? 0 : Math.max(0, 1 - sincePoke / POKE_SECONDS);
    const angles = rig.bones.map(bn => {
      if (still) return 0;
      const idle = bn.swing.deg * Math.sin(2 * Math.PI * (t / bn.swing.period + (bn.swing.phase ?? 0)));
      const burst = bn.poke ? bn.poke.deg * Math.sin(2 * Math.PI * sincePoke / bn.poke.period) * excite : 0;
      return (idle + burst) * Math.PI / 180;
    });

    for (let p = 0; p < n * n; p++) {
      let x = rest[p * 2], y = rest[p * 2 + 1];
      // eyes close toward their middle line (squash 92% at the deepest)
      for (let e = 0; e < rig.eyes.length; e++) {
        const w = eyeW[e][p];
        if (w > 0 && blink > 0) { const cy = rig.eyes[e].cy * H; y = cy + (y - cy) * (1 - 0.92 * blink * w); }
      }
      // each part turns around its joint, by its weight at this point
      for (let b = 0; b < rig.bones.length; b++) {
        const w = boneW[b][p];
        if (w <= 0 || angles[b] === 0) continue;
        const a = angles[b] * w;
        const px = rig.bones[b].pivot[0] * W, py = rig.bones[b].pivot[1] * H;
        const dx = x - px, dy = y - py, c = Math.cos(a), s = Math.sin(a);
        x = px + dx * c - dy * s; y = py + dx * s + dy * c;
      }
      pos[p * 2] = ((x + padX) / CW) * 2 - 1;
      pos[p * 2 + 1] = 1 - ((y + padY) / CH) * 2;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, textures[still ? 0 : Math.floor(t * fps) % textures.length]);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  };

  let raf = 0;
  const t0 = performance.now() - (seed % 7) * 1000;
  const loop = (now: number) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
  if (still) draw(0); else raf = requestAnimationFrame(loop);
  // a still frame is redrawn when the canvas changes size
  const ro = new ResizeObserver(() => { if (still) draw(0); });
  ro.observe(canvas);

  return {
    poke() { pokeAt = (performance.now() - t0) / 1000; },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

function mulberry(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
