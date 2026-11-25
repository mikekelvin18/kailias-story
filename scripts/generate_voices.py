#!/usr/bin/env python3
"""
generate_voices.py: make every voice clip the app plays, offline and free.

Kailia's voice (the main character, the narrator of the story)
  1. A short reference clip (8-12 s) is made with Kokoro-82M (kokoro-onnx,
     Apache-2.0): voices af_bella 0.5 + af_sky 0.5 blended, speed 1.2,
     pitched up 3 semitones, then joined with af_heart (also pitched up).
     It is saved to scripts/voice-ref/kailia-ref.wav and only remade when
     its settings change.
  2. Every Kailia line is spoken by Chatterbox (resemble-ai/chatterbox, MIT)
     copying that reference clip: exaggeration 0.85, cfg_weight 0.3,
     temperature 0.8 (exaggeration 1.0 for lines tagged "excited"), then
     pitched up 1 semitone.

Other characters (only the ones switched on in VOICES below) are spoken by
Kokoro directly.

Every clip then goes through the same ffmpeg chain: high-pass 80 Hz, treble
+4.5 dB at 3.5 kHz, light compression, two-pass loudnorm to -16 LUFS /
-1.5 dB true peak, mono 24 kHz, 96 kbps MP3.

Clips are saved to public/audio/<speaker>/<words>-<hash>.mp3. The hash covers
the text and the voice settings, so an unchanged line is skipped and a changed
one is remade. public/audio/manifest.json is rebuilt at the end:
  { "kailia": { "<voiceKey of the sentence>": "kailia/<file>.mp3" }, ... }
lib/voice.ts plays from that manifest and falls back to the device's own
voice for any sentence with no clip.

Where the lines come from
  - Kailia's story lines: every { who: 'kailia', text: "..." } in
    app/story/page.tsx, one clip per sentence (split the same way as the app).
  - Kailia's cheers: voice/kailia-lines.json.
  - Extra lines for any speaker: voice/extra-lines.json (optional), a list of
    { "who": "kailia", "text": "...", "tags": ["excited"] }.

Run it
  Chatterbox needs a GPU to be quick (a laptop CPU takes minutes per line):
  use the Colab notebook scripts/generate_voices.ipynb (free GPU). Or locally:
    python3 -m venv .venv && . .venv/bin/activate
    pip install kokoro-onnx soundfile numpy chatterbox-tts torchaudio
    python3 scripts/generate_voices.py                 # everything that changed
    python3 scripts/generate_voices.py --only kailia   # one speaker
    python3 scripts/generate_voices.py --ref-only      # just Kailia's reference clip (Kokoro, no GPU)
    python3 scripts/generate_voices.py --dry-run       # list what would be made
  ffmpeg must be installed (Colab has it; macOS: brew install ffmpeg).

Privacy: everything runs on your own machine (or your own Colab). The app only
ever plays the finished MP3 files; it never calls a voice service.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'audio'
REF_DIR = ROOT / 'scripts' / 'voice-ref'
MODEL_DIR = Path(os.environ.get('KOKORO_DIR', Path.home() / '.cache' / 'kokoro-onnx'))
MODEL_URLS = {
    'kokoro-v1.0.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx',
    'voices-v1.0.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin',
}

# ─────────────────────────────────────────────────────────────────────────────
# THE VOICE MAP: change voices here.
#   engine 'chatterbox': copies the reference clip (Kailia)
#   engine 'kokoro':     a Kokoro voice name, or a blend {name: weight}
#   pitch:               semitones up (+) or down (-) after speaking
#   enabled: False       keeps that speaker's current recordings untouched
# Noel and the pet friends already have recorded voices Kelvin picked by ear
# (public/voice/, scripts/record-voice.py). The reviewer's Kokoro picks for
# them are listed below, switched off; set enabled to True to use them.
# ─────────────────────────────────────────────────────────────────────────────
VOICES = {
    'kailia': {
        'engine': 'chatterbox',
        'reference': {
            # part 1: bella + sky blended, quick, pitched up 3 semitones
            'blend': {'af_bella': 0.5, 'af_sky': 0.5}, 'speed': 1.2, 'pitch': 3,
            # part 2: af_heart, pitched up, joined on the end
            'join': {'voice': 'af_heart', 'speed': 1.1, 'pitch': 3},
            'text': ("Hi! I'm Kailia! I love adventures with my best friend Noel. "
                     "Look at the fireflies! Let's count them, one, two, three!"),
            'join_text': "Wow, so much fun! Let's go again!",
        },
        'exaggeration': 0.85, 'excited_exaggeration': 1.0,
        'cfg_weight': 0.3, 'temperature': 0.8,
        'pitch': 1,
        'enabled': True,
    },
    'noel': {'engine': 'kokoro', 'voice': 'am_michael', 'speed': 0.9, 'pitch': 0, 'enabled': False},
    'flick': {'engine': 'kokoro', 'voice': 'af_sky', 'speed': 1.15, 'pitch': 0, 'enabled': False},
}

# How names are spelled FOR THE VOICE ONLY (the screen always shows the real
# spelling). Kelvin 2026-11-20: Kailia = "KAI-LEE-yah" ("Kai" rhymes with sky,
# then "Lee-ya"); Noel = "No-EL", two beats. If a voice still says it wrong,
# change the spelling here and run again.
SAY_AS = {
    'Kailia': 'Kye-LEE-yah',
    'Noel': 'No-ell',
}

# the ffmpeg chain every clip goes through (before the loudness pass)
FILTERS = 'highpass=f=80,treble=g=4.5:f=3500,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2'
LOUDNESS = {'I': -16, 'TP': -1.5, 'LRA': 11}

# ── text helpers (must match lib/voice.ts) ───────────────────────────────────

def voice_key(sentence: str) -> str:
    """Same as voiceKey() in lib/voice.ts."""
    s = sentence.lower().replace('‘', "'").replace('’', "'")
    return re.sub(r"[^a-z0-9']+", ' ', s).strip()


def split_sentences(text: str) -> list[str]:
    """Same as sentences() in lib/voice.ts."""
    clean = re.sub(r'[\U0001F300-\U0001FAFF☀-➿️‍]', '', text)
    clean = re.sub(r'[*_~]', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    parts = [p.strip() for p in re.split(r'(?<=[.!?…])\s+(?=[A-Z0-9"\'“‘])', clean) if p.strip()]
    return parts or [clean]


def tts_text(text: str) -> str:
    for name, sound in SAY_AS.items():
        text = re.sub(rf'\b{name}\b', sound, text)
    return text


def slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:40] or 'line'

# ── gathering the lines ──────────────────────────────────────────────────────

LINES_FILE: str | None = None


def gather_lines(split: bool = True) -> list[dict]:
    lines: list[dict] = []
    if LINES_FILE:  # a ready list (the Colab notebook brings its own copy)
        lines = json.loads(Path(LINES_FILE).read_text(encoding='utf-8'))
        return explode(lines) if split else lines
    story_file = ROOT / 'app' / 'story' / 'page.tsx'
    story = story_file.read_text(encoding='utf-8') if story_file.exists() else ''
    for m in re.finditer(r"""\{\s*who:\s*'(\w+)',\s*text:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*\}""", story):
        who, raw = m.group(1), m.group(2)
        text = bytes(raw[1:-1], 'utf-8').decode('unicode_escape') if '\\' in raw else raw[1:-1]
        lines.append({'who': who, 'text': text, 'tags': ['excited'] if '!!' in text else []})
    cheers = ROOT / 'voice' / 'kailia-lines.json'
    if cheers.exists():
        for t in json.loads(cheers.read_text(encoding='utf-8')):
            lines.append({'who': 'kailia', 'text': t, 'tags': ['excited']})
    extra = ROOT / 'voice' / 'extra-lines.json'
    if extra.exists():
        lines += json.loads(extra.read_text(encoding='utf-8'))
    return explode(lines) if split else lines


def explode(lines: list[dict]) -> list[dict]:
    """One clip per sentence, exactly as the app splits them."""
    out, seen = [], set()
    for line in lines:
        for s in split_sentences(line['text']):
            k = (line['who'], voice_key(s))
            if not k[1] or k in seen:
                continue
            seen.add(k)
            excited = 'excited' in line.get('tags', []) or s.endswith('!!')
            out.append({'who': line['who'], 'text': s, 'excited': excited})
    return out

# ── audio helpers ────────────────────────────────────────────────────────────

def need(cmd: str):
    if not shutil.which(cmd):
        sys.exit(f'{cmd} is not installed (needed for the audio clean-up).')


def ffmpeg(*args: str) -> str:
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr[-1500:])
    return r.stderr


def pitch_filter(semitones: float, rate: int) -> str:
    """Pitch up/down by semitones while keeping the speed the same."""
    if not semitones:
        return 'anull'
    f = 2 ** (semitones / 12)
    return f'asetrate={int(rate * f)},aresample={rate},atempo={1 / f:.6f}'


def finish(wav_in: Path, mp3_out: Path, rate: int, semitones: float = 0):
    """Pitch, clean-up chain, two-pass loudnorm, mono 24 kHz 96 kbps MP3."""
    pre = f'{pitch_filter(semitones, rate)},{FILTERS}'
    ln = f"loudnorm=I={LOUDNESS['I']}:TP={LOUDNESS['TP']}:LRA={LOUDNESS['LRA']}"
    log = ffmpeg('-i', str(wav_in), '-af', f'{pre},{ln}:print_format=json', '-f', 'null', '-')
    measured = json.loads(log[log.rindex('{'):log.rindex('}') + 1])
    mp3_out.parent.mkdir(parents=True, exist_ok=True)
    if 'inf' in str(measured['input_i']):
        # too short for a loudness reading (under 0.4 s, e.g. "Ta-da!"):
        # bring its loudest point up to the same true-peak limit instead
        vol = ffmpeg('-i', str(wav_in), '-af', f'{pre},volumedetect', '-f', 'null', '-')
        peak = float(vol.split('max_volume:')[1].split('dB')[0])
        gain = LOUDNESS['TP'] - peak
        ffmpeg('-i', str(wav_in), '-af', f'{pre},volume={gain:.2f}dB', '-ac', '1', '-ar', '24000',
               '-c:a', 'libmp3lame', '-b:a', '96k', str(mp3_out))
        return
    second = (f"{ln}:measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
              f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
              f":offset={measured['target_offset']}")
    mp3_out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg('-i', str(wav_in), '-af', f'{pre},{second}', '-ac', '1', '-ar', '24000',
           '-c:a', 'libmp3lame', '-b:a', '96k', str(mp3_out))

# ── Kokoro ───────────────────────────────────────────────────────────────────

_kokoro = None

def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro  # pip install kokoro-onnx
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        for name, url in MODEL_URLS.items():
            dest = MODEL_DIR / name
            if not dest.exists():
                print(f'  downloading {name} ...')
                urllib.request.urlretrieve(url, dest)
        _kokoro = Kokoro(str(MODEL_DIR / 'kokoro-v1.0.onnx'), str(MODEL_DIR / 'voices-v1.0.bin'))
    return _kokoro


def kokoro_style(voice):
    """A voice name, or a blend {name: weight}."""
    k = kokoro()
    if isinstance(voice, str):
        return voice
    return sum(k.get_voice_style(name) * w for name, w in voice.items())


def kokoro_wav(text: str, voice, speed: float, path: Path) -> int:
    import soundfile as sf
    samples, rate = kokoro().create(tts_text(text), voice=kokoro_style(voice), speed=speed, lang='en-us')
    sf.write(str(path), samples, rate)
    return rate

# ── Kailia's reference clip ──────────────────────────────────────────────────

def reference_clip(cfg: dict) -> Path:
    ref = cfg['reference']
    tag = hashlib.sha1(json.dumps(ref, sort_keys=True).encode()).hexdigest()[:8]
    out = REF_DIR / 'kailia-ref.wav'
    stamp = REF_DIR / 'kailia-ref.settings'
    if out.exists() and stamp.exists() and stamp.read_text().strip() == tag:
        return out
    print('Making Kailia\'s reference clip with Kokoro ...')
    REF_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        r1 = kokoro_wav(ref['text'], ref['blend'], ref['speed'], t / 'a.wav')
        j = ref['join']
        r2 = kokoro_wav(ref['join_text'], j['voice'], j['speed'], t / 'b.wav')
        ffmpeg('-i', str(t / 'a.wav'), '-af', f"{pitch_filter(ref['pitch'], r1)},aresample=24000", str(t / 'a2.wav'))
        ffmpeg('-i', str(t / 'b.wav'), '-af', f"{pitch_filter(j['pitch'], r2)},aresample=24000", str(t / 'b2.wav'))
        # a short breath between the two halves, then trim to 12 s at most
        ffmpeg('-i', str(t / 'a2.wav'), '-i', str(t / 'b2.wav'), '-filter_complex',
               '[0:a]apad=pad_dur=0.35[a];[a][1:a]concat=n=2:v=0:a=1,atrim=0:12,'
               'loudnorm=I=-18:TP=-2,aresample=24000', '-ac', '1', str(out))
    stamp.write_text(tag)
    secs = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(out)],
                                capture_output=True, text=True).stdout.strip() or 0)
    print(f'  {out.relative_to(ROOT)} ({secs:.1f} s)')
    return out

# ── Chatterbox ───────────────────────────────────────────────────────────────

_cb = None

def chatterbox():
    global _cb
    if _cb is None:
        import torch
        from chatterbox.tts import ChatterboxTTS  # pip install chatterbox-tts
        device = 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu')
        print(f'Loading Chatterbox on {device} (CPU is slow: use the Colab notebook) ...')
        _cb = ChatterboxTTS.from_pretrained(device=device)
    return _cb


def chatterbox_wav(text: str, ref: Path, cfg: dict, excited: bool, path: Path) -> int:
    import torchaudio as ta
    model = chatterbox()
    # Chatterbox now and then returns silence for a very short cheer
    # ("Wheee!"): try again a few times before giving up on the line
    for attempt in range(4):
        wav = model.generate(
            tts_text(text), audio_prompt_path=str(ref),
            exaggeration=cfg['excited_exaggeration'] if excited else cfg['exaggeration'],
            cfg_weight=cfg['cfg_weight'], temperature=cfg['temperature'] + 0.05 * attempt,
        )
        if wav.numel() > model.sr * 0.25 and float(wav.abs().max()) > 0.02:
            break
        print(f'  (silent take, trying again)')
    else:
        raise RuntimeError(f'Chatterbox gave only silence for: {text}')
    ta.save(str(path), wav, model.sr)
    return model.sr

# ── main ─────────────────────────────────────────────────────────────────────

def clip_name(who: str, line: dict, cfg: dict) -> str:
    settings = {k: v for k, v in cfg.items() if k != 'enabled'}
    h = hashlib.sha1(json.dumps([line['text'], line['excited'], SAY_AS, FILTERS, LOUDNESS, settings],
                                sort_keys=True).encode()).hexdigest()[:10]
    return f'{who}/{slug(line["text"])}-{h}.mp3'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--only', help='one speaker (e.g. kailia)')
    ap.add_argument('--ref-only', action='store_true', help="just make Kailia's reference clip")
    ap.add_argument('--dry-run', action='store_true', help='list what would be made')
    ap.add_argument('--force', action='store_true', help='remake every clip')
    ap.add_argument('--lines', help='read the lines from this JSON list instead of the app ([{who, text, tags}])')
    ap.add_argument('--print-lines', action='store_true', help='print every line as JSON (for the Colab notebook)')
    args = ap.parse_args()
    global LINES_FILE
    LINES_FILE = args.lines
    if args.print_lines:
        print(json.dumps(gather_lines(split=False), indent=1, ensure_ascii=False))
        return
    need('ffmpeg')

    if args.ref_only:
        reference_clip(VOICES['kailia'])
        return

    lines = gather_lines()
    manifest_path = OUT / 'manifest.json'
    old = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest: dict[str, dict[str, str]] = {}
    todo = []
    for line in lines:
        who = line['who']
        cfg = VOICES.get(who)
        if not cfg or not cfg.get('enabled'):
            continue
        name = clip_name(who, line, cfg)
        manifest.setdefault(who, {})[voice_key(line['text'])] = name
        if args.only and who != args.only:
            if voice_key(line['text']) in old.get(who, {}):
                manifest[who][voice_key(line['text'])] = old[who][voice_key(line['text'])]
            continue
        if args.force or not (OUT / name).exists():
            todo.append((who, line, cfg, name))

    print(f'{len(lines)} sentences, {len(todo)} to make, {sum(map(len, manifest.values())) - len(todo)} unchanged.')
    if args.dry_run:
        for who, line, _, name in todo:
            print(f'  {who:8} {"(excited) " if line["excited"] else ""}{line["text"]}  ->  {name}')
        return

    ref = reference_clip(VOICES['kailia']) if any(t[0] == 'kailia' for t in todo) else None
    for i, (who, line, cfg, name) in enumerate(todo, 1):
        print(f'[{i}/{len(todo)}] {who}: {line["text"]}')
        with tempfile.TemporaryDirectory() as tmp:
            raw = Path(tmp) / 'raw.wav'
            if cfg['engine'] == 'chatterbox':
                rate = chatterbox_wav(line['text'], ref, cfg, line['excited'], raw)
            else:
                rate = kokoro_wav(line['text'], cfg['voice'], cfg.get('speed', 1.0), raw)
            finish(raw, OUT / name, rate, cfg.get('pitch', 0))

    # remove clips no line uses any more, then save the manifest
    keep = {f for m in manifest.values() for f in m.values()}
    for f in OUT.glob('*/*.mp3'):
        if f'{f.parent.name}/{f.name}' not in keep and f.parent.name in manifest:
            f.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=1, sort_keys=True) + '\n')
    print(f'Saved {manifest_path.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
