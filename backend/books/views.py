import logging
import threading
from django.conf import settings
from django.core.cache import cache
from rest_framework import status, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book, AIInsight, QAHistory
from .serializers import (
    BookListSerializer, BookDetailSerializer,
    BookUploadSerializer, ScrapeRequestSerializer, QAHistorySerializer
)

logger = logging.getLogger(__name__)


class BookListView(generics.ListAPIView):
    """GET /api/books/ — List all books with optional filtering."""
    serializer_class = BookListSerializer

    def get_queryset(self):
        cache_key = 'book_list_all'
        qs = cache.get(cache_key)
        if qs is not None:
            return qs

        queryset = Book.objects.all()
        genre = self.request.query_params.get('genre')
        search = self.request.query_params.get('search')
        min_rating = self.request.query_params.get('min_rating')

        if genre:
            queryset = queryset.filter(genre__icontains=genre)
        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(author__icontains=search)
        if min_rating:
            try:
                queryset = queryset.filter(rating__gte=float(min_rating))
            except ValueError:
                pass

        cache.set(cache_key, queryset, settings.CACHE_TTL)
        return queryset

    def list(self, request, *args, **kwargs):
        # Invalidate cache on fresh params
        has_params = any(request.query_params.get(k) for k in ['genre', 'search', 'min_rating'])
        if has_params:
            cache.delete('book_list_all')
        return super().list(request, *args, **kwargs)


class BookDetailView(generics.RetrieveAPIView):
    """GET /api/books/{id}/ — Full book detail with AI insights."""
    queryset = Book.objects.prefetch_related('insights').all()
    serializer_class = BookDetailSerializer


class BookUploadView(APIView):
    """POST /api/books/upload/ — Upload a book manually."""

    def post(self, request):
        serializer = BookUploadSerializer(data=request.data)
        if serializer.is_valid():
            book = serializer.save()
            # Trigger AI processing in background
            from ai_engine.services import generate_insights_for_book, index_book_in_chroma
            thread = threading.Thread(target=_process_book_async, args=(book.id,))
            thread.daemon = True
            thread.start()
            return Response(BookDetailSerializer(book).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _process_book_async(book_id: int):
    """Run AI processing in background thread."""
    try:
        from ai_engine.services import generate_insights_for_book, index_book_in_chroma
        book = Book.objects.get(pk=book_id)
        generate_insights_for_book(book)
        index_book_in_chroma(book)
        book.is_processed = True
        book.save()
        cache.delete('book_list_all')
        logger.info(f"Book {book_id} processed successfully.")
    except Exception as e:
        logger.error(f"Error processing book {book_id}: {e}")


class BookScrapeView(APIView):
    """POST /api/books/scrape/ — Trigger Selenium scraping."""

    def post(self, request):
        serializer = ScrapeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        num_pages = serializer.validated_data['num_pages']
        category = serializer.validated_data.get('category', '')
        generate_insights = serializer.validated_data.get('generate_insights', True)

        # Run scraping synchronously (for demo) — in production use Celery
        try:
            from .scraper import scrape_books
            books_data = scrape_books(num_pages=num_pages, category=category)
        except Exception as e:
            logger.error(f"Scraping error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created_books = []
        to_process_ids = []
        skipped = 0
        
        for book_data in books_data:
            # Deduplication by title
            existing = Book.objects.filter(title=book_data['title']).first()
            if existing:
                skipped += 1
                if not existing.is_processed:
                    to_process_ids.append(existing.id)
                continue
            
            book = Book.objects.create(**book_data)
            created_books.append(book)
            to_process_ids.append(book.id)

        # Process AI insights in background (for both new and previously unprocessed books)
        if generate_insights and to_process_ids:
            thread = threading.Thread(target=_process_books_batch, args=(to_process_ids,))
            thread.daemon = True
            thread.start()

        cache.delete('book_list_all')
        return Response({
            'message': f'Scraped {len(books_data)} books. Created: {len(created_books)}, Processing: {len(to_process_ids)}, Skipped (already in DB): {skipped}.',
            'scraped': len(books_data),
            'created': len(created_books),
            'to_process': len(to_process_ids),
            'skipped': skipped,
            'books': BookListSerializer(created_books, many=True).data,
        }, status=status.HTTP_201_CREATED)


def _process_books_batch(book_ids: list):
    """Process a batch of books for AI insights."""
    from ai_engine.services import generate_insights_for_book, index_book_in_chroma
    for book_id in book_ids:
        try:
            book = Book.objects.get(pk=book_id)
            generate_insights_for_book(book)
            index_book_in_chroma(book)
            book.is_processed = True
            book.save()
            logger.info(f"Processed book {book_id}")
        except Exception as e:
            logger.error(f"Error processing book {book_id}: {e}")
    cache.delete('book_list_all')


class BookRecommendationsView(APIView):
    """GET /api/books/{id}/recommendations/ — Recommend similar books."""

    def get(self, request, pk):
        cache_key = f'recommendations_{pk}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

        # Strategy 1: Same genre
        recs = Book.objects.filter(genre=book.genre).exclude(pk=pk).order_by('-rating')[:5]

        # Strategy 2: ChromaDB similarity
        try:
            from ai_engine.services import get_similar_books
            similar_ids = get_similar_books(book)
            chroma_recs = Book.objects.filter(pk__in=similar_ids).exclude(pk=pk)
            # Merge, deduplicate
            all_recs = list(recs) + [b for b in chroma_recs if b.pk not in [r.pk for r in recs]]
            all_recs = all_recs[:8]
        except Exception as e:
            logger.warning(f"ChromaDB similarity failed, using genre-only: {e}")
            all_recs = list(recs)

        data = BookListSerializer(all_recs, many=True).data
        cache.set(cache_key, data, settings.CACHE_TTL)
        return Response(data)


class GenreListView(APIView):
    """GET /api/genres/ — List all unique genres."""

    def get(self, request):
        genres = Book.objects.exclude(genre='').values_list('genre', flat=True).distinct().order_by('genre')
        return Response(list(genres))


@api_view(['GET'])
def book_stats(request):
    """GET /api/stats/ — Summary statistics."""
    cache_key = 'book_stats'
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    total = Book.objects.count()
    processed = Book.objects.filter(is_processed=True).count()
    genres = Book.objects.exclude(genre='').values_list('genre', flat=True).distinct().count()

    # Top genres
    from django.db.models import Count, Avg
    top_genres = (
        Book.objects.exclude(genre='')
        .values('genre')
        .annotate(count=Count('id'), avg_rating=Avg('rating'))
        .order_by('-count')[:10]
    )

    stats = {
        'total_books': total,
        'processed_books': processed,
        'total_genres': genres,
        'top_genres': list(top_genres),
    }
    cache.set(cache_key, stats, 300)
    return Response(stats)
