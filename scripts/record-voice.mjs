// ── Record Noel's lines with a natural AI voice (ElevenLabs) ──
// Reads voice/lines.json (made by scripts/voice-lines.mjs), records every
// sentence that has no recording yet, and saves them as small MP3 files in
// public/voice/ plus public/voice/manifest.json, which lib/voice.ts reads.
//
// Only the app's own fixed sentences are sent to ElevenLabs, once, from a
// developer machine. The app itself never talks to ElevenLabs and no child
// data is ever sent (lines with a child's name aren't in lines.json).
//
//   ELEVENLABS_API_KEY=... node scripts/record-voice.mjs --samples
//       records one test line in a few candidate voices into
//       voice/samples/ so a grown-up can pick Noel's voice.
//   ELEVENLABS_API_KEY=... NOEL_VOICE_ID=<id> node scripts/record-voice.mjs
//       records every missing sentence in that voice.
//   add --redo to record everything again (e.g. after changing voice).

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const KEY = process.env.ELEVENLABS_API_KEY;
const API = 'https://api.elevenlabs.io/v1';
const MODEL = process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2';
const OUT = 'public/voice';
const MANIFEST = `${OUT}/manifest.json`;

// Gentle and warm, with a little bounce: steady enough to sound the same
// on every line, expressive enough to sound happy.
const SETTINGS = { stability: 0.55, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: 0.92 };

/** Must match voiceKey() in lib/voice.ts. */
export function voiceKey(sentence) {
  return sentence.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
}

/** What the device voice would say: emoji gone, SHOUTED words as normal words (as in lib/voice.ts). */
function spoken(sentence) {
  return sentence.replace(/\b[A-Z]{2,}\b/g, w => (w === 'GO' || w === 'OK' ? w : w.toLowerCase()));
}

async function tts(voiceId, text) {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS }),
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    const msg = await r.text();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await new Promise(res => setTimeout(res, 2000 * attempt)); continue; }
    throw new Error(`ElevenLabs ${r.status}: ${msg.slice(0, 300)}`);
  }
}

async function samples() {
  const r = await fetch(`${API}/voices`, { headers: { 'xi-api-key': KEY } });
  if (!r.ok) throw new Error(`Could not list voices: ${r.status} ${await r.text()}`);
  const { voices } = await r.json();
  const want = process.env.SAMPLE_VOICES?.split(',');
  const pick = want
    ? voices.filter(v => want.includes(v.voice_id) || want.includes(v.name))
    : voices.filter(v => /warm|friendly|gentle|soft|calm|child|kid|animat|character|cartoon|narrat|story/i
        .test(`${v.name} ${v.description ?? ''} ${Object.values(v.labels ?? {}).join(' ')}`)).slice(0, 8);
  mkdirSync('voice/samples', { recursive: true });
  const line = "Hi friend! I'm Noel. Let's help Kailia find the fireflies. Ready? Let's go!";
  for (const v of pick) {
    const file = `voice/samples/${v.name.replace(/[^a-z0-9]+/gi, '-')}-${v.voice_id}.mp3`;
    writeFileSync(file, await tts(v.voice_id, line));
    console.log(`${file}  (${Object.values(v.labels ?? {}).join(', ')})`);
  }
}

async function recordAll() {
  const voiceId = process.env.NOEL_VOICE_ID;
  if (!voiceId) throw new Error('Set NOEL_VOICE_ID (pick one with --samples first).');
  const redo = process.argv.includes('--redo');
  const lines = JSON.parse(readFileSync('voice/lines.json', 'utf8'));
  mkdirSync(OUT, { recursive: true });
  const manifest = !redo && existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  if (redo) readdirSync(OUT).filter(f => f.endsWith('.mp3')).forEach(f => rmSync(`${OUT}/${f}`));

  let made = 0, chars = 0;
  for (const sentence of lines) {
    const key = voiceKey(sentence);
    if (!key || (manifest[key] && existsSync(`${OUT}/${manifest[key]}`))) continue;
    const file = `${createHash('sha1').update(`${voiceId}|${key}`).digest('hex').slice(0, 12)}.mp3`;
    writeFileSync(`${OUT}/${file}`, await tts(voiceId, spoken(sentence)));
    manifest[key] = file;
    made++; chars += sentence.length;
    if (made % 25 === 0) { writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n'); console.log(`${made} recorded…`); }
  }
  // drop recordings for sentences the app no longer says
  const keep = new Set(lines.map(voiceKey));
  for (const k of Object.keys(manifest)) if (!keep.has(k)) { rmSync(`${OUT}/${manifest[k]}`, { force: true }); delete manifest[k]; }
  writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n');
  console.log(`Recorded ${made} new sentences (${chars} characters). ${Object.keys(manifest).length} in total.`);
}

if (!KEY) { console.error('Set ELEVENLABS_API_KEY first.'); process.exit(1); }
(process.argv.includes('--samples') ? samples() : recordAll()).catch(e => { console.error(e.message); process.exit(1); });
