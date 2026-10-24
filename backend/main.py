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
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
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
# Also include deployed frontend hosts used by the app.
default_origins = ",".join([
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8000",
    "https://eco-track-ai.vercel.app",
    "https://www.eco-track-ai.vercel.app",
    "https://eco-track-ai.onrender.com",
    "https://www.eco-track-ai.onrender.com",
    "https://eco-track-ai.netlify.app",
    "https://www.eco-track-ai.netlify.app",
    "https://rebrand-eco-track-ai-oneqneg.netlify.app",
    "https://www.rebrand-eco-track-ai-oneqneg.netlify.app",
    "https://greenwise-ai.netlify.app",
    "https://www.greenwise-ai.netlify.app",
])
FRONTEND_ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", default_origins).split(",") if o.strip()]
app = FastAPI(
    title="EcoTrack API (Consolidated)",
    description="Unified Backend API for EcoTrack - Environmental Tracking Application",
    version="3.0.0"
)
app.include_router(auth_router, prefix="/api/auth")
app.include_router(users_router, prefix="/api/user")
app.include_router(debug_genai_router)
app.include_router(debug_genai_signature_router)
app.include_router(debug_genai_signatures_full_router)
# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://rebrand-eco-track-ai-oneqneg.netlify.app",
        "https://www.rebrand-eco-track-ai-oneqneg.netlify.app",
        "https://greenwise-ai.netlify.app",
        "https://www.greenwise-ai.netlify.app",
        "https://eco-track-ai.onrender.com",
        "https://eco-track-ai.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- Security ---
security = HTTPBearer()
