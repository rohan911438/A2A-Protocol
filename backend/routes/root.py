import os
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Agentic Exchange Backend Running"}


@router.get("/debug/env")
async def debug_env():
    gemini = os.getenv("GEMINI_API_KEY")
    google = os.getenv("GOOGLE_API_KEY")
    return {
        "GEMINI_API_KEY_set": bool(gemini),
        "GOOGLE_API_KEY_set": bool(google),
        "GEMINI_len": len(gemini) if gemini else 0,
        "GOOGLE_len": len(google) if google else 0,
    }
