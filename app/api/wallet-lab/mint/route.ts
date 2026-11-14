// Makes a new test pet card for a device key. The issuer pays the fee.
// Capped so a stranger can't burn through the test coins.
import { isAddress } from 'viem';
import { labEnabled, settings } from '@/lib/walletLab/server/config';
import { chainTools } from '@/lib/walletLab/server/chain';
import { kv, underLimit } from '@/lib/walletLab/server/stores';
import { walletLab } from '@/lib/walletLab/server/issuer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!labEnabled()) return new Response('Not found', { status: 404 });
  walletLab(); // throws with a clear message if setup is incomplete
  const body = (await request.json().catch(() => null)) as { address?: string; companion?: number } | null;
  const address = body?.address ?? '';
  const companion = Number(body?.companion ?? 5);
  if (!isAddress(address) || !Number.isInteger(companion) || companion < 0 || companion > 5) {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }
  const s = settings();
  const store = kv(s);
  const client = request.headers.get('x-real-ip') ?? 'local';
  if (!(await underLimit(store, `mint:${client}`, 5, 86400)) || !(await underLimit(store, 'mint:all', 200, 86400))) {
    return Response.json({ error: 'rate_limited' }, { status: 429 });
  }
  const tokenId = await chainTools(s).mint(address, companion);
  return Response.json({ tokenId: tokenId.toString(), contract: s.contract, chainId: s.chainId });
}
