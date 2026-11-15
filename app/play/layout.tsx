import AssessmentGate from '@/components/AssessmentGate';
import GameMusic from '@/components/GameMusic';
import NoelVoice from '@/components/NoelVoice';

// Covers the entire world map and every quest under it (/play/*, via
// Next.js layout nesting — one check protects all of them, including
// direct/bookmarked links to a specific quest). GameMusic adds the soft
// background loop and its on/off button inside the games; NoelVoice reads
// each game's story card and Noel's bubble aloud.
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssessmentGate>
      {children}
      <GameMusic />
      <NoelVoice />
    </AssessmentGate>
  );
}
