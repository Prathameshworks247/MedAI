from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect, Query, HTTPException, status, Depends
import io
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import asyncio

from src.models.appointment import AppointmentModel, UpdateAppointmentModel, DiagnosisResponse, PrimaryDiagnosis, DiagnosisItem
from src.middlewares.auth import check_doctor_exists
from src.db import appointment_collection, user_collection
from src.services.streaming_stt import StreamingTranscriber
from src.services.whisper_service import transcribe_audio_file

from src.services.tools import extract_clinical_info, _save_to_mongo_impl
from src.services.diagnosis_generator import generate_diagnosis, build_diagnosis_context, convert_med42_to_structured_json
from src.services.chatbot_context import verify_doctor_patient_access
from src.r2 import upload_to_r2
from pydantic import BaseModel

class FinalizeRecordingRequest(BaseModel):
    discussion_text: str

router = APIRouter()


@router.get("/total")
async def total_appointments(
    patient_id: Optional[str] = Query(None),
):
    try:
        query = {"status": "completed"}
        if patient_id:
            query["patient_id"] = patient_id
        count = await appointment_collection.count_documents(query)
        return {"total": count}
    except Exception as e:
        print(f"Error counting appointments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to count appointments: {str(e)}"
        )

@router.get("/")
async def read_appointments(
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    appointment_status: Optional[str] = Query(None),
    appointment_date: Optional[str] = Query(None),
    limit: Optional[int] = Query(None),
):
    """Get all appointments"""
    try:
        appointments = []
        query = {}
        if patient_id:
            query["patient_id"] = patient_id
        if doctor_id:
            query["doctor_id"] = doctor_id
        if appointment_status:
            query["status"] = appointment_status
        if appointment_date:
            try:
                # Parse date string "YYYY-MM-DD" to datetime
                start_date = datetime.strptime(appointment_date, "%Y-%m-%d")
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                query["appointment_date"] = {
                    "$gte": start_date,
                    "$lte": end_date
                }
            except ValueError:
                # If parsing fails, ignore the date filter or handle accordingly
                pass
        async for appointment in appointment_collection.find(query).limit(limit or 1000):
            # Convert ObjectId to string
            appointment["_id"] = str(appointment["_id"])
            # Convert datetime objects to ISO format strings
            for key in ["appointment_date", "start_time", "end_time", "created_at", "updated_at"]:
                if key in appointment and isinstance(appointment[key], datetime):
                    appointment[key] = appointment[key].isoformat()
            # Populate doctor details
            if "doctor_id" in appointment and appointment["doctor_id"]:
                try:
                    doctor = await user_collection.find_one({"_id": ObjectId(appointment["doctor_id"])})
                    if doctor:
                         appointment["doctor"] = {
                             "name": doctor.get("full_name", "Unknown"),
                             "specialization": doctor.get("specialization", "General"),
                             "id": str(doctor["_id"])
                         }
                except:
                    # Fallback if doctor_id is not valid ObjectId
                    pass
            
            # Populate patient details
            if "patient_id" in appointment and appointment["patient_id"]:
                try:
                    patient = await user_collection.find_one({"_id": ObjectId(appointment["patient_id"])})
                    if patient:
                        age = "N/A"
                        if "date_of_birth" in patient and patient["date_of_birth"]:
                            try:
                                dob = patient["date_of_birth"]
                                if isinstance(dob, datetime):
                                    age = (datetime.now() - dob).days // 365
                            except:
                                pass
                                
                        appointment["patient"] = {
                            "id": str(patient["_id"]),
                            "name": patient.get("full_name", "Unknown"),
                            "gender": patient.get("gender", "N/A"),
                            "age": age
                        }
                except:
                    pass

            appointments.append(appointment)
        return appointments
    except Exception as e:
        print(f"Error fetching appointments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointments: {str(e)}"
        )


