from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.models.schemas import User

router = APIRouter()

@router.get("/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get user profile"""
    return {"user": current_user, "message": "User profile retrieved successfully"}

@router.get("/stats")
async def get_user_stats(current_user: User = Depends(get_current_user)):
    """Get user statistics"""
    # TODO: Implement user statistics calculation
    return {
        "total_activities": 0,
        "carbon_saved": 0.0,
        "recycling_count": 0,
        "achievements": []
    }