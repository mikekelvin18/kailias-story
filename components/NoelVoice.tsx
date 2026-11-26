'use client';

// ── Noel reads the games aloud ──
// Pre-readers can't read Noel's speech bubbles, so every game's story card
// and Noel's bubble are read out loud. A game opts in by putting
// `data-read-aloud` on the element: whenever that element appears or its
// words change, Noel says the new words (lib/voice.ts picks his voice).
//
// While a bubble is read, the sentence being read gets a soft yellow
// highlight (CSS Custom Highlight API, `::highlight(kp-reading)` in
// globals.css; browsers without it simply show no highlight). Tapping a
// sentence reads just that sentence again; the little speaker in the
// bubble's corner (drawn by globals.css) reads the whole bubble again.
// <ReadAloudControls> (components/NarrationPlayer.tsx) pauses, plays and
// replays the bubble it sits under.
//
// Games that already speak for themselves (Reading, Sensory, the friends'
// games, the Garden, the care pet) don't mark their bubbles, so nothing is
// ever read twice. Mounted once in app/play/layout.tsx.

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { soundEnabled } from '@/lib/accessibility';
import { sayLine, hush, hushOwn, splitSentences } from '@/lib/voice';

const OWNER = 'read-aloud';

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
    .join(' ')
    .replace(/([a-z][.!?…])(?=[A-Z])/g, '$1 '); // two sentences glued together on screen ("balloons!Listen")
}

function onScreen(el: Element) {
  const h = el as HTMLElement;
  if (!h.isConnected || (h.offsetParent === null && getComputedStyle(h).position !== 'fixed')) return false;
  const r = h.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// ── The reading highlight ──
type HighlightApi = { set: (name: string, h: unknown) => void; delete: (name: string) => void };
function highlights(): HighlightApi | null {
  const c = (globalThis as unknown as { CSS?: { highlights?: HighlightApi } }).CSS;
  const H = (globalThis as unknown as { Highlight?: unknown }).Highlight;
  return c?.highlights && H ? c.highlights : null;
}
export function clearReadingMark() { try { highlights()?.delete('kp-reading'); } catch { /* ignore */ } }
function markRange(r: Range | null) {
  const api = highlights();
  if (!api) return;
  try {
    if (!r) { api.delete('kp-reading'); return; }
    const H = (globalThis as unknown as { Highlight: new (...r: Range[]) => unknown }).Highlight;
    api.set('kp-reading', new H(r));
  } catch { /* ignore */ }
}

const squash = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Where each spoken sentence sits in the bubble's text, as DOM ranges (null = not found). */
function sentenceRanges(el: Element, sentences: string[]): (Range | null)[] {
  // every visible letter or digit of the bubble, with the text node it lives in
  const chars: { node: Text; at: number }[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: n => ((n.parentElement?.closest('[data-no-read]')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let flat = '';
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const t = n.data;
    for (let i = 0; i < t.length; i++) {
      if (/[a-z0-9]/i.test(t[i])) { chars.push({ node: n, at: i }); flat += t[i].toLowerCase(); }
    }
  }
  let from = 0;
  return sentences.map(s => {
    const key = squash(s);
    if (!key) return null;
    const i = flat.indexOf(key, from);
    if (i < 0) return null;
    from = i + key.length;
    const a = chars[i], b = chars[i + key.length - 1];
    try {
      const r = document.createRange();
      r.setStart(a.node, a.at);
      // stretch to the sentence's closing punctuation when it is right there
      let endAt = b.at + 1;
      while (endAt < b.node.data.length && /[.!?…"”'’)]/.test(b.node.data[endAt])) endAt++;
      r.setEnd(b.node, endAt);
      return r;
    } catch { return null; }
  });
}

/** Which sentence (of sentenceRanges) the finger landed on, or -1. */
function sentenceAt(ranges: (Range | null)[], x: number, y: number): number {
  return ranges.findIndex(r => !!r && Array.from(r.getClientRects()).some(b => x >= b.left - 4 && x <= b.right + 4 && y >= b.top - 4 && y <= b.bottom + 4));
}

// ── Reading one bubble (also used by the controls under a bubble) ──
let current: Element | null = null; // the card or bubble Noel is reading now (or read last)

/** Read a bubble aloud, the whole thing or just one sentence, highlighting as it goes. */
export function readBubble(el: Element, only?: number) {
  if (!soundEnabled()) return;
  const words = wordsOf(el);
  if (!words) return;
  current = el;
  const sentences = splitSentences(words);
  const ranges = sentenceRanges(el, sentences);
  if (only !== undefined && only >= 0 && sentences[only]) {
    sayLine(sentences[only], {
      force: true, owner: OWNER,
      onSentence: () => markRange(ranges[only]),
      onDone: () => markRange(null),
    });
    return;
  }
  sayLine(words, {
    force: true, owner: OWNER,
    onSentence: i => markRange(ranges[i] ?? null),
    onDone: () => markRange(null),
  });
}
/** Read the bubble that was read last again, from the start. */
export function replayBubble() { if (current?.isConnected) readBubble(current); }

export default function NoelVoice() {
  // Leaving a game: nothing it was saying carries over into the next one
  // (Muse round 4: Sense Explorer started with old Word Wizard lines).
  const path = usePathname();
  // (a cleanup: it runs before the next page's first line, never after it)
  useEffect(() => () => { hush(); clearReadingMark(); }, [path]);

  useEffect(() => {
    const heard = new WeakMap<Element, string>();
    let pending: ReturnType<typeof setTimeout> | null = null;

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
        current = el;
        if (soundEnabled()) {
          const ranges = sentenceRanges(el, splitSentences(words));
          sayLine(words, { owner: OWNER, onSentence: i => markRange(ranges[i] ?? null), onDone: () => markRange(null) });
        }
      } else if (current && (!onScreen(current) || !current.matches(SELECTOR))) {
        // the story card closed (the game started) or the bubble went quiet:
        // stop mid-sentence instead of talking over the game, but only our
        // own line: if the game already started its first line, let it finish
        current = null;
        markRange(null);
        hushOwn(OWNER);
      }
    };
    // games re-draw many times a second; look at most a few times a second
    const soon = () => { if (!pending) pending = setTimeout(scan, 160); };

    const watcher = new MutationObserver(soon);
    watcher.observe(document.body, { subtree: true, childList: true, characterData: true });
    soon();

    // tap a sentence to hear it again; tap the speaker corner to hear it all
    const replay = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.(SELECTOR);
      if (!el || !soundEnabled()) return;
      const box = el.getBoundingClientRect();
      const corner = e.clientX > box.right - 52 && e.clientY < box.top + 52;
      if (!corner) {
        const words = wordsOf(el);
        const i = sentenceAt(sentenceRanges(el, splitSentences(words)), e.clientX, e.clientY);
        if (i >= 0) { readBubble(el, i); return; }
      }
      readBubble(el);
    };
    document.addEventListener('click', replay);

    return () => {
      watcher.disconnect();
      if (pending) clearTimeout(pending);
      document.removeEventListener('click', replay);
      markRange(null);
      hush();
    };
  }, []);

  return null;
}
