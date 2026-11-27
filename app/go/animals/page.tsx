import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { jumpLinksEnabled } from '@/lib/jumpGate';
import AnimalGallery from './AnimalGallery';

// /go/animals: every side animal moving, on one screen (preview builds
// only, like the other jump links). Tap one to see its bigger move.
export default async function Animals() {
  await connection();
  if (!jumpLinksEnabled()) notFound();
  return <AnimalGallery />;
}