@router.get("/{appointment_id}")
async def get_appointment(appointment_id: str):
    """Get a specific appointment by ID"""
    try:
        # Try ObjectId first
        try:
            appointment = await appointment_collection.find_one({"_id": ObjectId(appointment_id)})
        except:
            # If ObjectId fails, try string
            appointment = await appointment_collection.find_one({"_id": appointment_id})
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found"
            )
        
        # Convert ObjectId to string
        appointment["_id"] = str(appointment["_id"])
        # Convert datetime objects to ISO format strings
        for key in ["appointment_date", "start_time", "end_time", "created_at", "updated_at"]:
            if key in appointment and isinstance(appointment[key], datetime):
                appointment[key] = appointment[key].isoformat()
        
        # Populate doctor details
        if "doctor_id" in appointment and appointment["doctor_id"]:
            try:
                doctor = await user_collection.find_one({"_id": ObjectId(appointment["doctor_id"])})
                if doctor:
                        appointment["doctor"] = {
                            "name": doctor.get("full_name", "Unknown"),
                            "specialization": doctor.get("specialization", "General")
                        }
            except:
                pass
        
        # Populate patient details
        if "patient_id" in appointment and appointment["patient_id"]:
            try:
                patient = await user_collection.find_one({"_id": ObjectId(appointment["patient_id"])})
                if patient:
                    age = "N/A"
                    if "date_of_birth" in patient and patient["date_of_birth"]:
                        try:
                            dob = patient["date_of_birth"]
                            if isinstance(dob, datetime):
                                age = (datetime.now() - dob).days // 365
                        except:
                            pass
                    appointment["patient"] = {
                        "id": str(patient["_id"]),
                        "name": patient.get("full_name", "Unknown"),
                        "gender": patient.get("gender", "N/A"),
                        "age": age         
                    }
            except:
                pass
        
        return appointment
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching appointment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointment: {str(e)}"
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: AppointmentModel,
    appointment_type: str = Query("new", alias="type"),
    prev_appointment_id: Optional[str] = Query(None),
    doctor=Depends(check_doctor_exists)
):
    """
    Create a new appointment in the database.
    
    Args:
        appointment: AppointmentModel with all required fields
        
    Returns:
        Created appointment with generated _id
    """
    try:
        # Convert Pydantic model to dict
        appointment_dict = appointment.model_dump()

        # Define IST timezone
        ist_offset = timedelta(hours=5, minutes=30)
        ist_tz = timezone(ist_offset)
        
        def convert_to_ist(dt_val):
            if isinstance(dt_val, datetime):
                if dt_val.tzinfo is None:
                    dt_val = dt_val.replace(tzinfo=timezone.utc)
                return dt_val.astimezone(ist_tz).replace(tzinfo=None)
            return dt_val

        # Convert times to IST
        for key in ["start_time", "end_time", "appointment_date"]:
            if key in appointment_dict and appointment_dict[key]:
                appointment_dict[key] = convert_to_ist(appointment_dict[key])
        
        # Set timestamps if not provided or convert existing
        if "created_at" not in appointment_dict or not appointment_dict["created_at"]:
            appointment_dict["created_at"] = datetime.now(ist_tz).replace(tzinfo=None)
        else:
            appointment_dict["created_at"] = convert_to_ist(appointment_dict["created_at"])

        if "updated_at" not in appointment_dict or not appointment_dict["updated_at"]:
            appointment_dict["updated_at"] = datetime.now(ist_tz).replace(tzinfo=None)
        else:
            appointment_dict["updated_at"] = convert_to_ist(appointment_dict["updated_at"])
        
        # Initialize empty discussion if not provided
        if "discussion" not in appointment_dict:
            appointment_dict["discussion"] = ""

        if appointment_type == "old":
            if not prev_appointment_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Previous appointment ID not provided"
                )
            prev_appointment = await appointment_collection.find_one({"_id": prev_appointment_id})
            if not prev_appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Previous appointment with ID {prev_appointment_id} not found"
                )
            prev_app_id = prev_appointment_id.split("-")[0]         
            prev_app_number = prev_appointment_id.split("-")[1]
            print(prev_app_id, prev_app_number)
            appointment_dict["_id"] = str(f"{prev_app_id}-{int(prev_app_number) + 1}")
            print(appointment_dict["_id"])
        else:
            appointment_dict["_id"] = str(f"{ObjectId()}-{0}")
        
        # Insert into database
        result = await appointment_collection.insert_one(appointment_dict)
        # Fetch the created appointment
        created_appointment = await appointment_collection.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string for JSON serialization
        if created_appointment:
            created_appointment["_id"] = str(created_appointment["_id"])
            # Convert datetime objects to ISO format strings
            for key in ["appointment_date", "start_time", "end_time", "created_at", "updated_at"]:
                if key in created_appointment and isinstance(created_appointment[key], datetime):
                    created_appointment[key] = created_appointment[key].isoformat()
        
        return {
            "message": "Appointment created successfully",
            "appointment": created_appointment
        }
        
    except Exception as e:
        print(f"Error creating appointment: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create appointment: {str(e)}"
        )

