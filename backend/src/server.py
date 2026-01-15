from typing import Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes.root import router as root_router
from src.config import PORT

app = FastAPI(port=PORT)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}

app.include_router(root_router)

