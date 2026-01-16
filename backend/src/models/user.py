from pydantic import BaseModel, Field, EmailStr
from typing import Literal
from datetime import date

class UserBase(BaseModel):
    email: EmailStr    
    full_name: str
    phone: str
    hashed_password: str 
    # temp fields for signup
    password: str

class PatientCreate(UserBase):
    password: str
    role: Literal["patient"] = "patient"
    date_of_birth: date
    blood_group: str

class DoctorCreate(UserBase):
    password: str
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

class UserResponse(UserBase):
    user_type: Literal["patient", "doctor"]