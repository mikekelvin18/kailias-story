// ERC-8426 issuer routes (wallet lab experiment). 404 unless WALLET_LAB_ENABLED=1.
import { labEnabled } from '@/lib/walletLab/server/config';
import { walletLab, helloResultPage } from '@/lib/walletLab/server/issuer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request): Promise<Response> {
  if (!labEnabled()) return new Response('Not found', { status: 404 });
  const { issuer } = walletLab();
  // A browser tapping "Say hi!" on the card's link page: let the issuer
  // answer in JSON, then draw our own friendly page instead of its plain one.
  const url = new URL(request.url);
  if (request.method === 'POST' && url.pathname.startsWith('/wallet-pass/links/') && (request.headers.get('accept') ?? '').includes('text/html')) {
    const headers = new Headers(request.headers);
    headers.set('accept', 'application/json');
    const body = await request.arrayBuffer();
    const response = await issuer.handler(new Request(request.url, { method: 'POST', headers, body }));
    return helloResultPage(response);
  }
  return issuer.handler(request);
}

export { handle as GET, handle as POST, handle as HEAD, handle as OPTIONS };
