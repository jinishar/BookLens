"""
AI Services Module

Handles:
1. AI Insight generation (summary, genre classification, sentiment, recommendations)
2. ChromaDB vector indexing
3. RAG pipeline for Q&A

LLM Backend: LM Studio (local) or OpenAI API
Embeddings: sentence-transformers (always local, free)
"""
import logging
import hashlib
import json
import re
from typing import List, Dict, Optional, Tuple

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Singleton clients (lazy init)
# ──────────────────────────────────────────────────────────────
_embedding_model: Optional[SentenceTransformer] = None
_chroma_client: Optional[chromadb.PersistentClient] = None
_chroma_collection = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading embedding model...")
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _embedding_model


def get_chroma_collection():
    global _chroma_client, _chroma_collection
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
    if _chroma_collection is None:
        _chroma_collection = _chroma_client.get_or_create_collection(
            name="books",
            metadata={"hnsw:space": "cosine"}
        )
    return _chroma_collection


# ──────────────────────────────────────────────────────────────
# LLM Client
# ──────────────────────────────────────────────────────────────
def call_llm(prompt: str, max_tokens: int = 500) -> str:
    """
    Call LLM. Tries LM Studio first, falls back to OpenAI, 
    then falls back to rule-based if neither is available.
    """
    if settings.USE_LOCAL_LLM:
        try:
            return call_lm_studio(prompt, max_tokens)
        except Exception as e:
            logger.warning(f"LM Studio unavailable: {e}")

    if settings.OPENAI_API_KEY:
        try:
            return call_openai(prompt, max_tokens)
        except Exception as e:
            logger.warning(f"OpenAI unavailable: {e}")

    # Fallback: rule-based
    return rule_based_fallback(prompt)