@router.patch("/{appointment_id}")
async def update_appointment(appointment_id: str, appointment_update: UpdateAppointmentModel):
    """
    Update an appointment by ID.
    Only provided fields will be updated.
    """
    try:
        # Create update dictionary with only set fields
        update_data = appointment_update.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update"
            )

        # Define IST timezone
        ist_offset = timedelta(hours=5, minutes=30)
        ist_tz = timezone(ist_offset)
        
        def convert_to_ist(dt_val):
            if isinstance(dt_val, datetime):
                if dt_val.tzinfo is None:
                    dt_val = dt_val.replace(tzinfo=timezone.utc)
                return dt_val.astimezone(ist_tz).replace(tzinfo=None)
            return dt_val

        # Convert times to IST
        for key in ["start_time", "end_time", "appointment_date"]:
            if key in update_data and update_data[key]:
                update_data[key] = convert_to_ist(update_data[key])
            
        # Add updated_at timestamp in IST
        update_data["updated_at"] = datetime.now(ist_tz).replace(tzinfo=None)
        
        # Try ObjectId first
        try:
             query = {"_id": ObjectId(appointment_id)}
        except:
             query = {"_id": appointment_id}

        # Perform update
        result = await appointment_collection.update_one(
            query,
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found"
            )
            
        # Fetch updated appointment
        updated_appointment = await appointment_collection.find_one(query)
        
        # Format for response
        if updated_appointment:
            updated_appointment["_id"] = str(updated_appointment["_id"])
            # Convert datetime objects to ISO format strings
            for key in ["appointment_date", "start_time", "end_time", "created_at", "updated_at"]:
                if key in updated_appointment and isinstance(updated_appointment[key], datetime):
                    updated_appointment[key] = updated_appointment[key].isoformat()
        
        return updated_appointment
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating appointment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update appointment: {str(e)}"
        )

@router.post("/transcribe-file")
async def transcribe_file(
    file: UploadFile = File(...)
):
    text = await transcribe_audio_file(file)
    print(text)
    return {
        "discussion": text
    }

