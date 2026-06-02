import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Orbi Developer Portal',
  description: 'Manage your Orbi API key, gas sponsorship, and deployer account.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-screen bg-[#020817] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
