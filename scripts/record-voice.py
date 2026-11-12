"""
Record Noel's lines with a free, open-source voice (Kokoro, Apache-2.0).

Reads voice/lines.json (made by `node scripts/voice-lines.mjs`), records
every sentence that has no recording yet into public/voice/*.mp3 and lists
them in public/voice/manifest.json, which lib/voice.ts reads. Runs fully
offline once the model is downloaded: nothing is sent to any service, and
lines with a child's name are never in lines.json.

Setup (once):
  python3 -m venv .venv-voice && .venv-voice/bin/pip install kokoro-onnx soundfile numpy
  mkdir -p ~/kokoro && cd ~/kokoro
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
  (ffmpeg must be installed)

Run:
  .venv-voice/bin/python scripts/record-voice.py            # record Noel's missing lines
  .venv-voice/bin/python scripts/record-voice.py --speaker kailia   # Kailia's cheers
  .venv-voice/bin/python scripts/record-voice.py --redo     # re-record everything (after a voice change)
  KOKORO_DIR=/path/to/models ... to use another model folder
"""
import hashlib, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

# ── Who's speaking ── (voices picked by Kelvin from the samples)
SPEAKERS = {
    # Noel: every instruction and line in the games
    'noel':   dict(voice=os.environ.get('NOEL_VOICE', 'am_fenrir'), speed=0.95, pitch=1.0,
                   lines='voice/lines.json', out='public/voice', key='sentence'),
    # Kailia: short happy cheers, a young girl's voice (a grown voice lifted a little)
    'kailia': dict(voice=os.environ.get('KAILIA_VOICE', 'af_heart'), speed=1.0, pitch=1.16,
                   lines='voice/kailia-lines.json', out='public/voice/kailia', key='exact'),
}
SPEAKER = sys.argv[sys.argv.index('--speaker') + 1] if '--speaker' in sys.argv else 'noel'
CFG = SPEAKERS[SPEAKER]
VOICE, SPEED = CFG['voice'], CFG['speed']
LANG = 'en-gb' if VOICE.startswith('b') else 'en-us'

# How names are said, as phonemes (the voice guesses names wrong otherwise).
NAME_SOUNDS = {
    'nˈoʊl': 'noʊˈɛl',          # Noel: "no-EL", like Christmas
    # 'kˈaɪliə': 'kˈeɪliə',     # Kailia: set once Kelvin confirms
}

OUT = CFG['out']
MANIFEST = f'{OUT}/manifest.json'
MODELS = os.path.expanduser(os.environ.get('KOKORO_DIR', '~/kokoro'))


def voice_key(sentence: str) -> str:
    """Must match voiceKey() in lib/voice.ts."""
    s = sentence.lower().replace('‘', "'").replace('’', "'")
    return re.sub(r"[^a-z0-9']+", ' ', s).strip()


def spoken(sentence: str) -> str:
    """What the device voice would say (as lib/voice.ts): SHOUTED words read as normal words."""
    s = re.sub(r'\b[A-Z]{2,}\b', lambda m: m.group(0) if m.group(0) in ('GO', 'OK') else m.group(0).lower(), sentence)
    return s.replace('…', '...').replace('—', ', ').replace('–', ', ')


def phonemes(k: Kokoro, text: str) -> str:
    p = k.tokenizer.phonemize(text, LANG)
    for wrong, right in NAME_SOUNDS.items():
        p = re.sub(rf'(?<![\wʰ-˿]){re.escape(wrong)}(?![\wʰ-˿])', right, p)
    return p


def tidy(audio: np.ndarray, sr: int) -> np.ndarray:
    """Trim long silence at the ends, even out loudness, keep peaks safe."""
    level = np.abs(audio)
    loud = np.where(level > 0.02)[0]
    if len(loud):
        a, b = max(0, loud[0] - int(0.04 * sr)), min(len(audio), loud[-1] + int(0.12 * sr))
        audio = audio[a:b]
    rms = float(np.sqrt(np.mean(audio ** 2))) or 1e-6
    audio = audio * (0.1 / rms)                     # about -20 dBFS speech level
    peak = float(np.abs(audio).max())
    if peak > 0.89:
        audio = audio * (0.89 / peak)
    fade = int(0.01 * sr)
    audio[:fade] *= np.linspace(0, 1, fade); audio[-fade:] *= np.linspace(1, 0, fade)
    return audio


def main():
    redo = '--redo' in sys.argv
    lines = json.load(open(CFG['lines']))
    keyof = (lambda l: l) if CFG['key'] == 'exact' else voice_key
    os.makedirs(OUT, exist_ok=True)
    manifest = {} if redo or not os.path.exists(MANIFEST) else json.load(open(MANIFEST))
    if redo:
        for f in os.listdir(OUT):  # only this speaker's folder (Kailia's is a subfolder)
            if f.endswith('.mp3'): os.remove(os.path.join(OUT, f))
    k = Kokoro(f'{MODELS}/kokoro-v1.0.onnx', f'{MODELS}/voices-v1.0.bin')

    made = 0
    for sentence in lines:
        key = keyof(sentence)
        if not key or (key in manifest and os.path.exists(f'{OUT}/{manifest[key]}')):
            continue
        audio, sr = k.create(phonemes(k, spoken(sentence)), voice=VOICE, speed=SPEED, is_phonemes=True)
        audio = tidy(audio, sr)
        name = hashlib.sha1(f'{VOICE}|{SPEED}|{key}'.encode()).hexdigest()[:12] + '.mp3'
        with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
            sf.write(wav.name, audio, sr)
            lift = ['-af', f"rubberband=pitch={CFG['pitch']}:formant=shifted"] if CFG['pitch'] != 1.0 else []
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav.name, *lift, '-ac', '1', '-ar', '24000',
                            '-codec:a', 'libmp3lame', '-b:a', '48k', f'{OUT}/{name}'], check=True)
        manifest[key] = name
        made += 1
        if made % 50 == 0:
            print(f'{made} recorded…', flush=True)

    keep = {keyof(l) for l in lines}
    for key in [k_ for k_ in manifest if k_ not in keep]:
        try: os.remove(f'{OUT}/{manifest[key]}')
        except FileNotFoundError: pass
        del manifest[key]
    json.dump(dict(sorted(manifest.items())), open(MANIFEST, 'w'), indent=1)
    open(MANIFEST, 'a').write('\n')
    print(f'{SPEAKER}: recorded {made} new lines in voice {VOICE}. {len(manifest)} in total.')


if __name__ == '__main__':
    main()
