from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.models.schemas import User, TrackingEntryCreate, TrackingEntryInDB
from app.database import get_database
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("/entry", response_model=TrackingEntryInDB)
async def create_tracking_entry(
    entry: TrackingEntryCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new tracking entry"""
    db = get_database()
    
    entry_dict = {
        **entry.dict(),
        "user_id": current_user.id,
        "date": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    # TODO: Calculate carbon impact based on activity
    if entry.activity_type == "recycling":
        entry_dict["carbon_impact"] = entry.amount * 0.5  # Simple calculation
    
    result = await db.tracking_entries.insert_one(entry_dict)
    entry_dict["id"] = str(result.inserted_id)
    
    return TrackingEntryInDB(**entry_dict)

@router.get("/entries", response_model=List[TrackingEntryInDB])
async def get_tracking_entries(
    current_user: User = Depends(get_current_user),
    limit: int = 100
):
    """Get user's tracking entries"""
    db = get_database()
    
    cursor = db.tracking_entries.find({"user_id": current_user.id}).sort("date", -1).limit(limit)
    entries = []
    async for entry in cursor:
        entry["id"] = str(entry["_id"])
        entries.append(TrackingEntryInDB(**entry))
    
    return entries

@router.get("/stats")
async def get_tracking_stats(current_user: User = Depends(get_current_user)):
    """Get tracking statistics for user"""
    db = get_database()
    
    # TODO: Implement proper aggregation
    total_entries = await db.tracking_entries.count_documents({"user_id": current_user.id})
    
    return {
        "total_entries": total_entries,
        "total_carbon_saved": 0.0,  # TODO: Calculate from entries
        "activities_this_month": 0,  # TODO: Calculate from entries
        "top_activity": "recycling"  # TODO: Calculate from entries
    }