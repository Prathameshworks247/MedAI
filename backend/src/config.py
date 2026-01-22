import os
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash

load_dotenv()

PORT = os.getenv('PORT', '8000')
MONGODB_URI = os.getenv('MONGODB_URI')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
FEATHERLESS_API_KEY = os.getenv('FEATHERLESS_API_KEY')
R2_ENDPOINT = os.getenv('R2_ENDPOINT')
R2_ACCESS_KEY = os.getenv('R2_ACCESS_KEY')
R2_SECRET_KEY = os.getenv('R2_SECRET_KEY')
R2_BUCKET=os.getenv('R2_BUCKET')
R2_PUBLIC_URL=os.getenv('R2_PUBLIC_URL')

# JWT Configuration - with defaults for development
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    # Default secret key for development only - CHANGE IN PRODUCTION!
    SECRET_KEY = "dev-secret-key-change-in-production-please-use-strong-random-key"
    print("WARNING: Using default SECRET_KEY. Set SECRET_KEY in .env for production!")

ALGORITHM = os.getenv('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '10080')  # 7 days default

password_hash = PasswordHash.recommended()

# Use HTTPBearer for simpler Swagger UI (just Bearer token, no OAuth2 flow)
http_bearer = HTTPBearer(auto_error=False)