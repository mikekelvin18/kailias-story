// A small drawn starlight star (warm yellow, brown outline) for reward
// lines, instead of the ✨ emoji.
export default function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-0.2em' }}>
      <path d="M12 1.8l2.9 6.6 7.2.7-5.4 4.8 1.6 7.1L12 17.3 5.7 21l1.6-7.1L1.9 9.1l7.2-.7z" fill="#FDE047" stroke="#3b2416" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="9.5" cy="9.5" r="1.4" fill="#FFFBE0" />
    </svg>
  );
}
