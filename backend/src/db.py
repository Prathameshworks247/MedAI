from pymongo import AsyncMongoClient, server_api
from typing import Any

from src.config import MONGODB_URI

client = AsyncMongoClient[Any](MONGODB_URI,server_api=server_api.ServerApi(version="1", strict=True,deprecation_errors=True))
db = client.get_database("InterIIIT")


appointment_collection = db.get_collection("appointments")
user_collection = db.get_collection("users")