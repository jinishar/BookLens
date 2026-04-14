import logging
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from books.models import Book, QAHistory, AIInsight
from books.serializers import QAHistorySerializer

logger = logging.getLogger(__name__)


class QAView(APIView):
    """
    POST /api/qa/ — RAG-based question answering about books.
    """

    def post(self, request):
        question = request.data.get('question', '').strip()
        if not question:
            return Response(
                {'error': 'Question is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from .services import rag_query
            result = rag_query(question, top_k=5)

            # Save to QA history
            history = QAHistory.objects.create(
                question=question,
                answer=result['answer'],
                sources=[s['id'] for s in result.get('sources', [])],
            )

            return Response({
                'id': history.id,
                'question': question,
                'answer': result['answer'],
                'sources': result.get('sources', []),
                'chunks_used': result.get('chunks_used', 0),
            })
        except Exception as e:
            logger.error(f"QA error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GenerateInsightsView(APIView):
    """
    POST /api/books/{id}/generate-insights/ — (Re)generate AI insights for a book.
    """

    def post(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Clear existing insights
            AIInsight.objects.filter(book=book).delete()

            from .services import generate_insights_for_book, index_book_in_chroma
            generate_insights_for_book(book)
            index_book_in_chroma(book)

            book.is_processed = True
            book.save()

            # Return fresh insights
            from books.serializers import AIInsightSerializer
            insights = AIInsight.objects.filter(book=book)
            return Response({
                'book_id': pk,
                'insights': AIInsightSerializer(insights, many=True).data,
                'message': 'Insights generated successfully.',
            })
        except Exception as e:
            logger.error(f"Insight generation error for book {pk}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def qa_history(request):
    """GET /api/qa/history/ — Retrieve recent Q&A history."""
    history = QAHistory.objects.all()[:20]
    return Response(QAHistorySerializer(history, many=True).data)
