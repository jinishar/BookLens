import os
import sys
import django

# Add backend to path
sys.path.append(r'd:\Interview projects\BookLens\backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'booklens.settings')
django.setup()

from ai_engine.services import rag_query

question = "What is the best book in the library?"
result = rag_query(question)
print("--- ANSWER ---")
print(result['answer'])
print("--- END ---")
