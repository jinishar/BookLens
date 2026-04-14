# BookLens — AI-Powered Book Intelligence Platform

A full-stack web application with AI/RAG integration for intelligent book discovery and querying.

## 🚀 Tech Stack
- **Backend**: Django REST Framework, Python
- **Database**: SQLite (prod: MySQL), ChromaDB (vectors)
- **Frontend**: Next.js 14, Tailwind CSS
- **AI**: LM Studio (local) / OpenAI API
- **Embeddings**: sentence-transformers (local, free)
- **Scraping**: Selenium + BeautifulSoup (books.toscrape.com)

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. (Optional) AI with LM Studio
- Download [LM Studio](https://lmstudio.ai)
- Load any model (Llama, Mistral, etc.)
- Start local server on port 1234
- Set `USE_LOCAL_LLM=true` in `backend/.env`

### 4. (Optional) OpenAI API
- Set `OPENAI_API_KEY=your-key` in `backend/.env`
- Set `USE_LOCAL_LLM=false`

## 📡 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/books/ | List all books (filterable) |
| GET | /api/books/{id}/ | Book detail with AI insights |
| GET | /api/books/{id}/recommendations/ | Similar book recommendations |
| POST | /api/books/upload/ | Upload a book manually |
| POST | /api/books/scrape/ | Trigger Selenium scraping |
| POST | /api/books/{id}/generate-insights/ | Generate AI insights |
| POST | /api/qa/ | RAG question answering |
| GET | /api/qa/history/ | Q&A history |
| GET | /api/genres/ | All unique genres |
| GET | /api/stats/ | Dashboard statistics |

## 🤖 AI Features
- **Summary**: AI-generated book summaries
- **Genre Classification**: Predicts genre and subgenre
- **Sentiment Analysis**: Analyzes book description tone
- **Recommendations**: "If you like X, you'll like Y" logic
- **RAG Pipeline**: ChromaDB + sentence-transformers for Q&A

## 🔗 Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/ (admin/admin123)
