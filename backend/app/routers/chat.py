from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from app.utils.gemini_client import generate_text

router = APIRouter()


@router.post("/chat")
async def chat_endpoint(payload: Dict[str, Any]):
    """
    Chat endpoint that accepts JSON:
      { "message": "<user message>", "sessionId": "<optional session id>" }
    Returns:
      { "response": "<assistant text>" }
    """
    message = payload.get("message") if isinstance(payload, dict) else None
    if not message or not isinstance(message, str):
        raise HTTPException(status_code=400, detail="Missing 'message' in request body")

    try:
        response_text = await generate_text(message)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {exc}") from exc

    return {"response": response_text}
