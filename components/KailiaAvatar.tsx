import Image from 'next/image';
import { PAINTED_ART } from './characters/characters.config';

export default function KailiaAvatar({ size = 100 }: { size?: number }) {
  return (
    <Image
      src={PAINTED_ART ? "/kailia-avatar-painted.png" : "/kailia-avatar.png"}
      alt="Kailia"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
      priority
    />
  );
}
