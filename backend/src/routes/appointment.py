from fastapi import APIRouter

from ..server import appointment_collection

router = APIRouter()


@router.get("/")
async def read_appointments():
    return [{"username": "Rick"}, {"username": "Morty"}]


@router.get("/me")
async def read_user_me():
    return {"username": "fakecurrentuser"}


@router.get("/{username}")
async def read_user(username: str):
    return {"username": username}