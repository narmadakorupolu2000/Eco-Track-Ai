from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.models.schemas import UserCreate, User, Token, UserUpdate
from app.auth import verify_password, get_password_hash, create_access_token, verify_token
from app.database import get_database
from datetime import datetime, timedelta
from typing import Optional
import pymongo

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current authenticated user"""
    email = verify_token(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    db = get_database()
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Convert MongoDB _id to id for Pydantic model
    user["id"] = str(user["_id"])
    del user["_id"]
    
    return User(**user)

@router.post("/register", response_model=User)
async def register(user: UserCreate):
    """Register a new user"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_dict = {
        **user.dict(exclude={"password"}),
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    return User(**user_dict)

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get access token"""
    db = get_database()
    
    # Find user by email or username
    user = await db.users.find_one({"$or": [{"email": form_data.username}, {"username": form_data.username}]})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user profile"""
    db = get_database()
    
    update_data = {}
    for field, value in user_update.dict(exclude_unset=True).items():
        if field == "password" and value:
            update_data["hashed_password"] = get_password_hash(value)
        elif value is not None:
            update_data[field] = value
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one({"email": current_user.email}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"email": current_user.email})
    return User(**updated_user)