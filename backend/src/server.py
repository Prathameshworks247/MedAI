from typing import Any
from fastapi import FastAPI
from pymongo import AsyncMongoClient, server_api

from routes.root import router as root_router

from config import PORT, MONGODB_URI

app = FastAPI(port=PORT)
client = AsyncMongoClient[Any](MONGODB_URI,server_api=server_api.ServerApi(version="1", strict=True,deprecation_errors=True))
db = client.get_database("InterIIIT")


appointment_collection = db.get_collection("appointments")


@app.get("/")
async def root():
    return {"message": "Hello World"}

app.include_router(root_router)

