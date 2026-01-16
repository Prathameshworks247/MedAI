from datetime import datetime, timedelta, timezone
from typing import Literal
import jwt
from fastapi import Depends, HTTPException, status, APIRouter
from pydantic import BaseModel
from bson import ObjectId

from src.db import user_collection
from src.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, password_hash
from src.models.user import PatientCreate, DoctorCreate
from src.middlewares.auth import get_current_user

class Login(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: str | None = None
    user_type: Literal["patient", "doctor"] = "patient"


router = APIRouter()


# usable helper functions

def verify_password(plain_password: str, hashed_password: str):
    return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return password_hash.hash(password)

async def get_user_by_email(email: str):
    user = await user_collection.find_one({"email": email})
    return user

async def create_user(user: PatientCreate | DoctorCreate):
    user_copy = user.model_dump()
    user_copy["hashed_password"] = get_password_hash(user_copy["password"])
    user_copy.pop("password")
    new_user = await user_collection.insert_one(user_copy)
    return new_user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY is not set. Please set it in your .env file.")
    if not ALGORITHM:
        raise ValueError("ALGORITHM is not set. Please set it in your .env file.")
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# routes

@router.post("/login")
async def login(
    data: Login,
) -> Token:
    user = await get_user_by_email(data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User with this email does not exist, please signup first",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(data.password, user.get("hashed_password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires=timedelta(
        minutes=float(
            ACCESS_TOKEN_EXPIRE_MINUTES
            if ACCESS_TOKEN_EXPIRE_MINUTES is not None
            else 10000
        )
    )   
    access_token = create_access_token(
        data={"user_id": str(user["_id"]), "user_type": user.get("role")}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/signup/patient")
async def patient_signup(
    data: PatientCreate,
) -> Token:
    user = await get_user_by_email(data.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User with this email already exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    new_patient = await create_user(data)
    access_token_expires=timedelta(
        minutes=float(
            ACCESS_TOKEN_EXPIRE_MINUTES
            if ACCESS_TOKEN_EXPIRE_MINUTES is not None
            else 10000
        )
    )
    access_token = create_access_token(
        data={"user_id": str(new_patient.inserted_id), "user_type": "patient"}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/signup/doctor")
async def doctor_signup(
    data: DoctorCreate,
) -> Token:
    user = await get_user_by_email(data.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User with this email already exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    new_doctor = await create_user(data)
    access_token_expires=timedelta(
        minutes=float(
            ACCESS_TOKEN_EXPIRE_MINUTES
            if ACCESS_TOKEN_EXPIRE_MINUTES is not None
            else 10000
        )
    )
    access_token = create_access_token(
        data={"user_id": str(new_doctor.inserted_id), "user_type": "doctor"}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me")
async def read_users_me(
    user=Depends(get_current_user)
):
    # Convert MongoDB document to JSON-serializable dict
    # Handle ObjectId and other MongoDB-specific types
    if isinstance(user, dict):
        user_dict = dict(user)
    else:
        # If it's a MongoDB document object, convert to dict
        user_dict = dict(user) if hasattr(user, 'items') else {}
    
    # Convert ObjectId to string for JSON serialization
    if "_id" in user_dict and isinstance(user_dict["_id"], ObjectId):
        user_dict["_id"] = str(user_dict["_id"])
    
    # Filter out sensitive fields
    user_dict.pop("hashed_password", None)
    user_dict.pop("password", None)
    
    return user_dict