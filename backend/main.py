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
from app.routers.chat import router as chat_router
from app.routers.waste_classification import router as waste_classification_router
from app.routers.debug_genai import router as debug_genai_router
from app.routers.debug_genai_signature import router as debug_genai_signature_router
from app.routers.debug_genai_signatures_full import router as debug_genai_signatures_full_router

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

# default_origins = (
#     "http://localhost,"
#     "http://localhost:3000,"
#     "http://localhost:3001,"
#     "http://localhost:8000,"
#     "http://127.0.0.1,"
#     "http://127.0.0.1:3000,"
#     "http://127.0.0.1:3001,"
#     "http://127.0.0.1:8000",
#     "https://eco-track-ai.vercel.app",
#     "https://www.eco-track-ai.vercel.app"
# )
# FRONTEND_ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", default_origins).split(",") if o.strip()]
default_origins = "http://localhost,http://localhost:3000,http://localhost:3001,http://localhost:8000,http://127.0.0.1,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:8000,https://eco-track-ai.vercel.app,https://www.eco-track-ai.vercel.app,https://rebrand-eco-track-ai-greenwise-0nebnq.vercel.app"
FRONTEND_ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", default_origins).split(",") if o.strip()]
app = FastAPI(
    title="EcoTrack API (Consolidated)",
    description="Unified Backend API for EcoTrack - Environmental Tracking Application",
    version="3.0.0"
)
app.include_router(debug_genai_router)
app.include_router(debug_genai_signature_router)
app.include_router(debug_genai_signatures_full_router)
# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
        mongodb_client = AsyncIOMotorClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        await mongodb_client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        db = mongodb_client[DATABASE_NAME]
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.activities.create_index([("user_id", 1), ("timestamp", -1)])
        await db.activities.create_index([("user_id", 1), ("activity_type", 1), ("timestamp", -1)])
        print("✅ Indexes created (users, activities).")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
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

CARBON_FACTORS = {
    "car_petrol": 0.192,
    "car_diesel": 0.171,
    "car_electric": 0.053,
    "bus": 0.089,
    "train": 0.041,
    "flight_short": 0.255,
    "flight_long": 0.195,
    "motorcycle": 0.113,
    "bicycle": 0.0,
    "walk": 0.0,
    "electricity_grid": 0.233,
    "electricity_renewable": 0.0,
    "gas_heating": 0.185,
    "beef": 27.0,
    "lamb": 39.2,
    "pork": 12.1,
    "chicken": 6.9,
    "fish": 5.1,
    "cheese": 13.5,
    "milk": 1.9,
    "eggs": 4.8,
    "vegetables": 2.0,
    "fruits": 1.1,
    "grains": 2.5,
    "general_waste": 0.45,
    "recycled": -0.15,
    "composted": -0.10,
    "e_waste": 0.85,
}

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
        "icon": "��️",
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
        return round(factor * amount, 3)
    return 0.0

def calculate_points(activity_type: str, carbon_impact: float, is_positive_action: bool = False) -> int:
    base_points = abs(int(carbon_impact * 10))
    if is_positive_action or carbon_impact < 0:
        return max(base_points * 2, 5)
    return max(base_points, 2)

def update_streak(last_activity_date: datetime | None) -> int:
    if not last_activity_date:
        return 1
    now = datetime.utcnow()
    diff = now - last_activity_date
    if diff.total_seconds() <= 86400:
        return 1
    return 0

def generate_insights(user_stats: dict, recent_activities: list) -> list:
    insights = []
    carbon_saved = user_stats.get("carbon_saved", 0)
    if carbon_saved > 0:
        trees = round(carbon_saved / 21, 1)
        insights.append({
            "type": "success",
            "title": "Carbon Savings",
            "message": f"You've saved {carbon_saved:.1f}kg CO2e! That's like planting {trees} trees! 🌳",
            "icon": "💚"
        })
    streak = user_stats.get("streak_days", 0)
    if streak >= 7:
        insights.append({
            "type": "success",
            "title": f"{streak}-Day Streak!",
            "message": "Consistency is key! Keep tracking to stay accountable.",
            "icon": "🔥"
        })
    if recent_activities:
        transport_count = sum(1 for a in recent_activities if a.get("activity_type") == "transportation")
        if transport_count > 5:
            insights.append({
                "type": "tip",
                "title": "Transportation Tip",
                "message": "Consider carpooling, public transit, or biking for short trips to reduce emissions.",
                "icon": "🚲"
            })
    level = user_stats.get("level", "Eco Beginner")
    total_points = user_stats.get("total_points", 0)
    if level == "Eco Beginner" and total_points > 50:
        insights.append({
            "type": "info",
            "title": "Level Up Soon!",
            "message": f"You're {100 - total_points} points away from Eco Explorer!",
            "icon": "⬆️"
        })
    weekly_progress = user_stats.get("weekly_progress", 0)
    if weekly_progress >= 80:
        insights.append({
            "type": "success",
            "title": "Goal Almost Reached!",
            "message": f"You're at {weekly_progress:.0f}% of your weekly goal. Keep going!",
            "icon": "🎯"
        })
    return insights[:4]

