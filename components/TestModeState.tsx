'use client';

import { useTestTapMode } from '@/hooks/useTestTapMode';

/** /review: says whether test mode (tap instead of drag) is on in this tab. */
export default function TestModeState() {
  const on = useTestTapMode();
  return (
    <p className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-extrabold" data-test-mode-state={on ? 'on' : 'off'}
      style={on ? { background: '#DCFCE7', color: '#065F46' } : { background: '#F1F5F9', color: '#334155' }}>
      Test mode is {on ? 'ON in this tab' : 'off'}
    </p>
  );
}
