// ── Wallet lab: where card records live ──
// The ERC-8426 issuer, the Apple web service and the Google provider each
// need a small shared store. All three sit on one Upstash Redis (free tier).
//
// What is stored: card serial numbers, random link seeds, the pet picture
// shown on the card (companion, stage, happy days) and Apple's device push
// tokens. Nothing about the child: no name, age, scores or contact details.

import { Redis } from '@upstash/redis';
import { memoryKv, type KeyValueStore } from '@erc8426/issuer';
import {
  MAX_REGISTRATIONS_PER_PASS, SUPERSEDED_PUSH_WINDOW_MS,
  type ApplePassRecord, type ApplePassStore, type DeviceRegistration,
} from '@erc8426/apple';
import type { GoogleObjectRecord, GoogleObjectStore } from '@erc8426/google';
import type { Settings } from './config';

let shared: KeyValueStore | null = null;

export function kv(s: Settings): KeyValueStore {
  if (shared) return shared;
  if (process.env.WALLET_LAB_MEMORY_STORE === '1' && process.env.NODE_ENV !== 'production') {
    shared = memoryKv(); // local testing only: forgets everything on restart
    return shared;
  }
  if (!s.kv.url || !s.kv.token) throw new Error('Wallet lab: no Redis configured');
  const redis = new Redis({ url: s.kv.url, token: s.kv.token, automaticDeserialization: false });
  shared = {
    get: (k) => redis.get<string>(k),
    async set(k, v, o = {}) {
      const opts: Record<string, unknown> = {};
      if (o.ttlSeconds) opts.ex = o.ttlSeconds;
      if (o.onlyIfAbsent) opts.nx = true;
      return (await redis.set(k, v, opts as never)) === 'OK';
    },
    getDel: (k) => redis.getdel<string>(k),
    del: async (k) => void (await redis.del(k)),
  };
  return shared;
}

const P = 'kailia:walletlab:';
const DATE_KEYS = new Set(['updatedAt', 'expiresAt', 'relevantDate', 'startsAt', 'endsAt']);

function encode(v: unknown): string {
  return JSON.stringify(v, (_k, x) => (x instanceof Uint8Array ? { __bytes: Buffer.from(x).toString('base64') } : x));
}
function decode<T>(raw: string | null): T | null {
  if (raw == null) return null;
  return JSON.parse(raw, (k, x) => {
    if (x && typeof x === 'object' && typeof x.__bytes === 'string') return new Uint8Array(Buffer.from(x.__bytes, 'base64'));
    if (DATE_KEYS.has(k) && typeof x === 'string') return new Date(x);
    return x;
  }) as T;
}

async function getJson<T>(store: KeyValueStore, key: string, fallback: T): Promise<T> {
  return decode<T>(await store.get(key)) ?? fallback;
}
async function putJson(store: KeyValueStore, key: string, value: unknown) {
  await store.set(key, encode(value));
}

