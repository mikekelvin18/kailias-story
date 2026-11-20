// ── Wallet lab: what the card shows ──
// Kind words only. The pet never gets sick, never dies, and there are no
// numbers that feel like scores: just its name, how it's growing, happy
// days and hellos. A missed day reads "Missed you!".

import type { ImageSource, PassContent } from '@erc8426/core';
import { CARD_PETS, STAGE_NAMES, STAGE_SLUGS } from '../shared';
import type { OnChainPet } from './chain';

const imageCache = new Map<string, Uint8Array>();

async function bytes(url: string): Promise<Uint8Array> {
  const hit = imageCache.get(url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`card picture ${url} answered ${res.status}`);
  const b = new Uint8Array(await res.arrayBuffer());
  imageCache.set(url, b);
  return b;
}

/** One picture at 1x/2x/3x: bytes for Apple, a public https URL for Google. */
async function picture(origin: string, name: string): Promise<ImageSource> {
  const base = `${origin}/wallet-lab/${name}`;
  const [data, data2x, data3x] = await Promise.all([bytes(`${base}.png`), bytes(`${base}@2x.png`), bytes(`${base}@3x.png`)]);
  return { url: `${base}@3x.png?v=1`, data, data2x, data3x };
}

export function moodFor(pet: OnChainPet, nowSeconds: number): string {
  if (pet.stage === 0) return 'Wiggling!';
  const hours = (nowSeconds - pet.lastVisit) / 3600;
  if (hours < 30) return 'Happy to see you';
  return 'Missed you! Come say hi';
}

export async function renderCard(opts: {
  origin: string;
  serial: string;
  pet: OnChainPet;
  links: Record<string, string>;
  nowSeconds: number;
}): Promise<PassContent> {
  const { origin, serial, pet, links, nowSeconds } = opts;
  const friend = CARD_PETS[pet.companion] ?? CARD_PETS[5];
  const stage = Math.min(Math.max(pet.stage, 0), 3);
  const strip = stage === 0 ? 'strip-egg' : `strip-${friend.slug}-${STAGE_SLUGS[stage]}`;
  const [icon, logo, hero] = await Promise.all([picture(origin, 'icon'), picture(origin, 'logo'), picture(origin, strip)]);
  const shownName = stage === 0 ? 'Magic egg' : friend.name;

  return {
    serial,
    style: 'storeCard',
    organizationName: "Kailia's Story",
    description: `${shownName}, a care pet from Kailia's Story`,
    title: "Kailia's Story",
    colors: { background: '#2E2A5A', foreground: '#FFFFFF', label: '#F7D774' },
    images: { icon, logo, hero },
    header: [{ key: 'stage', label: 'GROWING', value: STAGE_NAMES[stage], changeMessage: `${shownName} grew! Now: %@` }],
    primary: [{ key: 'name', label: 'YOUR PET', value: stage === 0 ? 'Egg' : friend.name }], // short, so it never covers the egg
    secondary: [
      { key: 'mood', label: 'TODAY', value: moodFor(pet, nowSeconds) },
      { key: 'happy', label: 'HAPPY DAYS', value: pet.happyDays },
    ],
    auxiliary: [{ key: 'hellos', label: 'HELLOS', value: pet.hellos, changeMessage: `${shownName} heard you say hi!` }],
    back: [
      { key: 'about', label: 'About this card', value: `${shownName} grows each day your child does a little care task in Kailia's Story. Your pet never gets sick and never goes away. A missed day only means it missed you.` },
      { key: 'test', label: 'This is a test', value: 'This card is an experiment on a test blockchain (ERC-8426). It has no money value and cannot be sold or traded.' },
      { key: 'privacy', label: 'Privacy', value: 'The card holds the pet only: its kind, how grown it is, happy days and hellos. No name, age, photo, email or scores.' },
    ],
    links: links.hello ? [{ key: 'hello', label: `Say hi to ${shownName}`, url: links.hello }] : [],
  };
}
