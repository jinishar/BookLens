import os
import sys
import django
import threading

# Setup Django environment
sys.path.append('d:/Interview projects/BookLens/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'booklens.settings')
django.setup()

from books.models import Book
from books.views import _process_books_batch

def main():
    unprocessed = Book.objects.filter(is_processed=False)
    count = unprocessed.count()
    
    if count == 0:
        print("All books are already processed!")
        return
        
    print(f"Found {count} unprocessed books. Starting batch processing...")
    
    # We can process them in batches to avoid overwhelming the system
    book_ids = list(unprocessed.values_list('id', flat=True))
    
    # Process synchronously in this script
    _process_books_batch(book_ids)
    
    print("Processing complete!")

if __name__ == "__main__":
    main()
