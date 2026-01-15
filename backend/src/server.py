from fastapi import FastAPI,WebSocket,WebSocketDisconnect,Depends,UploadFile, File
from services.whisper_service import transcribe_audio_file
from pymongo import AsyncMongoClient, server_api
from config import PORT, MONGODB_URI

app = FastAPI(port=PORT)

client = AsyncMongoClient(MONGODB_URI,server_api=server_api.ServerApi(version="1", strict=True,deprecation_errors=True))
db = client.get_database("InterIIIT")


appointment_collection = db.get_collection("appointments")


@app.get("/")
async def root():
    return {"message": "Hello World"}

