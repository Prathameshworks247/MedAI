from pydantic import BaseModel, Field, EmailStr, RootModel
from typing import Literal, List, Dict
from datetime import date, datetime

# ------------------ Base User ------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    gender: Literal["male", "female", "other"]
    hashed_password: str

# ------------------ Medical History ------------------
class MedicalHistoryModel(BaseModel):
    medical_history_id: str
    file_name: str
    uri: str
    summary: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------ Metric Value ------------------
class MetricValue(BaseModel):
    value: float
    is_anamoly: bool = False

# ------------------ Metric Time Series ------------------
class MetricTimeSeries(RootModel[Dict[str, MetricValue]]):
    """
    Root model for time series data.
    Keys are ISO format datetime strings (for MongoDB compatibility).
    Values are MetricValue objects.
    """

# ------------------ All Patient Metrics ------------------
class PatientMetrics(BaseModel):
    metrics: Dict[
        Literal[
            "blood_pressure",
            "heart_rate",
            "temperature",
            "glucose",
            "cholesterol",
            "haemoglobin",
            "wbc",
            "rbc",
            "platelets"
        ],
        MetricTimeSeries
    ]

# ------------------ Patient Create ------------------
class PatientCreate(UserBase):
    password: str
    role: Literal["patient"] = "patient"
    date_of_birth: date
    blood_group: str

# ------------------ Doctor Create ------------------
class DoctorCreate(UserBase):
    password: str
    role: Literal["doctor"] = "doctor"
    license_number: str
    specialization: str
    years_experience: int

# ------------------ Patient in DB ------------------
class PatientInDB(PatientCreate):
    id: str = Field(alias="_id")
    medical_history: List[MedicalHistoryModel] = Field(default_factory=list)
    time_series: PatientMetrics = Field(default_factory=lambda: PatientMetrics(metrics={}))

    class Config:
        populate_by_name = True

# ------------------ Doctor in DB ------------------
class DoctorInDB(DoctorCreate):
    id: str = Field(alias="_id")
    class Config:
        populate_by_name = True

# ------------------ User Response ------------------
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: str
    gender: Literal["male", "female", "other"]
    user_type: Literal["patient", "doctor"]
