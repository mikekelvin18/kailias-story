"""
Record Noel's lines with a free, open-source voice (Kokoro, Apache-2.0).

Reads voice/lines.json (made by `node scripts/voice-lines.mjs`), records
every sentence that has no recording yet into public/voice/*.mp3 and lists
them in public/voice/manifest.json, which lib/voice.ts reads. Runs fully
offline once the model is downloaded: nothing is sent to any service, and
lines with a child's name are never in lines.json.

Setup (once):
  python3 -m venv .venv-voice && .venv-voice/bin/pip install kokoro-onnx soundfile numpy pyworld 'setuptools<81'
  mkdir -p ~/kokoro && cd ~/kokoro
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
  (ffmpeg must be installed)

Run:
  .venv-voice/bin/python scripts/record-voice.py            # record Noel's missing lines
  .venv-voice/bin/python scripts/record-voice.py --speaker kailia   # Kailia's cheers
  .venv-voice/bin/python scripts/record-voice.py --speaker shelly   # a pet friend (shelly nova kiko flick sage ember)
  .venv-voice/bin/python scripts/record-voice.py --redo     # re-record everything (after a voice change)
  KOKORO_DIR=/path/to/models ... to use another model folder
"""
import hashlib, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

# ── Who's speaking ── (voices picked by Kelvin from the samples)
SPEAKERS = {
    # Noel: every instruction and line in the games ("big gentle bear", made livelier: Kelvin's take 1)
    'noel':   dict(voice=os.environ.get('NOEL_VOICE', 'am_fenrir'), speed=1.0, pitch=1.0, lively=1.5,
                   lines='voice/lines.json', out='public/voice', key='sentence'),
    # Kailia: short happy cheers, a young girl's voice (a grown voice lifted a little)
    'kailia': dict(voice=os.environ.get('KAILIA_VOICE', 'af_heart'), speed=1.0, pitch=1.16, lively=0,
                   lines='voice/kailia-lines.json', out='public/voice/kailia', key='exact'),
}

# The pet friends, each in its own voice (2026-11-18, Kelvin: "gender appropriate
# voice on each pet", excited lift at the end of a sentence, a little sad when the
# line is sad). Girls: Shelly, Nova, Kiko. Boys: Flick, Sage, Ember. Natural
# voices, no big pitch shifting (Kelvin found pitched-up voices robotic).
# `ends`: how far the end of a sentence lifts (excited) or falls (sad).
PETS = {
    # girls: natural young women's voices, a small lift
    'shelly': dict(voice='af_bella', speed=0.94, lively=1.35, lift=1.06, ends=1.0),    # gentle, warm turtle
    'nova':   dict(voice='af_heart', speed=1.02, lively=1.45, lift=1.08, ends=1.2),    # sparkly unicorn
    'kiko':   dict(voice='af_jessica', speed=1.06, lively=1.5, lift=1.08, ends=1.25),  # chatty parrot
    # boys: a boy's voice is a man's voice blended with a woman's (Kokoro mixes
    # the two voice styles), lifted a little; sounds young, not grown-up
    'flick':  dict(voice='am_puck*0.6+af_heart*0.4', speed=1.06, lively=1.45, lift=1.1, ends=1.15),   # playful fox
    'sage':   dict(voice='bm_fable*0.7+bf_emma*0.3', speed=0.95, lively=1.3, lift=1.05, ends=0.9),    # wise little owl
    'ember':  dict(voice='am_echo*0.6+af_bella*0.4', speed=1.0, lively=1.45, lift=1.12, ends=1.15),   # sweet baby dragon
}
for _name, _p in PETS.items():
    SPEAKERS[_name] = dict(voice=os.environ.get(f'{_name.upper()}_VOICE', _p['voice']), speed=_p['speed'], pitch=1.0,
                          lively=_p['lively'], lift=_p['lift'], ends=_p['ends'], lines=f'voice/pets/{_name}.json',
                          out=f'public/voice/pets/{_name}', key='sentence')
SPEAKER = sys.argv[sys.argv.index('--speaker') + 1] if '--speaker' in sys.argv else 'noel'
CFG = SPEAKERS[SPEAKER]
VOICE, SPEED = CFG['voice'], CFG['speed']
LANG = 'en-gb' if VOICE.startswith('b') else 'en-us'

