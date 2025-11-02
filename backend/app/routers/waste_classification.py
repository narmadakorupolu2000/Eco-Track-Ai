from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.routers.auth import get_current_user
from app.models.schemas import User, WasteClassificationCreate, WasteClassificationInDB
from app.database import get_database
from datetime import datetime
from typing import List
import uuid

from app.utils.perplexity_client import upload_to_cloudinary, classify_image_with_perplexity

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
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {e}")

    # Call Perplexity-based classifier
    try:
        parsed, raw = classify_image_with_perplexity(image_url)
    except Exception as e:
        # Classification failed — fallback to a safe default
        parsed = {"category": "Unknown", "confidence": 0.0, "recommendations": "Classification service unavailable"}

    classification_result = {
        "user_id": current_user.id,
        "image_url": image_url,
        "classification": parsed.get("category", "Unknown"),
        "confidence": float(parsed.get("confidence", 0.0)),
        "recommendations": parsed.get("recommendations", ""),
        "date": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }

    result = await db.waste_classifications.insert_one(classification_result)
    classification_result["id"] = str(result.inserted_id)

    return WasteClassificationInDB(**classification_result)

@router.get("/history", response_model=List[WasteClassificationInDB])
async def get_classification_history(
    current_user: User = Depends(get_current_user),
    limit: int = 50
):
    """Get user's waste classification history"""
    db = get_database()
    
    cursor = db.waste_classifications.find({"user_id": current_user.id}).sort("date", -1).limit(limit)
    classifications = []
    async for classification in cursor:
        classification["id"] = str(classification["_id"])
        classifications.append(WasteClassificationInDB(**classification))
    
    return classifications

@router.get("/stats")
async def get_waste_stats(current_user: User = Depends(get_current_user)):
    """Get waste classification statistics"""
    db = get_database()
    
    total_classifications = await db.waste_classifications.count_documents({"user_id": current_user.id})
    
    return {
        "total_classifications": total_classifications,
        "most_common_type": "plastic",  # TODO: Calculate from data
        "recycling_rate": 0.75,  # TODO: Calculate from data
        "classifications_this_week": 0  # TODO: Calculate from data
    }