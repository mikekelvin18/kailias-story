import AssessmentGate from '@/components/AssessmentGate';
import GameMusic from '@/components/GameMusic';

// Covers the entire world map and every quest under it (/play/*, via
// Next.js layout nesting — one check protects all of them, including
// direct/bookmarked links to a specific quest). GameMusic adds the soft
// background loop and its on/off button inside the games.
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssessmentGate>
      {children}
      <GameMusic />
    </AssessmentGate>
  );
}
