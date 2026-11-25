#!/usr/bin/env python3
"""
Builds scripts/generate_voices.ipynb, the Google Colab notebook that runs
scripts/generate_voices.py on Colab's free GPU (Chatterbox is very slow on a
laptop CPU).

The notebook carries everything it needs inside it: the voice script, the
list of lines, and Kailia's reference clip. So it works without access to the
GitHub repository. Re-run this after changing lines or voice settings:

    python3 scripts/generate_voices.py --ref-only     # if the reference settings changed
    python3 scripts/build_voice_notebook.py
"""

import base64
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
script = (ROOT / 'scripts' / 'generate_voices.py').read_text(encoding='utf-8')
lines = subprocess.run([sys.executable, str(ROOT / 'scripts' / 'generate_voices.py'), '--print-lines'],
                       capture_output=True, text=True, check=True).stdout
ref = ROOT / 'scripts' / 'voice-ref' / 'kailia-ref.wav'
stamp = ROOT / 'scripts' / 'voice-ref' / 'kailia-ref.settings'
ref_b64 = base64.b64encode(ref.read_bytes()).decode() if ref.exists() else ''


def md(text):
    return {'cell_type': 'markdown', 'metadata': {}, 'source': text.strip().splitlines(True)}


def code(text):
    return {'cell_type': 'code', 'metadata': {}, 'execution_count': None, 'outputs': [], 'source': text.strip().splitlines(True)}


cells = [
    md("""
# Kailia's voice: make every clip (free GPU)

1. At the top: **Runtime → Change runtime type → T4 GPU → Save**.
2. **Runtime → Run all.** If Colab asks to restart after installing, click **Restart session**, then **Run all** again.
3. It takes about 10 minutes. At the end a file called **kailia-voice.zip** downloads.
4. Send that zip to Claude in the project thread. Claude puts the clips in the app.

Everything runs in your own Colab. Nothing is sent to any voice company.
"""),
    code("""
# 1. Check the GPU and install the free voice tools (Chatterbox, Kokoro)
!nvidia-smi --query-gpu=name --format=csv,noheader || echo "No GPU: Runtime > Change runtime type > T4 GPU"
!pip -q install chatterbox-tts kokoro-onnx soundfile "setuptools<81"
!ffmpeg -version | head -1
"""),
    code(
        "# 2. The voice script (a copy of scripts/generate_voices.py) and the lines\n"
        "import os\n"
        "os.makedirs('/content/kailia/scripts/voice-ref', exist_ok=True)\n"
        "os.chdir('/content/kailia')\n"
        f"open('scripts/generate_voices.py', 'w').write({script!r})\n"
        f"open('lines.json', 'w').write({lines!r})\n"
        "print('ready')\n"),
    code(f"""
# 3. Kailia's reference clip (made with Kokoro; the same one as in the app's repository)
import base64
ref = {ref_b64!r}
if ref:
    open('scripts/voice-ref/kailia-ref.wav', 'wb').write(base64.b64decode(ref))
    open('scripts/voice-ref/kailia-ref.settings', 'w').write({(stamp.read_text().strip() if stamp.exists() else '')!r})
print('reference clip', 'ready' if ref else 'will be made now')
"""),
    code("""
# 4. Make every Kailia line with Chatterbox (about 10 minutes on a T4)
!python3 scripts/generate_voices.py --lines lines.json --only kailia
"""),
    code("""
# 5. Download the clips: send kailia-voice.zip to Claude in the project thread
!cd public && zip -qr ../kailia-voice.zip audio
from google.colab import files
files.download('kailia-voice.zip')
"""),
    md("""
**Want to hear one first?** Run this cell after step 4.
"""),
    code("""
import glob, IPython.display as d
for f in sorted(glob.glob('public/audio/kailia/*.mp3'))[:5]:
    print(f); d.display(d.Audio(f))
"""),
]

nb = {'cells': cells, 'metadata': {'accelerator': 'GPU', 'colab': {'provenance': [], 'gpuType': 'T4'},
                                    'kernelspec': {'display_name': 'Python 3', 'name': 'python3'}},
      'nbformat': 4, 'nbformat_minor': 0}
out = ROOT / 'scripts' / 'generate_voices.ipynb'
out.write_text(json.dumps(nb, indent=1) + '\n', encoding='utf-8')
print(f'wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)')
