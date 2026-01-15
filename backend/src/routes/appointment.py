from fastapi import APIRouter

from ..server import appointment_collection
from services.streaming_stt import StreamingTranscriber
from fastapi import UploadFile, File,WebSocket,WebSocketDisconnect
from services.whisper_service import transcribe_audio_file
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
    transcriber  = StreamingTranscriber()
    
    try: 
        while True:
            message = await websocket.receive_bytes()
            partial_text = transcriber.process_audio_chunk(message)
            if partial_text:
                await websocket.send_json({
                    "type": "partial_transcript",
                    "text": partial_text
                })
    except WebSocketDisconnect:
        final_text = transcriber.finalize()

        await websocket.send_json({
            "type": "final_transcript",
            "text": final_text
        })
    finally:
        await websocket.close()