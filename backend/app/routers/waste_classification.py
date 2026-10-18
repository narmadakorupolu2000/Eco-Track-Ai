from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.routers.auth import get_current_user
from app.models.schemas import User, WasteClassificationCreate, WasteClassificationInDB
from app.database import get_database
from datetime import datetime
from typing import List
import uuid

from app.utils.gemini_client import upload_to_cloudinary, classify_image

router = APIRouter()

@router.post("/classify", response_model=WasteClassificationInDB)
async def classify_waste(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload and classify waste image"""
    db = get_database()
    # Read file bytes
    contents = await file.read()

    # Upload to Cloudinary (so the model can fetch the image)
    try:
        image_url = upload_to_cloudinary(contents, file.filename, file.content_type or "image/jpeg")
    except Exception as e:
        # Do not expose internal details or API keys
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {e}")

    # Call Gemini-based classifier
    try:
        parsed = await classify_image(image_url)
    except HTTPException:
        # propagate HTTP errors from the AI layer
        raise
    except Exception as e:
        # Classification failed — surface an error to caller (no mock/fallback)
        raise HTTPException(status_code=502, detail=f"Classification service error: {e}")

    # Validate/normalize required fields from parsed result
    try:
        category = parsed.get("category") or parsed.get("type") or "Unknown"
        confidence = float(parsed.get("confidence", 0.0))
        recommendations = parsed.get("disposal") or parsed.get("recommendations") or ""
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Invalid classification format returned by AI service: {e}")

    classification_result = {
        "user_id": current_user.id,
        "image_url": image_url,
        "classification": category,
        "confidence": float(confidence),
        "recommendations": recommendations,
        "date": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }

    try:
        result = await db.waste_classifications.insert_one(classification_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist classification: {e}")

    classification_result["id"] = str(result.inserted_id)

    return WasteClassificationInDB(**classification_result)
