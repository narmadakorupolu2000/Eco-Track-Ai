from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str  # Changed from EmailStr to str
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None  # Changed from EmailStr to str
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class User(UserBase):
    id: str
    is_active: bool = True
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Tracking Models
class TrackingEntry(BaseModel):
    user_id: str
    activity_type: str  # "recycling", "energy_consumption", "transportation", etc.
    amount: float
    unit: str
    carbon_impact: Optional[float] = None
    description: Optional[str] = None
    date: datetime = datetime.utcnow()

class TrackingEntryCreate(BaseModel):
    activity_type: str
    amount: float
    unit: str
    description: Optional[str] = None

class TrackingEntryInDB(TrackingEntry):
    id: str
    created_at: datetime

# Waste Classification Models
class WasteClassification(BaseModel):
    user_id: str
    image_url: str
    classification: str
    confidence: float
    recommendations: Optional[str] = None
    date: datetime = datetime.utcnow()

class WasteClassificationCreate(BaseModel):
    image_url: str

class WasteClassificationInDB(WasteClassification):
    id: str
    created_at: datetime