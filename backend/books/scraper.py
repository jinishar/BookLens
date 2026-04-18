"""
Requests-based scraper for books.toscrape.com
Fast, reliable, and does not require headless Chrome.
"""
import time
import re
import logging
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

RATING_MAP = {
    'One': 1.0,
    'Two': 2.0,
    'Three': 3.0,
    'Four': 4.0,
    'Five': 5.0,
}

BASE_URL = "https://books.toscrape.com/"

def parse_rating(rating_class: str) -> float:
    """Convert CSS class rating word to numeric."""
    for word, val in RATING_MAP.items():
        if word in rating_class:
            return val
    return 0.0

def scrape_book_detail(session: requests.Session, book_url: str) -> Dict:
    """Scrape detailed info from a book's page."""
    detail = {
        'description': '',
        'upc': '',
        'availability': '',
        'num_reviews': 0,
        'author': 'Unknown',
        'genre': '',
    }
    
    try:
        response = session.get(book_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Description
        desc_div = soup.find('div', id='product_description')
        if desc_div and desc_div.find_next_sibling('p'):
            detail['description'] = desc_div.find_next_sibling('p').get_text(strip=True)

        # Table info (UPC, Availability, Reviews)
        table = soup.find('table', class_='table-striped')
        if table:
            rows = table.find_all('tr')
            for row in rows:
                header = row.find('th')
                value = row.find('td')
                if not header or not value:
                    continue
                key = header.get_text(strip=True).lower()
                val = value.get_text(strip=True)
                if key == 'upc':
                    detail['upc'] = val
                elif key == 'availability':
                    match = re.search(r'\d+', val)
                    detail['availability'] = val
                    detail['num_reviews'] = int(match.group()) if match else 0
                elif 'review' in key:
                    try:
                        detail['num_reviews'] = int(val)
                    except ValueError:
                        pass

        # Genre from breadcrumb
        breadcrumb = soup.find('ul', class_='breadcrumb')
        if breadcrumb:
            items = breadcrumb.find_all('li')
            if len(items) >= 3:
                detail['genre'] = items[2].get_text(strip=True)

    except Exception as e:
        logger.error(f"Error scraping detail for {book_url}: {e}")

    return detail

def scrape_books(num_pages: int = 1, category: str = '') -> List[Dict]:
    """
    Main scraping function using Requests/BeautifulSoup.
    Scrapes books.toscrape.com incredibly fast.
    """
    books = []
    session = requests.Session()
    
    try:
        if category:
            start_url = f"{BASE_URL}catalogue/category/books/{category}/index.html"
        else:
            start_url = f"{BASE_URL}catalogue/page-1.html"

        current_url = start_url
        page = 0

        while current_url and page < num_pages:
            logger.info(f"Scraping page {page + 1}: {current_url}")
            response = session.get(current_url, timeout=10)
            
            # books.toscrape.com returns 404 if page doesn't exist
            if response.status_code != 200:
                break
                
            soup = BeautifulSoup(response.text, 'html.parser')
            book_cards = soup.find_all('article', class_='product_pod')

            if not book_cards:
                break

            for card in book_cards:
                try:
                    # Title and URL
                    title_tag = card.find('h3').find('a')
                    title = title_tag.get('title', title_tag.get_text(strip=True))
                    relative_url = title_tag.get('href', '')
                    
                    # Optimization: Skip detail scraping if book already exists and is processed
                    from books.models import Book
                    existing = Book.objects.filter(title=title).first()
                    if existing and existing.is_processed:
                        logger.info(f"Skipping detail scrape for existing book: {title}")
                        continue

                    # Resolve absolute URL safely
                    book_url = urljoin(current_url, relative_url)

                    # Rating
                    rating_tag = card.find('p', class_='star-rating')
                    rating = 0.0
                    if rating_tag:
                        rating = parse_rating(' '.join(rating_tag.get('class', [])))

                    # Price
                    price_tag = card.find('p', class_='price_color')
                    price = price_tag.get_text(strip=True) if price_tag else ''

                    # Cover image
                    img_tag = card.find('img')
                    cover_image_url = ''
                    if img_tag:
                        src = img_tag.get('src', '')
                        cover_image_url = urljoin(current_url, src)

                    book_data = {
                        'title': title,
                        'author': 'Unknown',
                        'rating': rating,
                        'price': price,
                        'book_url': book_url,
                        'cover_image_url': cover_image_url,
                        'num_reviews': 0,
                        'description': '',
                        'genre': '',
                        'availability': '',
                        'upc': '',
                    }

                    # Scrape inside detail page for description/genre/etc
                    # (This takes a moment per book)
                    detail = scrape_book_detail(session, book_url)
                    book_data.update(detail)

                    books.append(book_data)

                except Exception as e:
                    logger.error(f"Error parsing book card: {e}")
                    continue

            # Check next page link
            next_btn = soup.find('li', class_='next')
            if next_btn and page + 1 < num_pages:
                next_href = next_btn.find('a').get('href', '')
                current_url = urljoin(current_url, next_href)
            else:
                current_url = None

            page += 1

    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        raise ValueError(f"Scraping failed: {str(e)}")

    return books
