"""
EcoTrack API - Main Consolidated Entrypoint
Handles user authentication, stats tracking, activity logging, contact forms,
and all other backend services for the EcoTrack application.
This file combines logic from various modules into a single, unified service.
# reload: env update
"""

import os
import sys

# Load environment variables FIRST, before any imports that read them
from dotenv import load_dotenv
load_dotenv()

# Workaround for Python 3.13 SSL issues with MongoDB
if sys.version_info >= (3, 13):
    import ssl
    # Monkey patch to allow legacy SSL connections
    ssl._create_default_https_context = ssl._create_unverified_context

from fastapi import FastAPI, HTTPException, status, Depends, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from jose import jwt, JWTError
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import Request
from app.utils.perplexity_client import classify_image_with_perplexity, upload_to_cloudinary

# --- Configuration ---
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
DATABASE_NAME = "ecotrack_db"
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
RECIPIENT_EMAIL = "jayanthkorupolu.2000@gmail.com"
# Comma-separated list of allowed frontend origins (CORS)
# Include both localhost and 127.0.0.1 for local development, all common ports
# Also include "null" for file:// protocol testing
default_origins = "http://localhost,http://localhost:3000,http://localhost:3001,http://localhost:8000,http://127.0.0.1,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:8000,https://eco-track-ai.vercel.app,null"
FRONTEND_ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", default_origins).split(",") if o.strip()]


app = FastAPI(
    title="EcoTrack API (Consolidated)",
    description="Unified Backend API for EcoTrack - Environmental Tracking Application",
    version="3.0.0"
)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose all response headers
)

# --- Security ---
security = HTTPBearer()

# --- Database Client ---
mongodb_client: Optional[AsyncIOMotorClient] = None

# ==================== Database Connection Events ====================

