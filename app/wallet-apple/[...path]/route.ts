// Apple Wallet's update service for the wallet lab card: iPhones register
// here and fetch the newest card after a push. 404 unless the lab is on.
import { labEnabled } from '@/lib/walletLab/server/config';
import { walletLab } from '@/lib/walletLab/server/issuer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request): Promise<Response> {
  if (!labEnabled()) return new Response('Not found', { status: 404 });
  const { apple } = walletLab();
  if (!apple) return new Response('Not found', { status: 404 });
  return apple.webService(request);
}

export { handle as GET, handle as POST, handle as DELETE };
