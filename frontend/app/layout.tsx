import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'BookLens — AI-Powered Book Intelligence',
  description: 'Discover, analyze, and query books with AI-powered insights and RAG-based question answering.',
  keywords: 'books, AI, machine learning, book recommendations, RAG, NLP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <Navbar />
        <main className="pt-16 min-h-screen relative z-10">
          {children}
        </main>
        
        {/* Light Minimal Background */}
        <div className="fixed inset-0 z-0 bg-[#f8f6f0] pointer-events-none" />

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1a1a1a',
              border: '1px solid #e2e0d8',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            },
          }}
        />
      </body>
    </html>
  );
}
