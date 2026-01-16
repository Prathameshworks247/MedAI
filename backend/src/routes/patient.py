from fastapi import APIRouter, Depends
from typing import Optional


from src.middlewares.auth import check_doctor_exists
from src.db import user_collection

router = APIRouter()

@router.get("/")
async def get_patients(
    filter: Optional[str] = None,
    doctor = Depends(check_doctor_exists)
):
    query: dict = {"role": "patient"}
    if filter:
        query["$text"] = {"$search": filter}
        cursor = user_collection.find(
            query,
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(10)
    else:
        cursor = user_collection.find(query).limit(10)

    results = await cursor.to_list(length=10)
    
    # Convert ObjectId to string
    for user in results:
        if "_id" in user:
            user["_id"] = str(user["_id"])
            
    return results