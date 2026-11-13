'use client';

// ── Noel reads the games aloud ──
// Pre-readers can't read Noel's speech bubbles, so every game's story card
// and Noel's bubble are read out loud. A game opts in by putting
// `data-read-aloud` on the element: whenever that element appears or its
// words change, Noel says the new words (lib/voice.ts picks his voice).
// Tapping a marked bubble reads it again.
//
// Games that already speak for themselves (Reading, Sensory, the friends'
// games, the Garden, the care pet) don't mark their bubbles, so nothing is
// ever read twice. Mounted once in app/play/layout.tsx.

import { useEffect } from 'react';
import { soundEnabled } from '@/lib/accessibility';
import { sayLine, hush } from '@/lib/voice';

const SELECTOR = '[data-read-aloud]';

function wordsOf(el: Element): string {
  const h = el as HTMLElement;
  // innerText skips hidden bits and puts each line on its own row; a
  // heading row with no end punctuation gets a full stop so Noel pauses
  // bits marked data-no-read (a small "Chapter 3" heading) are shown, not spoken
  let text = h.innerText ?? h.textContent ?? '';
  h.querySelectorAll<HTMLElement>('[data-no-read]').forEach(skip => {
    const t = skip.innerText ?? '';
    if (t) text = text.replace(t, '');
  });
  return text
    .split(/\n+/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
    .map((l, i, all) => (i < all.length - 1 && !/[.!?…:,;—-]$/.test(l) ? `${l}.` : l))
    .join(' ');
}

function onScreen(el: Element) {
  const h = el as HTMLElement;
  if (!h.isConnected || (h.offsetParent === null && getComputedStyle(h).position !== 'fixed')) return false;
  const r = h.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export default function NoelVoice() {
  useEffect(() => {
    const heard = new WeakMap<Element, string>();
    let pending: ReturnType<typeof setTimeout> | null = null;

    let reading: Element | null = null; // the card or bubble Noel is reading now

    const scan = () => {
      pending = null;
      let next: { el: Element; words: string } | null = null;
      document.querySelectorAll(SELECTOR).forEach(el => {
        if (!onScreen(el)) return;
        const words = wordsOf(el);
        if (!words || heard.get(el) === words) return;
        heard.set(el, words);
        next = next ?? { el, words }; // the first new line on the page wins
      });
      if (next) {
        const { el, words } = next as { el: Element; words: string };
        reading = el;
        if (soundEnabled()) sayLine(words);
      } else if (reading && (!onScreen(reading) || !reading.matches(SELECTOR))) {
        // the story card closed (the game started) or the bubble went quiet:
        // stop mid-sentence instead of talking over the game
        reading = null;
        hush();
      }
    };
    // games re-draw many times a second; look at most a few times a second
    const soon = () => { if (!pending) pending = setTimeout(scan, 160); };

    const watcher = new MutationObserver(soon);
    watcher.observe(document.body, { subtree: true, childList: true, characterData: true });
    soon();

    // tap a bubble to hear it again
    const replay = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.(SELECTOR);
      if (el && soundEnabled()) { reading = el; sayLine(wordsOf(el), { force: true }); }
    };
    document.addEventListener('click', replay);

    return () => {
      watcher.disconnect();
      if (pending) clearTimeout(pending);
      document.removeEventListener('click', replay);
      hush();
    };
  }, []);

  return null;
}
