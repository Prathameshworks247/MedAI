from typing import Annotated
from fastapi import Depends, HTTPException, status
import jwt
from jwt.exceptions import InvalidTokenError
from bson import ObjectId

from src.db import user_collection
from src.config import SECRET_KEY, ALGORITHM, oauth2_scheme

async def get_user_by_id(user_id: str):
    try:
        user = await user_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
        return user
    except Exception:
        return None

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM or "HS256"])
        user_id = payload.get("user_id")
        user_type = payload.get("user_type")
        print(user_id, user_type)
        if user_id is None or user_type is None:
            print("User ID or user type is None")
            raise credentials_exception
    except InvalidTokenError:
        print("Invalid token")
        raise credentials_exception
    user = await get_user_by_id(user_id)
    if user is None:
        print("User not found")
        raise credentials_exception
    return user