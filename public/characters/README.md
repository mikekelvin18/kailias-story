# Drop final character art here

This folder is empty on purpose — the app currently draws Kailia and Noel as
code-based cartoon placeholders, so nothing needs to go here yet.

When you have final artwork:

1. Export each image (PNG or SVG, transparent background) — name them
   something clear, e.g. `kailia-happy.png`, `noel-excited.png`.
2. Drop the files into this folder.
3. Open `components/characters/characters.config.ts` and add a line pointing
   at each file. That's it — the app swaps the drawing for your image
   automatically, no other changes needed.
