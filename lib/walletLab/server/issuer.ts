// ── Wallet lab: the ERC-8426 issuer ──
// One issuer serves every pet card. It answers the standard's routes under
// /wallet-pass (manifest, challenge, signed actions, capability links,
// rotation, pass downloads), and Apple's update service under /wallet-apple.
//
// Who can do what:
//   • Add the card / sync the pet / delete the card: only the device that
//     holds the card's key, proven by signing a one-time challenge
//     (ERC-4361). That key never leaves the family's browser.
//   • "Say hi" from the card's back: a capability link, bounded on chain to
//     3 a day, moving nothing.

import { createIssuer, kvStores, ActionError, type Issuer } from '@erc8426/issuer';
import { appleFormatProvider, createApnsClient, type AppleFormatProvider } from '@erc8426/apple';
import { googleFormatProvider, googleWalletClient, saveOrigins } from '@erc8426/google';
import type { PassDeliveryProvider } from '@erc8426/core';
import { settings, missingSettings } from './config';
import { kv, appleStore, googleStore } from './stores';
import { chainTools } from './chain';
import { renderCard } from './render';
import { CARD_PETS, STAGE_SLUGS } from '../shared';

interface Lab {
  issuer: Issuer;
  apple: AppleFormatProvider | null;
}

let lab: Lab | null = null;

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function helloPage(postUrl: string, picture: string): string {
  const attempt = crypto.randomUUID();
  const safeUrl = esc(postUrl);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Say hi</title><meta name="robots" content="noindex">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#2E2A5A;color:#fff;font:600 18px/1.4 'Trebuchet MS',system-ui,sans-serif;padding:16px}
main{max-width:360px;text-align:center}img{width:100%;max-width:340px;height:auto;border-radius:14px}button{margin-top:20px;min-height:56px;padding:0 36px;border:0;border-radius:999px;background:#F7D774;color:#2E2A5A;font:800 20px 'Trebuchet MS',system-ui,sans-serif}</style></head>
<body><main><img src="/wallet-lab/${picture}@3x.png" alt=""><h1 style="font-size:24px">Say hi to your pet?</h1>
<p>Your pet loves hellos. It can hear up to three a day.</p>
<form method="post" action="${safeUrl}"><input type="hidden" name="attempt" value="${attempt}"><button type="submit">Say hi!</button></form></main></body></html>`;
}

async function petPicture(tokenId: string): Promise<{ picture: string; name: string }> {
  try {
    const pet = await chainTools(settings()).pet(BigInt(tokenId));
    const friend = CARD_PETS[pet.companion] ?? CARD_PETS[5];
    if (pet.stage === 0) return { picture: 'strip-egg', name: 'Your egg' };
    return { picture: `strip-${friend.slug}-${STAGE_SLUGS[Math.min(pet.stage, 3)]}`, name: friend.name };
  } catch {
    return { picture: 'strip-egg', name: 'Your pet' };
  }
}

/**
 * The page after "Say hi!" is tapped. The toolkit's own page is plain
 * ("Done. The action ran."), so the route asks for JSON and draws this.
 */
export async function helloResultPage(response: Response): Promise<Response> {
  const body = (await response.clone().json().catch(() => ({}))) as { tokenId?: string };
  const { picture, name } = body.tokenId ? await petPicture(body.tokenId) : { picture: 'strip-egg', name: 'Your pet' };
  const [title, text] = response.ok
    ? [`${name} heard you!`, 'Thank you for saying hi. Your card will show the new hello in a moment.']
    : response.status === 429
      ? [`${name} heard lots of hellos today`, 'Come back tomorrow to say hi again.']
      : ['Hmm, that didn\u2019t work', 'Please try again in a little while.'];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="robots" content="noindex">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#2E2A5A;color:#fff;font:600 18px/1.4 'Trebuchet MS',system-ui,sans-serif;padding:16px}
main{max-width:360px;text-align:center}img{width:100%;max-width:340px;height:auto;border-radius:14px}</style></head>
<body><main><img src="/wallet-lab/${esc(picture)}@3x.png" alt=""><h1 style="font-size:24px">${esc(title)}</h1><p>${esc(text)}</p></main></body></html>`;
  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(html, { status: response.status, headers });
}

export function walletLab(): Lab {
  if (lab) return lab;
  const s = settings();
  const missing = missingSettings(s);
  if (missing.length) throw new Error(`Wallet lab not set up: ${missing.join('; ')}`);
  const store = kv(s);
  const chain = chainTools(s);
  const domain = new URL(s.origin).host;

  const providers: PassDeliveryProvider[] = [];
  let apple: AppleFormatProvider | null = null;
  if (s.apple) {
    const passStore = appleStore(store);
    const certificates = {
      signerCert: s.apple.signerCert!,
      signerKey: s.apple.signerKey!,
      signerKeyPassphrase: s.apple.signerKeyPassphrase,
      wwdr: s.apple.wwdr!,
    };
    apple = appleFormatProvider({
      passTypeIdentifier: s.apple.passTypeIdentifier,
      teamIdentifier: s.apple.teamIdentifier,
      certificates,
      origin: s.origin,
      basePath: '/wallet-apple',
      store: passStore,
      sharingProhibited: true,
      apns: createApnsClient({
        certificate: { cert: certificates.signerCert, key: certificates.signerKey, passphrase: certificates.signerKeyPassphrase },
        passTypeIdentifier: s.apple.passTypeIdentifier,
        store: passStore,
      }),
    });
    providers.push(apple);
  }
  if (s.google?.serviceAccount) {
    providers.push(
      googleFormatProvider({
        client: googleWalletClient({
          serviceAccount: { client_email: s.google.serviceAccount.client_email, private_key: s.google.serviceAccount.private_key },
          issuerId: s.google.issuerId,
        }),
        classSuffix: 'kailia_pet_card_lab_v1',
        origins: saveOrigins([s.origin]),
        store: googleStore(store),
        view: { screenshots: 'refuse' },
        onError: (err, where) => console.warn('[wallet-lab google]', where, err.message),
      }),
    );
  }

  const issuer = createIssuer({
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    domain,
    baseUrl: s.origin,
    basePath: '/wallet-pass',
    chainId: s.chainId,
    contract: s.contract!,
    mode: 'gated',
    linkSecret: s.linkSecret!,
    publicClient: chain.publicClient as never,
    stores: kvStores(store, { chainId: s.chainId, contract: s.contract! }),
    providers,
    rateLimit: { trustProxy: process.env.VERCEL ? 'vercel' : undefined },
    capability: {
      enabled: true,
      // The page that opens when "Say hi" is tapped on the card's back.
      confirmPage: async ({ postUrl, token }) => {
        const { picture } = await petPicture(token.tokenId);
        return new Response(helloPage(postUrl, picture), { headers: { 'content-type': 'text/html; charset=utf-8' } });
      },
    },
    render: async ({ token, serial, links }) =>
      renderCard({
        origin: s.origin,
        serial,
        pet: await chain.pet(BigInt(token.tokenId)),
        links,
        nowSeconds: Math.floor(Date.now() / 1000),
      }),
    renderBurned: ({ serial }) => ({
      serial,
      style: 'storeCard',
      organizationName: "Kailia's Story",
      description: 'A care pet card that was deleted',
      title: "Kailia's Story",
      colors: { background: '#2E2A5A', foreground: '#FFFFFF', label: '#F7D774' },
      primary: [{ key: 'name', label: 'CARD', value: 'Deleted' }],
      back: [{ key: 'about', label: 'Deleted', value: 'This card was deleted by a grown-up. You can remove it from your wallet.' }],
      voided: true,
    }),
    actions: {
      hello: {
        description: 'Say hi to your pet',
        capability: true,
        bound: 'At most 3 hellos per card per day (enforced on chain). It moves no tokens and no value, and cannot transfer or delete the card.',
        execute: async ({ token, notifyUpdate }) => {
          try {
            await chain.hello(BigInt(token.tokenId));
          } catch {
            throw new ActionError(429, 'hello_limit', 'Your pet already heard lots of hellos today. Try again tomorrow!');
          }
          await notifyUpdate();
          return { ok: true };
        },
      },
      sync: {
        description: "Show your pet's latest growth on the card",
        execute: async ({ token, params, notifyUpdate }) => {
          const p = (params ?? {}) as { companion?: unknown; stage?: unknown; happyDays?: unknown };
          const companion = Number(p.companion), stage = Number(p.stage), happyDays = Number(p.happyDays);
          const ok = Number.isInteger(companion) && companion >= 0 && companion < 6
            && Number.isInteger(stage) && stage >= 0 && stage <= 3
            && Number.isInteger(happyDays) && happyDays >= 0 && happyDays < 100000;
          if (!ok) throw new ActionError(400, 'invalid_params', 'companion 0-5, stage 0-3, happyDays >= 0');
          try {
            await chain.sync(BigInt(token.tokenId), companion, stage, happyDays);
          } catch {
            // the contract refused (e.g. happy days going backwards, or the daily cap)
            throw new ActionError(409, 'not_applied', 'The card could not take this update.');
          }
          await notifyUpdate();
          return { ok: true };
        },
      },
      release: {
        description: 'Delete this pet card',
        transfersOrBurns: true,
        execute: async ({ token, account }) => {
          await chain.release(BigInt(token.tokenId));
          // Void the installed cards (pushes the "deleted" card). Best effort:
          // the burn already happened on chain.
          try {
            await walletLab().issuer.onTransfer(token.tokenId, account, '0x0000000000000000000000000000000000000000');
          } catch (e) {
            console.warn('[wallet-lab] release: could not void installed cards', e instanceof Error ? e.message : e);
          }
          return { ok: true };
        },
      },
    },
    onError: (error, ctx) => console.warn('[wallet-lab]', ctx.operation, ctx.tokenId ?? '', error instanceof Error ? error.message : error),
  });

  lab = { issuer, apple };
  return lab;
}
