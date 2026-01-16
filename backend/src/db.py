from pymongo import AsyncMongoClient, server_api
from typing import Any
import os

from src.config import MONGODB_URI

# Determine if we're in development mode
# Set MONGODB_ALLOW_INVALID_CERTS=false in .env for production (default: true for development)
ALLOW_INVALID_CERTS = os.getenv("MONGODB_ALLOW_INVALID_CERTS", "true").lower() == "true"

# MongoDB connection with SSL/TLS configuration
# mongodb+srv:// automatically uses TLS/SSL
connection_kwargs = {
    "server_api": server_api.ServerApi(version="1", strict=False, deprecation_errors=True),
}

# Allow invalid certificates for development (MongoDB Atlas SSL certificate verification)
# Set MONGODB_ALLOW_INVALID_CERTS=false in production
if ALLOW_INVALID_CERTS:
    connection_kwargs["tlsAllowInvalidCertificates"] = True

try:
    client = AsyncMongoClient[Any](MONGODB_URI, **connection_kwargs)
    db = client.get_database("InterIIIT")
    
    appointment_collection = db.get_collection("appointments")
    user_collection = db.get_collection("users")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    raise

# Test connection (optional - can be removed in production)
async def test_connection():
    try:
        await client.admin.command('ping')
        print("MongoDB connection successful!")
    except Exception as e:
        print(f"MongoDB connection test failed: {e}")