# ==================== Helper Functions ====================

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
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
    return {"message": "CORS is working!", "timestamp": datetime.utcnow().isoformat()}

@app.post("/internal/classify")
async def internal_classify(req: Request):
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
app.include_router(chat_router, prefix="/api")
app.include_router(waste_classification_router, prefix="/api")

@app.post("/api/waste-classify")
async def api_waste_classify(request: Request, file: UploadFile | None = File(default=None)):
    try:
        image_url: str | None = None
        prompt: str | None = None

        content_type = (request.headers.get("content-type") or request.headers.get("Content-Type") or "").lower()
        is_multipart = "multipart/form-data" in content_type
        if is_multipart or file is not None:
            upload: UploadFile | None = file
            if upload is None:
                form = await request.form()
                maybe = form.get("file")
                upload = maybe if isinstance(maybe, UploadFile) else None
            if not upload:
                raise HTTPException(status_code=400, detail="No file provided")

            data = await upload.read()
            mime = upload.content_type or "image/jpeg"
            try:
                image_url = upload_to_cloudinary(data, upload.filename or "upload.jpg", mime=mime)
            except Exception:
                b64 = __import__("base64").b64encode(data).decode("ascii")
                image_url = f"data:{mime};base64,{b64}"
        else:
            try:
                body = await request.json()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid JSON body")
            image_url = body.get("image")
            prompt = body.get("prompt")

        if not image_url:
            raise HTTPException(status_code=400, detail="No image provided")

        parsed, raw, tokens = classify_image_with_perplexity(image_url, prompt_extra=prompt)

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
        if not isinstance(confidence, (int, float)):
            confidence = 0.0
        confidence = max(0.0, min(100.0, round(float(confidence), 1)))

        is_waste = True
        if category.lower() == "not waste":
            is_waste = False

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
        carbon_impact = carbon_map.get(key, 0.0)
        if isinstance(recyclability, str) and "compost" in recyclability.lower():
            carbon_impact = max(0.02, carbon_impact * 0.7)
        elif isinstance(recyclability, str) and "recyclable" in recyclability.lower():
            carbon_impact = max(0.03, carbon_impact * 0.8)
        carbon_source = "heuristic"

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
        if confidence > 50:
            points = int(points * (0.5 + (confidence / 200.0)))

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
        verified = {"is_waste": is_waste, "confidence": confidence}
        return {"result": result, "raw": raw, "model": "perplexity", "verified": verified}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "Unauthorized" in error_msg or "Authorization" in error_msg:
            raise HTTPException(
                status_code=401,
                detail="Perplexity API key is invalid or expired. Please update PERPLEXITY_API_KEY in your .env file. Get a new key from https://www.perplexity.ai/settings/api"
            )
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/waste-classify-mock")
async def api_waste_classify_mock(request: Request, file: UploadFile | None = File(default=None)):
    import random
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
    return {"result": result, "raw": f"Mock classification: {result['item']}", "model": "mock"}

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

@app.get("/api/user/stats", response_model=UserStats)
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    db = get_database()
    stats = await db.user_stats.find_one({"user_id": current_user["_id"]})
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")
    stats["level"] = calculate_level(stats.get("total_points", 0))
    return UserStats(**stats)

