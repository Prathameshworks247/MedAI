"""
Context Retrieval Service for Doctor Chatbot
Fetches relevant data from MongoDB based on intent classification
"""

from typing import Dict, List, Any, Optional
from bson import ObjectId
from datetime import datetime
import json

from src.db import appointment_collection, user_collection


async def verify_doctor_patient_access(doctor_id: str, patient_id: str, appointment_id: Optional[str] = None) -> bool:
    """
    Verify that the doctor has access to this patient's data.
    Checks if doctor has any appointments with the patient.
    If appointment_id is provided, also verifies the doctor owns that appointment.
    """
    try:
        # First, try to verify using the specific appointment if provided
        if appointment_id:
            appointment = await get_appointment_context(appointment_id)
            if appointment:
                # Check if this appointment belongs to the doctor and patient
                apt_doctor_id = str(appointment.get("doctor_id", ""))
                apt_patient_id = str(appointment.get("patient_id", ""))
                
                # Normalize IDs for comparison (handle ObjectId strings)
                doctor_id_normalized = str(doctor_id).strip()
                patient_id_normalized = str(patient_id).strip()
                
                if apt_doctor_id == doctor_id_normalized and apt_patient_id == patient_id_normalized:
                    print(f"✅ Access verified via appointment {appointment_id}")
                    return True
                else:
                    print(f"⚠️  Appointment {appointment_id} doctor_id: {apt_doctor_id} (expected: {doctor_id_normalized}), patient_id: {apt_patient_id} (expected: {patient_id_normalized})")
        
        # Fallback: Check if doctor has ANY appointment with this patient
        # Try both string and ObjectId formats
        try:
            # Try with string IDs
            appointment = await appointment_collection.find_one({
                "doctor_id": doctor_id,
                "patient_id": patient_id
            })
            if appointment:
                print(f"✅ Access verified: Found appointment with string IDs")
                return True
        except Exception as e:
            print(f"⚠️  String ID lookup failed: {e}")
        
        # Try with ObjectId format
        try:
            doctor_object_id = ObjectId(doctor_id) if isinstance(doctor_id, str) and len(doctor_id) == 24 else doctor_id
            patient_object_id = ObjectId(patient_id) if isinstance(patient_id, str) and len(patient_id) == 24 else patient_id
            
            appointment = await appointment_collection.find_one({
                "doctor_id": doctor_object_id,
                "patient_id": patient_object_id
            })
            if appointment:
                print(f"✅ Access verified: Found appointment with ObjectId format")
                return True
        except Exception as e:
            print(f"⚠️  ObjectId lookup failed: {e}")
        
        # Try flexible matching (doctor_id or patient_id as string, the other as ObjectId)
        try:
            # Try doctor_id as string, patient_id as ObjectId
            patient_object_id = ObjectId(patient_id) if isinstance(patient_id, str) and len(patient_id) == 24 else patient_id
            appointment = await appointment_collection.find_one({
                "doctor_id": doctor_id,
                "patient_id": patient_object_id
            })
            if appointment:
                print(f"✅ Access verified: Found appointment (mixed format 1)")
                return True
        except:
            pass
        
        try:
            # Try doctor_id as ObjectId, patient_id as string
            doctor_object_id = ObjectId(doctor_id) if isinstance(doctor_id, str) and len(doctor_id) == 24 else doctor_id
            appointment = await appointment_collection.find_one({
                "doctor_id": doctor_object_id,
                "patient_id": patient_id
            })
            if appointment:
                print(f"✅ Access verified: Found appointment (mixed format 2)")
                return True
        except:
            pass
        
        print(f"❌ No appointment found for doctor_id={doctor_id}, patient_id={patient_id}")
        return False
        
    except Exception as e:
        print(f"Error verifying doctor-patient access: {e}")
        import traceback
        traceback.print_exc()
        return False


async def get_appointment_context(appointment_id: str) -> Dict[str, Any]:
    """Fetch appointment data including discussion, tests, reports, diagnosis"""
    try:
        # Try ObjectId first (for old format)
        try:
            appointment_object_id = ObjectId(appointment_id)
            appointment = await appointment_collection.find_one({"_id": appointment_object_id})
        except:
            # If not ObjectId, try string ID (for new format like "34524-3")
            appointment = await appointment_collection.find_one({"_id": appointment_id})
        
        if not appointment:
            return {}
        
        # Convert ObjectId to string for JSON serialization
        appointment["_id"] = str(appointment["_id"])
        if "patient_id" in appointment:
            appointment["patient_id"] = str(appointment["patient_id"])
        if "doctor_id" in appointment:
            appointment["doctor_id"] = str(appointment["doctor_id"])
        
        # Convert datetime objects to ISO strings
        for key in ["appointment_date", "start_time", "end_time", "created_at", "updated_at"]:
            if key in appointment and isinstance(appointment[key], datetime):
                appointment[key] = appointment[key].isoformat()
        
        return appointment
    except Exception as e:
        print(f"Error fetching appointment context: {e}")
        return {}


