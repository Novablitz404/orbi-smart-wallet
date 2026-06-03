import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Orbi — The Smart Wallet for Stellar',
  description: 'No seed phrase. No gas fees. Just your face. The first passkey smart wallet on Stellar.',
  metadataBase: new URL('https://orbiwallet.xyz'),
  openGraph: {
    title: 'Orbi — The Smart Wallet for Stellar',
    description: 'No seed phrase. No gas fees. Just your face.',
    url: 'https://orbiwallet.xyz',
    siteName: 'Orbi',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Orbi — The Smart Wallet for Stellar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orbi — The Smart Wallet for Stellar',
    description: 'No seed phrase. No gas fees. Just your face.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#020817] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