@router.websocket('/ws/dictation')
async def live_detection(websocket: WebSocket):
    await websocket.accept()
    transcriber = StreamingTranscriber()
    appointment_object_id = None
    
    # Extract appointment_id from query parameters in WebSocket URL
    appointment_id = None
    try:
        # FastAPI WebSocket query params are accessed via websocket.url.query
        from urllib.parse import parse_qs
        if hasattr(websocket, 'url') and websocket.url.query:
            query_params = parse_qs(websocket.url.query)
            appointment_id = query_params.get('appointment_id', [None])[0] or query_params.get('appointmentId', [None])[0]
    except Exception as e:
        print(f"⚠ Error parsing query params: {e}")
    
    # Convert appointment_id to ObjectId if provided
    if appointment_id:
        try:
            appointment_object_id = ObjectId(appointment_id)
            print(f"📝 Saving discussion to appointment: {appointment_id}")
        except Exception as e:
            print(f"⚠ Invalid appointment_id format, using as string: {e}")
            # Try using appointment_id as string if ObjectId conversion fails
            appointment_object_id = appointment_id
    else:
        print("⚠ No appointment_id provided, discussion will not be saved to database")
    
    async def save_discussion_to_appointment(text: str, is_final: bool = False):
        """Save discussion chunk to appointment in database"""
        if not appointment_object_id:
            return
        
        try:
            # Try ObjectId first
            search_filter = {"_id": appointment_object_id}
            
            # Get current discussion from appointment
            appointment = await appointment_collection.find_one(search_filter)
            
            if not appointment and appointment_id:
                # Try searching by string ID if ObjectId didn't work
                search_filter = {"_id": appointment_id}
                appointment = await appointment_collection.find_one(search_filter)
            
            if not appointment:
                print(f"⚠ Appointment not found with ID: {appointment_id}")
                return
            
            current_discussion = appointment.get("discussion", "")
            
            # Sarvam AI returns additive transcript, so we replace instead of appending
            updated_discussion = text
            
            # Update appointment with new discussion
            result = await appointment_collection.update_one(
                search_filter,
                {
                    "$set": {
                        "discussion": updated_discussion,
                        "updated_at": datetime.now()
                    }
                }
            )
            
            if result.matched_count > 0:
                print(f"✓ Saved discussion to appointment ({'final' if is_final else 'partial'}): {len(updated_discussion)} chars")
            else:
                print(f"⚠ Failed to update appointment with ID: {appointment_id}")
        except Exception as e:
            print(f"✗ Error saving discussion to appointment: {e}")
            import traceback
            traceback.print_exc()

    async def sender_loop():
        """Listen for transcript updates and send to frontend immediately"""
        try:
            while True:
                partial_text = await transcriber.transcript_queue.get()
                if partial_text:
                    # Send to frontend only, do not save to DB while recording
                    try:
                        await websocket.send_json({
                            "type": "partial_transcript",
                            "text": partial_text
                        })
                    except:
                        break
        except Exception as e:
            print(f"Error in sender_loop: {e}")

    sender_task = asyncio.create_task(sender_loop())
    
    try: 
        while True:
            try:
                message = await websocket.receive_bytes()
                print(f"Received audio chunk: {len(message)} bytes")
            except (WebSocketDisconnect, RuntimeError) as e:
                # Connection closed, break out of loop
                print(f"WebSocket disconnected: {e}")
                break
            
            try:
                # process_audio_chunk sends to Sarvam, which triggers the sender_loop via the queue
                await transcriber.process_audio_chunk(message)
            except Exception as e:
                print(f"Error processing chunk: {e}")
                import traceback
                traceback.print_exc()
                # Continue processing even if one chunk fails
                continue
                
    except WebSocketDisconnect:
        print("WebSocket disconnected, finalizing discussion...")
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cancel sender task
        sender_task.cancel()
        
        # Finalize discussion
        try:
            final_text = await transcriber.finalize()
            print(f"Final discussion: {final_text}")

            # Try to send final discussion to frontend, but don't save to DB here
            try:
                await websocket.send_json({
                    "type": "final_transcript",
                    "text": final_text
                })
            except (WebSocketDisconnect, RuntimeError, Exception):
                pass  # Connection already closed, that's okay
        except Exception as e:
            print(f"Error finalizing discussion: {e}")
        
        # Close WebSocket if still open
        try:
            if websocket.client_state.name != "DISCONNECTED":
                await websocket.close()
        except:
            pass  # Already closed or error closing



@router.post("/{appointment_id}/finalize-recording")
async def finalize_recording(appointment_id: str, request: FinalizeRecordingRequest):
    """
    Finalize the recording for an appointment.
    1. Saves the final discussion text to DB.
    2. Triggers LLM extraction to update discussion_summary.
    """
    try:
        # Get appointment
        try:
            appointment = await appointment_collection.find_one({"_id": ObjectId(appointment_id)})
        except:
            appointment = await appointment_collection.find_one({"_id": appointment_id})
            
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
            
        discussion = request.discussion_text
        
        # Save final discussion to appointment in DB
        await appointment_collection.update_one(
            {"_id": appointment["_id"]},
            {
                "$set": {
                    "discussion": discussion,
                    "updated_at": datetime.now()
                }
            }
        )
        
        patient_id = appointment.get("patient_id")
        if not patient_id:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment has no patient_id"
            )
            
        print(f"🔄 Processing finalized discussion for appointment {appointment_id}")

        document_text = f"""
            discussion: {discussion}            
        """
        
        # Invoke the tool
        # extracted_info is a Dict
        extracted_info = extract_clinical_info.invoke({"document_text": document_text})
        
        # Save to Mongo
        result_msg = await _save_to_mongo_impl(
            patient_id=str(patient_id),
            appointment_id=str(appointment_id),
            extracted=extracted_info,
            is_transcript=True # Explicitly set as transcript to allow discussion_summary update
        )
        
        # Extract discussion summary if present
        discussion_summary = extracted_info.get("appointment_updates", {}).get("discussion_summary", "")

        return {
            "message": "Recording finalized and processed successfully",
            "details": result_msg,
            "discussion_summary": discussion_summary
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error finalizing recording: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to finalize recording: {str(e)}"
        )