async def get_appointment_sequence(appointment_id: str) -> List[Dict[str, Any]]:
    """
    Fetch current appointment and previous appointments in sequence.
    For appointment ID like "34524-3", fetches: 34524-3, 34524-2, 34524-1, 34524-0
    """
    try:
        # Parse appointment ID to extract base_id and sequence number
        if "-" in appointment_id:
            parts = appointment_id.split("-")
            base_id = "-".join(parts[:-1])  # Everything except last part
            try:
                current_seq = int(parts[-1])
            except ValueError:
                # If last part is not a number, just return current appointment
                appointment = await get_appointment_context(appointment_id)
                return [appointment] if appointment else []
        else:
            # If no dash, just return current appointment
            appointment = await get_appointment_context(appointment_id)
            return [appointment] if appointment else []
        
        # Fetch current and previous appointments (current, -1, -2, -0)
        appointments = []
        sequences_to_fetch = [current_seq, current_seq - 1, current_seq - 2, 0]
        
        for seq in sequences_to_fetch:
            if seq < 0:
                continue  # Skip negative sequences
            
            seq_appointment_id = f"{base_id}-{seq}"
            appointment = await get_appointment_context(seq_appointment_id)
            if appointment:
                appointments.append(appointment)
        
        # Sort by sequence number (ascending: 0, 1, 2, 3)
        appointments.sort(key=lambda x: int(str(x["_id"]).split("-")[-1]) if "-" in str(x["_id"]) else 0)
        
        return appointments
    except Exception as e:
        print(f"Error fetching appointment sequence: {e}")
        import traceback
        traceback.print_exc()
        # Fallback: return just the current appointment
        appointment = await get_appointment_context(appointment_id)
        return [appointment] if appointment else []


async def get_patient_context(patient_id: str) -> Dict[str, Any]:
    """Fetch patient profile data including medical history"""
    try:
        patient_object_id = ObjectId(patient_id) if isinstance(patient_id, str) else patient_id
        patient = await user_collection.find_one({"_id": patient_object_id})
        
        if not patient:
            return {}
        
        # Convert ObjectId to string
        patient["_id"] = str(patient["_id"])
        
        # Convert datetime objects to ISO strings
        for key in ["date_of_birth", "created_at", "updated_at"]:
            if key in patient and isinstance(patient[key], datetime):
                patient[key] = patient[key].isoformat()
        
        # Remove sensitive fields
        patient.pop("hashed_password", None)
        patient.pop("password", None)
        
        return patient
    except Exception as e:
        print(f"Error fetching patient context: {e}")
        return {}


async def get_time_series_context(patient_id: str, metric: Optional[str] = None) -> Dict[str, Any]:
    """Fetch time-series data for a patient, optionally filtered by metric"""
    try:
        patient_object_id = ObjectId(patient_id) if isinstance(patient_id, str) else patient_id
        patient = await user_collection.find_one({"_id": patient_object_id})
        
        if not patient:
            return {}
        
        time_series = patient.get("time_series", {})
        metrics = time_series.get("metrics", {})
        
        if metric:
            # Return only the specified metric
            return {metric: metrics.get(metric, {})}
        else:
            # Return all metrics
            return metrics
    except Exception as e:
        print(f"Error fetching time-series context: {e}")
        return {}


