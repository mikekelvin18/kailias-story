import type { Metadata } from 'next';
import { Baloo_2 } from 'next/font/google';
import './globals.css';
import { AssessmentProvider } from '@/context/AssessmentContext';

// A big, round, bouncy display font — reads as a kids' storybook/game
// instead of a generic system font, for every bit of on-screen text.
const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-baloo',
});

export const metadata: Metadata = {
  title: "Kailia's Story — A Learning Adventure",
  description: "A fun, evidence-inspired learning journey for children ages 2–12.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${baloo.variable}`}>
      <body className="min-h-full flex flex-col">
        <AssessmentProvider>
          {children}
        </AssessmentProvider>
      </body>
    </html>
  );
}
