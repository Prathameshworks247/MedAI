from pydantic import BaseModel, Field, EmailStr
from typing import Literal, List
from datetime import date, datetime

class UserBase(BaseModel):
    email: EmailStr    
    full_name: str
    phone: str
    gender: Literal["male", "female", "other"]
    hashed_password: str 
    # temp fields for signup
    password: str

class MedicalHistoryModel(BaseModel):
    medical_history_id: str = Field(...)
    file_name: str = Field(...)
    uri: str = Field(...)
    summary: str = Field(...)
    created_at: datetime = Field(default=datetime.now())
    updated_at: datetime = Field(default=datetime.now())

class TimeSeriesModel(BaseModel):
    patient_id: str = Field(...)
    metric: str = Field(...)
    value: float = Field(...)
    unit: str = Field(...)
    timestamp: datetime = Field(...)

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
    medical_history: List[MedicalHistoryModel] = Field(...)
    class Config:
        populate_by_name = True

class DoctorInDB(DoctorCreate):
    id: str = Field(alias="_id")
    class Config:
        populate_by_name = True

class UserResponse(UserBase):
    user_type: Literal["patient", "doctor"]