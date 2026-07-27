import AssessmentGate from '@/components/AssessmentGate';

// Covers the whole Quest Library (/activities) — see AssessmentGate for
// why this needs its own layout rather than relying on /play's.
export default function ActivitiesLayout({ children }: { children: React.ReactNode }) {
  return <AssessmentGate>{children}</AssessmentGate>;
}