def call_lm_studio(prompt: str, max_tokens: int = 500) -> str:
    """Call LM Studio local API (OpenAI-compatible)."""
    import requests
    response = requests.post(
        f"{settings.LM_STUDIO_BASE_URL}/chat/completions",
        json={
            "model": "local-model",
            "messages": [
                {"role": "system", "content": "You are a helpful book analysis assistant."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content'].strip()


def call_openai(prompt: str, max_tokens: int = 500) -> str:
    """Call OpenAI API."""
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful book analysis assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def rule_based_fallback(prompt: str) -> str:
    """Rule-based fallback when no LLM is available."""
    p = prompt.lower()
    if 'summary' in p:
        return "This book presents an engaging narrative that captivates readers through well-developed characters and a compelling storyline. The author masterfully weaves themes that resonate with a broad audience."
    elif 'genre' in p or 'classif' in p:
        return "Fiction"
    elif 'sentiment' in p:
        return "Positive — The book evokes a generally optimistic and engaging tone throughout its narrative."
    elif 'recommend' in p:
        return "Readers who enjoy this book will appreciate its thematic depth and narrative style."
    return "Unable to generate insight at this time."


# ──────────────────────────────────────────────────────────────
# Smart Chunking
# ──────────────────────────────────────────────────────────────
def smart_chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
    """
    Smart chunking strategy:
    1. Tries to split on sentence boundaries
    2. Falls back to word-boundary splitting with overlap
    """
    if not text or not text.strip():
        return []

    # Split into sentences (simple regex)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    
    chunks = []
    current_chunk = []
    current_len = 0

    for sentence in sentences:
        words = sentence.split()
        if current_len + len(words) > chunk_size and current_chunk:
            chunks.append(' '.join(current_chunk))
            # Overlap: keep last N words
            current_chunk = current_chunk[-overlap:] if overlap > 0 else []
            current_len = len(current_chunk)
        current_chunk.extend(words)
        current_len += len(words)

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    # If no meaningful chunks, just return the whole text
    return chunks if chunks else [text[:1000]]


# ──────────────────────────────────────────────────────────────
# AI Insight Generation
# ──────────────────────────────────────────────────────────────
def generate_summary(book) -> str:
    """Generate a summary of the book."""
    cache_key = f'summary_{book.pk}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    description = book.description or f"A book titled '{book.title}'"
    prompt = f"""Generate a concise, engaging 2-3 sentence summary for this book:

Title: {book.title}
Author: {book.author}
Genre: {book.genre or 'Unknown'}
Description: {description[:1000]}

Write a compelling summary that highlights the key themes and what makes this book interesting."""

    result = call_llm(prompt, max_tokens=200)
    cache.set(cache_key, result, settings.CACHE_TTL)
    return result


def generate_genre_classification(book) -> str:
    """Classify the genre of the book using AI."""
    cache_key = f'genre_class_{book.pk}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    if book.genre:
        base_genre = book.genre
    else:
        base_genre = "Unknown"

    description = book.description or f"A book titled '{book.title}'"
    prompt = f"""Classify this book into specific literary genres and subgenres.

Title: {book.title}
Author: {book.author}
Category: {base_genre}
Description: {description[:800]}

Respond with: Primary Genre | Subgenre | Brief reason (1 sentence).
Example: "Mystery | Psychological Thriller | The dark atmosphere and unreliable narrator create suspense."
"""

    result = call_llm(prompt, max_tokens=100)
    cache.set(cache_key, result, settings.CACHE_TTL)
    return result


def generate_sentiment_analysis(book) -> str:
    """Analyze sentiment of the book's description."""
    cache_key = f'sentiment_{book.pk}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    description = book.description or f"'{book.title}' is a book without a description."
    prompt = f"""Perform a sentiment analysis of this book's description and tone.

Title: {book.title}
Description: {description[:800]}

Analyze:
1. Overall tone (Positive/Negative/Neutral/Mixed)
2. Emotional keywords present
3. Expected reader experience

Keep response to 2-3 sentences."""

    result = call_llm(prompt, max_tokens=150)
    cache.set(cache_key, result, settings.CACHE_TTL)
    return result


def generate_recommendation_reason(book) -> str:
    """Generate a recommendation blurb for the book."""
    cache_key = f'rec_reason_{book.pk}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    description = book.description or f"A book in the {book.genre or 'general'} genre."
    prompt = f"""Write a compelling "If you like X, you'll like Y" style recommendation for:

Title: {book.title}
Genre: {book.genre or 'General Fiction'}
Rating: {book.rating}/5
Description: {description[:600]}

Write 1-2 sentences: who would love this book and what similar books fans might enjoy."""

    result = call_llm(prompt, max_tokens=120)
    cache.set(cache_key, result, settings.CACHE_TTL)
    return result


def generate_insights_for_book(book):
    """Generate all AI insights for a book and save to DB."""
    from books.models import AIInsight

    insight_generators = {
        'summary': generate_summary,
        'genre_classification': generate_genre_classification,
        'sentiment': generate_sentiment_analysis,
        'recommendation_reason': generate_recommendation_reason,
    }

    for insight_type, generator in insight_generators.items():
        try:
            # Check if already exists
            if AIInsight.objects.filter(book=book, insight_type=insight_type).exists():
                continue

            content = generator(book)
            AIInsight.objects.create(
                book=book,
                insight_type=insight_type,
                content=content
            )
            logger.info(f"Generated {insight_type} for '{book.title}'")
        except Exception as e:
            logger.error(f"Failed to generate {insight_type} for book {book.pk}: {e}")


# ──────────────────────────────────────────────────────────────
# ChromaDB Indexing
# ──────────────────────────────────────────────────────────────
def index_book_in_chroma(book):
    """
    Index a book's content in ChromaDB for vector similarity search.
    Uses smart chunking for optimal retrieval.
    """
    from books.models import BookChunk

    # Build rich text content for the book
    content_parts = [
        f"Title: {book.title}",
        f"Author: {book.author}",
        f"Genre: {book.genre or 'Unknown'}",
        f"Rating: {book.rating}/5",
    ]
    if book.description:
        content_parts.append(f"Description: {book.description}")

    # Add AI insights
    for insight in book.insights.all():
        content_parts.append(f"{insight.insight_type.replace('_', ' ').title()}: {insight.content}")

    full_content = '\n'.join(content_parts)

    # Smart chunk
    chunks = smart_chunk_text(full_content, chunk_size=150, overlap=30)

    collection = get_chroma_collection()
    embedding_model = get_embedding_model()

    for idx, chunk in enumerate(chunks):
        chunk_id = f"book_{book.pk}_chunk_{idx}"

        # Skip if already indexed
        existing = collection.get(ids=[chunk_id])
        if existing['ids']:
            continue

        try:
            embedding = embedding_model.encode(chunk).tolist()
            collection.add(
                ids=[chunk_id],
                embeddings=[embedding],
                documents=[chunk],
                metadatas=[{
                    'book_id': book.pk,
                    'book_title': book.title,
                    'chunk_index': idx,
                }]
            )

            # Store in DB
            BookChunk.objects.get_or_create(
                book=book,
                chunk_index=idx,
                defaults={'content': chunk, 'chroma_id': chunk_id}
            )
        except Exception as e:
            logger.error(f"Error indexing chunk {idx} for book {book.pk}: {e}")

    logger.info(f"Indexed {len(chunks)} chunks for '{book.title}'")


def get_similar_books(book, top_k: int = 5) -> List[int]:
    """Get similar books using ChromaDB cosine similarity."""
    try:
        collection = get_chroma_collection()
        embedding_model = get_embedding_model()

        query_text = f"{book.title} {book.genre} {book.description[:200]}"
        query_embedding = embedding_model.encode(query_text).tolist()

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k * 3, 20),
            where={"book_id": {"$ne": book.pk}},
        )

        if not results['metadatas'] or not results['metadatas'][0]:
            return []

        # Unique book IDs in order of similarity
        seen = set()
        book_ids = []
        for meta in results['metadatas'][0]:
            bid = meta['book_id']
            if bid != book.pk and bid not in seen:
                seen.add(bid)
                book_ids.append(bid)
            if len(book_ids) >= top_k:
                break

        return book_ids
    except Exception as e:
        logger.error(f"ChromaDB similarity error: {e}")
        return []


# ──────────────────────────────────────────────────────────────
# RAG Pipeline
# ──────────────────────────────────────────────────────────────
def rag_query(question: str, top_k: int = 5) -> Dict:
    """
    Full RAG pipeline:
    1. Embed the question
    2. Similarity search in ChromaDB
    3. Retrieve context chunks
    4. Generate answer via LLM with source citations
    """
    from books.models import Book

    if not question.strip():
        return {'answer': 'Please provide a question.', 'sources': []}

    try:
        # Step 1: Embed question
        embedding_model = get_embedding_model()
        question_embedding = embedding_model.encode(question).tolist()

        # Step 2: Similarity search
        collection = get_chroma_collection()
        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=min(top_k, collection.count() or 1),
        )

        if not results['documents'] or not results['documents'][0]:
            return {
                'answer': "I don't have enough book data to answer this question. Please scrape some books first.",
                'sources': []
            }

        # Step 3: Build context
        context_chunks = results['documents'][0]
        metadatas = results['metadatas'][0]
        distances = results['distances'][0] if results.get('distances') else []

        # Collect unique source books
        source_book_ids = []
        seen_ids = set()
        for meta in metadatas:
            bid = meta['book_id']
            if bid not in seen_ids:
                seen_ids.add(bid)
                source_book_ids.append(bid)

        context = '\n\n---\n\n'.join(
            f"[Source: {meta['book_title']}]\n{chunk}"
            for chunk, meta in zip(context_chunks, metadatas)
        )

        # Step 4: Generate answer
        prompt = f"""You are a knowledgeable book assistant. Answer the user's question using ONLY the provided book context below.
Include specific book titles in your answer and cite sources naturally.

CONTEXT:
{context}

QUESTION: {question}

Provide a helpful, detailed answer. If the context doesn't contain enough information, say so clearly.
End with: "Sources: [list the book titles used]"
"""

        answer = call_llm(prompt, max_tokens=600)

        # Get source book details
        source_books = Book.objects.filter(pk__in=source_book_ids).values(
            'id', 'title', 'author', 'genre', 'rating', 'cover_image_url'
        )

        return {
            'answer': answer,
            'sources': list(source_books),
            'chunks_used': len(context_chunks),
        }

    except Exception as e:
        logger.error(f"RAG query error: {e}")
        return {
            'answer': f"An error occurred while processing your question: {str(e)}",
            'sources': []
        }
