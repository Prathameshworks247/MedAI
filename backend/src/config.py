import os
from dotenv import load_dotenv

load_dotenv()

PORT = os.getenv('PORT')
MONGODB_URI = os.getenv('MONGODB_URI')