# How the names are said, as phonemes. The voice guesses both names wrong on
# its own ("KAI-lee-uh" and "Nole"). Kelvin, 2026-11-20 (final, overrides the
# 2026-11-13 "kay-LEE-uh" / "Nole" setting, which was a mistake):
#   Kailia = "KAI-LEE-yah": "Kai" rhymes with sky, then "Lee-ya".
#   Noel   = "No-EL": two beats, "El" like the letter L.
# scripts/name-sounds.test.mjs checks these exact sounds and that every
# recorded line with a name was made with them: change both together, and
# only when Kelvin asks.
KAILIA_SOUND = 'kˌaɪlˈiːjɐ'
NOEL_SOUND = 'noʊˈɛl'
NAME_SOUNDS = [
    (re.compile(r'k[ˈˌ]?aɪl[ˈˌ]?i[ː]?ə'), KAILIA_SOUND),   # how the voice guesses Kailia
    (re.compile(r'n[ˈˌ]?oʊl'), NOEL_SOUND),                  # how the voice guesses Noel
]
# Part of every name line's file name, so a line recorded with other name
# sounds can't sit in the manifest unnoticed (and is re-recorded here).
NAMES_TAG = f'names:{KAILIA_SOUND},{NOEL_SOUND}'
HAS_NAME = re.compile(r'\b(kailia|noel)', re.I)

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


def voice_style(k: Kokoro, spec: str):
    """'am_puck*0.6+af_heart*0.4' blends voice styles; a plain name is one voice."""
    if '+' not in spec and '*' not in spec:
        return spec
    total = None
    for part in spec.split('+'):
        name, _, w = part.partition('*')
        v = k.get_voice_style(name.strip()) * float(w or 1)
        total = v if total is None else total + v
    return total


def phonemes(k: Kokoro, text: str) -> str:
    p = k.tokenizer.phonemize(text, LANG)
    for wrong, right in NAME_SOUNDS:
        p = wrong.sub(right, p)
    if HAS_NAME.search(text):
        assert KAILIA_SOUND in p or NOEL_SOUND in p, f'name sound not set in: {text!r} -> {p!r}'
    return p


def clip_name(key: str) -> str:
    """Must match clipName() in scripts/name-sounds.test.mjs."""
    tag = f'{VOICE}|{SPEED}|{key}' if not CFG.get('ends') else f'{VOICE}|{SPEED}|{CFG["ends"]}|{key}'
    if is_cheer(key):
        tag += '|' + CHEER_TAG
    if HAS_NAME.search(key):
        tag += '|' + NAMES_TAG
    return hashlib.sha1(tag.encode()).hexdigest()[:12] + '.mp3'


def expressive(audio: np.ndarray, sr: int, amount: float, lift: float = 1.06) -> np.ndarray:
    """Cheerful intonation: widen the voice's ups and downs around its middle
    pitch (the plain voice is a bit flat) and brighten it slightly."""
    import pyworld as pw
    x = audio.astype(np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=60, f0_ceil=500)
    sp = pw.cheaptrick(x, f0, t, sr); ap = pw.d4c(x, f0, t, sr)
    v = f0 > 0
    if v.sum() > 5:
        lf = np.log(f0[v]); med = np.median(lf)
        f0[v] = np.clip(np.exp(med + (lf - med) * amount) * lift, 70, 480)
    return pw.synthesize(f0, sp, ap, sr)[:len(x)].astype(np.float32)


SAD = re.compile(r"\b(miss(ed)?|sad|sorry|tired|sleepy|bye|goodbye|oh no|lost|broke|broken|rain(y)?|ouch|cry|alone)\b|that's okay", re.I)


