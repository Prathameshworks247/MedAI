from pydantic import BaseModel, Field, EmailStr
from typing import Literal
from datetime import date

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str

class PatientCreate(UserBase):
    role: Literal["patient"] = "patient"
    date_of_birth: date
    blood_group: str

class DoctorCreate(UserBase):
    role: Literal["doctor"] = "doctor"
    license_number: str
    specialization: str
    years_experience: int

class PatientInDB(PatientCreate):
    id: str = Field(alias="_id")
    class Config:
        populate_by_name = True

class DoctorInDB(DoctorCreate):
    id: str = Field(alias="_id")
    class Config:
        populate_by_name = True