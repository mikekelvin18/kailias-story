import AssessmentGate from '@/components/AssessmentGate';
import NoelVoice from '@/components/NoelVoice';

// Covers the entire world map and every quest under it (/play/*, via
// Next.js layout nesting — one check protects all of them, including
// direct/bookmarked links to a specific quest). Music (GameMusic) lives in
// the root layout; NoelVoice reads
// each game's story card and Noel's bubble aloud.
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssessmentGate>
      {children}
      <NoelVoice />
    </AssessmentGate>
  );
}
