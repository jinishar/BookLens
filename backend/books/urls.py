from django.urls import path
from . import views

urlpatterns = [
    # Book listing & detail
    path('books/', views.BookListView.as_view(), name='book-list'),
    path('books/<int:pk>/', views.BookDetailView.as_view(), name='book-detail'),

    # Upload & scrape
    path('books/upload/', views.BookUploadView.as_view(), name='book-upload'),
    path('books/scrape/', views.BookScrapeView.as_view(), name='book-scrape'),

    # Recommendations
    path('books/<int:pk>/recommendations/', views.BookRecommendationsView.as_view(), name='book-recommendations'),

    # Auxiliary
    path('genres/', views.GenreListView.as_view(), name='genre-list'),
    path('stats/', views.book_stats, name='book-stats'),
]
