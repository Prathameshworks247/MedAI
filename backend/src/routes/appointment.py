from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect, Query, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional

from src.models.appointment import AppointmentModel, UpdateAppointmentModel
from src.middlewares.auth import check_doctor_exists
from src.db import appointment_collection, user_collection
from src.services.streaming_stt import StreamingTranscriber
from src.services.whisper_service import transcribe_audio_file
from src.services.agent import process_medical_document

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
            
            # Append new text to existing discussion
            updated_discussion = current_discussion + (" " + text if current_discussion else text)
            
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
                partial_text = transcriber.process_audio_chunk(message)
                print(f"Discussion result: {partial_text}")
                
                if partial_text:
                    # Save partial discussion to appointment
                    await save_discussion_to_appointment(partial_text, is_final=False)
                    
                    # Try to send, but handle disconnection gracefully
                    try:
                        await websocket.send_json({
                            "type": "partial_transcript",
                            "text": partial_text
                        })
                    except (WebSocketDisconnect, RuntimeError, Exception) as send_error:
                        print(f"Error sending transcript (connection may be closed): {send_error}")
                        break  # Exit loop if we can't send
                        
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
        # Finalize discussion and save it
        try:
            final_text = transcriber.finalize()
            print(f"Final discussion: {final_text}")

            # Save final discussion to appointment
            if final_text:
                await save_discussion_to_appointment(final_text, is_final=True)
                
                # Process transcript through LLM extraction pipeline
                if appointment_object_id:
                    try:
                        # Get appointment to extract patient_id
                        appointment = await appointment_collection.find_one({"_id": appointment_object_id})
                        if appointment and appointment.get("patient_id") and appointment_id:
                            patient_id = appointment["patient_id"]
                            print(f"🔄 Processing transcript through LLM extraction pipeline...")
                            
                            # Process the transcript through the same pipeline as documents
                            # Mark as transcript so discussion_summary can be updated
                            extraction_result = await process_medical_document(
                                document_text=final_text,
                                patient_id=patient_id,
                                appointment_id=appointment_id or "",
                                file_path=None  # No PDF, just text
                            )
                            
                            if extraction_result and extraction_result.get("errors"):
                                print(f"⚠️  LLM extraction errors: {extraction_result['errors']}")
                            elif extraction_result:
                                print(f"✅ Successfully extracted and saved clinical information from transcript")
                        else:
                            print(f"⚠️  Could not find patient_id or appointment_id, skipping LLM extraction")
                    except Exception as e:
                        print(f"⚠️  Error processing transcript through LLM pipeline: {e}")
                        import traceback
                        traceback.print_exc()
                        # Don't fail the WebSocket if extraction fails

            # Try to send final discussion, but don't fail if connection is closed
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
    
@router.post(f"/{appointment_id}/diagnosis")
