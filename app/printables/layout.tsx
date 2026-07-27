import AssessmentGate from '@/components/AssessmentGate';

// Covers Printables (/printables and /printables/[id]) — see
// AssessmentGate for why this needs its own layout rather than relying
// on /play's.
export default function PrintablesLayout({ children }: { children: React.ReactNode }) {
  return <AssessmentGate>{children}</AssessmentGate>;
}
