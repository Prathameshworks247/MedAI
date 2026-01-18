from fastapi import APIRouter, Depends
from typing import Optional


from src.middlewares.auth import check_doctor_exists
from src.db import user_collection

router = APIRouter()

@router.get("/")
async def get_patients(
    filter: Optional[str] = None,
    _ = Depends(check_doctor_exists)
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

@router.get("/{patient_id}")
async def get_patient(patient_id: str, _ = Depends(check_doctor_exists)):
    from bson import ObjectId
    from fastapi import HTTPException
    
    try:
        try:
            query = {"_id": ObjectId(patient_id), "role": "patient"}
        except:
             query = {"_id": patient_id, "role": "patient"}
             
        user = await user_collection.find_one(query)
        if not user:
             raise HTTPException(status_code=404, detail="Patient not found")
        
        user["_id"] = str(user["_id"])
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))