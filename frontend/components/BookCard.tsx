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
      <div className="glass-card overflow-hidden h-full">
        
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={book.cover_image_url || fallbackCover}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackCover;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
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
          <h3 className="font-bold text-base leading-tight line-clamp-2 text-gray-900"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            {book.title}
          </h3>

          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium tracking-tight">
            <User size={12} />
            <span className="truncate">{book.author}</span>
          </div>

          <StarRating rating={book.rating} />

          {book.description && (
            <p className="text-xs line-clamp-2 mt-1 text-gray-600">
              {book.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            {book.price && (
              <span className="text-sm font-bold text-[#b45309]">
                {book.price}
              </span>
            )}
            {book.book_url && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(book.book_url, '_blank', 'noopener,noreferrer');
                }}
                className="flex items-center gap-1 text-xs font-semibold text-[#d97706] hover:text-[#b45309] transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                <ExternalLink size={12} />
                View
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
