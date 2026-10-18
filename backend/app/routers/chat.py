from fastapi import APIRouter, Depends, HTTPException, Request
from app.routers.auth import get_current_user
from app.models.schemas import User
from typing import Optional, Dict, Any

from app.utils.gemini_client import generate_text

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(payload: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """
    Chat endpoint that accepts JSON:
      { "message": "<user message>", "sessionId": "<optional session id>" }
    Returns:
      { "response": "<assistant text>" }
    """
    # preserve request/response contract: look for "message" key
    message = payload.get("message") if isinstance(payload, dict) else None
    if not message or not isinstance(message, str):
        raise HTTPException(status_code=400, detail="Missing 'message' in request body")

    try:
        # generate_text is an async function that returns plain text
        response_text = await generate_text(message)
    except HTTPException:
        # propagate HTTPExceptions (e.g., 502) from the AI layer
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    return {"response": response_text}
