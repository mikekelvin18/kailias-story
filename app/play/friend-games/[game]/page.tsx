'use client';

// ── A friend's signature game ──
// /play/friend-games/<id>: looks the game up and runs it in the shared
// FriendGameShell (components/friends/). The id is a game name, never
// child data.

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FriendGameShell from '@/components/friends/FriendGameShell';
import { findFriendGame } from '@/components/friends/games';

export default function FriendGamePage() {
  const { game } = useParams<{ game: string }>();
  const router = useRouter();
  const def = findFriendGame(game);

  useEffect(() => { if (!def) router.replace('/play/friends'); }, [def, router]);

  return def ? <FriendGameShell game={def} /> : null;
}
