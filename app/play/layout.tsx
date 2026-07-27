import AssessmentGate from '@/components/AssessmentGate';

// Covers the entire world map and every quest under it (/play/*, via
// Next.js layout nesting — one check protects all of them, including
// direct/bookmarked links to a specific quest).
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <AssessmentGate>{children}</AssessmentGate>;
}
