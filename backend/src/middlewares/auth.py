from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import InvalidTokenError
from bson import ObjectId

from src.db import user_collection
from src.config import SECRET_KEY, ALGORITHM, http_bearer

async def get_user_by_id(user_id: str):
    try:
        user = await user_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
        return user
    except Exception:
        return None

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    token = credentials.credentials
    
    try:
        if not SECRET_KEY:
            raise credentials_exception
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM or "HS256"])
        user_id = payload.get("user_id")
        user_type = payload.get("user_type")
        print(f"Authenticating user: {user_id}, type: {user_type}")
        if user_id is None or user_type is None:
            print("User ID or user type is None")
            raise credentials_exception
    except InvalidTokenError as e:
        print(f"Invalid token: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"Token validation error: {e}")
        raise credentials_exception
    
    user = await get_user_by_id(user_id)
    if user is None:
        print("User not found")
        raise credentials_exception
    return user

async def check_doctor_exists(credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    token = credentials.credentials
    
    try:
        if not SECRET_KEY:
            raise credentials_exception
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM or "HS256"])
        user_id = payload.get("user_id")
        user_type = payload.get("user_type")
        print(f"Authenticating user: {user_id}, type: {user_type}")
        if user_id is None or user_type is None:
            print("User ID or user type is None")
            raise credentials_exception
    except InvalidTokenError as e:
        print(f"Invalid token: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"Token validation error: {e}")
        raise credentials_exception
    
    user = await get_user_by_id(user_id)
    if user is None:
        print("User not found")
        raise credentials_exception
    
    if user.get("role") != "doctor":
        print(f"User is not a doctor, role: {user.get('role')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Doctor role required."
        )
    
    return user