import os
import sys
import django

# Setup Django environment
sys.path.append('d:/Interview projects/BookLens/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'booklens.settings')
django.setup()

from books.scraper import scrape_books

print("Starting scrape test...")
books = scrape_books(num_pages=1)
print(f"Scraped {len(books)} books.")

if books:
    first_book = books[0]
    print(f"Title: {first_book['title']}")
    print(f"Description (first 100 chars): {first_book['description'][:100]}...")
    print(f"Genre: {first_book['genre']}")
    print(f"Price: {first_book['price']}")
else:
    print("No books scraped.")
