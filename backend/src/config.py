import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash

load_dotenv()

PORT = os.getenv('PORT')
MONGODB_URI = os.getenv('MONGODB_URI')
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES')

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")