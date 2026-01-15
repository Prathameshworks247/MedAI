from typing import Any
from fastapi import FastAPI

from src.routes.root import router as root_router
from src.config import PORT

app = FastAPI(port=PORT)


@app.get("/")
async def root():
    return {"message": "Hello World"}

app.include_router(root_router)

