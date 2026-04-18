import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(r'd:\Interview projects\BookLens\backend\.env')
api_key = os.getenv('GEMINI_API_KEY')

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content("Hello, how are you?")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
