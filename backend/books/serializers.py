from rest_framework import serializers
from .models import Book, AIInsight, BookChunk, QAHistory


class AIInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInsight
        fields = ['id', 'insight_type', 'content', 'created_at']


class BookChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookChunk
        fields = ['id', 'chunk_index', 'content']


class BookListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view."""
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'rating', 'num_reviews',
            'description', 'book_url', 'cover_image_url', 'genre',
            'price', 'availability', 'is_processed', 'created_at'
        ]


class BookDetailSerializer(serializers.ModelSerializer):
    """Full serializer with insights and chunks."""
    insights = AIInsightSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'rating', 'num_reviews',
            'description', 'book_url', 'cover_image_url', 'genre',
            'price', 'availability', 'upc', 'is_processed',
            'created_at', 'updated_at', 'insights'
        ]


class BookUploadSerializer(serializers.ModelSerializer):
    """Serializer for manual book upload."""
    class Meta:
        model = Book
        fields = ['title', 'author', 'rating', 'num_reviews', 'description',
                  'book_url', 'cover_image_url', 'genre', 'price']

    def validate_rating(self, value):
        if value is not None and not (0 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 0 and 5.")
        return value


class QAHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QAHistory
        fields = ['id', 'question', 'answer', 'sources', 'created_at']


class ScrapeRequestSerializer(serializers.Serializer):
    num_pages = serializers.IntegerField(default=1, min_value=1, max_value=10)
    category = serializers.CharField(required=False, default='')
    generate_insights = serializers.BooleanField(default=True)