@app.on_event("startup")
async def startup_db_client():
    global mongodb_client
    try:
        print(f"Attempting to connect to MongoDB at {MONGODB_URI}...")
        
        # For Python 3.13 SSL compatibility with MongoDB Atlas
        mongodb_client = AsyncIOMotorClient(
            MONGODB_URI, 
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        await mongodb_client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        # Create helpful indexes
        db = mongodb_client[DATABASE_NAME]
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.activities.create_index([("user_id", 1), ("timestamp", -1)])
        await db.activities.create_index([("user_id", 1), ("activity_type", 1), ("timestamp", -1)])
        print("✅ Indexes created (users, activities).")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        # Depending on policy, you might want to raise the exception
        # to prevent the app from starting without a DB.
        # For now, we'll print the error and continue.
        mongodb_client = None

@app.on_event("shutdown")
async def shutdown_db_client():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("🔌 MongoDB connection closed.")

def get_database():
    if mongodb_client is None:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    return mongodb_client[DATABASE_NAME]

# ==================== Pydantic Models ====================

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    password: str

class User(BaseModel):
    id: str
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime

class UserStats(BaseModel):
    user_id: str
    total_points: int = 0
    carbon_saved: float = 0.0
    items_classified: int = 0
    weekly_goal: int = 100
    weekly_progress: float = 0.0
    level: str = "Eco Beginner"
    streak_days: int = 0
    last_activity_date: Optional[datetime] = None

class Activity(BaseModel):
    user_id: str
    activity_type: str
    description: str
    points_earned: int
    carbon_impact: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class GoalCreate(BaseModel):
    goal_type: str
    target: str
    deadline: Optional[datetime] = None

class Achievement(BaseModel):
    achievement_id: str
    name: str
    description: str
    icon: str
    color: str
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None

class CommunityStats(BaseModel):
    total_users: int
    active_users: int
    total_carbon_saved: float
    total_items_classified: int
    total_activities: int

class DashboardData(BaseModel):
    user: User
    stats: UserStats
    recent_activities: List[Activity]
    achievements: List[Achievement]
    community_stats: CommunityStats

class ContactFormData(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    subject: str
    message: str
    phone: Optional[str] = None
    company: Optional[str] = None

# ==================== Carbon Calculation Constants & Helpers ====================

# Carbon emission factors (kg CO2e per unit)
CARBON_FACTORS = {
    # Transportation (per km)
    "car_petrol": 0.192,      # Average petrol car
    "car_diesel": 0.171,      # Average diesel car
    "car_electric": 0.053,    # Electric car (grid average)
    "bus": 0.089,             # Public bus
    "train": 0.041,           # Train/metro
    "flight_short": 0.255,    # Flight < 500km
    "flight_long": 0.195,     # Flight > 500km
    "motorcycle": 0.113,      # Motorcycle
    "bicycle": 0.0,           # Zero emissions
    "walk": 0.0,              # Zero emissions
    
    # Energy (per kWh)
    "electricity_grid": 0.233,  # Grid electricity (US average)
    "electricity_renewable": 0.0,  # Solar/wind
    "gas_heating": 0.185,     # Natural gas per kWh
    
    # Food (per kg)
    "beef": 27.0,             # Beef production
    "lamb": 39.2,             # Lamb production
    "pork": 12.1,             # Pork production
    "chicken": 6.9,           # Chicken production
    "fish": 5.1,              # Fish production
    "cheese": 13.5,           # Cheese production
    "milk": 1.9,              # Milk per liter
    "eggs": 4.8,              # Per kg
    "vegetables": 2.0,        # Average vegetables
    "fruits": 1.1,            # Average fruits
    "grains": 2.5,            # Bread, rice, pasta
    
    # Waste (per kg)
    "general_waste": 0.45,    # Landfill waste
    "recycled": -0.15,        # Recycling saves carbon
    "composted": -0.10,       # Composting saves carbon
    "e_waste": 0.85,          # Electronic waste
}

# Achievement thresholds and rewards
ACHIEVEMENTS = {
    "first_steps": {
        "name": "Eco Newbie",
        "description": "Logged your first activity",
        "icon": "🌱",
        "points": 10,
        "criteria": "activities_count >= 1"
    },
    "week_warrior": {
        "name": "Week Warrior",
        "description": "7-day tracking streak",
        "icon": "🔥",
        "points": 50,
        "criteria": "streak_days >= 7"
    },
    "month_master": {
        "name": "Month Master",
        "description": "30-day tracking streak",
        "icon": "⭐",
        "points": 150,
        "criteria": "streak_days >= 30"
    },
    "carbon_saver": {
        "name": "Carbon Saver",
        "description": "Saved 10kg CO2e",
        "icon": "💚",
        "points": 75,
        "criteria": "carbon_saved >= 10"
    },
    "recycling_hero": {
        "name": "Recycling Hero",
        "description": "Recycled 50 items",
        "icon": "♻️",
        "points": 100,
        "criteria": "items_recycled >= 50"
    },
    "commute_champion": {
        "name": "Commute Champion",
        "description": "Used eco transport 20 times",
        "icon": "🚴",
        "points": 80,
        "criteria": "eco_commutes >= 20"
    }
}

def calculate_carbon_impact(activity_type: str, sub_type: str, amount: float, unit: str = "km") -> float:
    """
    Calculate carbon impact based on activity type and amount.
    Returns kg CO2e (negative values mean carbon saved/offset)
    """
    if activity_type == "transportation":
        factor = CARBON_FACTORS.get(sub_type, CARBON_FACTORS["car_petrol"])
        return round(factor * amount, 3)
    
    elif activity_type == "energy":
        factor = CARBON_FACTORS.get(sub_type, CARBON_FACTORS["electricity_grid"])
        return round(factor * amount, 3)
    
    elif activity_type == "food":
        factor = CARBON_FACTORS.get(sub_type, CARBON_FACTORS["vegetables"])
        return round(factor * amount, 3)
    
    elif activity_type == "waste":
        factor = CARBON_FACTORS.get(sub_type, CARBON_FACTORS["general_waste"])
        # Recycling and composting have negative factors (carbon saved)
        return round(factor * amount, 3)
    
    return 0.0

def calculate_points(activity_type: str, carbon_impact: float, is_positive_action: bool = False) -> int:
    """
    Calculate points earned for an activity.
    Positive actions (recycling, eco transport) earn more points.
    """
    base_points = abs(int(carbon_impact * 10))  # 10 points per kg CO2e
    
    if is_positive_action or carbon_impact < 0:
        # Reward eco-friendly actions more
        return max(base_points * 2, 5)
    else:
        # Still give some points for tracking, but less
        return max(base_points, 2)

def update_streak(last_activity_date: datetime | None) -> int:
    """
    Calculate streak days. Breaks if no activity for > 24 hours.
    """
    if not last_activity_date:
        return 1
    
    now = datetime.utcnow()
    diff = now - last_activity_date
    
    if diff.total_seconds() <= 86400:  # Within 24 hours
        return 1  # Continue streak (will be incremented)
    else:
        return 0  # Streak broken

def generate_insights(user_stats: dict, recent_activities: list) -> list:
    """
    Generate personalized insights based on user's carbon data and activities.
    """
    insights = []
    
    # Carbon saved insights
    carbon_saved = user_stats.get("carbon_saved", 0)
    if carbon_saved > 0:
        trees = round(carbon_saved / 21, 1)  # 1 tree absorbs ~21kg CO2/year
        insights.append({
            "type": "success",
            "title": "Carbon Savings",
            "message": f"You've saved {carbon_saved:.1f}kg CO2e! That's like planting {trees} trees! 🌳",
            "icon": "💚"
        })
    
    # Streak insights
    streak = user_stats.get("streak_days", 0)
    if streak >= 7:
        insights.append({
            "type": "success",
            "title": f"{streak}-Day Streak!",
            "message": "Consistency is key! Keep tracking to stay accountable.",
            "icon": "🔥"
        })
    
    # Category analysis from recent activities
    if recent_activities:
        transport_count = sum(1 for a in recent_activities if a.get("activity_type") == "transportation")
        if transport_count > 5:
            insights.append({
                "type": "tip",
                "title": "Transportation Tip",
                "message": "Consider carpooling, public transit, or biking for short trips to reduce emissions.",
                "icon": "🚲"
            })
    
    # Level progress
    level = user_stats.get("level", "Eco Beginner")
    total_points = user_stats.get("total_points", 0)
    if level == "Eco Beginner" and total_points > 50:
        insights.append({
            "type": "info",
            "title": "Level Up Soon!",
            "message": f"You're {100 - total_points} points away from Eco Explorer!",
            "icon": "⬆️"
        })
    
    # Goal progress
    weekly_progress = user_stats.get("weekly_progress", 0)
    if weekly_progress >= 80:
        insights.append({
            "type": "success",
            "title": "Goal Almost Reached!",
            "message": f"You're at {weekly_progress:.0f}% of your weekly goal. Keep going!",
            "icon": "🎯"
        })
    
    return insights[:4]  # Return top 4 insights

# ==================== Helper Functions ====================

def hash_password(password: str) -> str:
    """Hash password using bcrypt directly (Python 3.13 compatible)"""
    # Bcrypt has a 72-byte limit, truncate if needed
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt directly (Python 3.13 compatible)"""
    # Bcrypt has a 72-byte limit, truncate if needed
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

def calculate_level(total_points: int) -> str:
    if total_points >= 5000: return "Eco Legend"
    if total_points >= 2500: return "Eco Champion"
    if total_points >= 1000: return "Eco Warrior"
    if total_points >= 500: return "Eco Enthusiast"
    if total_points >= 100: return "Eco Explorer"
    return "Eco Beginner"

# ... (other helper functions from main_mongodb.py like update_streak, check_and_unlock_achievements, etc.)

# ==================== Root & Health Check Endpoints ====================

@app.get("/")
async def root():
    return {"message": "EcoTrack API (Consolidated) is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    try:
        db = get_database()
        await db.command('ping')
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "healthy", "service": "EcoTrack Backend API", "database": db_status}

@app.get("/api/test-cors")
async def test_cors():
    """Simple endpoint to test CORS configuration"""
    return {"message": "CORS is working!", "timestamp": datetime.utcnow().isoformat()}


@app.post("/internal/classify")
async def internal_classify(req: Request):
    """Internal endpoint used by the Next frontend to proxy image classification to the Python helper.

    Expects JSON body: { "image": "<url or data url>", "prompt": "optional prompt" }
    Returns { result, raw, tokens }
    """
    body = await req.json()
    image = body.get("image")
    prompt = body.get("prompt")
    if not image:
        raise HTTPException(status_code=400, detail="No image provided")
    try:
        parsed, raw, tokens = classify_image_with_perplexity(image, prompt_extra=prompt)
        return {"result": parsed, "raw": raw, "tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Public Waste Classify Endpoint (Perplexity) ====================

@app.post("/api/waste-classify")
async def api_waste_classify(request: Request, file: UploadFile | None = File(default=None)):
    """Public endpoint for the UI to classify waste using Perplexity.

    Accepts either:
      - multipart/form-data with `file`
      - application/json with { "image": "<url or data url>", "prompt": "optional" }

    Returns a normalized shape expected by the UI: { result, raw, model }
    where result = { category, confidence, disposal, tips, environmental_impact, points_earned }
    """
    try:
        image_url: str | None = None
        prompt: str | None = None

        content_type = (request.headers.get("content-type") or request.headers.get("Content-Type") or "").lower()
        is_multipart = "multipart/form-data" in content_type
        # Treat as multipart if header indicates it OR FastAPI injected file is present
        if is_multipart or file is not None:
            # Prefer FastAPI injection of UploadFile if available; else parse from request.form()
            upload: UploadFile | None = file
            if upload is None:
                form = await request.form()
                maybe = form.get("file")
                upload = maybe if isinstance(maybe, UploadFile) else None
            if not upload:
                raise HTTPException(status_code=400, detail="No file provided")

            data = await upload.read()
            mime = upload.content_type or "image/jpeg"
            # If Cloudinary configured in python env, upload to get a stable URL, else fallback to data URL
            try:
                image_url = upload_to_cloudinary(data, upload.filename or "upload.jpg", mime=mime)
            except Exception:
                # Fallback to data URL to still enable classification without Cloudinary
                b64 = __import__("base64").b64encode(data).decode("ascii")
                image_url = f"data:{mime};base64,{b64}"
        else:
            # JSON body path
            try:
                body = await request.json()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid JSON body")
            image_url = body.get("image")
            prompt = body.get("prompt")

        if not image_url:
            raise HTTPException(status_code=400, detail="No image provided")

        parsed, raw, tokens = classify_image_with_perplexity(image_url, prompt_extra=prompt)

        # Normalize to UI contract with richer fields
        # Coerce and sanitize fields
        category_val = (parsed.get("type") or parsed.get("category") or parsed.get("waste_type") or "Unknown")
        category = str(category_val).strip()
        item_val = (parsed.get("item") or parsed.get("specific_item") or "")
        item = str(item_val).strip()
        recyclability_val = (parsed.get("recyclability") or parsed.get("recyclable") or "")
        recyclability = str(recyclability_val).strip()
        disposal_val = (parsed.get("disposal") or parsed.get("recommended_disposal") or "Not applicable")
        disposal = str(disposal_val).strip()
        confidence_val = parsed.get("confidence")
        try:
            confidence = float(confidence_val) if confidence_val is not None else 0.0
        except Exception:
            confidence = 0.0
        # Clamp to 0..100 and round to 1 decimal to match UI expectations
        if not isinstance(confidence, (int, float)):
            confidence = 0.0
        confidence = max(0.0, min(100.0, round(float(confidence), 1)))

        # Heuristic: determine is_waste and basic scoring/impact
        is_waste = True
        if category.lower() == "not waste":
            is_waste = False

        # Default tips based on category; enriched and tied to recyclability
        default_tips_map = {
            "plastic": [
                "Rinse and place in recycling if accepted locally.",
                "Remove caps and labels if your program requires.",
                "Check the resin code (♻️ 1,2) — these are most commonly recyclable.",
            ],
            "metal": [
                "Rinse cans to remove residue before recycling.",
                "Do not crush if your facility sorts by shape.",
            ],
            "paper": [
                "Keep paper clean and dry; avoid oily or food-soiled paper.",
                "Flatten cardboard boxes to save bin space.",
            ],
            "glass": [
                "Rinse and sort by color if your program requires.",
                "Wrap broken glass and dispose per local guidelines (often not curbside).",
            ],
            "organic": [
                "Compost where available; avoid landfill to cut methane.",
                "If no compost bin, consider community compost drop-off.",
            ],
            "e-waste": [
                "Never trash e‑waste. Use certified e‑waste drop-off locations.",
                "Remove batteries and recycle them separately.",
            ],
            "hazardous": [
                "Take to hazardous waste collection sites; do not pour or trash.",
                "Store in original, sealed containers until disposal.",
            ],
        }

        # Very simple carbon impact estimate (kg CO2e) placeholder
        carbon_map = {
            "plastic": 0.20,
            "metal": 0.15,
            "paper": 0.05,
            "cardboard": 0.06,
            "glass": 0.08,
            "organic": 0.03,
            "e-waste": 0.50,
            "hazardous": 0.40,
        }
        key = category.lower()
        # tweak by recyclability where known
        carbon_impact = carbon_map.get(key, 0.0)
        if isinstance(recyclability, str) and "compost" in recyclability.lower():
            carbon_impact = max(0.02, carbon_impact * 0.7)
        elif isinstance(recyclability, str) and "recyclable" in recyclability.lower():
            carbon_impact = max(0.03, carbon_impact * 0.8)
        carbon_source = "heuristic"

        # Points heuristic
        # Points: simple gamification scheme
        points = 0
        recyc = recyclability.lower() if isinstance(recyclability, str) else ""
        if not is_waste:
            points = 0
        elif "hazard" in key or "e-waste" in key:
            points = 20
        elif "recyclable" in recyc:
            points = 15
        elif "compost" in recyc:
            points = 12
        else:
            points = 5
        # small confidence multiplier (50% baseline)
        if confidence > 50:
            points = int(points * (0.5 + (confidence / 200.0)))

        # Tips and environmental impact fallbacks (merge category + recyclability hints)
        tips = parsed.get("tips")
        merged_tips = []
        if isinstance(tips, list):
            merged_tips.extend([str(t).strip() for t in tips if str(t).strip()])
        merged_tips.extend(default_tips_map.get(key, []))
        if "cardboard" in item.lower() or "box" in item.lower() or key == "paper":
            merged_tips.append("Flatten cardboard to save space and improve collection efficiency.")
        if "plastic" in key:
            merged_tips.append("Check local rules for film plastics — often not curbside.")
        if "compost" in recyc:
            merged_tips.append("If only industrial composting is available, avoid the compost bin at home.")
        if "recyclable" in recyc:
            merged_tips.append("Avoid food contamination — a quick rinse prevents rejection.")
        # de-duplicate tips while preserving order
        seen = set()
        tips = []
        for t in merged_tips:
            if t not in seen:
                seen.add(t)
                tips.append(t)
        env_impact = parsed.get("environmental_impact") or parsed.get("explanation") or ""
        if not env_impact:
            env_impact = (
                "Proper disposal reduces contamination and improves recycling efficiency. "
                "Follow local guidelines for best environmental outcomes."
            )

        # Confidence advice
        low_confidence = confidence < 50
        advice = ""
        if low_confidence:
            advice = (
                "Low confidence result. Retake a clear, well-lit photo focusing on a single item. "
                "Avoid background clutter and reflective glare."
            )

        result = {
            "category": category,
            "item": item,
            "recyclability": recyclability,
            "is_waste": is_waste,
            "confidence": confidence,
            "disposal": disposal,
            "tips": tips,
            "environmental_impact": env_impact,
            "points_earned": points,
            "carbon_impact": carbon_impact,
            "carbon_source": carbon_source,
            "low_confidence": low_confidence,
            "advice": advice,
        }
        # Provide a small verifier shape the UI optionally uses
        verified = {"is_waste": is_waste, "confidence": confidence}
        return {"result": result, "raw": raw, "model": "perplexity", "verified": verified}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Provide helpful message for API key issues
        if "401" in error_msg or "Unauthorized" in error_msg or "Authorization" in error_msg:
            raise HTTPException(
                status_code=401, 
                detail="Perplexity API key is invalid or expired. Please update PERPLEXITY_API_KEY in your .env file. Get a new key from https://www.perplexity.ai/settings/api"
            )
        raise HTTPException(status_code=500, detail=error_msg)


# ==================== Mock Waste Classify Endpoint (For Testing) ====================

@app.post("/api/waste-classify-mock")
async def api_waste_classify_mock(request: Request, file: UploadFile | None = File(default=None)):
    """Mock endpoint for testing waste classification without Perplexity API.
    Returns realistic mock data based on random selection.
    """
    import random
    
    # Mock classification results
    mock_results = [
        {
            "category": "Plastic",
            "item": "Plastic Bottle",
            "recyclability": "Recyclable",
            "is_waste": True,
            "confidence": 95.5,
            "disposal": "Rinse and place in recycling bin",
            "tips": [
                "Remove cap before recycling",
                "Rinse container to remove residue",
                "Check if your local facility accepts this plastic type"
            ],
            "environmental_impact": "Recycling plastic bottles saves energy and reduces landfill waste",
            "points_earned": 15,
            "carbon_impact": 0.16,
            "carbon_source": "mock",
            "low_confidence": False,
            "advice": ""
        },
        {
            "category": "Paper",
            "item": "Cardboard Box",
            "recyclability": "Recyclable",
            "is_waste": True,
            "confidence": 92.3,
            "disposal": "Flatten and place in paper recycling",
            "tips": [
                "Remove any tape or labels",
                "Keep dry to maintain recyclability",
                "Flatten to save space"
            ],
            "environmental_impact": "Recycling cardboard reduces deforestation and saves energy",
            "points_earned": 12,
            "carbon_impact": 0.06,
            "carbon_source": "mock",
            "low_confidence": False,
            "advice": ""
        },
        {
            "category": "Metal",
            "item": "Aluminum Can",
            "recyclability": "Recyclable",
            "is_waste": True,
            "confidence": 98.7,
            "disposal": "Rinse and recycle",
            "tips": [
                "Aluminum is infinitely recyclable",
                "Rinse to remove residue",
                "Crushing saves space but check local guidelines"
            ],
            "environmental_impact": "Recycling aluminum saves 95% of the energy needed to make new cans",
            "points_earned": 18,
            "carbon_impact": 0.12,
            "carbon_source": "mock",
            "low_confidence": False,
            "advice": ""
        }
    ]
    
    result = random.choice(mock_results)
    return {
        "result": result,
        "raw": f"Mock classification: {result['item']}",
        "model": "mock"
    }


# ==================== Authentication Endpoints ====================

@app.post("/api/auth/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    db = get_database()
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered.")
    if await db.users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken.")

    user_id = f"user_{datetime.utcnow().timestamp()}"
    user_data = {
        "_id": user_id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "hashed_password": hash_password(user.password),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user_data)

    # Initialize user stats
    await db.user_stats.insert_one({
        "user_id": user_id, "total_points": 0, "carbon_saved": 0.0, "items_classified": 0,
        "weekly_goal": 100, "weekly_progress": 0.0, "level": "Eco Beginner", "streak_days": 0,
        "last_activity_date": None
    })
    
    return User(
        id=user_id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=True,
        created_at=user_data["created_at"]
    )

@app.post("/api/auth/token")
async def login(email: str = Form(...), password: str = Form(...)):
    db = get_database()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token({"user_id": user["_id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": User(
            id=user["_id"], email=user["email"], username=user["username"],
            full_name=user.get("full_name"), is_active=user.get("is_active", True),
            created_at=user["created_at"]
        )
    }

@app.get("/api/auth/me", response_model=User)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["_id"], email=current_user["email"], username=current_user["username"],
        full_name=current_user.get("full_name"), is_active=current_user.get("is_active", True),
        created_at=current_user["created_at"]
    )

# ==================== Contact Form Endpoint ====================

@app.post("/api/contact/submit")
async def submit_contact_form(form_data: ContactFormData):
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("⚠️ Contact form submitted but no email credentials configured. Skipping email.")
        return {
            "success": True, 
            "message": "Thank you for your message! We'll get back to you soon. (Demo mode - email not sent)"
        }
    
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = RECIPIENT_EMAIL
    msg['Subject'] = f"EcoTrack Contact Form: {form_data.subject}"
    
    email_body = f"""
    New Contact Form Submission from EcoTrack AI Website
    
    Name: {form_data.firstName} {form_data.lastName}
    Email: {form_data.email}
    Subject: {form_data.subject}
    Phone: {form_data.phone or 'N/A'}
    Company: {form_data.company or 'N/A'}
    
    Message:
    {form_data.message}
    """
    msg.attach(MIMEText(email_body, 'plain'))
    
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, msg.as_string())
        server.quit()
        return {"success": True, "message": "Thank you for your message! We'll get back to you soon."}
    except Exception as e:
        print(f"❌ Failed to send contact email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again later.")

# ==================== All Other Endpoints ====================
# (Copying all endpoints from main_mongodb.py: dashboard, stats, tracking, classify, etc.)

# Note: The following endpoints are condensed for brevity but represent the full logic from main_mongodb.py

@app.get("/api/user/stats", response_model=UserStats)
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    db = get_database()
    stats = await db.user_stats.find_one({"user_id": current_user["_id"]})
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")
    # Add dynamic calculations if needed
    stats["level"] = calculate_level(stats.get("total_points", 0))
    return UserStats(**stats)

@app.get("/api/user/dashboard", response_model=DashboardData)
async def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    """Enhanced dashboard with comprehensive stats, insights, and achievements."""
    db = get_database()
    user_id = current_user["_id"]
    
    # Get user stats
    stats_data = await db.user_stats.find_one({"user_id": user_id})
    if not stats_data:
        # Initialize stats if not exists
        stats_data = {
            "user_id": user_id,
            "total_points": 0,
            "carbon_saved": 0.0,
            "items_classified": 0,
            "weekly_goal": 100,
            "weekly_progress": 0.0,
            "level": "Eco Beginner",
            "streak_days": 0,
            "last_activity_date": None,
            "eco_commutes": 0,
            "items_recycled": 0,
            "activities_count": 0,
        }
        await db.user_stats.insert_one(stats_data)
    
    # Calculate level based on points
    total_points = stats_data.get("total_points", 0)
    stats_data["level"] = calculate_level(total_points)
    
    # Get recent activities
    recent_activities_cursor = db.activities.find({"user_id": user_id}).sort("timestamp", -1).limit(10)
    recent_activities = []
    async for doc in recent_activities_cursor:
        doc["_id"] = str(doc["_id"])
        recent_activities.append(Activity(**{
            "user_id": doc["user_id"],
            "activity_type": doc.get("activity_type", "general"),
            "description": doc.get("description", ""),
            "points_earned": doc.get("points_earned", 0),
            "carbon_impact": doc.get("carbon_impact", 0.0),
            "timestamp": doc.get("timestamp", datetime.utcnow()),
        }))
    
    # Get achievements
    unlocked_cursor = db.user_achievements.find({"user_id": user_id})
    unlocked_ids = set()
    async for doc in unlocked_cursor:
        unlocked_ids.add(doc["achievement_id"])
    
    achievements = []
    for ach_id, ach in ACHIEVEMENTS.items():
        is_unlocked = ach_id in unlocked_ids
        achievements.append(Achievement(
            achievement_id=ach_id,
            name=ach["name"],
            description=ach["description"],
            icon=ach["icon"],
            color="green" if is_unlocked else "gray",
            unlocked=is_unlocked,
            unlocked_at=datetime.utcnow() if is_unlocked else None,
        ))
    
    # Get community stats (aggregate from all users)
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    
    # Total carbon saved across all users
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$carbon_saved"}}}
    ]
    agg = db.user_stats.aggregate(pipeline)
    total_carbon = 0.0
    async for doc in agg:
        total_carbon = float(doc.get("total") or 0.0)
    
    # Total items classified
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$items_classified"}}}
    ]
    agg = db.user_stats.aggregate(pipeline)
    total_items = 0
    async for doc in agg:
        total_items = int(doc.get("total") or 0)
    
    # Total activities
    total_activities = await db.activities.count_documents({})
    
    community_stats = CommunityStats(
        total_users=total_users,
        active_users=active_users,
        total_carbon_saved=round(total_carbon, 1),
        total_items_classified=total_items,
        total_activities=total_activities,
    )
    
    user_obj = User(
        id=current_user["_id"],
        email=current_user["email"],
        username=current_user["username"],
        full_name=current_user.get("full_name"),
        created_at=current_user["created_at"]
    )

    return DashboardData(
        user=user_obj,
        stats=UserStats(**stats_data),
        recent_activities=recent_activities,
        achievements=achievements,
        community_stats=community_stats
    )

@app.post("/api/tracking/log")
async def tracking_log(request: Request, current_user: dict = Depends(get_current_user)):
    """Log a tracking activity with smart carbon calculation and points.

    Accepts JSON:
      {
        "activity_type": "transportation" | "energy" | "food" | "waste",
        "sub_type": "car_petrol" | "bus" | "bicycle" | etc.,
        "amount": 10.5,  // km, kWh, kg, etc.
        "unit": "km" | "kWh" | "kg",
        "description": "Drove to work",
        "is_positive": false  // true for eco-friendly actions
      }
    
    OR simple format:
      {
        "activity_type": "general",
        "description": "Recycled bottles",
        "points_earned": 10,
        "carbon_impact": -0.5
      }
    """
    db = get_database()
    user_id = current_user["_id"]

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    activity_type = str(body.get("activity_type") or "general")
    description = str(body.get("description") or body.get("activity") or "")
    
    # Smart calculation mode
    if "sub_type" in body and "amount" in body:
        sub_type = str(body.get("sub_type", ""))
        amount = float(body.get("amount", 0))
        unit = str(body.get("unit", "km"))
        is_positive = bool(body.get("is_positive", False))
        
        # Calculate carbon impact using smart formulas
        carbon_impact = calculate_carbon_impact(activity_type, sub_type, amount, unit)
        points_earned = calculate_points(activity_type, carbon_impact, is_positive)
        
        # Enhance description with details
        if not description:
            description = f"{activity_type.title()}: {amount}{unit} via {sub_type.replace('_', ' ')}"
    else:
        # Manual mode (backward compatible)
        try:
            points_earned = int(body.get("points_earned") or 0)
        except Exception:
            points_earned = 0
        try:
            carbon_impact = float(body.get("carbon_impact") or 0.0)
        except Exception:
            carbon_impact = 0.0

    activity = {
        "user_id": user_id,
        "activity_type": activity_type,
        "description": description,
        "points_earned": points_earned,
        "carbon_impact": carbon_impact,
        "timestamp": datetime.utcnow(),
    }
    
    # Store sub_type and amount for analytics
    if "sub_type" in body:
        activity["sub_type"] = body["sub_type"]
        activity["amount"] = body.get("amount", 0)
        activity["unit"] = body.get("unit", "")
    
    await db.activities.insert_one(activity)

    # Update user stats
    user_stats = await db.user_stats.find_one({"user_id": user_id})
    if not user_stats:
        user_stats = {
            "user_id": user_id,
            "total_points": 0,
            "carbon_saved": 0.0,
            "items_classified": 0,
            "streak_days": 0,
            "last_activity_date": None,
            "eco_commutes": 0,
            "items_recycled": 0,
            "activities_count": 0,
        }
    
    # Update counters
    inc = {"total_points": points_earned, "activities_count": 1}
    
    # Track carbon saved (negative impact means carbon saved)
    if carbon_impact < 0:
        inc["carbon_saved"] = abs(carbon_impact)
    
    # Track items classified from classifier
    if activity_type == "classify_waste":
        inc["items_classified"] = 1
    
    # Track eco-friendly actions
    if activity_type == "transportation" and body.get("sub_type") in ["bicycle", "walk", "bus", "train"]:
        inc["eco_commutes"] = 1
    if activity_type == "waste" and body.get("sub_type") in ["recycled", "composted"]:
        inc["items_recycled"] = 1
    
    # Update streak
    last_activity = user_stats.get("last_activity_date")
    streak_increment = update_streak(last_activity)
    if streak_increment > 0:
        inc["streak_days"] = 1
    else:
        # Streak broken, reset
        await db.user_stats.update_one(
            {"user_id": user_id},
            {"$set": {"streak_days": 1}}
        )
    
    # Calculate weekly progress (toward a goal of reducing carbon)
    # Fetch this week's carbon savings
    now = datetime.utcnow()
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    pipeline = [
        {"$match": {"user_id": user_id, "timestamp": {"$gte": week_start}, "carbon_impact": {"$lt": 0}}},
        {"$group": {"_id": None, "total_saved": {"$sum": "$carbon_impact"}}},
    ]
    agg = db.activities.aggregate(pipeline)
    week_saved = 0.0
    async for doc in agg:
        week_saved = abs(float(doc.get("total_saved") or 0.0))
    
    # Weekly goal: save 5kg CO2e
    weekly_goal = 5.0
    weekly_progress = min(100, (week_saved / weekly_goal) * 100) if weekly_goal > 0 else 0
    
    update_query = {
        "$inc": inc,
        "$set": {
            "last_activity_date": datetime.utcnow(),
            "weekly_progress": round(weekly_progress, 1),
        }
    }
    
    await db.user_stats.update_one({"user_id": user_id}, update_query, upsert=True)
    
    # Check for achievements
    updated_stats = await db.user_stats.find_one({"user_id": user_id})
    unlocked_achievements = []
    
    for ach_id, ach in ACHIEVEMENTS.items():
        # Check if already unlocked
        existing = await db.user_achievements.find_one({"user_id": user_id, "achievement_id": ach_id})
        if existing:
            continue
        
        # Evaluate criteria
        try:
            if eval(ach["criteria"], {}, updated_stats):
                # Unlock achievement
                await db.user_achievements.insert_one({
                    "user_id": user_id,
                    "achievement_id": ach_id,
                    "name": ach["name"],
                    "description": ach["description"],
                    "icon": ach["icon"],
                    "unlocked_at": datetime.utcnow(),
                    "points_awarded": ach["points"],
                })
                # Award points
                await db.user_stats.update_one(
                    {"user_id": user_id},
                    {"$inc": {"total_points": ach["points"]}}
                )
                unlocked_achievements.append(ach)
        except Exception:
            pass  # Skip invalid criteria
    
    return {
        "message": "Activity logged successfully",
        "activity": {
            "description": description,
            "points_earned": points_earned,
            "carbon_impact": carbon_impact,
            "timestamp": activity["timestamp"].isoformat(),
        },
        "stats": {
            "total_points": updated_stats.get("total_points", 0),
            "carbon_saved": updated_stats.get("carbon_saved", 0),
            "streak_days": updated_stats.get("streak_days", 0),
            "weekly_progress": round(weekly_progress, 1),
        },
        "unlocked_achievements": unlocked_achievements,
    }

@app.get("/api/tracking/history")
async def tracking_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.activities.find({"user_id": current_user["_id"]}).sort("timestamp", -1).limit(limit)
    results = []
    async for doc in cursor:
        # Convert MongoDB ObjectId to string for JSON serialization
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return {"activities": results, "count": len(results)}

@app.get("/api/user/classifications")
async def get_recent_classifications(limit: int = 10, current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.activities.find(
        {"user_id": current_user["_id"], "activity_type": "classify_waste"}
    ).sort("timestamp", -1).limit(limit)
    classifications = []
    async for doc in cursor:
        # Convert MongoDB ObjectId to string for JSON serialization
        doc["_id"] = str(doc["_id"])
        classifications.append(doc)
    return {"classifications": classifications, "count": len(classifications)}

# ==================== Goals & Insights Endpoints ====================

@app.get("/api/user/insights")
async def get_user_insights(current_user: dict = Depends(get_current_user)):
    """Get personalized insights based on user's carbon data and activities."""
    db = get_database()
    user_id = current_user["_id"]
    
    # Get user stats
    user_stats = await db.user_stats.find_one({"user_id": user_id})
    if not user_stats:
        return {"insights": []}
    
    # Get recent activities (last 20)
    cursor = db.activities.find({"user_id": user_id}).sort("timestamp", -1).limit(20)
    recent_activities = [doc async for doc in cursor]
    
    insights = generate_insights(user_stats, recent_activities)
    
    return {"insights": insights}

@app.get("/api/user/achievements")
async def get_user_achievements(current_user: dict = Depends(get_current_user)):
    """Get all achievements (unlocked and locked)."""
    db = get_database()
    user_id = current_user["_id"]
    
    # Get unlocked achievements
    cursor = db.user_achievements.find({"user_id": user_id})
    unlocked_ids = set()
    unlocked = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        unlocked_ids.add(doc["achievement_id"])
        unlocked.append(doc)
    
    # Build full achievement list with locked/unlocked status
    all_achievements = []
    for ach_id, ach in ACHIEVEMENTS.items():
        is_unlocked = ach_id in unlocked_ids
        unlocked_doc = next((a for a in unlocked if a["achievement_id"] == ach_id), None)
        
        all_achievements.append({
            "achievement_id": ach_id,
            "name": ach["name"],
            "description": ach["description"],
            "icon": ach["icon"],
            "points": ach["points"],
            "unlocked": is_unlocked,
            "unlocked_at": unlocked_doc["unlocked_at"].isoformat() if unlocked_doc else None,
        })
    
    return {"achievements": all_achievements, "unlocked_count": len(unlocked_ids)}

@app.post("/api/user/goals")
async def set_user_goal(request: Request, current_user: dict = Depends(get_current_user)):
    """Set or update user's carbon reduction goal.
    
    Body: {
      "goal_type": "weekly" | "monthly",
      "target_carbon_kg": 5.0,
      "deadline": "2025-12-31" (optional)
    }
    """
    db = get_database()
    user_id = current_user["_id"]
    
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    
    goal_type = str(body.get("goal_type", "weekly"))
    target_carbon_kg = float(body.get("target_carbon_kg", 5.0))
    deadline_str = body.get("deadline")
    
    deadline = None
    if deadline_str:
        try:
            deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
        except Exception:
            pass
    
    goal = {
        "user_id": user_id,
        "goal_type": goal_type,
        "target_carbon_kg": target_carbon_kg,
        "deadline": deadline,
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    
    # Deactivate old goals of same type
    await db.user_goals.update_many(
        {"user_id": user_id, "goal_type": goal_type},
        {"$set": {"is_active": False}}
    )
    
    # Insert new goal
    result = await db.user_goals.insert_one(goal)
    goal["_id"] = str(result.inserted_id)
    
    return {"message": "Goal set successfully", "goal": goal}

@app.get("/api/user/goals")
async def get_user_goals(current_user: dict = Depends(get_current_user)):
    """Get user's active goals with progress."""
    db = get_database()
    user_id = current_user["_id"]
    
    cursor = db.user_goals.find({"user_id": user_id, "is_active": True})
    goals = []
    
    now = datetime.utcnow()
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        goal_type = doc["goal_type"]
        target = doc["target_carbon_kg"]
        
        # Calculate period start based on goal type
        if goal_type == "weekly":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
        else:  # monthly
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get carbon saved in period
        pipeline = [
            {"$match": {"user_id": user_id, "timestamp": {"$gte": period_start}, "carbon_impact": {"$lt": 0}}},
            {"$group": {"_id": None, "total_saved": {"$sum": "$carbon_impact"}}},
        ]
        agg = db.activities.aggregate(pipeline)
        saved = 0.0
        async for result in agg:
            saved = abs(float(result.get("total_saved") or 0.0))
        
        progress = min(100, (saved / target) * 100) if target > 0 else 0
        
        doc["current_carbon_saved"] = round(saved, 2)
        doc["progress_percent"] = round(progress, 1)
        doc["remaining_carbon_kg"] = max(0, round(target - saved, 2))
        
        goals.append(doc)
    
    return {"goals": goals, "count": len(goals)}

# Carbon Endpoints (mocked data for brevity, should be calculated from activities)
def _month_bounds(dt: datetime) -> tuple[datetime, datetime]:
    start = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end

@app.get("/api/carbon/monthly")
async def get_monthly_carbon(current_user: dict = Depends(get_current_user)):
    """Net carbon impact for the current month (kg CO2e). Negative means savings."""
    db = get_database()
    user_id = current_user["_id"]
    now = datetime.utcnow()
    start, end = _month_bounds(now)
    pipeline = [
        {"$match": {"user_id": user_id, "timestamp": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon_impact"}}},
    ]
    agg = db.activities.aggregate(pipeline)
    total = 0.0
    async for doc in agg:
        total = float(doc.get("total") or 0.0)
    return {"monthly_carbon_kg": total}

@app.get("/api/carbon/transportation")
async def get_transportation_carbon(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["_id"]
    start, end = _month_bounds(datetime.utcnow())
    pipeline = [
        {"$match": {"user_id": user_id, "activity_type": "transportation", "timestamp": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon_impact"}}},
    ]
    agg = db.activities.aggregate(pipeline)
    total = 0.0
    async for doc in agg:
        total = float(doc.get("total") or 0.0)
    return {"transportation_carbon_kg": total}

@app.get("/api/carbon/energy")
async def get_energy_carbon(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["_id"]
    start, end = _month_bounds(datetime.utcnow())
    pipeline = [
        {"$match": {"user_id": user_id, "activity_type": "energy", "timestamp": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon_impact"}}},
    ]
    agg = db.activities.aggregate(pipeline)
    total = 0.0
    async for doc in agg:
        total = float(doc.get("total") or 0.0)
    return {"energy_carbon_kg": total}

@app.get("/api/carbon/food-waste")
async def get_food_waste_carbon(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["_id"]
    start, end = _month_bounds(datetime.utcnow())
    pipeline = [
        {"$match": {"user_id": user_id, "activity_type": {"$in": ["food", "waste"]}, "timestamp": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon_impact"}}},
    ]
    agg = db.activities.aggregate(pipeline)
    total = 0.0
    async for doc in agg:
        total = float(doc.get("total") or 0.0)
    return {"food_waste_carbon_kg": total}

@app.get("/api/carbon/trends")
async def get_carbon_trends(current_user: dict = Depends(get_current_user)):
    """Return last 6 months of net carbon impact per month (kg CO2e)."""
    import calendar
    db = get_database()
    user_id = current_user["_id"]
    now = datetime.utcnow()
    # Build month windows from oldest to newest
    windows = []
    year = now.year
    month = now.month
    for _ in range(6):
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, month + 1, 1)
        windows.append((start, end))
        # move back one month
        if month == 1:
            year -= 1
            month = 12
        else:
            month -= 1
    # Compute totals
    results = []
    for start, end in reversed(windows):
        pipeline = [
            {"$match": {"user_id": user_id, "timestamp": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": None, "total": {"$sum": "$carbon_impact"}}},
        ]
        agg = db.activities.aggregate(pipeline)
        total = 0.0
        async for doc in agg:
            total = float(doc.get("total") or 0.0)
        label = f"{calendar.month_abbr[start.month]} {start.year}"
        results.append({"month": label, "carbon_kg": total})
    return {"trends": results}

# ... and so on for all other endpoints from main_mongodb.py
