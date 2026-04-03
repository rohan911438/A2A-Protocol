import os
import re
from dotenv import load_dotenv
import google.generativeai as genai

# Ensure .env is loaded even if this module is imported early
load_dotenv()

# Setup Gemini API (support both env var names)
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# A default model to be used
# It might require configuration based on the user's specific gemini setup
try:
    model = genai.GenerativeModel('gemini-2.5-flash')
except Exception:
    model = None

BUYER_PROMPT = """You are a buyer negotiating a freelance deal.

Your constraints:
- Maximum budget: ₹{budget}
- Preferred starting price: ₹{initial_offer}
- Goal: Get best price while closing deal

Rules:
- Never exceed your budget
- Try to negotiate smartly
- Be persuasive but realistic
- Try to close the deal if price is reasonable

Conversation so far:
{history}

Respond with:
1. Your message (natural human tone)
2. Your current offer price (number only)

Format:
MESSAGE: <your message>
PRICE: <number>
"""

SELLER_PROMPT = """You are a service provider negotiating a freelance deal.

Your constraints:
- Minimum acceptable price: ₹{min_price}
- Starting asking price: ₹{initial_price}
- Goal: Maximize profit but close deal

Rules:
- Never go below minimum price
- Negotiate smartly
- Be persuasive and justify pricing
- Close deal if acceptable

Conversation so far:
{history}

Respond with:
MESSAGE: <your message>
PRICE: <number>
"""

def parse_llm_response(text: str) -> tuple[str, float]:
    """Parses the MESSAGE and PRICE from the LLM's response."""
    message = ""
    price = 0.0
    
    # Simple parsing logic
    message_match = re.search(r'MESSAGE:\s*(.*)', text, re.IGNORECASE)
    price_match = re.search(r'PRICE:\s*(\d+)', text, re.IGNORECASE)
    
    if message_match:
        message = message_match.group(1).strip()
    if price_match:
        price = float(price_match.group(1).strip())
        
    return message, price

def call_gemini(prompt: str) -> str:
    """Calls Gemini API with the given prompt."""
    try:
        # Lazy-configure in case env was loaded after import
        global model
        if not api_key:
            key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if key:
                genai.configure(api_key=key)
        if model is None:
            model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text
    except Exception as e:
        print(f"Error calling Gemini: {e}")
    # Return a fallback format if it fails for testing
    return "MESSAGE: Error calling LLM\nPRICE: 0"
