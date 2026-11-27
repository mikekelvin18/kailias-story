"""
Make each pet friend's little call, entirely in code (no recordings, no
licences): soft, rounded and short, so they're cute rather than loud.

  python3 scripts/pet-sounds.py          (needs numpy + soundfile + ffmpeg)

Writes public/sounds/pets/<kind>.mp3 for owl, fox, parrot, turtle, dragon, unicorn.
Tweak a pet's recipe below and run again.
"""
import os, subprocess, tempfile
import numpy as np
import soundfile as sf

SR = 44100
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(d * SR)) / SR


def env(n, attack=0.02, release=0.08):
    e = np.ones(n)
    a, r = max(1, int(attack * SR)), max(1, int(release * SR))
    e[:a] = np.linspace(0, 1, a) ** 2
    e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def glide(f0, f1, d, curve=1.0):
    x = t(d) / d
    return f0 + (f1 - f0) * x ** curve


def tone(freqs, harmonics=((1, 1.0),), vibrato=(0, 0)):
    """freqs: per-sample frequency array; harmonics: (multiple, level)."""
    vib_rate, vib_depth = vibrato
    n = len(freqs)
    f = freqs * (1 + vib_depth * np.sin(2 * np.pi * vib_rate * np.arange(n) / SR))
    phase = 2 * np.pi * np.cumsum(f) / SR
    return sum(level * np.sin(m * phase) for m, level in harmonics)


def lowpass(x, cutoff):
    # simple one-pole, run twice for a softer slope
    a = np.exp(-2 * np.pi * cutoff / SR)
    for _ in range(2):
        y = np.empty_like(x); acc = 0.0
        for i, v in enumerate(x):
            acc = (1 - a) * v + a * acc; y[i] = acc
        x = y
    return x


def breath(n, cutoff=1800):
    return lowpass(rng.standard_normal(n), cutoff)


def gap(d):
    return np.zeros(int(d * SR))


def owl():  # Sage: a soft "hoo… hoo-hoo"
    def hoo(d, f):
        fr = glide(f * 1.04, f * 0.94, d, 0.6)
        x = tone(fr, ((1, 1), (2, 0.18), (3, 0.05)), vibrato=(5.5, 0.012)) + 0.04 * breath(len(fr), 600)
        return x * env(len(fr), 0.07, 0.18)
    return np.concatenate([hoo(0.42, 410), gap(0.16), hoo(0.2, 430), gap(0.06), hoo(0.38, 400)])


def fox():  # Flick: two happy little yips
    def yip(d, f0, f1):
        fr = glide(f0, f1, d, 0.5)
        x = tone(fr, ((1, 1), (2, 0.45), (3, 0.2), (4, 0.08)))
        return lowpass(x, 3500) * env(len(fr), 0.008, 0.06)
    return np.concatenate([yip(0.11, 720, 1250), gap(0.09), yip(0.14, 760, 1380)])


def parrot():  # Kiko: a bright "twee-dee-dee!" whistle
    notes = [(0.13, 1900, 2900), (0.08, 2400, 2200), (0.08, 2500, 2300), (0.16, 2300, 3100)]
    out = []
    for d, f0, f1 in notes:
        fr = glide(f0, f1, d, 0.7)
        out += [tone(fr, ((1, 1), (2, 0.12)), vibrato=(28, 0.02)) * env(len(fr), 0.01, 0.04), gap(0.035)]
    return np.concatenate(out) * 0.8


def turtle():  # Shelly: three bubbly bloops
    out = []
    for f0, f1 in [(240, 620), (200, 540), (260, 700)]:
        d = 0.09
        fr = glide(f0, f1, d, 2.2)
        out += [tone(fr, ((1, 1), (2, 0.1))) * env(len(fr), 0.004, 0.05), gap(0.07)]
    return np.concatenate(out)


def dragon():  # Ember: a warm puff of smoke, then a tiny squeak
    n = int(0.32 * SR)
    puff = breath(n, 700) * env(n, 0.03, 0.22) * 1.6
    rumble = tone(glide(150, 110, 0.32), ((1, 1), (2, 0.4))) * env(n, 0.04, 0.2) * 0.35
    fr = glide(900, 1450, 0.2, 0.5)
    squeak = tone(fr, ((1, 1), (2, 0.3), (3, 0.1)), vibrato=(14, 0.03)) * env(len(fr), 0.01, 0.07) * 0.55
    return np.concatenate([puff + rumble, gap(0.05), squeak])


def unicorn():  # Nova: a sparkly little whinny with twinkles
    d = 0.55
    fr = glide(1250, 680, d, 0.8)
    whinny = tone(fr, ((1, 1), (2, 0.35), (3, 0.12)), vibrato=(13, 0.05)) * env(len(fr), 0.02, 0.2) * 0.6
    total = int((0.05 + 3 * 0.11 + 0.35) * SR)
    sparkle = np.zeros(total)
    for i, f in enumerate([2093, 2637, 3136, 3951]):
        st = int((0.05 + i * 0.11) * SR); dd = 0.35
        b = tone(np.full(int(dd * SR), f)) * np.exp(-t(dd) * 9) * env(int(dd * SR), 0.006, 0.02) * 0.22
        sparkle[st:st + len(b)] += b
    body = np.zeros(total); body[:len(whinny)] = lowpass(whinny, 4000)
    return body + sparkle


PETS = {'owl': owl, 'fox': fox, 'parrot': parrot, 'turtle': turtle, 'dragon': dragon, 'unicorn': unicorn}

if __name__ == '__main__':
    out = 'public/sounds/pets'
    os.makedirs(out, exist_ok=True)
    for kind, make in PETS.items():
        x = make()
        x = x / (np.abs(x).max() or 1) * 0.7          # gentle, consistent loudness
        x = np.concatenate([gap(0.02), x, gap(0.05)])
        with tempfile.NamedTemporaryFile(suffix='.wav') as w:
            sf.write(w.name, x.astype(np.float32), SR)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w.name, '-ac', '1', '-codec:a', 'libmp3lame',
                            '-b:a', '64k', f'{out}/{kind}.mp3'], check=True)
        print(f'{out}/{kind}.mp3  {len(x) / SR:.2f}s')
