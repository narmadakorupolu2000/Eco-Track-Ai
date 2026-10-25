
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.routers.auth import get_current_user
from app.models.schemas import (
    User,
    WasteClassificationInDB,
    WasteClassificationResult,
)
from app.database import get_database
from app.utils.gemini_client import upload_to_cloudinary, classify_image

router = APIRouter()


@router.post("/classify", response_model=WasteClassificationResult)
async def classify_waste(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an image and return the six-field waste classification result."""

    # Validate the uploaded file type.
    allowed_types = {"image/jpeg", "image/png", "image/webp"}

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Upload a JPG, PNG, or WEBP image of waste.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty. Please upload a waste image.",
        )

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Please upload an image smaller than 10 MB.",
        )

    # Upload the image.
    try:
        image_url = upload_to_cloudinary(
            contents,
            file.filename or "waste-image",
            file.content_type or "image/jpeg",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {exc}",
        ) from exc

    # Classify the image using Gemini.
    try:
        parsed = await classify_image(image_url)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Classification service error: {exc}",
        ) from exc

    
    

    category = str(parsed.get("category") or "Unknown")
    confidence = float(parsed.get("confidence", 0.0))
    disposal = str(parsed.get("disposal") or "")
    tips = parsed.get("tips", [])
    environmental_impact = str(
        parsed.get("environmental_impact") or ""
    )
    points_earned = int(parsed.get("points_earned", 10))

    if not isinstance(tips, list):
        tips = [tips] if isinstance(tips, str) else []

    tips = [str(tip) for tip in tips if str(tip).strip()]

    # Store both the existing history fields and the new classification fields.
    now = datetime.utcnow()

    classification_record = {
        "user_id": current_user.id,
        "image_url": image_url,
        "classification": category,
        "confidence": confidence,
        "recommendations": disposal,
        "category": category,
        "disposal": disposal,
        "tips": tips,
        "environmental_impact": environmental_impact,
        "points_earned": points_earned,
        "date": now,
        "created_at": now,
    }

    db = get_database()

    try:
        await db.waste_classifications.insert_one(classification_record)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save classification: {exc}",
        ) from exc

    # Return exactly the six fields required by ClassificationResult.
    return WasteClassificationResult(
        category=category,
        confidence=confidence,
        disposal=disposal,
        tips=tips,
        environmental_impact=environmental_impact,
        points_earned=points_earned,
    )


@router.get("/history", response_model=List[WasteClassificationInDB])
async def get_classification_history(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
):
    """Get the user's waste classification history."""

    db = get_database()

    cursor = (
        db.waste_classifications
        .find({"user_id": current_user.id})
        .sort("date", -1)
        .limit(max(1, min(limit, 100)))
    )

    classifications = []

    async for classification in cursor:
        classification["id"] = str(classification.pop("_id"))
        classifications.append(
            WasteClassificationInDB(**classification)
        )

    return classifications


@router.get("/stats")
async def get_waste_stats(
    current_user: User = Depends(get_current_user),
):
    """Get waste classification statistics."""

    db = get_database()

    total_classifications = await db.waste_classifications.count_documents(
        {"user_id": current_user.id}
    )

    return {
        "total_classifications": total_classifications,
        "most_common_type": "plastic",
        "recycling_rate": 0.75,
        "classifications_this_week": 0,
    }
