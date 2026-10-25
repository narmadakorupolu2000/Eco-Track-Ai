
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
    """Classify waste or explain what a non-waste image contains."""

    # Validate uploaded file type.
    allowed_types = {"image/jpeg", "image/png", "image/webp"}

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Upload a JPG, PNG, or WEBP image.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty. Please upload an image.",
        )

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Please upload an image smaller than 10 MB.",
        )

    # Upload image to Cloudinary.
    try:
        image_url = upload_to_cloudinary(
            contents,
            file.filename or "uploaded-image",
            file.content_type,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {exc}",
        ) from exc

    # Classify image using Gemini.
    try:
        parsed = await classify_image(image_url)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Classification service error: {exc}",
        ) from exc

    # Read Gemini's waste validation fields.
    is_waste = parsed.get("is_waste", False)
    if not isinstance(is_waste, bool):
        is_waste = str(is_waste).strip().lower() == "true"

    message = str(parsed.get("message") or "").strip()

    category = str(parsed.get("category") or "Unknown")

    try:
        confidence = float(parsed.get("confidence", 0.0) or 0.0)
    except (TypeError, ValueError):
        confidence = 0.0

    # Keep confidence within the percentage range expected by the frontend.
    # Gemini may return either 0.95 or 95.
    if 0 <= confidence <= 1:
        confidence *= 100

    confidence = max(0.0, min(100.0, confidence))

    disposal = str(parsed.get("disposal") or "")
    environmental_impact = str(
        parsed.get("environmental_impact") or ""
    )

    tips = parsed.get("tips", [])
    if isinstance(tips, str):
        tips = [tips]
    elif not isinstance(tips, list):
        tips = []

    tips = [
        str(tip).strip()
        for tip in tips
        if str(tip).strip()
    ]

    # Non-waste images must not receive waste classification points.
    if not is_waste:
        category = (
            "Unknown" if category == "Unknown" else "Non-Waste Image"
        )
        disposal = "No waste disposal recommendation is applicable."
        tips = []
        environmental_impact = (
            "No waste-related environmental impact can be determined from this image."
        )
        points_earned = 0

        if not message:
            message = (
                "This image does not appear to show a waste item."
                if category != "Unknown"
                else "The image could not be classified clearly."
            )
    else:
        try:
            points_earned = int(parsed.get("points_earned", 10))
        except (TypeError, ValueError):
            points_earned = 10

        points_earned = max(0, points_earned)

    # Store the result while preserving fields used by existing history APIs.
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
        "is_waste": is_waste,
        "message": message,
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

    # Return exactly the six fields expected by the current frontend.
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
