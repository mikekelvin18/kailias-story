'use client';

import { useEffect } from 'react';
import { applyJump, type JumpPlan } from '@/lib/jump';

// Sets up the test child, then does a full page load of the target so every
// part of the app reads the new child from scratch.
export default function JumpRunner({ plan }: { plan: JumpPlan }) {
  useEffect(() => {
    applyJump(plan);
    window.location.replace(plan.path);
  }, [plan]);
  return (
    <main className="min-h-screen flex items-center justify-center text-xl font-bold"
      style={{ background: '#F5F3FF', color: '#4C1D95' }}>
      Getting it ready…
    </main>
  );
}
