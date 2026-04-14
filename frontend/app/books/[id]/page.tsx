'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getBook, getRecommendations, generateInsights, BookDetail, Book } from '@/lib/api';
import BookCard from '@/components/BookCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Star, ExternalLink, ArrowLeft, Brain, BookOpen,
  FileText, Tag, MessageSquare, Zap, User,
  ShoppingCart, Hash
} from 'lucide-react';

function StarRating({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={18}
          className={i <= Math.round(r) ? 'star-filled' : 'star-empty'}
          fill={i <= Math.round(r) ? '#f59e0b' : 'none'}
        />
      ))}
      <span className="ml-2 font-bold text-lg" style={{ color: '#fbbf24' }}>{r.toFixed(1)}</span>
      <span className="text-sm" style={{ color: '#64748b' }}>/5</span>
    </div>
  );
}

const INSIGHT_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  summary: { label: 'AI Summary', icon: FileText, color: '#6366f1' },
  genre_classification: { label: 'Genre Analysis', icon: Tag, color: '#f59e0b' },
  sentiment: { label: 'Sentiment Analysis', icon: MessageSquare, color: '#10b981' },
  recommendation_reason: { label: 'Who Should Read This', icon: Brain, color: '#a78bfa' },
};

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookRes, recRes] = await Promise.all([
        getBook(parseInt(id)),
        getRecommendations(parseInt(id)),
      ]);
      setBook(bookRes.data);
      setRecommendations(recRes.data);
    } catch (e) {
      toast.error('Failed to load book details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!book) return;
    setGenerating(true);
    const toastId = toast.loading('Generating AI insights...');
    try {
      await generateInsights(book.id);
      toast.success('AI insights generated!', { id: toastId });
      fetchData();
    } catch (e) {
      toast.error('Failed to generate insights.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm" style={{ color: '#64748b' }}>Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 text-center">
        <BookOpen size={60} className="mx-auto mb-4" style={{ color: '#374151' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#94a3b8' }}>Book not found</h2>
        <Link href="/books" className="btn-primary inline-flex items-center gap-2 mt-4">
          <ArrowLeft size={15} /> Back to Books
        </Link>
      </div>
    );
  }

  const fallbackCover = `https://picsum.photos/seed/${book.id}/400/560`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Back */}
      <Link href="/books" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: '#94a3b8' }}>
        <ArrowLeft size={15} /> Back to Books
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 fade-in">
        {/* Cover */}
        <div className="lg:col-span-1">
          <div className="glass-card overflow-hidden" style={{ borderRadius: 20 }}>
            <img
              src={book.cover_image_url || fallbackCover}
              alt={book.title}
              className="w-full object-cover"
              style={{ maxHeight: 460 }}
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackCover; }}
            />
          </div>

          {/* Quick info */}
          <div className="glass-card p-5 mt-4 space-y-3">
            {book.price && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                  <ShoppingCart size={14} /> Price
                </div>
                <span className="font-bold" style={{ color: '#f59e0b' }}>{book.price}</span>
              </div>
            )}
            {book.availability && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                  <BookOpen size={14} /> Availability
                </div>
                <span className="text-sm" style={{ color: '#10b981' }}>{book.availability}</span>
              </div>
            )}
            {book.upc && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                  <Hash size={14} /> UPC
                </div>
                <span className="text-sm font-mono" style={{ color: '#64748b' }}>{book.upc}</span>
              </div>
            )}
            {book.book_url && (
              <a href={book.book_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-medium transition-all mt-2"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}>
                <ExternalLink size={14} /> View on Store
              </a>
            )}
          </div>
        </div>

        {/* Main Info */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-4">
            {book.genre && <span className="badge badge-genre">{book.genre}</span>}
            {book.is_processed && <span className="badge badge-processed"><Brain size={10} className="mr-1" />AI Analyzed</span>}
          </div>

          <h1 className="text-4xl font-black mb-3 leading-tight"
            style={{ color: '#f1f5f9', fontFamily: "'Playfair Display', serif" }}>
            {book.title}
          </h1>

          <div className="flex items-center gap-2 mb-4" style={{ color: '#94a3b8' }}>
            <User size={15} />
            <span className="text-lg">{book.author}</span>
          </div>

          <div className="mb-6">
            <StarRating rating={book.rating} />
            {book.num_reviews > 0 && (
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>{book.num_reviews} reviews</p>
            )}
          </div>

          {book.description && (
            <div className="glass-card p-5 mb-6">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
                <FileText size={14} /> Description
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{book.description}</p>
            </div>
          )}

          {/* Generate Insights Button */}
          {!book.is_processed && (
            <button
              onClick={handleGenerateInsights}
              disabled={generating}
              className="btn-primary flex items-center gap-2 mb-6"
            >
              {generating ? <LoadingSpinner size="sm" /> : <Zap size={15} />}
              {generating ? 'Generating Insights...' : 'Generate AI Insights'}
            </button>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {book.insights && book.insights.length > 0 && (
        <div className="mb-12 fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain size={20} style={{ color: '#6366f1' }} /> AI Insights
            </h2>
            <button onClick={handleGenerateInsights} disabled={generating}
              className="flex items-center gap-1 text-sm transition-colors"
              style={{ color: '#6366f1' }}>
              <Zap size={13} /> Regenerate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {book.insights.map((insight) => {
              const config = INSIGHT_CONFIG[insight.insight_type] || {
                label: insight.insight_type, icon: Brain, color: '#6366f1'
              };
              return (
                <div key={insight.id} className="glass-card p-5 transition-all hover:scale-[1.01]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${config.color}20` }}>
                      <config.icon size={14} style={{ color: config.color }} />
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: config.color }}>
                      {config.label}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
                    {insight.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="fade-in">
          <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
            <BookOpen size={20} style={{ color: '#f59e0b' }} /> You Might Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 8).map((rec) => (
              <BookCard key={rec.id} book={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
