// ── Pet rigs ──
// Where each pet's moving parts are, measured on its picture in
// public/art/pets/. All numbers are fractions of the picture's width
// (x, rx) and height (y, ry), so they still fit if the picture is
// re-exported at another size (same framing).
//
// A pet listed here gets part motion (blinks, head tilt, wing/tail) from
// meshRig.ts; any pet not listed keeps LiveArt's whole-picture motion.
// To rig a new pet: find its eye centres, neck, and the joint of each
// part that should move, then copy an entry below and adjust.

import type { PetRig } from './meshRig';

export const PET_RIGS: Record<string, PetRig> = {
  '/art/pets/kiko.webp': {
    pad: 0.12,
    eyes: [
      { cx: 0.406, cy: 0.356, rx: 0.06, ry: 0.06 },
      { cx: 0.631, cy: 0.273, rx: 0.045, ry: 0.055 },
    ],
    bones: [
      // head tilts around the neck, curious and chatty
      { name: 'head', pivot: [0.495, 0.53], region: { cx: 0.46, cy: 0.26, rx: 0.3, ry: 0.27, soft: 0.3 },
        swing: { deg: 3.5, period: 4.6 }, poke: { deg: 7, period: 0.65 } },
      // the raised wing waves from the shoulder
      { name: 'wing', pivot: [0.711, 0.508], region: { cx: 0.875, cy: 0.49, rx: 0.16, ry: 0.22, soft: 0.35 },
        swing: { deg: 6, period: 1.9 }, poke: { deg: 16, period: 0.32 } },
      // tail feathers wag from the base
      { name: 'tail', pivot: [0.247, 0.684], region: { cx: 0.12, cy: 0.64, rx: 0.155, ry: 0.175, soft: 0.35 },
        swing: { deg: 4, period: 2.3, phase: 0.3 }, poke: { deg: 12, period: 0.28 } },
    ],
  },
};

export function rigFor(src: string): PetRig | null {
  return PET_RIGS[src] ?? null;
}
