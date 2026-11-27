import { test, expect } from '@playwright/test';
import { makeChallenge, CREATURE_NAME } from '../../lib/creatureChallenges';

// The wild-friend riddles shared by Journey and Trail Walk. Thousands of
// random riddles, each checked for an honest answer key.

test('every wild-friend riddle has exactly one right answer, and it is really right', () => {
  for (const tier of ['tiny', 'small', 'big']) {
    for (let i = 0; i < 3000; i++) {
      const ch = makeChallenge(i, tier);
      const right = ch.options.filter(o => o.correct);
      const where = `${tier} ${ch.type}: ${ch.ask} ${JSON.stringify(ch.options)}`;
      expect(right.length, where).toBe(1);
      expect(new Set(ch.options.map(o => o.label)).size, `no duplicate choices — ${where}`).toBe(ch.options.length);
      const ans = right[0].label;
      if (ch.type === 'count') {
        const n = [...ch.display].filter(c => c === ch.creature).length;
        expect(Number(ans), where).toBe(n);
        for (const o of ch.options) expect(Number(o.label), where).toBeGreaterThan(0);
      }
      if (ch.type === 'memory') {
        expect(ch.memoryFull, where).toContain(ans);
        expect(ch.memoryCast, where).not.toContain(ans);
        for (const o of ch.options.filter(o => !o.correct)) expect(ch.memoryFull, `a decoy was in the lineup — ${where}`).not.toContain(o.label);
        // Muse round 7: the missing dragon (🐲) still showed "here" because 🐉 is
        // drawn the same. Judge by the PICTURE (animal name), not the emoji.
        const names = (l: string[]) => l.map(c => CREATURE_NAME[c]);
        expect(names(ch.memoryCast!), `the missing animal still looks "here" — ${where}`).not.toContain(CREATURE_NAME[ans]);
        expect(new Set(names(ch.memoryFull!)).size, `two look-alike animals in the lineup — ${where}`).toBe(ch.memoryFull!.length);
        for (const o of ch.options.filter(o => !o.correct)) expect(names(ch.memoryFull!), `a decoy looks like someone in the lineup — ${where}`).not.toContain(CREATURE_NAME[o.label]);
        // the empty spot shows where the missing one stood, and it is not the friend in front of Kailia
        expect(ch.memoryFull![ch.memoryGap!], where).toBe(ans);
        expect(ans, `the friend in front of Kailia went missing — ${where}`).not.toBe(ch.creature);
      }
      if (ch.type === 'color') expect(ans, where).toBe(ch.display);
      if (ch.type === 'word') {
        const name = CREATURE_NAME[ch.creature];
        expect(ch.ask, where).toContain(name);
        expect(CREATURE_NAME[ans], where).toBe(name);
        for (const o of ch.options.filter(o => !o.correct)) expect(CREATURE_NAME[o.label], `a wrong picture is also a ${name} — ${where}`).not.toBe(name);
      }
    }
  }
});
