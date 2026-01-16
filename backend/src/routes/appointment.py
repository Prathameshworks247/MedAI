from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import Optional
from src.models.appointment import AppointmentModel
from src.db import appointment_collection
from src.services.streaming_stt import StreamingTranscriber
from src.services.whisper_service import transcribe_audio_file

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_appointment(appointment: AppointmentModel):
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
        
        # Set timestamps if not provided
        if "created_at" not in appointment_dict or not appointment_dict["created_at"]:
            appointment_dict["created_at"] = datetime.now()
        if "updated_at" not in appointment_dict or not appointment_dict["updated_at"]:
            appointment_dict["updated_at"] = datetime.now()
        
        # Initialize empty discussion if not provided
        if "discussion" not in appointment_dict:
            appointment_dict["discussion"] = ""
        
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


@router.get("/")
async def read_appointments():
    """Get all appointments"""
    try:
        appointments = []
        async for appointment in appointment_collection.find():
            # Convert ObjectId to string
            appointment["_id"] = str(appointment["_id"])
            # Convert datetime objects to ISO format strings
            for key in ["appointment_date", "start_time", "end_time", "created_at", "updated_at"]:
                if key in appointment and isinstance(appointment[key], datetime):
                    appointment[key] = appointment[key].isoformat()
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
        
        return appointment
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching appointment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointment: {str(e)}"
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