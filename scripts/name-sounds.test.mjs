// Kailia and Noel must always be said the way Kelvin says them (2026-11-20):
//   Kailia = "KAI-LEE-yah" ("Kai" rhymes with sky, then "Lee-ya")
//   Noel   = "No-EL" (two beats, "El" like the letter L)
// They were once set right, then changed to "kay-LEE-uh" / "Nole" while the
// lines were being recorded, and nothing noticed. These checks fail if the
// name sounds in scripts/record-voice.py change, if any recorded line with a
// name was made with other sounds, or if the device voice stops respelling.
// Run: node scripts/name-sounds.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { deviceNames } from '../lib/nameSounds.ts';

const KAILIA_SOUND = 'kˌaɪlˈiːjɐ';
const NOEL_SOUND = 'noʊˈɛl';
const NAMES_TAG = `names:${KAILIA_SOUND},${NOEL_SOUND}`;
const HAS_NAME = /\b(kailia|noel)/i;
const script = readFileSync('scripts/record-voice.py', 'utf8');

test('the recording script uses the agreed name sounds', () => {
  assert.match(script, new RegExp(`^KAILIA_SOUND = '${KAILIA_SOUND}'$`, 'm'));
  assert.match(script, new RegExp(`^NOEL_SOUND = '${NOEL_SOUND}'$`, 'm'));
  assert.doesNotMatch(script, /'ke[ɪi]l/, 'Kailia must not start with "kay"');
});

/** Must match clip_name() in scripts/record-voice.py. */
function clipName(voice, speed, key, ends) {
  let tag = ends == null ? `${voice}|${speed}|${key}` : `${voice}|${speed}|${ends}|${key}`;
  if (HAS_NAME.test(key)) tag += '|' + NAMES_TAG;
  return createHash('sha1').update(tag).digest('hex').slice(0, 12) + '.mp3';
}
const voiceKey = s => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();

test("every recorded line of Noel's with a name was made with the agreed sounds", () => {
  const manifest = JSON.parse(readFileSync('public/voice/manifest.json', 'utf8'));
  const lines = JSON.parse(readFileSync('voice/lines.json', 'utf8'));
  const named = [...new Set(lines.map(voiceKey).filter(k => HAS_NAME.test(k)))];
  assert.ok(named.length > 20, 'expected many lines with a name');
  for (const key of named) {
    assert.ok(manifest[key], `not recorded: "${key}" (run scripts/record-voice.py)`);
    assert.equal(manifest[key], clipName('am_fenrir', '1.0', key),
      `"${key}" was recorded with other name sounds: re-run scripts/record-voice.py`);
    assert.ok(existsSync(`public/voice/${manifest[key]}`), `missing file for "${key}"`);
  }
});

test('no other speaker has a name line recorded the old way', () => {
  for (const dir of ['kailia', 'pets/shelly', 'pets/nova', 'pets/kiko', 'pets/flick', 'pets/sage', 'pets/ember']) {
    const f = `public/voice/${dir}/manifest.json`;
    if (!existsSync(f)) continue;
    const manifest = JSON.parse(readFileSync(f, 'utf8'));
    for (const key of Object.keys(manifest).filter(k => HAS_NAME.test(k))) {
      assert.ok(false, `${dir} has a line with a name ("${key}"): add a check for its file name here`);
    }
  }
});

test('the device voice says the names the same way', () => {
  assert.equal(deviceNames('Help Kailia find Noel!'), 'Help Kai-leeya find No-el!');
  assert.equal(deviceNames("Kailia's lantern and Noel's letters"), "Kai-leeya's lantern and No-el's letters");
  assert.equal(deviceNames('Noelle'), 'Noelle');
  const voice = readFileSync('lib/voice.ts', 'utf8');
  assert.match(voice, /sentences\(clean\)\.map\(p => deviceNames\(/, 'say() must pass device-voice lines through deviceNames');
});
