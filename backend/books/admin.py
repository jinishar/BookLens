from django.contrib import admin
from books.models import Book, AIInsight, BookChunk, QAHistory


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'genre', 'rating', 'is_processed', 'created_at']
    list_filter = ['genre', 'is_processed']
    search_fields = ['title', 'author']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = ['book', 'insight_type', 'created_at']
    list_filter = ['insight_type']


@admin.register(BookChunk)
class BookChunkAdmin(admin.ModelAdmin):
    list_display = ['book', 'chunk_index', 'created_at']


@admin.register(QAHistory)
class QAHistoryAdmin(admin.ModelAdmin):
    list_display = ['question', 'created_at']
    readonly_fields = ['created_at']
