// ── Kailia's Garden: asset manifest ──
// Every picture the garden shows, with a stable id. `status` says whether
// it is final art or a temporary drawing in code:
//   painted — Kelvin's painted picture, final
//   code    — drawn in code to the art bible, TEMPORARY until a painted
//             picture replaces it (then: drop the file in public/art/world/,
//             set `src`, and the prop component draws the picture instead)
// Ids never change, so saved stickers and quest data stay valid.

export interface AssetEntry {
  id: string;
  kind: 'character' | 'pet' | 'environment' | 'object' | 'effect' | 'ui';
  status: 'painted' | 'code';
  /** file under public/, or the component that draws it */
  src: string;
  /** size in world px (the garden is 2400 x 1000) */
  size: [number, number];
  /** what moves, for animation work */
  animation?: string;
  /** loaded with the garden, or only when needed */
  load: 'eager' | 'lazy';
}

export const GARDEN_ASSETS: AssetEntry[] = [
  { id: 'kailia', kind: 'character', status: 'painted', src: '/characters/painted/kailia/*', size: [200, 250], animation: 'run cycle (5 frames, rig), front portrait (rig: blink, head), left/right portraits', load: 'eager' },
  { id: 'noel', kind: 'character', status: 'painted', src: '/characters/painted/noel/portrait-front.png', size: [170, 204], animation: 'rig: blink, breathe, tap squish', load: 'eager' },
  { id: 'pet', kind: 'pet', status: 'painted', src: '/art/pets/<name>.webp (the chosen friend)', size: [128, 160], animation: 'rig: blink, head, wings/tail; CSS: walk, sniff, sad, cheer, dance', load: 'eager' },
  { id: 'garden-sky', kind: 'environment', status: 'code', src: 'GardenScene.tsx#GardenSky', size: [0, 0], animation: 'clouds drift', load: 'eager' },
  { id: 'garden-hills', kind: 'environment', status: 'code', src: 'GardenScene.tsx#GardenFar', size: [2400, 1000], animation: 'parallax 0.3', load: 'eager' },
  { id: 'garden-treeline', kind: 'environment', status: 'code', src: 'GardenScene.tsx#GardenMid', size: [2400, 1000], animation: 'parallax 0.6', load: 'eager' },
  { id: 'garden-ground', kind: 'environment', status: 'code', src: 'GardenScene.tsx#GardenGround', size: [2400, 1000], animation: 'stream ripples, reeds sway', load: 'eager' },
  { id: 'garden-cottage', kind: 'environment', status: 'code', src: 'GardenScene.tsx#Cottage', size: [400, 430], load: 'eager' },
  { id: 'garden-foreground', kind: 'environment', status: 'code', src: 'GardenScene.tsx#GardenFront', size: [2400, 1000], animation: 'parallax 1.15, sway', load: 'eager' },
  { id: 'toy-chest', kind: 'object', status: 'code', src: 'GardenProps.tsx#ToyChest', size: [150, 130], animation: 'lid opens', load: 'eager' },
  { id: 'watering-can', kind: 'object', status: 'code', src: 'GardenProps.tsx#WateringCan', size: [140, 110], animation: 'tilts and pours', load: 'eager' },
  { id: 'sunflower', kind: 'object', status: 'code', src: 'GardenProps.tsx#Sunflower', size: [220, 340], animation: 'head lifts with the water, blooms, points', load: 'eager' },
  { id: 'stepping-stone', kind: 'object', status: 'code', src: 'GardenProps.tsx#Stone', size: [96, 64], animation: 'snaps into place', load: 'eager' },
  { id: 'bush', kind: 'object', status: 'code', src: 'GardenProps.tsx#Bush', size: [190, 140], animation: 'rustles', load: 'eager' },
  { id: 'star-ball', kind: 'object', status: 'code', src: 'GardenProps.tsx#StarBall', size: [64, 64], animation: 'glows, pops out, thrown', load: 'eager' },
  { id: 'ladybug', kind: 'object', status: 'code', src: 'GardenProps.tsx#Ladybug', size: [40, 34], animation: 'flies off when found', load: 'eager' },
  { id: 'frog', kind: 'object', status: 'code', src: 'GardenProps.tsx#Frog', size: [120, 80], animation: 'breathes, hops', load: 'eager' },
  { id: 'leaf-pile', kind: 'object', status: 'code', src: 'GardenProps.tsx#LeafPile', size: [140, 70], animation: 'scatters', load: 'eager' },
  { id: 'butterfly', kind: 'effect', status: 'code', src: 'GardenProps.tsx#Butterfly', size: [60, 50], animation: 'flaps, flies away', load: 'eager' },
  { id: 'snail', kind: 'effect', status: 'code', src: 'GardenProps.tsx#Snail', size: [70, 50], animation: 'peeks out', load: 'eager' },
  { id: 'treasure-shelf', kind: 'ui', status: 'code', src: 'GardenProps.tsx#TreasureShelf', size: [130, 60], load: 'eager' },
];