# Cheers: what a friend or Noel says after the child gets something right
# (Kelvin, 2026-11-23: "make their intonation livelier after achieving a
# task, Shelly's voice after getting a cookie was kinda bored"). These lines
# get a bigger, bouncier melody: wider ups and downs, a brighter start, and a
# clear climb on the last word, said a touch quicker, as an excited "!" even
# when the text ends with a full stop. Matched on voice_key() (lower case, no
# punctuation). scripts/name-sounds.test.mjs reads this same pattern.
CHEER = re.compile(r"^(?!.*\b(?:breath\w*|slow|slowly|easy|steady paws|calm|try|nice and|again|missing|too many|almost|close)\b)(?:yay|yum|yummy|wow|woo+|whee|hooray|hop hop hooray|ta da|tada|yes|gotcha|got one|twins|match$|lovely|sparkly|so pretty|sharp eyes|big hug|hee hee|you(?:'re on a roll| did| found| caught| remembered| got| were amazing| helped| fixed| made| count| heard| listened| read| sang)|amazing|great|fantastic|wonderful|perfect\w*|beautiful|nice|brilliant|super|awesome|excellent|incredible|well done|good job|good drawing|bravo|exactly|just right|just the right amount|fair and square|thank you|mmm thank you|star catcher|level \d+ done|all done|all sorted|all three|another (?:star|letter home|one|pair found)|balanced in the end|every (?:star|baby dragon has|letter made it|potion found)|everyone is found|i did one|kailia is cheering|kailia made it|magic reading|wizard reading|mailbag sorted|right (?:in|on) the|roar some|special delivery|smooth as|quick hands|sparkly catch|that crystal was different|that word starts just right|that's it|that was delicious|that made me so happy|i'm so happy|i love playing|look i grew|wow i'm all grown|look at it grow|ooh a (?:star|new friend)|a star$|a rainbow letter|my treasure is happy|the reef is so happy|sunny is happy|traced from memory|the dragon does a happy|the dragon is so happy|\w+ is doing a happy dance|crack crack|hi$|hi i'm|hi it's me|it's me|i'm (?:shelly|nova|kiko|flick|sage|ember)$|we did every|we got there|what a (?:fling|memory|pattern|steady)|what quick|the (?:cauldrons are bubbling|crew loves|fireflies like|flower loves|forest is getting brighter|lantern is glowing|path glows|path is whole|signpost lit|sky is glowing|story sparkles|whole cave is ringing)|they woke up and waved|.* (?:shines again|conquered|joined your party|joins the journey))\b")
CHEER_TAG = 'cheer2'   # part of a cheer line's file name; change it to re-record every cheer
CHEER_HIGH = 8          # how far a cheer leaps up, in semitones above the voice's middle


def is_cheer(key: str) -> bool:
    """Noel's and the pets' cheers (Kailia's own lines are left as they are)."""
    return SPEAKER != 'kailia' and bool(CHEER.search(key)) and not SAD.search(key)


def mood(sentence: str) -> str:
    """How a sentence should end: 'sad' falls a little, '!' and '?' lift."""
    if SAD.search(sentence) and not re.search(r"\b(hug|happy|love|tomorrow)\b", sentence, re.I):
        return 'sad'
    if is_cheer(voice_key(sentence)):
        return 'cheer'
    s = sentence.rstrip(' "\'”’')
    return 'ask' if s.endswith('?') else 'excited' if s.endswith('!') else 'plain'


def shape_ending(audio: np.ndarray, sr: int, how: str, amount: float = 1.0) -> np.ndarray:
    """Sentence melody: an excited line lifts at its last words, a question
    rises at the very end, a sad line sinks a little and slows. Done on the
    pitch track only (pyworld), so the voice itself stays natural."""
    if how == 'plain' or amount <= 0:
        return audio
    import pyworld as pw
    x = audio.astype(np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=60, f0_ceil=600)
    sp = pw.cheaptrick(x, f0, t, sr); ap = pw.d4c(x, f0, t, sr)
    voiced = np.where(f0 > 0)[0]
    if len(voiced) < 8:
        return audio
    first, last = voiced[0], voiced[-1]
    n = len(f0)
    pos = np.clip((np.arange(n) - first) / max(1, last - first), 0, 1)
    if how == 'excited':   # the last third climbs up to ~+20%, peak on the last word
        ramp = np.clip((pos - 0.62) / 0.38, 0, 1) ** 1.6
        factor = 1 + 0.20 * amount * ramp
    elif how == 'ask':     # a clear rise on the last word
        ramp = np.clip((pos - 0.72) / 0.28, 0, 1) ** 1.4
        factor = 1 + 0.26 * amount * ramp
    else:                  # sad: a gentle sink through the second half
        ramp = np.clip((pos - 0.45) / 0.55, 0, 1)
        factor = 1 - 0.14 * amount * ramp
    f0 = np.where(f0 > 0, np.clip(f0 * factor, 70, 600), 0)
    y = pw.synthesize(f0, sp, ap, sr)[:len(x)].astype(np.float32)
    if how == 'sad':       # a touch slower, like a little sigh
        import subprocess as _sp, tempfile as _tf
        with _tf.NamedTemporaryFile(suffix='.wav') as a, _tf.NamedTemporaryFile(suffix='.wav') as b:
            sf.write(a.name, y, sr)
            _sp.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', a.name, '-af', 'atempo=0.93', b.name], check=True)
            y, _ = sf.read(b.name, dtype='float32')
    return y


