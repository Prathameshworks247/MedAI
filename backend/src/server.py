from fastapi import FastAPI,WebSocket,WebSocketDisconnect,Depends,UploadFile, File
from services.whisper_service import transcribe_audio_file
from pymongo import AsyncMongoClient, server_api
from services.streaming_stt import StreamingTranscriber
from config import PORT, MONGODB_URI

app = FastAPI(port=PORT)

client = AsyncMongoClient(MONGODB_URI,server_api=server_api.ServerApi(version="1", strict=True,deprecation_errors=True))
db = client.get_database("InterIIIT")


appointment_collection = db.get_collection("appointments")


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/transcribe-file")
async def transcribe_file(
    file: UploadFile = File(...)
):
    text = await transcribe_audio_file(file)
    print(text)
    return {
        "transcript": text
    }

@app.websocket('/ws/dictation')
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