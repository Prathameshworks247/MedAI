from fastapi import APIRouter

from src.routes.appointment import router as appointment_router
from src.routes.auth import router as auth_router

router = APIRouter()


router.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"],
)

router.include_router(
    appointment_router,
    prefix="/appointments",
    tags=["appointments"],
)