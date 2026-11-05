'use client';

// ── Choose Noel's read-aloud voice (grown-ups only) ──
// Lists the friendly English voices this device has, best first, with a
// "Hear it" button. "Automatic" picks the warmest one for you. The list
// differs on every phone and computer, because each ships its own voices.

import { useEffect, useState } from 'react';
import { friendlyVoices, chosenVoice, isNaturalVoice, say } from '@/lib/voice';

const SAMPLE = "Hi! I'm Noel. Let's go on an adventure with Kailia!";

/** "Microsoft Ana Online (Natural) - English (United States)" -> "Ana (natural)" */
function prettyName(v: SpeechSynthesisVoice) {
  let n = v.name.replace(/^(Microsoft|Google|Apple)\s+/i, '').replace(/\s*-\s*English.*$/i, '');
  n = n.replace(/\s*Online\s*\(Natural\)/i, ' (natural)').replace(/\s*\((Enhanced|Premium)\)/i, ' (enhanced)');
  if (/^ana\b/i.test(n)) n = n.replace(/\(natural\)/, '(natural, kid voice)');
  const region = v.lang.split(/[-_]/)[1]?.toUpperCase();
  return region && region !== 'US' && !/\b(UK|GB|United Kingdom)\b/i.test(n) ? `${n} · ${region}` : n;
}

export default function VoicePicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [auto, setAuto] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => {
      setVoices(friendlyVoices().slice(0, 12));
      setAuto(chosenVoice());
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load);
  }, [value]);

  if (!voices.length) {
    return <p className="text-xs text-gray-500">This device has no read-aloud voices.</p>;
  }

  const current = voices.find(v => v.name === value);
  const playing = current ?? auto;

  return (
    <div>
      <div className="flex gap-2">
        <select value={current ? value : ''} onChange={e => onChange(e.target.value)}
          aria-label="Noel's voice"
          className="flex-1 min-w-0 min-h-[44px] rounded-xl px-3 text-sm font-semibold text-gray-800 bg-white"
          style={{ border: '1px solid #CBD5E1' }}>
          <option value="">{auto ? `Automatic: ${prettyName(auto)}` : 'Automatic'}</option>
          {voices.map(v => <option key={v.name} value={v.name}>{prettyName(v)}</option>)}
        </select>
        <button type="button" onClick={() => setTimeout(() => say(SAMPLE), 0)}
          className="min-h-[44px] px-4 rounded-xl text-sm font-extrabold text-white transition-transform active:scale-95"
          style={{ background: '#7C3AED' }}>
          Hear it
        </button>
      </div>
      {playing && !isNaturalVoice(playing) && (
        <p className="text-xs text-gray-500 mt-1.5">
          Tip: voices marked natural or enhanced sound most like a real person. On iPhone and iPad you can add one free in
          Settings &gt; Accessibility &gt; Spoken Content &gt; Voices.
        </p>
      )}
    </div>
  );
}
