// ── The pet's egg ──
// A simple drawn egg (no emoji) for the first stage, before the friend
// hatches. Rocks gently; "Reduce motion" stills it (the wiggle class).

export default function PetEgg({ size, crack = false }: { size: number; crack?: boolean }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" aria-hidden="true" className="wiggle" style={{ transformOrigin: '50% 100%' }}>
      <ellipse cx="50" cy="114" rx="30" ry="5" fill="rgba(60,40,90,0.15)" />
      <path d="M50 6 C76 6 92 48 92 74 C92 98 74 112 50 112 C26 112 8 98 8 74 C8 48 24 6 50 6 Z"
        fill="#F5EBFF" stroke="#7C5CC4" strokeWidth="3.5" />
      <path d="M22 44 C30 40 34 52 42 48" fill="none" stroke="#C4B5FD" strokeWidth="5" strokeLinecap="round" />
      <circle cx="64" cy="40" r="6" fill="#FBCFE8" />
      <circle cx="30" cy="80" r="7" fill="#BAE6FD" />
      <circle cx="70" cy="86" r="5" fill="#FDE68A" />
      <circle cx="52" cy="66" r="4" fill="#BBF7D0" />
      <ellipse cx="36" cy="28" rx="7" ry="12" fill="#FFFFFF" opacity="0.7" transform="rotate(-20 36 28)" />
      {crack && (
        <path d="M14 66 L28 58 L38 70 L50 56 L62 70 L74 58 L86 66" fill="none" stroke="#5B3FA0" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      )}
    </svg>
  );
}
