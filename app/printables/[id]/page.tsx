'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import PandaSprite from '@/components/characters/PandaSprite';
import WorksheetSheet from '@/components/worksheets/WorksheetSheet';
import { findWorksheet } from '@/lib/worksheets';
import { markWorksheetDone, isWorksheetDone } from '@/lib/worksheetProgress';
import { hasActiveConsent, hasPhotoConsent, recordPhotoConsent } from '@/lib/family';
import { savePhoto, getPhoto, deletePhoto } from '@/lib/photos';
import { awardStarlight } from '@/lib/rewards';

// ─── One printable worksheet: print it, do it, mark it done ──────────────────
// Photo verification is the ONE narrow photo exception in this app — see
// CLAUDE.md Privacy & COPPA rule 4. The upload control below is a plain
// <input type="file"> the PARENT taps; nothing here ever opens a camera
// automatically, and the photo never leaves this device (lib/photos.ts).

export default function PrintableDetailPage() {
  const params = useParams<{ id: string }>();
  const worksheet = findWorksheet(params.id);

  const [done, setDone] = useState(false);
  const [consented, setConsented] = useState(false);
  const [photoConsentGiven, setPhotoConsentGiven] = useState(false);
  const [showPhotoConsent, setShowPhotoConsent] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!worksheet) return;
    setConsented(hasActiveConsent());
    setPhotoConsentGiven(hasPhotoConsent());
    setDone(isWorksheetDone(worksheet.id));
    if (worksheet.verifyMethod === 'photo') {
      getPhoto(worksheet.id).then(p => { if (p) setPhotoUrl(URL.createObjectURL(p.blob)); });
    }
  }, [worksheet]);

  if (!worksheet) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b4b' }}>
        <div className="text-center">
          <p className="text-white font-bold mb-3">Worksheet not found.</p>
          <Link href="/printables" className="text-purple-300 underline">← Back to Printables</Link>
        </div>
      </main>
    );
  }

  function handlePrint() {
    window.print();
  }

  function markTapDone() {
    if (!worksheet) return;
    const alreadyDone = done;
    markWorksheetDone(worksheet.id, false);
    setDone(true);
    if (!alreadyDone) awardStarlight(10);
  }

  function tapAttachPhoto() {
    if (!photoConsentGiven) { setShowPhotoConsent(true); return; }
    fileRef.current?.click();
  }

  function confirmPhotoConsent() {
    recordPhotoConsent();
    setPhotoConsentGiven(true);
    setShowPhotoConsent(false);
    fileRef.current?.click();
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !worksheet) return;
    setSaving(true);
    try {
      await savePhoto(worksheet.id, file);
      const p = await getPhoto(worksheet.id);
      if (p) setPhotoUrl(URL.createObjectURL(p.blob));
      const alreadyDone = done;
      markWorksheetDone(worksheet.id, true);
      setDone(true);
      if (!alreadyDone) awardStarlight(10);
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto() {
    if (!worksheet) return;
    await deletePhoto(worksheet.id);
    setPhotoUrl(null);
  }

  return (
    <main className="min-h-screen pb-10 print:bg-white" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-sheet { box-shadow: none !important; border: none !important; padding: 0 !important; }
          main { background: white !important; }
        }
      `}</style>

      <div className="max-w-md mx-auto px-4 pt-5 no-print">
        <div className="flex items-center justify-between mb-3">
          <Link href="/printables" className="text-sm font-bold text-purple-200">← Printables</Link>
          <span className="text-xs font-bold text-purple-200">{worksheet.emoji} {worksheet.title}</span>
        </div>

        {!consented && (
          <Link href="/family" className="block rounded-2xl p-3 mb-4"
            style={{ background: 'rgba(253,224,71,0.14)', border: '1.5px solid rgba(253,224,71,0.4)' }}>
            <p className="text-xs text-yellow-100">
              ⚠️ Set up the free family account first so this worksheet can be saved as done —
              <span className="underline font-bold"> tap here for the Parent Zone</span>.
            </p>
          </Link>
        )}

        <div className="flex items-start gap-2 rounded-2xl p-3 mb-4"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
          <PandaSprite size={44} expression={done ? 'celebrating' : 'happy'} style={{ flexShrink: 0 }} />
          <p className="text-sm font-semibold text-purple-100 pt-2">
            {done ? 'Already marked done — print again anytime, or do it again for fun!' : worksheet.noelTip}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        <div className="print-sheet rounded-2xl p-3 mb-4 flex justify-center" style={{ background: 'white', border: '1.5px solid rgba(255,255,255,0.2)' }}>
          <WorksheetSheet worksheet={worksheet} />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 no-print">
        <button onClick={handlePrint}
          className="w-full py-3.5 rounded-full text-lg font-extrabold text-white mb-3 transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
          🖨️ Print this page
        </button>

        {worksheet.verifyMethod === 'tap' ? (
          <button onClick={markTapDone} disabled={!consented}
            className="w-full py-3.5 rounded-full text-lg font-extrabold transition-transform hover:scale-105"
            style={{ background: done ? '#059669' : '#FBBF24', color: done ? 'white' : '#1e1b4b', opacity: consented ? 1 : 0.5 }}>
            {done ? '✅ Marked done!' : 'We did it! ✨'}
          </button>
        ) : (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
            <p className="text-xs text-purple-200 mb-2 font-semibold">
              After tracing on paper, a parent takes a photo of the finished sheet to mark it done.
              The photo stays only on this device — it&apos;s never uploaded anywhere.
            </p>
            {photoUrl && (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Completed worksheet" className="w-full rounded-xl mb-2" style={{ maxHeight: 220, objectFit: 'contain', background: '#0000' }} />
                <button onClick={removePhoto} className="text-xs text-red-300 underline">Remove photo</button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
            <button onClick={tapAttachPhoto} disabled={!consented || saving}
              className="w-full py-3.5 rounded-full text-lg font-extrabold transition-transform hover:scale-105"
              style={{ background: done ? '#059669' : '#FBBF24', color: done ? 'white' : '#1e1b4b', opacity: consented ? 1 : 0.5 }}>
              {saving ? 'Saving…' : done ? '✅ Photo saved — replace it' : '📷 Attach a photo'}
            </button>
          </div>
        )}
      </div>

      {showPhotoConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-3xl p-5" style={{ background: 'white' }}>
            <h2 className="text-lg font-extrabold text-gray-800 mb-2">📷 Before you attach a photo</h2>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-700">This is separate from your main account consent. Please read this too:</p>
              <div className="rounded-xl p-2.5 text-xs text-gray-700" style={{ background: '#F8FAFC' }}>
                • The photo stays <strong>only on this device</strong>, forever — never uploaded, emailed, or sent anywhere.
              </div>
              <div className="rounded-xl p-2.5 text-xs text-gray-700" style={{ background: '#F8FAFC' }}>
                • <strong>You</strong> choose the photo — the app never opens a camera by itself.
              </div>
              <div className="rounded-xl p-2.5 text-xs text-gray-700" style={{ background: '#F8FAFC' }}>
                • Deleting the child profile or account deletes every saved photo too.
              </div>
            </div>
            <button onClick={confirmPhotoConsent}
              className="w-full py-3 rounded-full font-extrabold text-white mb-2"
              style={{ background: '#2563EB' }}>
              Got it — choose a photo
            </button>
            <button onClick={() => setShowPhotoConsent(false)} className="w-full py-2 text-sm text-gray-500 font-semibold">
              Not now
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