def smooth_f0(f0: np.ndarray) -> np.ndarray:
    """Clean the pitch track before resynthesis. The pitch finder sometimes
    jumps an octave for a frame or two on a high, breathy voice, and each
    jump comes out as a click or crackle. Snap those back to their
    neighbours and soften frame-to-frame wobble."""
    f0 = f0.copy()
    v = np.where(f0 > 0)[0]
    if len(v) < 5:
        return f0
    vals = f0[v]
    k = 3
    pad = np.pad(vals, k, mode='edge')
    med = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(len(vals))])
    ratio = vals / med
    vals = np.where((ratio > 1.4) | (ratio < 0.7), med, vals)   # octave glitches
    sm = np.convolve(np.pad(vals, 1, mode='edge'), [0.25, 0.5, 0.25], 'valid')
    f0[v] = sm
    return f0


def pet_voice(audio: np.ndarray, sr: int, amount: float, lift: float, how: str, ends: float) -> np.ndarray:
    """The pets' cheerful intonation and sentence ending in ONE resynthesis
    with a cleaned pitch track. (They used to go through the vocoder twice,
    once for liveliness and once for the ending, with the raw pitch track;
    Kelvin heard that as crackling, 2026-11-22.)"""
    import pyworld as pw
    x = audio.astype(np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=70, f0_ceil=600)
    f0 = smooth_f0(f0)
    sp = pw.cheaptrick(x, f0, t, sr); ap = pw.d4c(x, f0, t, sr)
    v = f0 > 0
    if v.sum() > 5:
        lf = np.log(f0[v]); med = np.median(lf)
        f0[v] = np.exp(med + (lf - med) * amount) * lift
    voiced = np.where(v)[0]
    if how != 'plain' and ends > 0 and len(voiced) >= 8:
        first, last = voiced[0], voiced[-1]
        pos = np.clip((np.arange(len(f0)) - first) / max(1, last - first), 0, 1)
        if how == 'cheer':
            # A real cheer, shaped like Kelvin's own example (2026-11-23):
            # the voice LEAPS up at the start, stays up high and bright
            # through the line ("Yaaay!"), then falls away at the very end.
            # (An earlier try bent the END of the line up instead; Kelvin
            # heard that as sarcastic.) The voice's own little ups and downs
            # ride on top at a smaller size, so it doesn't go robotic.
            idx = np.where(v)[0]
            lf = np.log(f0[idx]); med = np.median(lf)
            kern = np.ones(31) / 31                       # ~150 ms
            trend = np.convolve(np.pad(lf, 15, mode='edge'), kern, 'valid')
            detail = lf - trend
            p = pos[idx]
            st = np.log(2) / 12                           # one semitone, in log pitch
            up = np.clip(p / 0.14, 0, 1); up = up * up * (3 - 2 * up)          # quick leap up
            down = np.clip((p - 0.66) / 0.34, 0, 1) ** 1.4                    # fall at the end
            target = med + st * (CHEER_HIGH * up - 1.2 * p - (CHEER_HIGH + 5) * down)
            lf = np.minimum(target + 0.45 * detail, med + st * (CHEER_HIGH + 3))
            f0 = f0.copy(); f0[idx] = np.exp(lf)
            # louder where it's high, like a real cheer
            high = np.zeros(len(f0)); high[idx] = np.clip((target - med) / (st * CHEER_HIGH), 0, 1)
            cheer_gain = 10 ** (4.5 * np.convolve(high, np.ones(9) / 9, 'same') / 20)
            factor = 1.0
        elif how == 'excited':
            factor = 1 + 0.20 * ends * np.clip((pos - 0.62) / 0.38, 0, 1) ** 1.6
        elif how == 'ask':
            factor = 1 + 0.26 * ends * np.clip((pos - 0.72) / 0.28, 0, 1) ** 1.4
        else:
            factor = 1 - 0.14 * ends * np.clip((pos - 0.45) / 0.55, 0, 1)
        f0 = f0 * factor
    f0 = np.where(v, np.clip(f0, 70, 600), 0)
    y = pw.synthesize(f0, sp, ap, sr)[:len(x)].astype(np.float32)
    if how == 'cheer' and 'cheer_gain' in locals():
        y = y * np.interp(np.arange(len(y)) / sr, t, cheer_gain).astype(np.float32)
    if how == 'sad':       # a touch slower, like a little sigh
        with tempfile.NamedTemporaryFile(suffix='.wav') as a, tempfile.NamedTemporaryFile(suffix='.wav') as b:
            sf.write(a.name, y, sr)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', a.name, '-af', 'atempo=0.93', b.name], check=True)
            y, _ = sf.read(b.name, dtype='float32')
    return y


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


