"""
Selenium-based scraper for books.toscrape.com
Scrapes book title, author (if available), rating, price, cover image, and detail page.
"""
import time
import re
import logging
from typing import List, Dict, Optional

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import requests

logger = logging.getLogger(__name__)

RATING_MAP = {
    'One': 1.0,
    'Two': 2.0,
    'Three': 3.0,
    'Four': 4.0,
    'Five': 5.0,
}

BASE_URL = "https://books.toscrape.com"


def get_driver():
    """Initialize headless Chrome driver."""
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        logger.warning(f"ChromeDriverManager failed: {e}, trying system Chrome...")
        driver = webdriver.Chrome(options=options)

    driver.set_page_load_timeout(30)
    return driver


def parse_rating(rating_class: str) -> float:
    """Convert CSS class rating word to numeric."""
    for word, val in RATING_MAP.items():
        if word in rating_class:
            return val
    return 0.0


def scrape_book_detail(driver, book_url: str) -> Dict:
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
        driver.get(book_url)
        time.sleep(1)
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Description
        desc_div = soup.find('div', id='product_description')
        if desc_div and desc_div.find_next_sibling('p'):
            detail['description'] = desc_div.find_next_sibling('p').get_text(strip=True)

        # Table info
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
    Main scraping function. Scrapes books.toscrape.com.
    
    Args:
        num_pages: Number of catalogue pages to scrape (max 50 available)
        category: Optional category slug to filter by
    
    Returns:
        List of book dicts
    """
    driver = get_driver()
    books = []

    try:
        if category:
            start_url = f"{BASE_URL}/catalogue/category/books/{category}/index.html"
        else:
            start_url = f"{BASE_URL}/catalogue/page-1.html"

        current_url = start_url
        page = 0

        while current_url and page < num_pages:
            logger.info(f"Scraping page {page + 1}: {current_url}")
            driver.get(current_url)
            time.sleep(1.5)

            soup = BeautifulSoup(driver.page_source, 'html.parser')
            book_cards = soup.find_all('article', class_='product_pod')

            for card in book_cards:
                try:
                    # Title
                    title_tag = card.find('h3').find('a')
                    title = title_tag.get('title', title_tag.get_text(strip=True))

                    # Relative URL
                    relative_url = title_tag.get('href', '')
                    if relative_url.startswith('../'):
                        relative_url = relative_url.replace('../', '')
                        book_url = f"{BASE_URL}/catalogue/{relative_url}"
                    elif relative_url.startswith('catalogue/'):
                        book_url = f"{BASE_URL}/{relative_url}"
                    else:
                        book_url = f"{BASE_URL}/catalogue/{relative_url}"

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
                        if src.startswith('../'):
                            src = src.replace('../../', '')
                            cover_image_url = f"{BASE_URL}/{src}"
                        else:
                            cover_image_url = f"{BASE_URL}/{src.lstrip('/')}"

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

                    # Scrape detail page
                    logger.info(f"  → Detail: {title}")
                    detail = scrape_book_detail(driver, book_url)
                    book_data.update(detail)

                    books.append(book_data)
                    logger.info(f"  ✓ Scraped: {title} | Genre: {detail.get('genre')} | Rating: {rating}")

                except Exception as e:
                    logger.error(f"Error parsing book card: {e}")
                    continue

            # Next page
            next_btn = soup.find('li', class_='next')
            if next_btn and page + 1 < num_pages:
                next_href = next_btn.find('a').get('href', '')
                if category:
                    current_url = f"{BASE_URL}/catalogue/category/books/{category}/{next_href}"
                else:
                    if next_href.startswith('catalogue/'):
                        current_url = f"{BASE_URL}/{next_href}"
                    else:
                        current_url = f"{BASE_URL}/catalogue/{next_href}"
            else:
                current_url = None

            page += 1

    except Exception as e:
        logger.error(f"Scraping failed: {e}")
    finally:
        driver.quit()

    logger.info(f"Scraping complete. Total books: {len(books)}")
    return books
