import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Movie Recommendation System Using Collaborative Filtering',
  description:
    'An interactive movie recommendation platform powered by User-Based Collaborative Filtering, Item-Based Collaborative Filtering, and Matrix Factorization (SVD).',
  openGraph: {
    title: 'Movie Recommendation System Using Collaborative Filtering',
    description:
      'Discover how Collaborative Filtering predicts movie ratings using User-Based CF, Item-Based CF, and Matrix Factorization (SVD).',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movie Recommendation System Using Collaborative Filtering',
    description:
      'Interactive Machine Learning platform demonstrating User-Based CF, Item-Based CF, and Matrix Factorization (SVD).',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#0B192C] text-[#F8FAFC] font-sans antialiased selection:bg-[#38BDF8] selection:text-[#0B192C]"
      >
        {children}
      </body>
    </html>
  );
}
