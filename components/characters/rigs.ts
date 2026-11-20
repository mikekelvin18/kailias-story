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
    face: { cx: 0.52, cy: 0.38, rx: 0.235, ry: 0.165, soft: 0.15 },
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
        swing: { deg: 9, period: 1.9 }, poke: { deg: 16, period: 0.32 } },
      // tail feathers wag from the base
      { name: 'tail', pivot: [0.247, 0.684], region: { cx: 0.12, cy: 0.64, rx: 0.155, ry: 0.175, soft: 0.35 },
        swing: { deg: 6, period: 2.3, phase: 0.3 }, poke: { deg: 12, period: 0.28 } },
    ],
  },
  '/art/pets/flick.webp': {
    pad: 0.1,
    face: { cx: 0.615, cy: 0.44, rx: 0.28, ry: 0.165, soft: 0.15 },
    eyes: [
      { cx: 0.474, cy: 0.469, rx: 0.06, ry: 0.048 },
      { cx: 0.742, cy: 0.357, rx: 0.055, ry: 0.045 },
    ],
    bones: [
      { name: 'head', pivot: [0.6, 0.64], region: { cx: 0.56, cy: 0.36, rx: 0.42, ry: 0.3, soft: 0.3 },
        swing: { deg: 3, period: 5.2 }, poke: { deg: 6, period: 0.7 } },
      // ears twitch now and then on their own rhythm
      { name: 'ear-left', pivot: [0.33, 0.39], region: { cx: 0.15, cy: 0.32, rx: 0.15, ry: 0.11, soft: 0.35 },
        swing: { deg: 6, period: 2.7, phase: 0.2 }, poke: { deg: 12, period: 0.3 } },
      { name: 'ear-right', pivot: [0.71, 0.21], region: { cx: 0.68, cy: 0.1, rx: 0.13, ry: 0.11, soft: 0.35 },
        swing: { deg: 3.5, period: 3.1, phase: 0.6 }, poke: { deg: 10, period: 0.3 } },
      // the big fluffy tail swishes from its base
      { name: 'tail', pivot: [0.4, 0.84], region: { cx: 0.19, cy: 0.74, rx: 0.22, ry: 0.18, soft: 0.35 },
        swing: { deg: 9, period: 2.1 }, poke: { deg: 16, period: 0.36 } },
    ],
  },
  '/art/pets/sage.webp': {
    pad: 0.1,
    face: { cx: 0.625, cy: 0.41, rx: 0.38, ry: 0.15, soft: 0.15 },
    eyes: [
      { cx: 0.453, cy: 0.4, rx: 0.06, ry: 0.048 },
      { cx: 0.772, cy: 0.371, rx: 0.055, ry: 0.048 },
    ],
    bones: [
      // owls tilt their heads to listen
      { name: 'head', pivot: [0.56, 0.6], region: { cx: 0.56, cy: 0.33, rx: 0.46, ry: 0.3, soft: 0.3 },
        swing: { deg: 4.5, period: 5.6 }, poke: { deg: 9, period: 0.8 } },
      { name: 'wing-left', pivot: [0.45, 0.63], region: { cx: 0.25, cy: 0.74, rx: 0.2, ry: 0.17, soft: 0.35 },
        swing: { deg: 7, period: 2.6 }, poke: { deg: 18, period: 0.3 } },
      { name: 'wing-right', pivot: [0.85, 0.6], region: { cx: 0.93, cy: 0.69, rx: 0.1, ry: 0.15, soft: 0.35 },
        swing: { deg: -7, period: 2.6, phase: 0.1 }, poke: { deg: -16, period: 0.3 } },
    ],
  },
  '/art/pets/ember.webp': {
    pad: 0.1,
    face: { cx: 0.585, cy: 0.395, rx: 0.32, ry: 0.18, soft: 0.15 },
    eyes: [
      { cx: 0.431, cy: 0.4, rx: 0.07, ry: 0.055 },
      { cx: 0.723, cy: 0.322, rx: 0.06, ry: 0.052 },
    ],
    bones: [
      { name: 'head', pivot: [0.55, 0.6], region: { cx: 0.5, cy: 0.33, rx: 0.44, ry: 0.3, soft: 0.3 },
        swing: { deg: 3, period: 4.8 }, poke: { deg: 6, period: 0.7 } },
      // little wings flutter from the back
      { name: 'wing-left', pivot: [0.32, 0.56], region: { cx: 0.16, cy: 0.59, rx: 0.17, ry: 0.13, soft: 0.35 },
        swing: { deg: -10, period: 1.6 }, poke: { deg: -18, period: 0.26 } },
      { name: 'wing-right', pivot: [0.77, 0.58], region: { cx: 0.89, cy: 0.59, rx: 0.13, ry: 0.13, soft: 0.35 },
        swing: { deg: 10, period: 1.6 }, poke: { deg: 18, period: 0.26 } },
      { name: 'tail', pivot: [0.24, 0.76], region: { cx: 0.08, cy: 0.76, rx: 0.11, ry: 0.15, soft: 0.35 },
        swing: { deg: 7, period: 2.4, phase: 0.4 }, poke: { deg: 12, period: 0.34 } },
    ],
  },
  '/art/pets/nova.webp': {
    pad: 0.1,
    face: { cx: 0.72, cy: 0.45, rx: 0.3, ry: 0.16, soft: 0.15 },
    eyes: [
      { cx: 0.571, cy: 0.42, rx: 0.065, ry: 0.055 },
      { cx: 0.879, cy: 0.371, rx: 0.05, ry: 0.05 },
    ],
    bones: [
      { name: 'head', pivot: [0.66, 0.66], region: { cx: 0.64, cy: 0.33, rx: 0.4, ry: 0.32, soft: 0.3 },
        swing: { deg: 2.5, period: 4.9 }, poke: { deg: 6, period: 0.7 } },
      // rainbow tail sways from the hip
      { name: 'tail', pivot: [0.33, 0.64], region: { cx: 0.15, cy: 0.67, rx: 0.17, ry: 0.21, soft: 0.35 },
        swing: { deg: 8, period: 2.5 }, poke: { deg: 14, period: 0.36 } },
    ],
  },
  '/art/pets/shelly.webp': {
    pad: 0.1,
    face: { cx: 0.51, cy: 0.235, rx: 0.38, ry: 0.245, soft: 0.06 },  // her whole head: the flipper waves right beside it
    eyes: [
      { cx: 0.368, cy: 0.322, rx: 0.07, ry: 0.052 },
      { cx: 0.698, cy: 0.215, rx: 0.055, ry: 0.05 },
    ],
    bones: [
      { name: 'head', pivot: [0.53, 0.47], region: { cx: 0.5, cy: 0.23, rx: 0.42, ry: 0.25, soft: 0.3 },
        swing: { deg: 3, period: 5 }, poke: { deg: 6, period: 0.7 } },
      // her raised flipper waves hello (gently: it nearly touches her cheek)
      { name: 'flipper', pivot: [0.79, 0.56], region: { cx: 0.9, cy: 0.42, rx: 0.11, ry: 0.18, soft: 0.3 },
        swing: { deg: 7, period: 1.5 }, poke: { deg: 11, period: 0.3 } },
    ],
  },
};