@app.get("/api/user/dashboard", response_model=DashboardData)
async def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["_id"]
    stats_data = await db.user_stats.find_one({"user_id": user_id})
    if not stats_data:
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
    total_points = stats_data.get("total_points", 0)
    stats_data["level"] = calculate_level(total_points)

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

    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$carbon_saved"}}}]
    agg = db.user_stats.aggregate(pipeline)
    total_carbon = 0.0
    async for doc in agg:
        total_carbon = float(doc.get("total") or 0.0)

    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$items_classified"}}}]
    agg = db.user_stats.aggregate(pipeline)
    total_items = 0
    async for doc in agg:
        total_items = int(doc.get("total") or 0)

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
    db = get_database()
    user_id = current_user["_id"]
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    activity_type = str(body.get("activity_type") or "general")
    description = str(body.get("description") or body.get("activity") or "")

    if "sub_type" in body and "amount" in body:
        sub_type = str(body.get("sub_type", ""))
        amount = float(body.get("amount", 0))
        unit = str(body.get("unit", "km"))
        is_positive = bool(body.get("is_positive", False))
        carbon_impact = calculate_carbon_impact(activity_type, sub_type, amount, unit)
        points_earned = calculate_points(activity_type, carbon_impact, is_positive)
        if not description:
            description = f"{activity_type.title()}: {amount}{unit} via {sub_type.replace('_', ' ')}"
    else:
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

    if "sub_type" in body:
        activity["sub_type"] = body["sub_type"]
        activity["amount"] = body.get("amount", 0)
        activity["unit"] = body.get("unit", "")

    await db.activities.insert_one(activity)

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

    inc = {"total_points": points_earned, "activities_count": 1}
    if carbon_impact < 0:
        inc["carbon_saved"] = abs(carbon_impact)
    if activity_type == "classify_waste":
        inc["items_classified"] = 1
    if activity_type == "transportation" and body.get("sub_type") in ["bicycle", "walk", "bus", "train"]:
        inc["eco_commutes"] = 1
    if activity_type == "waste" and body.get("sub_type") in ["recycled", "composted"]:
        inc["items_recycled"] = 1

    last_activity = user_stats.get("last_activity_date")
    streak_increment = update_streak(last_activity)
    if streak_increment > 0:
        inc["streak_days"] = 1
    else:
        await db.user_stats.update_one(
            {"user_id": user_id},
            {"$set": {"streak_days": 1}}
        )

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

    updated_stats = await db.user_stats.find_one({"user_id": user_id})
    unlocked_achievements = []
    for ach_id, ach in ACHIEVEMENTS.items():
        existing = await db.user_achievements.find_one({"user_id": user_id, "achievement_id": ach_id})
        if existing:
            continue
        try:
            if eval(ach["criteria"], {}, updated_stats):
                await db.user_achievements.insert_one({
                    "user_id": user_id,
                    "achievement_id": ach_id,
                    "name": ach["name"],
                    "description": ach["description"],
                    "icon": ach["icon"],
                    "unlocked_at": datetime.utcnow(),
                    "points_awarded": ach["points"],
                })
                await db.user_stats.update_one(
                    {"user_id": user_id},
                    {"$inc": {"total_points": ach["points"]}}
                )
                unlocked_achievements.append(ach)
        except Exception:
            pass

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
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return {"activities": results, "count": len(results)}

@app.get("/api/user/classifications")
async def get_recent_classifications(limit: int = 10, current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.activities.find({"user_id": current_user["_id"], "activity_type": "classify_waste"}).sort("timestamp", -1).limit(limit)
    classifications = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        classifications.append(doc)
    return {"classifications": classifications, "count": len(classifications)}

@app.get("/api/user/insights")
async def get_user_insights(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["_id"]
    user_stats = await db.user_stats.find_one({"user_id": user_id})
    if not user_stats:
        return {"insights": []}
    cursor = db.activities.find({"user_id": user_id}).sort("timestamp", -1).limit(20)
    recent_activities = [doc async for doc in cursor]
    insights = generate_insights(user_stats, recent_activities)
    return {"insights": insights}

@app.get("/api/user/achievements")
async def get_user_achievements(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["_id"]
    cursor = db.user_achievements.find({"user_id": user_id})
    unlocked_ids = set()
    unlocked = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        unlocked_ids.add(doc["achievement_id"])
        unlocked.append(doc)

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

    await db.user_goals.update_many(
        {"user_id": user_id, "goal_type": goal_type},
        {"$set": {"is_active": False}}
    )

    result = await db.user_goals.insert_one(goal)
    goal["_id"] = str(result.inserted_id)
    return {"message": "Goal set successfully", "goal": goal}

@app.get("/api/user/goals")
async def get_user_goals(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["_id"]
    cursor = db.user_goals.find({"user_id": user_id, "is_active": True})
    goals = []
    now = datetime.utcnow()

    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        goal_type = doc["goal_type"]
        target = doc["target_carbon_kg"]
        if goal_type == "weekly":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

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

def _month_bounds(dt: datetime) -> tuple[datetime, datetime]:
    start = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end

@app.get("/api/carbon/monthly")
async def get_monthly_carbon(current_user: dict = Depends(get_current_user)):
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
    import calendar
    db = get_database()
    user_id = current_user["_id"]
    now = datetime.utcnow()
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
        if month == 1:
            year -= 1
            month = 12
        else:
            month -= 1
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
