'use client';
import { Book } from '@/lib/api';
import Link from 'next/link';
import { Star, ExternalLink, Brain, User } from 'lucide-react';
import Image from 'next/image';

interface BookCardProps {
  book: Book;
}

function StarRating({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(r) ? 'star-filled' : 'star-empty'}
          fill={i <= Math.round(r) ? '#f59e0b' : 'none'}
        />
      ))}
      {rating !== null && (
        <span className="text-xs ml-1" style={{ color: '#fbbf24' }}>{r.toFixed(1)}</span>
      )}
    </div>
  );
}

export default function BookCard({ book }: BookCardProps) {
  const fallbackCover = `https://picsum.photos/seed/${book.id}/200/280`;

  return (
    <Link href={`/books/${book.id}`} className="block group">
      <div className="glass-card overflow-hidden h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1"
        style={{ cursor: 'pointer' }}>
        
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)' }}>
          <img
            src={book.cover_image_url || fallbackCover}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackCover;
            }}
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(10,10,18,0.9) 0%, transparent 50%)',
          }} />
          
          {/* Genre badge */}
          {book.genre && (
            <div className="absolute top-3 left-3">
              <span className="badge badge-genre">{book.genre}</span>
            </div>
          )}
          
          {/* AI processed badge */}
          {book.is_processed && (
            <div className="absolute top-3 right-3">
              <span className="badge badge-processed flex items-center gap-1">
                <Brain size={10} />AI
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2"
            style={{ color: '#f1f5f9', fontFamily: "'Playfair Display', serif" }}>
            {book.title}
          </h3>

          <div className="flex items-center gap-1 text-xs" style={{ color: '#94a3b8' }}>
            <User size={11} />
            <span className="truncate">{book.author}</span>
          </div>

          <StarRating rating={book.rating} />

          {book.description && (
            <p className="text-xs line-clamp-2 mt-1" style={{ color: '#64748b' }}>
              {book.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-2 pt-2"
            style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
            {book.price && (
              <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>
                {book.price}
              </span>
            )}
            {book.book_url && (
              <a
                href={book.book_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: '#6366f1' }}
              >
                <ExternalLink size={11} />
                View
              </a>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