// Kailia and Noel's front portraits (public/characters/{,painted/}…). The
// painted and original pictures share one framing, so one rig fits both.
const KAILIA_FRONT: PetRig = {
  pad: 0.08, shade: true,
  face: { cx: 0.5, cy: 0.37, rx: 0.35, ry: 0.125, soft: 0.15 },
  eyes: [
    { cx: 0.338, cy: 0.348, rx: 0.075, ry: 0.048 },
    { cx: 0.665, cy: 0.348, rx: 0.075, ry: 0.048 },
  ],
  bones: [
    { name: 'head', pivot: [0.5, 0.56], region: { cx: 0.5, cy: 0.3, rx: 0.52, ry: 0.32, soft: 0.25 },
      swing: { deg: 2.5, period: 5.4 }, poke: { deg: 6, period: 0.75 } },
    // long hair swings a beat behind the head
    { name: 'hair-left', pivot: [0.19, 0.38], region: { cx: 0.12, cy: 0.6, rx: 0.1, ry: 0.15, soft: 0.4 },
      swing: { deg: 2.5, period: 5.4, phase: 0.15 }, poke: { deg: 7, period: 0.5 } },
    { name: 'hair-right', pivot: [0.81, 0.38], region: { cx: 0.88, cy: 0.6, rx: 0.1, ry: 0.15, soft: 0.4 },
      swing: { deg: 2.5, period: 5.4, phase: 0.15 }, poke: { deg: 7, period: 0.5 } },
    // arms sway a little at her sides, and wave when tapped
    { name: 'arm-left', pivot: [0.22, 0.615], region: { cx: 0.12, cy: 0.69, rx: 0.09, ry: 0.07, soft: 0.4 },
      swing: { deg: 3, period: 3.2 }, poke: { deg: 14, period: 0.4 } },
    { name: 'arm-right', pivot: [0.78, 0.615], region: { cx: 0.88, cy: 0.69, rx: 0.09, ry: 0.07, soft: 0.4 },
      swing: { deg: -3, period: 3.2 }, poke: { deg: -14, period: 0.4 } },
  ],
};

