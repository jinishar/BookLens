import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export interface Book {
  id: number;
  title: string;
  author: string;
  rating: number | null;
  num_reviews: number;
  description: string;
  book_url: string;
  cover_image_url: string;
  genre: string;
  price: string;
  availability: string;
  is_processed: boolean;
  created_at: string;
}

export interface BookDetail extends Book {
  upc: string;
  updated_at: string;
  insights: AIInsight[];
}

export interface AIInsight {
  id: number;
  insight_type: 'summary' | 'genre_classification' | 'sentiment' | 'recommendation_reason';
  content: string;
  created_at: string;
}

export interface QAResponse {
  id: number;
  question: string;
  answer: string;
  sources: {
    id: number;
    title: string;
    author: string;
    genre: string;
    rating: number;
    cover_image_url: string;
  }[];
  chunks_used: number;
}

export interface Stats {
  total_books: number;
  processed_books: number;
  total_genres: number;
  top_genres: { genre: string; count: number; avg_rating: number }[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Books
export const getBooks = (params?: {
  genre?: string;
  search?: string;
  min_rating?: number;
  page?: number;
}) => api.get<PaginatedResponse<Book>>('/books/', { params });

export const getBook = (id: number) => api.get<BookDetail>(`/books/${id}/`);

export const getRecommendations = (id: number) => api.get<Book[]>(`/books/${id}/recommendations/`);

export const uploadBook = (data: Partial<Book>) => api.post<BookDetail>('/books/upload/', data);

export const scrapeBooks = (data: { num_pages: number; category?: string; generate_insights?: boolean }) =>
  api.post('/books/scrape/', data);

export const generateInsights = (id: number) => api.post(`/books/${id}/generate-insights/`);

// Genres
export const getGenres = () => api.get<string[]>('/genres/');

// Stats
export const getStats = () => api.get<Stats>('/stats/');

// Q&A
export const askQuestion = (question: string) => api.post<QAResponse>('/qa/', { question });

export const getQAHistory = () => api.get('/qa/history/');

export default api;
