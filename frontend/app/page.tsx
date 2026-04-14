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
        <h1 className="text-5xl font-black mb-3 gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
          BookLens
        </h1>
        <p className="text-lg max-w-2xl" style={{ color: '#94a3b8' }}>
          AI-powered book intelligence. Scrape, analyze, and query books with RAG-based question answering and smart recommendations.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/books" className="btn-primary flex items-center gap-2">
            <BookOpen size={16} /> Browse Books
          </Link>
          <Link href="/qa" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Brain size={16} /> Ask AI
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card p-5 fade-in">
            <div className="flex items-center justify-between mb-3">
              <card.icon size={18} style={{ color: card.color }} />
              <TrendingUp size={12} style={{ color: '#475569' }} />
            </div>
            <div className="text-3xl font-black mb-1" style={{ color: card.color }}>
              {loading ? <div className="h-8 w-16 shimmer" /> : `${card.value}${card.suffix || ''}`}
            </div>
            <div className="text-xs" style={{ color: '#64748b' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Scraper Panel */}
      <div className="glass-card p-6 mb-10 fade-in">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Download size={18} style={{ color: '#6366f1' }} />
              Import Books via Selenium
            </h2>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Automatically scrape books from <b style={{ color: '#a78bfa' }}>books.toscrape.com</b> with AI insight generation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap" style={{ color: '#94a3b8' }}>Pages:</label>
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
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Layers size={18} style={{ color: '#f59e0b' }} /> Top Genres
          </h2>
          <div className="flex flex-wrap gap-3">
            {stats.top_genres.map((g) => (
              <Link key={g.genre} href={`/books?genre=${encodeURIComponent(g.genre)}`}>
                <span className="glass-card px-4 py-2 flex items-center gap-2 text-sm cursor-pointer transition-all hover:scale-105"
                  style={{ borderRadius: 20 }}>
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>{g.genre}</span>
                  <span className="badge badge-rating">{g.count} books</span>
                  <span style={{ color: '#fbbf24', fontSize: 11 }}>★ {g.avg_rating?.toFixed(1)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Books */}
      <div className="fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={18} style={{ color: '#6366f1' }} /> Recently Added
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="flex items-center gap-1 text-sm transition-colors"
              style={{ color: '#64748b' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <Link href="/books" className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-indigo-400"
              style={{ color: '#6366f1' }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : recentBooks.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4" style={{ color: '#374151' }} />
            <p className="text-lg font-semibold mb-2" style={{ color: '#94a3b8' }}>No Books Yet</p>
            <p className="text-sm mb-6" style={{ color: '#475569' }}>
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
