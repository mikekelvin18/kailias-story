import Link from 'next/link';
import PandaSprite from '@/components/characters/PandaSprite';

// Any address that doesn't exist lands here instead of a blank error:
// Noel says the path is hidden and offers the two ways back.
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center"
      style={{ background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)' }}>
      <PandaSprite size={130} expression="thinking" />
      <h1 className="text-3xl font-extrabold text-white mt-4 drop-shadow-lg">Hmm, this path is hidden!</h1>
      <p className="text-lg text-white mt-2 max-w-sm" style={{ opacity: 0.92 }}>
        Noel looked everywhere, but this page isn&apos;t on the map. Let&apos;s head back together.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none sm:w-auto">
        <Link href="/play" className="px-10 py-4 rounded-full text-xl font-extrabold shadow-xl transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#3B0764' }}>
          Back to the map
        </Link>
        <Link href="/" className="px-10 py-4 rounded-full text-xl font-extrabold transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'white', color: '#4C1D95' }}>
          Front page
        </Link>
      </div>
    </main>
  );
}
