'use client';
import { useEffect, useState, useCallback } from 'react';
import { getBooks, getGenres, Book } from '@/lib/api';
import BookCard from '@/components/BookCard';
import { SkeletonCard } from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Search, Filter, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function BooksPageContent() {
  const searchParams = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [minRating, setMinRating] = useState('');

  const fetchBooks = useCallback(async (currentPage = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage };
      if (search) params.search = search;
      if (genre) params.genre = genre;
      if (minRating) params.min_rating = minRating;

      const res = await getBooks(params as any);
      setBooks(res.data.results);
      setTotal(res.data.count);
      setHasNext(!!res.data.next);
      setHasPrev(!!res.data.previous);
    } catch {
      toast.error('Failed to load books.');
    } finally {
      setLoading(false);
    }
  }, [search, genre, minRating]);

  useEffect(() => {
    getGenres().then((r) => setGenres(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchBooks(1);
  }, [genre]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBooks(1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    fetchBooks(p);
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8 fade-in">
        <h1 className="text-4xl font-black mb-2 gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
          Book Library
        </h1>
        <p style={{ color: '#94a3b8' }}>{total} books available</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-5 mb-8 fade-in">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4f46e5' }} />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark pl-9"
            />
          </div>

          {/* Genre */}
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4f46e5' }} />
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="input-dark pl-9 md:w-52 appearance-none"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <option value="">All Genres</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Min rating */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="input-dark md:w-44 appearance-none"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>

          <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Search size={15} /> Search
          </button>
        </form>
      </div>

      {/* Genre pills */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 fade-in">
          <button
            onClick={() => {
              setGenre('');
              setSearch('');
              setMinRating('');
            }}
            style={{
              background: !genre && !search && !minRating ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)',
              color: !genre && !search && !minRating ? '#a78bfa' : '#6366f1',
              border: '1px solid rgba(99,102,241,0.3)',
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Books
          </button>
          {genres.slice(0, 15).map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              style={{
                background: genre === g ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)',
                color: genre === g ? '#a78bfa' : '#6366f1',
                border: '1px solid rgba(99,102,241,0.3)',
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : books.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BookOpen size={56} className="mx-auto mb-4" style={{ color: '#1e1e3a' }} />
          <p className="text-lg font-semibold mb-2" style={{ color: '#94a3b8' }}>No books found</p>
          <p className="text-sm" style={{ color: '#475569' }}>
            Try adjusting your filters or import books from the dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 fade-in">
          {books.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      )}

      {/* Pagination */}
      {(hasNext || hasPrev) && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={!hasPrev}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm" style={{ color: '#64748b' }}>Page {page}</span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={!hasNext}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
