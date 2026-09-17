import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pawan K. Kushwaha — Product Designer & Prototyper',
  description:
    'Portfolio of Pawan K. Kushwaha — Product and Industrial Designer specializing in tangible prototyping, DFM engineering, CAD, and human-centered design.',
  keywords: [
    'Pawan Kushwaha',
    'Product Designer',
    'Industrial Designer',
    'Prototyping',
    'DFM',
    'CAD',
    '3D Printing',
  ],
  authors: [{ name: 'Pawan Kumar Kushwaha' }],
  openGraph: {
    title: 'Pawan K. Kushwaha — Product Designer & Prototyper',
    description: 'Design. Make. Explore. Physical prototyping and digital systems.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
