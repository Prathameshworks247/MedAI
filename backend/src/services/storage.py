

import src.db as db
from datetime import datetime
async def update_appointment(appointment_id: str, updates: dict):
    await db.appointment_collection.update_one(
        {"_id": appointment_id},
        {"$set": updates}
    )

async def update_patient(patient_id: str, updates: dict):
    await db.user_collection.update_one(
        {"_id": patient_id},
        {
            "$addToSet": updates,
            "$set": {"updated_at": datetime.now()}
        }
    )
    
async def store_reports(appointment_id: str, report: dict):
    await db.appointment_collection.update_one(
        {"_id": appointment_id},
        {"$push": {"reports": report}}
    )

async def store_tests(appointment_id: str, test: dict):
    await db.appointment_collection.update_one(
        {"_id": appointment_id},
        {"$push": {"tests": test}}
    )

async def store_time_series(patient_id: str, time_series: dict):
    await db.user_collection.update_one(
        {"_id": patient_id},/
        {"$addToSet": {"time_series": time_series}}
    )