def record_line(k: Kokoro, style, sentence: str, out_path: str):
    """Record one sentence in this speaker's voice to an mp3."""
    how = mood(sentence)
    text = spoken(sentence)
    if how == 'cheer':           # said as an excited "!"
        text = re.sub(r'[.…]+(["\'”’]*)\s*$', r'!\1', text.rstrip())
    audio, sr = k.create(phonemes(k, text), voice=style, speed=SPEED, is_phonemes=True)
    if how == 'cheer' and SPEAKER != 'kailia':   # Noel and the pets: the cheer melody, one clean pass
        audio = pet_voice(audio, sr, CFG['lively'], CFG.get('lift', 1.06), 'cheer', CFG.get('ends', 1.0))
    elif CFG.get('ends'):          # a pet friend: one clean pass (no crackle)
        audio = pet_voice(audio, sr, CFG['lively'], CFG.get('lift', 1.06), how, CFG['ends'])
    elif CFG['lively']:          # Noel: as Kelvin picked him (take 1)
        audio = expressive(audio, sr, CFG['lively'], CFG.get('lift', 1.06))
    audio = tidy(audio, sr)
    with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
        sf.write(wav.name, audio, sr)
        lift = ['-af', f"rubberband=pitch={CFG['pitch']}:formant=shifted"] if CFG['pitch'] != 1.0 else []
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav.name, *lift, '-ac', '1', '-ar', '24000',
                        '-codec:a', 'libmp3lame', '-b:a', '64k' if CFG.get('ends') else '48k', out_path], check=True)


def main():
    redo = '--redo' in sys.argv
    lines = json.load(open(CFG['lines']))
    keyof = (lambda l: l) if CFG['key'] == 'exact' else voice_key
    os.makedirs(OUT, exist_ok=True)
    manifest = {} if redo or not os.path.exists(MANIFEST) else json.load(open(MANIFEST))
    if redo:
        for f in os.listdir(OUT):  # only this speaker's folder (Kailia's and the pets' are subfolders)
            if f.endswith('.mp3'): os.remove(os.path.join(OUT, f))
    k = Kokoro(f'{MODELS}/kokoro-v1.0.onnx', f'{MODELS}/voices-v1.0.bin')
    style = voice_style(k, VOICE)

    made = 0
    for sentence in lines:
        key = keyof(sentence)
        name = clip_name(key)
        if not key or (manifest.get(key) == name and os.path.exists(f'{OUT}/{name}')):
            continue
        if key in manifest and manifest[key] != name:   # made another way (e.g. old name sounds): redo
            try: os.remove(f'{OUT}/{manifest[key]}')
            except FileNotFoundError: pass
        record_line(k, style, sentence, f'{OUT}/{name}')
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
