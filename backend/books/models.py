from django.db import models


class Book(models.Model):
    """Main book model storing scraped/uploaded book metadata."""
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=300, blank=True, default='Unknown')
    rating = models.FloatField(null=True, blank=True)
    num_reviews = models.IntegerField(default=0)
    description = models.TextField(blank=True, default='')
    price = models.CharField(max_length=50, blank=True, default='')
    book_url = models.URLField(max_length=1000, blank=True, default='')
    cover_image_url = models.URLField(max_length=1000, blank=True, default='')
    genre = models.CharField(max_length=200, blank=True, default='')
    availability = models.CharField(max_length=100, blank=True, default='')
    upc = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_processed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['genre']),
            models.Index(fields=['rating']),
            models.Index(fields=['title']),
        ]

    def __str__(self):
        return f"{self.title} by {self.author}"


class AIInsight(models.Model):
    """Stores AI-generated insights for a book."""
    INSIGHT_TYPES = [
        ('summary', 'Summary'),
        ('genre_classification', 'Genre Classification'),
        ('sentiment', 'Sentiment Analysis'),
        ('recommendation_reason', 'Recommendation Reason'),
    ]

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='insights')
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('book', 'insight_type')
        ordering = ['insight_type']

    def __str__(self):
        return f"{self.insight_type} for {self.book.title}"


class BookChunk(models.Model):
    """Stores text chunks for RAG pipeline."""
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    content = models.TextField()
    chroma_id = models.CharField(max_length=200, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['book', 'chunk_index']
        unique_together = ('book', 'chunk_index')

    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.book.title}"


class QAHistory(models.Model):
    """Stores question-answer history."""
    question = models.TextField()
    answer = models.TextField()
    sources = models.JSONField(default=list)  # list of book IDs used
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Q: {self.question[:80]}..."