@router.post("/{appointment_id}/diagnosis")
async def generate_appointment_diagnosis(
    appointment_id: str,
    doctor: dict = Depends(check_doctor_exists)
):
    """
    Generate 5 diagnoses for an appointment using Med42 model.
    
    Uses comprehensive patient data and appointment history:
    - Patient medical history
    - Current appointment (full details)
    - Baseline appointment (seq 0)
    - Previous 2 appointments
    
    Returns:
    - Primary diagnosis (highest confidence) with:
      * Diagnosis Summary
      * Comprehensive Reasoning Chain
      * Risk Factors
    - 4 Alternative diagnoses with summaries
    
    The diagnosis is saved to the appointment's generated_diagnosis field.
    """
    try:
        doctor_id = str(doctor["_id"])
        
        # Get appointment to extract patient_id
        appointment = await appointment_collection.find_one({"_id": appointment_id})
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment {appointment_id} not found"
            )
        
        patient_id = appointment.get("patient_id")
        if not patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment does not have a patient_id"
            )
        
        # Verify doctor has access to this patient
        has_access = await verify_doctor_patient_access(
            doctor_id=doctor_id,
            patient_id=str(patient_id),
            appointment_id=appointment_id
        )
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this patient's data"
            )
        
        # Step 1: Generate diagnoses using Med42 (plain text)
        print(f"🩺 Step 1: Generating diagnoses using Med42...")
        diagnosis_text = await generate_diagnosis(
            patient_id=str(patient_id),
            appointment_id=appointment_id
        )
        
        # Step 2: Build context for Gemini conversion
        print(f"📊 Step 2: Building context for Gemini conversion...")
        context = await build_diagnosis_context(
            patient_id=str(patient_id),
            appointment_id=appointment_id
        )
        
        # Step 3: Convert Med42 text to structured JSON using Gemini
        print(f"🔄 Step 3: Converting to structured JSON using Gemini...")
        structured_json = await convert_med42_to_structured_json(
            med42_text=diagnosis_text,
            patient_id=str(patient_id),
            appointment_id=appointment_id,
            context=context
        )
        
        # Step 4: Save both text and structured JSON to appointment
        await appointment_collection.update_one(
            {"_id": appointment_id},
            {
                "$set": {
                    "generated_diagnosis_text": diagnosis_text,  # Keep original text
                    "generated_diagnosis": structured_json,  # Structured JSON for dashboard
                    "diagnosis_generated_at": datetime.now(),
                    "updated_at": datetime.now()
                }
            }
        )
        
        print(f"✅ Diagnosis generated, converted, and saved to appointment")
        
        # Return structured JSON response
        return {
            "diagnosis": structured_json,
            "diagnosis_text": diagnosis_text,  # Also include text for reference
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in generate_appointment_diagnosis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate diagnosis: {str(e)}"
        )

@router.post("/{appointment_id}/upload-diagnosis-files")
async def upload_diagnosis_files(
    appointment_id: str,
    files: List[UploadFile] = File(...),
    doctor: dict = Depends(check_doctor_exists)
):
    """Upload multiple diagnosis files to R2"""
    try:
        uploaded_files = []
        
        for file in files:
            content = await file.read()
            # Use unique filename to avoid collisions
            unique_filename = f"diagnosis/{appointment_id}/{datetime.now().timestamp()}_{file.filename}"
            file_uri = upload_to_r2(io.BytesIO(content), unique_filename)
            
            if file_uri:
                uploaded_files.append({
                    "name": file.filename,
                    "uri": file_uri
                })
            else:
                print(f"Failed to upload {file.filename} to R2")
                
        return {"success": True, "files": uploaded_files}
    except Exception as e:
        print(f"Error uploading diagnosis files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload files: {str(e)}"
        )

@router.post("/{appointment_id}/doctor-diagnosis")
async def save_doctor_diagnosis(
    appointment_id: str,
    diagnosis_data: dict,
    doctor: dict = Depends(check_doctor_exists)
):
    """Save doctor's clinical diagnosis and notes"""
    try:
        # Expected diagnosis_data: { diagnosis_text: str, files: List[dict] }
        # where files is List of { name: str, uri: str }
        
        result = await appointment_collection.update_one(
            {"_id": appointment_id},
            {
                "$set": {
                    "doctor_diagnosis": {
                        "text": diagnosis_data.get("diagnosis_text", ""),
                        "files": diagnosis_data.get("files", []),
                        "submitted_at": datetime.now(),
                        "doctor_id": str(doctor["_id"])
                    },
                    "updated_at": datetime.now()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
            
        return {"success": True, "message": "Doctor diagnosis saved successfully"}
    except Exception as e:
        print(f"Error saving doctor diagnosis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save diagnosis: {str(e)}"
        )
