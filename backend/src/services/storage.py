

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

async def store_time_series(patient_id: str, time_series_observations: list):
    """
    Store time series observations in the new PatientMetrics structure.
    
    Args:
        patient_id: Patient MongoDB ID
        time_series_observations: List of TimeSeriesMetric objects with metric, value, unit, timestamp, is_anamoly
    """
    from bson import ObjectId
    from datetime import datetime
    
    try:
        patient_object_id = ObjectId(patient_id) if isinstance(patient_id, str) and len(patient_id) == 24 else patient_id
    except:
        patient_object_id = patient_id
    
    # Get existing patient to preserve existing time series data
    existing_patient = await db.user_collection.find_one({"_id": patient_object_id})
    existing_time_series = existing_patient.get("time_series", {}) if existing_patient else {}
    existing_metrics = existing_time_series.get("metrics", {}) if isinstance(existing_time_series, dict) else {}
    
    # Allowed metric names matching PatientMetrics model
    allowed_metrics = [
        "blood_pressure", "heart_rate", "temperature", "glucose",
        "cholesterol", "hemoglobin", "wbc", "rbc", "platelets"
    ]
    
    # Process each observation
    for obs in time_series_observations:
        if isinstance(obs, dict):
            metric_name = obs.get("metric", "").lower()
            
            # Skip if metric name is not in allowed list
            if metric_name not in allowed_metrics:
                continue
            
            # Parse timestamp
            try:
                timestamp = datetime.fromisoformat(obs["timestamp"]) if isinstance(obs.get("timestamp"), str) else datetime.now()
            except:
                timestamp = datetime.now()
            
            # Create MetricValue
            metric_value = {
                "value": obs.get("value", 0.0),
                "is_anamoly": obs.get("is_anamoly", False)
            }
            
            # Initialize metric time series if it doesn't exist
            if metric_name not in existing_metrics:
                existing_metrics[metric_name] = {}
            
            # Add or update the value at this timestamp (use ISO string as key)
            timestamp_key = timestamp.isoformat()
            existing_metrics[metric_name][timestamp_key] = metric_value
    
    # Update patient with new time series structure
    updated_time_series = {"metrics": existing_metrics}
    await db.user_collection.update_one(
        {"_id": patient_object_id},
        {"$set": {"time_series": updated_time_series, "updated_at": datetime.now()}}
    )