const NOEL_FRONT: PetRig = {
  pad: 0.08, shade: true,
  face: { cx: 0.5, cy: 0.345, rx: 0.29, ry: 0.13, soft: 0.15 },
  eyes: [
    { cx: 0.358, cy: 0.31, rx: 0.06, ry: 0.045 },
    { cx: 0.648, cy: 0.31, rx: 0.06, ry: 0.045 },
  ],
  bones: [
    { name: 'head', pivot: [0.5, 0.52], region: { cx: 0.5, cy: 0.27, rx: 0.5, ry: 0.28, soft: 0.25 },
      swing: { deg: 2.5, period: 5.8 }, poke: { deg: 6, period: 0.8 } },
    { name: 'ear-left', pivot: [0.22, 0.14], region: { cx: 0.15, cy: 0.08, rx: 0.1, ry: 0.07, soft: 0.4 },
      swing: { deg: 3, period: 3.3 }, poke: { deg: 12, period: 0.3 } },
    { name: 'ear-right', pivot: [0.78, 0.14], region: { cx: 0.85, cy: 0.08, rx: 0.1, ry: 0.07, soft: 0.4 },
      swing: { deg: -3, period: 3.6 }, poke: { deg: -12, period: 0.3 } },
    // big soft paws swing at his sides
    { name: 'arm-left', pivot: [0.19, 0.59], region: { cx: 0.14, cy: 0.73, rx: 0.1, ry: 0.1, soft: 0.4 },
      swing: { deg: 3, period: 3.6 }, poke: { deg: 12, period: 0.45 } },
    { name: 'arm-right', pivot: [0.82, 0.59], region: { cx: 0.86, cy: 0.73, rx: 0.1, ry: 0.1, soft: 0.4 },
      swing: { deg: -3, period: 3.6 }, poke: { deg: -12, period: 0.45 } },
  ],
};

const CHARACTER_RIGS: Record<string, PetRig> = {
  '/characters/kailia/portrait-front.png': KAILIA_FRONT,
  '/characters/painted/kailia/portrait-front.png': KAILIA_FRONT,
  '/characters/noel/portrait-front.png': NOEL_FRONT,
  '/characters/painted/noel/portrait-front.png': NOEL_FRONT,
};

// Running: the drawn run-1…run-5 cycle, with hair, cape and scarf streaming
// behind on top. Fractions are of the cycle's shared box (the largest
// frame, feet on the floor, centred). Each step is half a cycle, so the
// streaming parts bounce twice per cycle.
export const RUN_RIGS: Record<'kailia' | 'noel', PetRig> = {
  kailia: {
    pad: 0.12, fps: 10, eyes: [],
    bones: [
      { name: 'hair', pivot: [0.52, 0.24], region: { cx: 0.24, cy: 0.38, rx: 0.22, ry: 0.18, soft: 0.4 },
        swing: { deg: 4, period: 0.25 } },
      { name: 'cape', pivot: [0.46, 0.6], region: { cx: 0.16, cy: 0.64, rx: 0.15, ry: 0.09, soft: 0.4 },
        swing: { deg: 9, period: 0.25, phase: 0.25 } },
    ],
  },
  noel: {
    pad: 0.12, fps: 10, eyes: [],
    bones: [
      { name: 'scarf', pivot: [0.55, 0.4], region: { cx: 0.24, cy: 0.36, rx: 0.18, ry: 0.11, soft: 0.4 },
        swing: { deg: 7, period: 0.25, phase: 0.25 } },
    ],
  },
};

// Jumping: the drawn jump-1…jump-4 (crouch, take off, in the air, land),
// played once. Hair, cape and scarf lift and settle through the hop.
export const JUMP_RIGS: Record<'kailia' | 'noel', PetRig> = {
  kailia: {
    pad: 0.12, fps: 8, once: true, eyes: [],
    bones: [
      { name: 'hair', pivot: [0.55, 0.3], region: { cx: 0.25, cy: 0.42, rx: 0.24, ry: 0.2, soft: 0.4 },
        swing: { deg: 5, period: 0.5 } },
      { name: 'cape', pivot: [0.5, 0.62], region: { cx: 0.15, cy: 0.66, rx: 0.15, ry: 0.1, soft: 0.4 },
        swing: { deg: 8, period: 0.5, phase: 0.2 } },
    ],
  },
  noel: {
    pad: 0.12, fps: 8, once: true, eyes: [],
    bones: [
      { name: 'scarf', pivot: [0.55, 0.5], region: { cx: 0.22, cy: 0.5, rx: 0.2, ry: 0.12, soft: 0.4 },
        swing: { deg: 7, period: 0.5, phase: 0.2 } },
    ],
  },
};


