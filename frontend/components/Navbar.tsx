'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, MessageSquare, BarChart3, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/books', label: 'Books', icon: BookOpen },
  { href: '/qa', label: 'AI Q&A', icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-[#e2e0d8]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#ffc900]">
            <BookOpen size={16} className="text-black" />
          </div>
          <span className="font-black text-xl text-black tracking-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>BookLens</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  color: isActive ? '#1a1a1a' : '#4b5563',
                  background: isActive ? '#fef3c7' : 'transparent',
                }}>
                <Icon size={15} />
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e5b400]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
