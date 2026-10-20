// Usage: node scripts/motion-keyframes.mjs  (prints CSS to paste into app/globals.css)
// Samples smooth eased motion at 12 fps ("on twos") so loops have the
// held-frame, hand-animated feel. Output is pasted into globals.css.
const FPS = 12;
const f = (n) => +n.toFixed(3);
function gen(name, dur, fn) {
  const N = Math.round(dur * FPS);
  let out = `@keyframes ${name} {\n`;
  for (let i = 0; i <= N; i++) {
    const p = i / N; const v = fn(p % 1);
    const parts = [];
    if (v.x || v.y) parts.push(`translate(${f(v.x||0)}px, ${f(v.y||0)}px)`);
    if (v.r) parts.push(`rotate(${f(v.r)}deg)`);
    if (v.sx !== undefined) parts.push(`scale(${f(v.sx)}, ${f(v.sy)})`);
    out += `  ${f(p*100)}% { transform: ${parts.join(' ') || 'none'};${v.o!==undefined?` opacity: ${f(v.o)};`:''} }\n`;
  }
  return out + '}\n';
}
const TAU = Math.PI*2;
// gentle hop: rise, hang, fall, squash on landing, stretch on take-off
const hop = (h, sq) => (p) => {
  const y = -h * Math.pow(Math.sin(Math.PI * p), 1.4);
  const speed = Math.abs(Math.cos(Math.PI * p));            // fast near ground
  const land = Math.pow(Math.max(0, Math.cos(TAU * p)), 8);  // only right at the ground
  const sy = 1 + sq * 0.8 * speed * (1 - land) - sq * 1.3 * land;
  return { y, sx: 1 / sy, sy };
};
console.log(gen('float', 3, hop(10, 0.05)));
console.log(gen('critter-bob', 1.8, (p) => ({ ...hop(6, 0.07)(p), r: -3 * Math.sin(TAU * p) })));
console.log(gen('wiggle', 2, (p) => ({ r: 4 * Math.sin(TAU * p), sx: 1 + 0.02 * Math.sin(2 * TAU * p), sy: 1 - 0.02 * Math.sin(2 * TAU * p) })));
console.log(gen('sparkle', 1.5, (p) => { const s = 0.82 + 0.18 * (0.5 + 0.5 * Math.cos(TAU * p)); return { r: 12 * Math.sin(TAU * p), sx: s, sy: s, o: 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(TAU * p)) }; }));
