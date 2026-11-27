'use client';

import Link from 'next/link';
import { CritterSprite, type SpeciesKey } from '@/components/characters/CritterSprite';

const NEWEST: SpeciesKey[] = ['swan', 'frog', 'squirrel', 'hedgehog', 'bee', 'butterfly'];
const EARLIER: SpeciesKey[] = ['koala', 'raccoon', 'parrot', 'peacock', 'rabbit', 'deer'];

function Grid({ list }: { list: SpeciesKey[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
      {list.map(s => (
        <div key={s} className="flex flex-col items-center rounded-3xl py-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <CritterSprite species={s} size={140} />
          <span className="mt-1 font-extrabold capitalize text-white">{s}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnimalGallery() {
  return (
    <main className="min-h-screen px-4 py-6" style={{ background: 'linear-gradient(180deg,#1e3a5f,#2c5364)' }}>
      <div className="max-w-xl mx-auto">
        <Link href="/go" className="text-sm font-bold" style={{ color: '#BAE6FD' }}>← Jump links</Link>
        <h1 className="mt-2 text-2xl font-extrabold text-white">Side animals</h1>
        <p className="text-sm mt-1" style={{ color: '#E0F2FE' }}>Preview only. Tap an animal to see its bigger move.</p>
        <h2 className="mt-5 text-lg font-extrabold" style={{ color: '#FDE68A' }}>Newest pictures</h2>
        <Grid list={NEWEST} />
        <h2 className="mt-6 text-lg font-extrabold" style={{ color: '#FDE68A' }}>Earlier pictures</h2>
        <Grid list={EARLIER} />
      </div>
    </main>
  );
}
