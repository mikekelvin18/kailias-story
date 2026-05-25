import type { Metadata } from 'next';
import './globals.css';
import { AssessmentProvider } from '@/context/AssessmentContext';

export const metadata: Metadata = {
  title: "Kailia's Story — A Learning Adventure",
  description: "A fun, evidence-inspired learning journey for children ages 2–12.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AssessmentProvider>
          {children}
        </AssessmentProvider>
      </body>
    </html>
  );
}
