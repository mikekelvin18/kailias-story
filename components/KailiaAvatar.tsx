import Image from 'next/image';

export default function KailiaAvatar({ size = 100 }: { size?: number }) {
  return (
    <Image
      src="/kailia-avatar.png"
      alt="Kailia"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
      priority
    />
  );
}
