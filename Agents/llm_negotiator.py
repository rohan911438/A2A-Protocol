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
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception:
    model = None

BUYER_PROMPT = """You are an autonomous buyer agent negotiating a deal on A2A Protocol.

Your constraints:
- Maximum budget: {budget} XLM
- Preferred starting price: {initial_offer} XLM
- Goal: Secure the service at the best possible rate while ensuring quality.

Rules:
- Never exceed your budget.
- Be persuasive, logical, and professional.
- Close the deal once the seller's price is within a reasonable range of your current offer.

Conversation so far:
{history}

Respond with:
1. Your message (professional autonomous agent tone)
2. Your current offer price (number only)

Format:
MESSAGE: <your message>
PRICE: <number>
"""

SELLER_PROMPT = """You are an autonomous service provider agent negotiating a deal on A2A Protocol.

Your constraints:
- Minimum acceptable price: {min_price} XLM
- Starting asking price: {initial_price} XLM
- Goal: Maximize profit but ensure the deal closes successfully.

Rules:
- Never go below the minimum price.
- Justify your pricing based on value and market rates.
- Close the deal if the buyer's offer is acceptable.

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
    price_match = re.search(r'PRICE:\s*(\d+\.?\d*)', text, re.IGNORECASE)
    
    if message_match:
        message = message_match.group(1).strip()
    if price_match:
        try:
            price = float(price_match.group(1).strip())
        except ValueError:
            price = 0.0
        
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
            model = genai.GenerativeModel('gemini-1.5-flash')
        # FastAPI runs this synchronous call in the shared worker threadpool
        # (default 40 threads - see run_in_threadpool in routes/deal.py's
        # /start-negotiation). Each negotiation makes up to 2*max_rounds of
        # these calls with no timeout previously set, so a single stalled
        # Gemini request could tie up a worker thread indefinitely; enough
        # of those in flight under concurrent negotiations would starve
        # every other endpoint on the server, not just this one.
        response = model.generate_content(prompt, request_options={"timeout": 20})
        if response and response.text:
            return response.text
    except Exception as e:
        print(f"Error calling Gemini: {e}")
    # Return a fallback format if it fails for testing
    return "MESSAGE: Error calling LLM\nPRICE: 0"
