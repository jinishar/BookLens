'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStats, scrapeBooks, getBooks, Stats, Book } from '@/lib/api';
import BookCard from '@/components/BookCard';
import LoadingSpinner, { SkeletonCard } from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  BookOpen, Brain, Star, Layers, Download, Zap,
  TrendingUp, ChevronRight, RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapePages, setScrapePages] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, booksRes] = await Promise.all([getStats(), getBooks()]);
      setStats(statsRes.data);
      setRecentBooks(booksRes.data.results.slice(0, 8));
    } catch (e) {
      toast.error('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    const toastId = toast.loading(`Scraping ${scrapePages} page(s) from books.toscrape.com...`);
    try {
      const res = await scrapeBooks({ num_pages: scrapePages, generate_insights: true });
      toast.success(`✓ Created ${res.data.created} books, skipped ${res.data.skipped} duplicates.`, { id: toastId, duration: 5000 });
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Scraping failed.', { id: toastId });
    } finally {
      setScraping(false);
    }
  };

  const statCards = [
    { label: 'Total Books', value: stats?.total_books ?? 0, icon: BookOpen, color: '#6366f1' },
    { label: 'AI Processed', value: stats?.processed_books ?? 0, icon: Brain, color: '#10b981' },
    { label: 'Genres', value: stats?.total_genres ?? 0, icon: Layers, color: '#f59e0b' },
    { label: 'Top Rated', value: stats?.top_genres?.[0]?.avg_rating?.toFixed(1) ?? '—', icon: Star, color: '#ef4444', suffix: '/5' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="mb-12 fade-in">
        <div className="flex items-center gap-2 mb-3">
          <div className="pulse-dot" />
          <span className="text-xs font-medium" style={{ color: '#10b981' }}>Live Intelligence Platform</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-black mb-4 text-[#1a1a1a]" style={{ fontFamily: "var(--font-playfair), serif", letterSpacing: "-0.02em" }}>
          BookLens
        </h1>
        <p className="text-lg max-w-2xl text-gray-600">
          AI-powered book intelligence. Scrape, analyze, and query books with RAG-based question answering and smart recommendations.
        </p>
        <div className="flex flex-wrap gap-4 mt-8">
          <Link href="/books" className="btn-primary flex items-center gap-2 text-lg px-6 py-3">
            <BookOpen size={18} /> Browse Library
          </Link>
          <Link href="/qa" className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-lg transition-all hover:bg-gray-100"
            style={{ background: '#ffffff', color: '#1a1a1a', border: '1px solid #e2e0d8', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Brain size={18} className="text-[#e5b400]" /> Ask AI Assistant
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card p-5 fade-in">
            <div className="flex items-center justify-between mb-3">
              <card.icon size={20} className="text-[#e5b400]" />
              <TrendingUp size={14} className="text-gray-400" />
            </div>
            <div className="text-3xl font-black mb-1 text-gray-900">
              {loading ? <div className="h-8 w-16 shimmer" /> : `${card.value}${card.suffix || ''}`}
            </div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Scraper Panel */}
      <div className="glass-card p-6 mb-10 fade-in">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-bold text-lg mb-1 flex items-center gap-2 text-gray-900">
              <Download size={18} className="text-[#e5b400]" />
              Import Books via Selenium
            </h2>
            <p className="text-sm text-gray-600">
              Automatically scrape books from <b className="text-gray-900">books.toscrape.com</b> with AI insight generation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap text-gray-600 font-medium">Pages:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={scrapePages}
                onChange={(e) => setScrapePages(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="input-dark w-20 text-center"
              />
            </div>
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              {scraping ? <><LoadingSpinner size="sm" /> Scraping...</> : <><Zap size={15} /> Scrape Now</>}
            </button>
          </div>
        </div>
      </div>

      {/* Top Genres */}
      {stats?.top_genres && stats.top_genres.length > 0 && (
        <div className="mb-10 fade-in">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <Layers size={18} className="text-[#e5b400]" /> Top Genres
          </h2>
          <div className="flex flex-wrap gap-3">
            {stats.top_genres.map((g) => (
              <Link key={g.genre} href={`/books?genre=${encodeURIComponent(g.genre)}`}>
                <span className="glass-card px-4 py-2 flex items-center gap-2 text-sm hover:scale-105"
                  style={{ borderRadius: 20 }}>
                  <span className="font-bold text-gray-800">{g.genre}</span>
                  <span className="badge badge-rating">{g.count} books</span>
                  <span className="text-[11px] font-bold text-[#b45309]">★ {g.avg_rating?.toFixed(1)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Books */}
      <div className="fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <BookOpen size={18} className="text-[#e5b400]" /> Recently Added
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <Link href="/books" className="flex items-center gap-1 text-sm font-medium text-[#d97706] hover:text-[#b45309] transition-colors">
              View All <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : recentBooks.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-2 border-[#e2e0d8] shadow-none bg-transparent">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-bold mb-2 text-gray-700">No Books Yet</p>
            <p className="text-sm mb-6 text-gray-500">
              Use the scraper above to import books, or add them manually.
            </p>
            <Link href="/books" className="btn-primary inline-flex items-center gap-2">
              <Download size={15} /> Start Importing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
