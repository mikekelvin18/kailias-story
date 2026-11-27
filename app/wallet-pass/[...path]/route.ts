// ERC-8426 issuer routes (wallet lab experiment). 404 unless WALLET_LAB_ENABLED=1.
import { labEnabled } from '@/lib/walletLab/server/config';
import { walletLab } from '@/lib/walletLab/server/issuer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request): Promise<Response> {
  if (!labEnabled()) return new Response('Not found', { status: 404 });
  return walletLab().issuer.handler(request);
}

export { handle as GET, handle as POST, handle as HEAD, handle as OPTIONS };
