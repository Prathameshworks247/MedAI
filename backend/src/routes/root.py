from fastapi import APIRouter

from src.routes.appointment import router as appointment_router
from src.routes.patient import router as patient_router
from src.routes.doctor import router as doctor_router
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

router.include_router(
    patient_router,
    prefix="/patients",
    tags=["patients"],
)

router.include_router(
    doctor_router,
    prefix="/doctors",
    tags=["doctors"],
)
