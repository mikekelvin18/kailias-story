// ── Movement and character states ──
// Every walking thing in a place (Kailia, the pet) is a Body: where it is,
// where it is going (a queue of waypoints), which way it faces, and its
// state. The state machine is deliberately small:
//
//   idle ──walkTo──▶ walk ──arrive──▶ idle (or the queued arrival action)
//   any  ──act(state, ms)──▶ reach | look | sniff | sad | cheer | dance
//                            └─ after ms ──▶ idle (or walk, if a target waits)
//   hold is a flag, not a state: Kailia can walk while carrying.
//
// Walking always wins over a one-shot reaction, so a child never waits on
// an animation: a tap to walk cancels whatever is playing.

export type BodyState = 'idle' | 'walk' | 'reach' | 'look' | 'sniff' | 'sad' | 'cheer' | 'dance';

export interface Body {
  x: number;
  y: number;
  path: { x: number; y: number }[];
  facing: 1 | -1;
  state: BodyState;
  /** when a one-shot state ends (ms timestamp), 0 for none */
  until: number;
  /** a reaction to play once the path ends */
  arrive: { state: BodyState; ms: number } | null;
  /** bumped on each new action, so CSS one-shots restart */
  n: number;
}

export function body(x: number, y: number): Body {
  return { x, y, path: [], facing: 1, state: 'idle', until: 0, arrive: null, n: 0 };
}

export function walkTo(b: Body, path: { x: number; y: number }[], arrive: Body['arrive'] = null): Body {
  if (!path.length) return b;
  return { ...b, path, state: 'walk', until: 0, arrive, n: b.n + 1 };
}

export function act(b: Body, state: BodyState, ms: number, now: number, face?: number): Body {
  const facing = face === undefined || Math.abs(face - b.x) < 4 ? b.facing : face > b.x ? 1 : -1;
  return { ...b, path: [], state, until: now + ms, arrive: null, facing, n: b.n + 1 };
}

export function face(b: Body, x: number): Body {
  if (Math.abs(x - b.x) < 4) return b;
  const facing = x > b.x ? 1 : -1;
  return facing === b.facing ? b : { ...b, facing };
}

/** advance one frame; returns the same object when nothing changed */
export function step(b: Body, dt: number, speed: number, now: number): Body {
  if (b.state !== 'walk') {
    if (b.until && now >= b.until) return { ...b, state: 'idle', until: 0 };
    return b;
  }
  const next = b.path[0];
  if (!next) {
    if (b.arrive) return { ...b, state: b.arrive.state, until: now + b.arrive.ms, arrive: null, n: b.n + 1 };
    return { ...b, state: 'idle' };
  }
  const dx = next.x - b.x, dy = next.y - b.y;
  const dist = Math.hypot(dx, dy);
  // ease into the stop over the last 40 px of the whole walk
  const last = b.path.length === 1;
  const v = speed * (last ? Math.max(0.35, Math.min(1, dist / 40)) : 1) * dt;
  const facing: 1 | -1 = Math.abs(dx) > 2 ? (dx > 0 ? 1 : -1) : b.facing;
  if (dist <= v || dist < 1) {
    return { ...b, x: next.x, y: next.y, path: b.path.slice(1), facing };
  }
  return { ...b, x: b.x + (dx / dist) * v, y: b.y + (dy / dist) * v, facing };
}

/** things lower on screen are closer: a little bigger and drawn on top */
export function depthScale(y: number) {
  return 0.86 + 0.24 * Math.max(0, Math.min(1, (y - 640) / 320));
}
