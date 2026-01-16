from fastapi import APIRouter, UploadFile, File,WebSocket,WebSocketDisconnect

from src.services.streaming_stt import StreamingTranscriber
from src.services.whisper_service import transcribe_audio_file

router = APIRouter()


@router.get("/")
async def read_appointments():
    return [{"username": "Rick"}, {"username": "Morty"}]


@router.get("/me")
async def read_user_me():
    return {"username": "fakecurrentuser"}


@router.get("/{username}")
async def read_user(username: str):
    return {"username": username}

@router.post("/transcribe-file")
async def transcribe_file(
    file: UploadFile = File(...)
):
    text = await transcribe_audio_file(file)
    print(text)
    return {
        "transcript": text
    }

@router.websocket('/ws/dictation')
async def live_detection(websocket: WebSocket):
    await websocket.accept()
    transcriber = StreamingTranscriber()
    
    try: 
        while True:
            message = await websocket.receive_bytes()
            print(f"Received audio chunk: {len(message)} bytes")
            
            try:
                partial_text = transcriber.process_audio_chunk(message)
                print(f"Transcription result: {partial_text}")
                
                if partial_text:
                    await websocket.send_json({
                        "type": "partial_transcript",
                        "text": partial_text
                    })
            except Exception as e:
                print(f"Error processing chunk: {e}")
                import traceback
                traceback.print_exc()
                # Continue processing even if one chunk fails
                continue
                
    except WebSocketDisconnect:
        print("WebSocket disconnected, finalizing transcript...")
        final_text = transcriber.finalize()
        print(f"Final transcript: {final_text}")

        try:
            await websocket.send_json({
                "type": "final_transcript",
                "text": final_text
            })
        except:
            pass  # Connection already closed
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        try:
            await websocket.close()
        except:
            pass