// The side animals in the games (public/art/critters/, Kelvin's pictures
// from 2026-11-14). Measured the same way as the pets above.
export const CRITTER_RIGS: Record<string, PetRig> = {
  '/art/critters/koala.webp': {
    pad: 0.1,
    face: { cx: 0.535, cy: 0.4, rx: 0.25, ry: 0.155, soft: 0.15 },
    eyes: [
      { cx: 0.4, cy: 0.37, rx: 0.055, ry: 0.06 },
      { cx: 0.65, cy: 0.33, rx: 0.055, ry: 0.06 },
    ],
    bones: [
      { name: 'head', pivot: [0.5, 0.56], region: { cx: 0.5, cy: 0.3, rx: 0.5, ry: 0.3, soft: 0.35 },
        swing: { deg: 3, period: 5 }, poke: { deg: 6, period: 0.7 } },
      { name: 'ear-left', pivot: [0.3, 0.25], region: { cx: 0.17, cy: 0.22, rx: 0.15, ry: 0.17, soft: 0.35 },
        swing: { deg: 5, period: 2.8, phase: 0.2 }, poke: { deg: 12, period: 0.3 } },
      { name: 'ear-right', pivot: [0.66, 0.2], region: { cx: 0.8, cy: 0.2, rx: 0.16, ry: 0.17, soft: 0.35 },
        swing: { deg: -5, period: 3.1, phase: 0.5 }, poke: { deg: -12, period: 0.3 } },
      { name: 'arm-left', pivot: [0.33, 0.65], region: { cx: 0.27, cy: 0.67, rx: 0.09, ry: 0.08, soft: 0.35 },
        swing: { deg: 9, period: 1.7 }, poke: { deg: 18, period: 0.3 } },
      { name: 'arm-right', pivot: [0.68, 0.65], region: { cx: 0.77, cy: 0.68, rx: 0.08, ry: 0.08, soft: 0.35 },
        swing: { deg: -9, period: 1.7, phase: 0.5 }, poke: { deg: -18, period: 0.3 } },
    ],
  },
  '/art/critters/peacock.webp': {
    pad: 0.1,
    face: { cx: 0.52, cy: 0.485, rx: 0.2, ry: 0.12, soft: 0.15 },
    eyes: [
      { cx: 0.43, cy: 0.47, rx: 0.045, ry: 0.05 },
      { cx: 0.61, cy: 0.45, rx: 0.045, ry: 0.05 },
    ],
    bones: [
      { name: 'fan-left', pivot: [0.5, 0.7], region: { cx: 0.18, cy: 0.55, rx: 0.16, ry: 0.3, soft: 0.35 },
        swing: { deg: 3, period: 3.2 }, poke: { deg: 8, period: 0.5 } },
      { name: 'fan-right', pivot: [0.5, 0.7], region: { cx: 0.84, cy: 0.55, rx: 0.16, ry: 0.3, soft: 0.35 },
        swing: { deg: -3, period: 3.2 }, poke: { deg: -8, period: 0.5 } },
      { name: 'head', pivot: [0.5, 0.6], region: { cx: 0.5, cy: 0.42, rx: 0.2, ry: 0.2, soft: 0.35 },
        swing: { deg: 3.5, period: 4.6 }, poke: { deg: 7, period: 0.65 } },
      { name: 'crest', pivot: [0.5, 0.27], region: { cx: 0.5, cy: 0.13, rx: 0.17, ry: 0.13, soft: 0.35 },
        swing: { deg: 6, period: 2.2, phase: 0.3 }, poke: { deg: 14, period: 0.3 } },
      { name: 'wing-left', pivot: [0.42, 0.68], region: { cx: 0.3, cy: 0.7, rx: 0.12, ry: 0.09, soft: 0.35 },
        swing: { deg: 10, period: 1.6 }, poke: { deg: 11, period: 0.28 } },
      { name: 'wing-right', pivot: [0.6, 0.68], region: { cx: 0.72, cy: 0.7, rx: 0.12, ry: 0.09, soft: 0.35 },
        swing: { deg: -10, period: 1.6 }, poke: { deg: -11, period: 0.28 } },
    ],
  },
  '/art/critters/rabbit.webp': {
    pad: 0.1,
    face: { cx: 0.52, cy: 0.46, rx: 0.25, ry: 0.125, soft: 0.15 },
    eyes: [
      { cx: 0.42, cy: 0.43, rx: 0.05, ry: 0.055 },
      { cx: 0.62, cy: 0.43, rx: 0.05, ry: 0.055 },
    ],
    bones: [
      { name: 'head', pivot: [0.52, 0.6], region: { cx: 0.5, cy: 0.42, rx: 0.28, ry: 0.2, soft: 0.35 },
        swing: { deg: 3, period: 5 }, poke: { deg: 6, period: 0.7 } },
      { name: 'ear-left', pivot: [0.4, 0.28], region: { cx: 0.32, cy: 0.15, rx: 0.12, ry: 0.15, soft: 0.35 },
        swing: { deg: 7, period: 2.4 }, poke: { deg: 16, period: 0.3 } },
      { name: 'ear-right', pivot: [0.6, 0.28], region: { cx: 0.7, cy: 0.15, rx: 0.12, ry: 0.16, soft: 0.35 },
        swing: { deg: -5, period: 2.9, phase: 0.4 }, poke: { deg: -14, period: 0.3 } },
      { name: 'tail', pivot: [0.36, 0.8], region: { cx: 0.27, cy: 0.8, rx: 0.08, ry: 0.1, soft: 0.35 },
        swing: { deg: 10, period: 1.2 }, poke: { deg: 18, period: 0.25 } },
    ],
  },
  '/art/critters/parrot.webp': {
    pad: 0.1,
    face: { cx: 0.51, cy: 0.3, rx: 0.27, ry: 0.24, soft: 0.08 },  // the whole head: wings beat right beside it
    eyes: [
      { cx: 0.42, cy: 0.36, rx: 0.055, ry: 0.06 },
      { cx: 0.65, cy: 0.32, rx: 0.055, ry: 0.06 },
    ],
    bones: [
      { name: 'head', pivot: [0.5, 0.55], region: { cx: 0.5, cy: 0.3, rx: 0.28, ry: 0.28, soft: 0.35 },
        swing: { deg: 3.5, period: 4.6 }, poke: { deg: 7, period: 0.65 } },
      { name: 'wing-left', pivot: [0.38, 0.6], region: { cx: 0.2, cy: 0.55, rx: 0.2, ry: 0.2, soft: 0.35 },
        swing: { deg: 12, period: 1.4 }, poke: { deg: 12, period: 0.28 } },
      { name: 'wing-right', pivot: [0.65, 0.6], region: { cx: 0.8, cy: 0.55, rx: 0.16, ry: 0.2, soft: 0.35 },
        swing: { deg: -12, period: 1.4 }, poke: { deg: -12, period: 0.28 } },
      { name: 'tail', pivot: [0.35, 0.8], region: { cx: 0.2, cy: 0.85, rx: 0.15, ry: 0.1, soft: 0.35 },
        swing: { deg: 6, period: 2.3, phase: 0.3 }, poke: { deg: 12, period: 0.28 } },
    ],
  },
  '/art/critters/deer.webp': {
    pad: 0.1,
    face: { cx: 0.525, cy: 0.46, rx: 0.245, ry: 0.14, soft: 0.15 },
    eyes: [
      { cx: 0.43, cy: 0.44, rx: 0.05, ry: 0.055 },
      { cx: 0.62, cy: 0.42, rx: 0.05, ry: 0.055 },
    ],
    bones: [
      { name: 'head', pivot: [0.52, 0.6], region: { cx: 0.5, cy: 0.35, rx: 0.36, ry: 0.33, soft: 0.35 },
        swing: { deg: 3, period: 5.2 }, poke: { deg: 7, period: 0.7 } },
      { name: 'ear-left', pivot: [0.34, 0.36], region: { cx: 0.22, cy: 0.32, rx: 0.1, ry: 0.1, soft: 0.35 },
        swing: { deg: 8, period: 2.6, phase: 0.2 }, poke: { deg: 16, period: 0.3 } },
      { name: 'ear-right', pivot: [0.68, 0.34], region: { cx: 0.77, cy: 0.3, rx: 0.09, ry: 0.1, soft: 0.35 },
        swing: { deg: -8, period: 3, phase: 0.6 }, poke: { deg: -16, period: 0.3 } },
      { name: 'tail', pivot: [0.3, 0.66], region: { cx: 0.25, cy: 0.64, rx: 0.07, ry: 0.09, soft: 0.35 },
        swing: { deg: 12, period: 1.1 }, poke: { deg: 20, period: 0.25 } },
    ],
  },
  '/art/critters/raccoon.webp': {
    pad: 0.1,
    face: { cx: 0.555, cy: 0.405, rx: 0.27, ry: 0.16, soft: 0.15 },
    eyes: [
      { cx: 0.44, cy: 0.38, rx: 0.055, ry: 0.055 },
      { cx: 0.67, cy: 0.35, rx: 0.055, ry: 0.055 },
    ],
    bones: [
      { name: 'head', pivot: [0.58, 0.56], region: { cx: 0.55, cy: 0.3, rx: 0.36, ry: 0.28, soft: 0.35 },
        swing: { deg: 3, period: 5 }, poke: { deg: 6, period: 0.7 } },
      { name: 'ear-left', pivot: [0.36, 0.25], region: { cx: 0.3, cy: 0.17, rx: 0.1, ry: 0.12, soft: 0.35 },
        swing: { deg: 6, period: 2.7, phase: 0.2 }, poke: { deg: 12, period: 0.3 } },
      { name: 'ear-right', pivot: [0.76, 0.2], region: { cx: 0.78, cy: 0.12, rx: 0.09, ry: 0.11, soft: 0.35 },
        swing: { deg: -5, period: 3.1, phase: 0.6 }, poke: { deg: -12, period: 0.3 } },
      { name: 'arm-left', pivot: [0.42, 0.62], region: { cx: 0.33, cy: 0.64, rx: 0.08, ry: 0.07, soft: 0.35 },
        swing: { deg: 10, period: 1.6 }, poke: { deg: 20, period: 0.3 } },
      { name: 'arm-right', pivot: [0.74, 0.62], region: { cx: 0.82, cy: 0.63, rx: 0.07, ry: 0.07, soft: 0.35 },
        swing: { deg: -10, period: 1.6, phase: 0.5 }, poke: { deg: -20, period: 0.3 } },
      { name: 'tail', pivot: [0.4, 0.85], region: { cx: 0.22, cy: 0.72, rx: 0.14, ry: 0.2, soft: 0.35 },
        swing: { deg: 7, period: 2.2 }, poke: { deg: 14, period: 0.36 } },
    ],
  },
  // Swan, frog, squirrel, hedgehog, bee and butterfly: Kelvin's big
  // pictures from 2026-11-18 (replacing the small cut-outs from his
  // overview sheet). Eyes measured on the pupils.
  '/art/critters/swan.webp': {
    pad: 0.1,
    face: { cx: 0.44, cy: 0.23, rx: 0.175, ry: 0.14, soft: 0.15 },
    eyes: [
      { cx: 0.392, cy: 0.188, rx: 0.035, ry: 0.04 },
      { cx: 0.518, cy: 0.192, rx: 0.03, ry: 0.04 },
    ],
    bones: [
      // the long neck sways, so the head bobs gracefully
      { name: 'head', pivot: [0.5, 0.42], region: { cx: 0.43, cy: 0.2, rx: 0.17, ry: 0.17, soft: 0.35 },
        swing: { deg: 4, period: 4.8 }, poke: { deg: 9, period: 0.7 } },
      // big open wings beat slowly from the shoulders
      { name: 'wing-left', pivot: [0.38, 0.52], region: { cx: 0.18, cy: 0.47, rx: 0.18, ry: 0.22, soft: 0.35 },
        swing: { deg: 8, period: 1.9 }, poke: { deg: 18, period: 0.3 } },
      { name: 'wing-right', pivot: [0.6, 0.5], region: { cx: 0.8, cy: 0.44, rx: 0.17, ry: 0.22, soft: 0.35 },
        swing: { deg: -8, period: 1.9 }, poke: { deg: -18, period: 0.3 } },
      { name: 'tail', pivot: [0.6, 0.74], region: { cx: 0.7, cy: 0.77, rx: 0.08, ry: 0.07, soft: 0.35 },
        swing: { deg: 8, period: 1.3, phase: 0.3 }, poke: { deg: 16, period: 0.26 } },
    ],
  },
  '/art/critters/frog.webp': {
    pad: 0.1,
    face: { cx: 0.5, cy: 0.28, rx: 0.34, ry: 0.225, soft: 0.15 },
    eyes: [
      { cx: 0.367, cy: 0.2, rx: 0.075, ry: 0.08 },
      { cx: 0.627, cy: 0.2, rx: 0.075, ry: 0.08 },
    ],
    bones: [
      { name: 'head', pivot: [0.5, 0.56], region: { cx: 0.5, cy: 0.28, rx: 0.4, ry: 0.28, soft: 0.35 },
        swing: { deg: 3, period: 4.4 }, poke: { deg: 7, period: 0.6 } },
      // back legs flex as if about to hop
      { name: 'leg-left', pivot: [0.3, 0.68], region: { cx: 0.14, cy: 0.78, rx: 0.15, ry: 0.17, soft: 0.35 },
        swing: { deg: 4, period: 2.6 }, poke: { deg: 12, period: 0.28 } },
      { name: 'leg-right', pivot: [0.7, 0.68], region: { cx: 0.86, cy: 0.78, rx: 0.15, ry: 0.17, soft: 0.35 },
        swing: { deg: -4, period: 2.6 }, poke: { deg: -12, period: 0.28 } },
    ],
  },
  '/art/critters/squirrel.webp': {
    pad: 0.1,
    face: { cx: 0.365, cy: 0.325, rx: 0.29, ry: 0.155, soft: 0.15 },
    eyes: [
      { cx: 0.27, cy: 0.285, rx: 0.058, ry: 0.06 },
      { cx: 0.455, cy: 0.287, rx: 0.058, ry: 0.06 },
    ],
    bones: [
      { name: 'head', pivot: [0.37, 0.52], region: { cx: 0.36, cy: 0.28, rx: 0.3, ry: 0.24, soft: 0.35 },
        swing: { deg: 3, period: 5 }, poke: { deg: 6, period: 0.7 } },
      { name: 'ear-left', pivot: [0.24, 0.15], region: { cx: 0.2, cy: 0.09, rx: 0.07, ry: 0.08, soft: 0.35 },
        swing: { deg: 7, period: 2.6, phase: 0.2 }, poke: { deg: 14, period: 0.3 } },
      { name: 'ear-right', pivot: [0.52, 0.15], region: { cx: 0.56, cy: 0.09, rx: 0.07, ry: 0.08, soft: 0.35 },
        swing: { deg: -6, period: 3, phase: 0.6 }, poke: { deg: -14, period: 0.3 } },
      // the big bushy tail swishes from its base
      { name: 'tail', pivot: [0.6, 0.82], region: { cx: 0.8, cy: 0.42, rx: 0.18, ry: 0.36, soft: 0.35 },
        swing: { deg: 5, period: 2.3 }, poke: { deg: 11, period: 0.34 } },
      // paws nibble at the acorn
      { name: 'arms', pivot: [0.36, 0.62], region: { cx: 0.35, cy: 0.72, rx: 0.14, ry: 0.1, soft: 0.35 },
        swing: { deg: 4, period: 0.9 }, poke: { deg: 10, period: 0.22 } },
    ],
  },
  '/art/critters/hedgehog.webp': {
    pad: 0.1,
    face: { cx: 0.5, cy: 0.45, rx: 0.3, ry: 0.16, soft: 0.15 },
    eyes: [
      { cx: 0.396, cy: 0.4, rx: 0.065, ry: 0.07 },
      { cx: 0.611, cy: 0.4, rx: 0.065, ry: 0.07 },
    ],
    bones: [
      { name: 'head', pivot: [0.5, 0.64], region: { cx: 0.5, cy: 0.38, rx: 0.3, ry: 0.26, soft: 0.35 },
        swing: { deg: 2.5, period: 5 }, poke: { deg: 6, period: 0.7 } },
      { name: 'ear-left', pivot: [0.33, 0.3], region: { cx: 0.28, cy: 0.23, rx: 0.08, ry: 0.08, soft: 0.35 },
        swing: { deg: 6, period: 2.7, phase: 0.2 }, poke: { deg: 12, period: 0.3 } },
      { name: 'ear-right', pivot: [0.67, 0.3], region: { cx: 0.72, cy: 0.23, rx: 0.08, ry: 0.08, soft: 0.35 },
        swing: { deg: -6, period: 3.1, phase: 0.6 }, poke: { deg: -12, period: 0.3 } },
      { name: 'arm-left', pivot: [0.4, 0.66], region: { cx: 0.38, cy: 0.74, rx: 0.07, ry: 0.06, soft: 0.35 },
        swing: { deg: 9, period: 1.6 }, poke: { deg: 18, period: 0.3 } },
      { name: 'arm-right', pivot: [0.6, 0.66], region: { cx: 0.62, cy: 0.74, rx: 0.07, ry: 0.06, soft: 0.35 },
        swing: { deg: -9, period: 1.6, phase: 0.5 }, poke: { deg: -18, period: 0.3 } },
      // the prickles ruffle on each side
      { name: 'quills-left', pivot: [0.38, 0.6], region: { cx: 0.1, cy: 0.55, rx: 0.1, ry: 0.25, soft: 0.4 },
        swing: { deg: 3, period: 3.4 }, poke: { deg: 8, period: 0.25 } },
      { name: 'quills-right', pivot: [0.62, 0.6], region: { cx: 0.9, cy: 0.55, rx: 0.1, ry: 0.25, soft: 0.4 },
        swing: { deg: -3, period: 3.4 }, poke: { deg: -8, period: 0.25 } },
    ],
  },
  '/art/critters/bee.webp': {
    pad: 0.1,
    face: { cx: 0.49, cy: 0.415, rx: 0.25, ry: 0.17, soft: 0.15 },
    eyes: [
      { cx: 0.402, cy: 0.356, rx: 0.056, ry: 0.058 },
      { cx: 0.576, cy: 0.359, rx: 0.056, ry: 0.058 },
    ],
    bones: [
      { name: 'head', pivot: [0.49, 0.56], region: { cx: 0.49, cy: 0.35, rx: 0.24, ry: 0.22, soft: 0.35 },
        swing: { deg: 3, period: 4.2 }, poke: { deg: 7, period: 0.6 } },
      { name: 'antennae', pivot: [0.49, 0.2], region: { cx: 0.49, cy: 0.1, rx: 0.22, ry: 0.1, soft: 0.35 },
        swing: { deg: 6, period: 1.5, phase: 0.3 }, poke: { deg: 14, period: 0.25 } },
      // quick buzzing wings
      { name: 'wing-left', pivot: [0.3, 0.5], region: { cx: 0.14, cy: 0.48, rx: 0.15, ry: 0.24, soft: 0.35 },
        swing: { deg: 13, period: 0.4 }, poke: { deg: 20, period: 0.18 } },
      { name: 'wing-right', pivot: [0.7, 0.5], region: { cx: 0.86, cy: 0.48, rx: 0.15, ry: 0.24, soft: 0.35 },
        swing: { deg: -13, period: 0.4 }, poke: { deg: -20, period: 0.18 } },
      { name: 'legs-left', pivot: [0.36, 0.72], region: { cx: 0.24, cy: 0.8, rx: 0.11, ry: 0.14, soft: 0.35 },
        swing: { deg: 6, period: 1.4 }, poke: { deg: 12, period: 0.25 } },
      { name: 'legs-right', pivot: [0.64, 0.72], region: { cx: 0.76, cy: 0.8, rx: 0.11, ry: 0.14, soft: 0.35 },
        swing: { deg: -6, period: 1.4, phase: 0.5 }, poke: { deg: -12, period: 0.25 } },
    ],
  },
  '/art/critters/butterfly.webp': {
    pad: 0.1,
    face: { cx: 0.49, cy: 0.47, rx: 0.2, ry: 0.14, soft: 0.15 },
    eyes: [
      { cx: 0.414, cy: 0.43, rx: 0.05, ry: 0.055 },
      { cx: 0.569, cy: 0.434, rx: 0.05, ry: 0.055 },
    ],
    bones: [
      { name: 'head', pivot: [0.49, 0.6], region: { cx: 0.49, cy: 0.4, rx: 0.18, ry: 0.17, soft: 0.35 },
        swing: { deg: 3, period: 4.4 }, poke: { deg: 7, period: 0.6 } },
      { name: 'antennae', pivot: [0.49, 0.3], region: { cx: 0.49, cy: 0.17, rx: 0.2, ry: 0.12, soft: 0.35 },
        swing: { deg: 5, period: 1.8, phase: 0.3 }, poke: { deg: 12, period: 0.25 } },
      // big wings beat from the body
      { name: 'wing-left', pivot: [0.44, 0.58], region: { cx: 0.17, cy: 0.6, rx: 0.17, ry: 0.4, soft: 0.35 },
        swing: { deg: 10, period: 0.9 }, poke: { deg: 18, period: 0.25 } },
      { name: 'wing-right', pivot: [0.56, 0.58], region: { cx: 0.83, cy: 0.6, rx: 0.17, ry: 0.4, soft: 0.35 },
        swing: { deg: -10, period: 0.9 }, poke: { deg: -18, period: 0.25 } },
    ],
  },
};

export function rigFor(src: string): PetRig | null {
  return PET_RIGS[src] ?? CRITTER_RIGS[src] ?? CHARACTER_RIGS[src] ?? null;
}
