This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Regenerating the voices (free, offline)

Every voice the app plays is a ready-made MP3 in `public/`. The app never calls a voice service; the device's own voice only fills in for a sentence that has no clip yet.

**Kailia** (Chatterbox copying a Kokoro-made reference clip) is made by `scripts/generate_voices.py` into `public/audio/` with `public/audio/manifest.json`. Voices and settings are in the `VOICES` map at the top of that script; how names are pronounced is in `SAY_AS`. Chatterbox needs a GPU to be quick, so the easy way is Google Colab:

1. Open `scripts/generate_voices.ipynb` in Google Colab (File → Upload notebook).
2. Runtime → Change runtime type → **T4 GPU**, then Runtime → **Run all** (about 10 minutes).
3. Unzip the `kailia-voice.zip` it downloads into `public/` (it holds `audio/`), then commit.

On your own computer instead (needs Python 3.10+ and ffmpeg):

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install kokoro-onnx soundfile numpy chatterbox-tts torchaudio "setuptools<81"
python3 scripts/generate_voices.py --dry-run      # what would be made
python3 scripts/generate_voices.py                # make every new or changed line
python3 scripts/generate_voices.py --ref-only     # only Kailia's reference clip (Kokoro, no GPU)
python3 scripts/build_voice_notebook.py           # refresh the Colab notebook after changing lines
```

Unchanged lines are skipped (each file name carries a hash of its text and settings). Kailia's lines come from `app/story/page.tsx` (`who: 'kailia'`) and `voice/kailia-lines.json`; add more in `voice/extra-lines.json`.

**Noel and the pet friends** keep their own recorded voices from `scripts/record-voice.py` (see the comments at its top). After changing game text, run `node scripts/voice-lines.mjs` and then that script.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
