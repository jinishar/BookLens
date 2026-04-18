import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(r'd:\Interview projects\BookLens\backend\.env')
api_key = os.getenv('GEMINI_API_KEY')

genai.configure(api_key=api_key)

try:
    models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    for m in models:
        if '1.5' in m or 'flash' in m:
            print(m)
except Exception as e:
    print(f"Error: {e}")
