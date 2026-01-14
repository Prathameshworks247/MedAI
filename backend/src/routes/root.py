from fastapi import APIRouter

from .appointment import router as appointment_router

router = APIRouter()


router.include_router(
    appointment_router,
    prefix="/appointments",
    tags=["appointments"],
)