/** Apple Wallet: pass records and which iPhones hold each card. */
export function appleStore(store: KeyValueStore): ApplePassStore {
  const passKey = (serial: string) => `${P}apple:pass:${serial}`;
  const regKey = (passType: string, serial: string) => `${P}apple:regs:${passType}:${serial}`;
  const devKey = (device: string, passType: string) => `${P}apple:dev:${device}:${passType}`;
  const pushKey = (token: string) => `${P}apple:push:${token}`;

  return {
    async getPass(serial) {
      return decode<ApplePassRecord>(await store.get(passKey(serial)));
    },
    async putPass(record) {
      await putJson(store, passKey(record.serial), record);
    },
    async register(r: DeviceRegistration) {
      const regs = await getJson<DeviceRegistration[]>(store, regKey(r.passTypeIdentifier, r.serial), []);
      const existing = regs.find((x) => x.deviceLibraryIdentifier === r.deviceLibraryIdentifier);
      if (existing && existing.supersededAt === undefined) {
        existing.pushToken = r.pushToken;
        await putJson(store, regKey(r.passTypeIdentifier, r.serial), regs);
        await putJson(store, pushKey(r.pushToken), [[r.passTypeIdentifier, r.serial]]);
        return false;
      }
      const live = regs.filter((x) => x.supersededAt === undefined);
      if (live.length >= MAX_REGISTRATIONS_PER_PASS) return 'full';
      const next = regs.filter((x) => x.deviceLibraryIdentifier !== r.deviceLibraryIdentifier);
      next.push({ deviceLibraryIdentifier: r.deviceLibraryIdentifier, passTypeIdentifier: r.passTypeIdentifier, serial: r.serial, pushToken: r.pushToken });
      await putJson(store, regKey(r.passTypeIdentifier, r.serial), next);
      const serials = await getJson<string[]>(store, devKey(r.deviceLibraryIdentifier, r.passTypeIdentifier), []);
      if (!serials.includes(r.serial)) serials.push(r.serial);
      await putJson(store, devKey(r.deviceLibraryIdentifier, r.passTypeIdentifier), serials);
      const pushes = await getJson<[string, string][]>(store, pushKey(r.pushToken), []);
      if (!pushes.some(([t, s]) => t === r.passTypeIdentifier && s === r.serial)) pushes.push([r.passTypeIdentifier, r.serial]);
      await putJson(store, pushKey(r.pushToken), pushes);
      return !existing;
    },
    async supersede(passType, serial) {
      const regs = await getJson<DeviceRegistration[]>(store, regKey(passType, serial), []);
      const at = Date.now();
      for (const r of regs) if (r.supersededAt === undefined) r.supersededAt = at;
      await putJson(store, regKey(passType, serial), regs);
    },
    async unregister(device, passType, serial) {
      const regs = await getJson<DeviceRegistration[]>(store, regKey(passType, serial), []);
      await putJson(store, regKey(passType, serial), regs.filter((x) => x.deviceLibraryIdentifier !== device));
      const serials = await getJson<string[]>(store, devKey(device, passType), []);
      await putJson(store, devKey(device, passType), serials.filter((s) => s !== serial));
    },
    async serialsForDevice(device, passType) {
      const serials = await getJson<string[]>(store, devKey(device, passType), []);
      const out: string[] = [];
      for (const s of serials) {
        const regs = await getJson<DeviceRegistration[]>(store, regKey(passType, s), []);
        if (regs.some((x) => x.deviceLibraryIdentifier === device)) out.push(s);
      }
      return out;
    },
    async pushTokensForSerial(passType, serial) {
      const regs = await getJson<DeviceRegistration[]>(store, regKey(passType, serial), []);
      const since = Date.now() - SUPERSEDED_PUSH_WINDOW_MS;
      const superseded = regs.filter((r) => r.supersededAt !== undefined && r.supersededAt >= since).map((r) => r.pushToken);
      const live = regs.filter((r) => r.supersededAt === undefined).map((r) => r.pushToken);
      return [...new Set([...superseded.slice(-MAX_REGISTRATIONS_PER_PASS), ...live])];
    },
    async removePushToken(pushToken) {
      const pushes = await getJson<[string, string][]>(store, pushKey(pushToken), []);
      for (const [passType, serial] of pushes) {
        const regs = await getJson<DeviceRegistration[]>(store, regKey(passType, serial), []);
        await putJson(store, regKey(passType, serial), regs.filter((r) => r.pushToken !== pushToken));
      }
      await store.del(pushKey(pushToken));
    },
  };
}

/** Google Wallet: which Google card object belongs to which serial. */
export function googleStore(store: KeyValueStore): GoogleObjectStore {
  const key = (serial: string) => `${P}google:${serial}`;
  return {
    get: async (serial) => decode<GoogleObjectRecord>(await store.get(key(serial))),
    put: async (serial, record) => putJson(store, key(serial), record),
    delete: async (serial) => store.del(key(serial)),
  };
}

/** A tiny fixed-window counter, used to cap how many test cards get made. */
export async function underLimit(store: KeyValueStore, name: string, limit: number, windowSeconds: number): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const k = `${P}limit:${name}:${bucket}`;
  const n = Number((await store.get(k)) ?? 0) + 1;
  await store.set(k, String(n), { ttlSeconds: windowSeconds * 2 });
  return n <= limit;
}
