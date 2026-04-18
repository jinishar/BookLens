from google import genai
import os
from dotenv import load_dotenv

load_dotenv(r'd:\Interview projects\BookLens\backend\.env')
api_key = os.getenv('GEMINI_API_KEY')

client = genai.Client(api_key=api_key)

try:
    for m in client.models.list():
        print(m.name)
except Exception as e:
    print(f"Error: {e}")
