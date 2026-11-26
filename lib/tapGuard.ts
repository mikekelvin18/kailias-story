// ── Was that a tap, or a scroll? ──
// On iPhones a finger lifting after a SCROLL also sends "touchend". The
// sound code wakes (and, if the phone left it stuck, rebuilds) the music
// and effects engines on every touchend; doing that at the end of a scroll
// grabbed the phone's sound away from Noel mid-sentence, so scrolling the
// story card made the sound stop (Kelvin, 2026-11-25). Sound code asks
// here first and ignores the end of a scroll.

let startX = 0, startY = 0, startAt = 0, moved = false;

if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (!t) return;
    startX = t.clientX; startY = t.clientY; startAt = Date.now(); moved = false;
  }, { capture: true, passive: true });
  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (t && Math.hypot(t.clientX - startX, t.clientY - startY) > 10) moved = true;
  }, { capture: true, passive: true });
  window.addEventListener('scroll', () => { if (Date.now() - startAt < 10_000) moved = true; }, { capture: true, passive: true });
}

/** True when this touchend ended a scroll or a drag, not a tap. */
export function endedAScroll(e: Event): boolean {
  return e.type === 'touchend' && moved;
}
