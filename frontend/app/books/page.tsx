import { Suspense } from 'react';
import BooksPageContent from './BooksPageContent';

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="h-8 shimmer w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 shimmer rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <BooksPageContent />
    </Suspense>
  );
}