async def get_all_appointments_for_patient(patient_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch recent appointments for a patient"""
    try:
        appointments = await appointment_collection.find(
            {"patient_id": patient_id}
        ).sort("appointment_date", -1).limit(limit).to_list(length=limit)
        
        # Convert ObjectIds and datetimes
        for apt in appointments:
            apt["_id"] = str(apt["_id"])
            if "patient_id" in apt:
                apt["patient_id"] = str(apt["patient_id"])
            if "doctor_id" in apt:
                apt["doctor_id"] = str(apt["doctor_id"])
            
            for key in ["appointment_date", "start_time", "end_time", "created_at", "updated_at"]:
                if key in apt and isinstance(apt[key], datetime):
                    apt[key] = apt[key].isoformat()
        
        return appointments
    except Exception as e:
        print(f"Error fetching patient appointments: {e}")
        return []


async def build_chatbot_context(
    intent: str,
    patient_id: str,
    appointment_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build context dictionary based on intent classification.
    Always includes:
    - Patient medical history
    - Appointment discussion summaries (current + previous 2 + base)
    - Intent-specific data
    
    For appointment ID like "34524-3", includes appointments: 34524-3, 34524-2, 34524-1, 34524-0
    """
    context = {
        "intent": intent,
        "patient_id": patient_id,
        "appointment_id": appointment_id,
        "data": {}
    }
    
    # ALWAYS include patient medical history
    patient_context = await get_patient_context(patient_id)
    context["data"]["patient"] = patient_context
    context["data"]["patient_medical_history"] = patient_context.get("medical_history", [])
    
    # ALWAYS include appointment sequence (current + previous 2 + base) if appointment_id provided
    if appointment_id:
        appointment_sequence = await get_appointment_sequence(appointment_id)
        context["data"]["appointment_sequence"] = appointment_sequence
        
        # Extract discussion summaries from all appointments in sequence
        discussion_summaries = []
        for apt in appointment_sequence:
            summary = {
                "appointment_id": str(apt.get("_id", "")),
                "appointment_date": apt.get("appointment_date", ""),
                "discussion": apt.get("discussion", ""),
                "discussion_summary": apt.get("discussion_summary", ""),
                "chief_complaint": apt.get("chief_complaint", "")
            }
            discussion_summaries.append(summary)
        context["data"]["discussion_summaries"] = discussion_summaries
        
        # Current appointment (most recent in sequence)
        if appointment_sequence:
            context["data"]["current_appointment"] = appointment_sequence[-1]
    else:
        # If no appointment_id, get recent appointments
        recent_appointments = await get_all_appointments_for_patient(patient_id, limit=5)
        context["data"]["recent_appointments"] = recent_appointments
        discussion_summaries = []
        for apt in recent_appointments:
            summary = {
                "appointment_id": str(apt.get("_id", "")),
                "appointment_date": apt.get("appointment_date", ""),
                "discussion": apt.get("discussion", ""),
                "discussion_summary": apt.get("discussion_summary", ""),
                "chief_complaint": apt.get("chief_complaint", "")
            }
            discussion_summaries.append(summary)
        context["data"]["discussion_summaries"] = discussion_summaries
    
    # Intent-specific data
    if intent == "appointment_summary":
        # Already have appointment_sequence and discussion_summaries
        pass
    
    elif intent == "test_analysis":
        if appointment_id and appointment_sequence:
            # Collect tests from all appointments in sequence
            all_tests = []
            for apt in appointment_sequence:
                all_tests.extend(apt.get("tests", []))
            context["data"]["tests"] = all_tests
        else:
            # Get all recent appointments with tests
            appointments = await get_all_appointments_for_patient(patient_id, limit=10)
            all_tests = []
            for apt in appointments:
                all_tests.extend(apt.get("tests", []))
            context["data"]["tests"] = all_tests
    
    elif intent == "report_analysis":
        if appointment_id and appointment_sequence:
            # Collect reports from all appointments in sequence
            all_reports = []
            for apt in appointment_sequence:
                all_reports.extend(apt.get("reports", []))
            context["data"]["reports"] = all_reports
        else:
            # Get all recent appointments with reports
            appointments = await get_all_appointments_for_patient(patient_id, limit=10)
            all_reports = []
            for apt in appointments:
                all_reports.extend(apt.get("reports", []))
            context["data"]["reports"] = all_reports
    
    elif intent == "diagnosis_reasoning":
        if appointment_id and appointment_sequence:
            # Include diagnoses from all appointments in sequence
            diagnoses = []
            for apt in appointment_sequence:
                if apt.get("generated_diagnosis"):
                    diagnoses.append({
                        "appointment_id": str(apt.get("_id", "")),
                        "generated_diagnosis": apt.get("generated_diagnosis"),
                        "doctor_diagnosis": apt.get("doctor_diagnosis")
                    })
            context["data"]["diagnoses"] = diagnoses
    
    elif intent == "time_series_analysis":
        context["data"]["time_series"] = await get_time_series_context(patient_id)
    
    # For all intents, ensure we have the essential data
    if not context["data"].get("current_appointment") and appointment_id:
        current = await get_appointment_context(appointment_id)
        if current:
            context["data"]["current_appointment"] = current
    # print(context)
    return context
