from pydantic import BaseModel, Field
from datetime import datetime
from typing import List

class ReportModel(BaseModel):
    report_id: str = Field(...)
    uri: str = Field(...)
    summary: str = Field(...)

class TestModel(BaseModel):
    test_id: str = Field(...)
    uri: str = Field(...)
    summary: str = Field(...)

class AppointmentModel(BaseModel):
    patient_id: str = Field(...)
    doctor_id: str = Field(...)
    appointment_date: datetime = Field(...)
    status: str = Field(...)
    chief_complaint: str = Field(...)
    start_time: datetime = Field(...)
    end_time: datetime = Field(...)
    discussion: str = Field(...)
    discussion_summary: str = Field(...)
    reports: List[ReportModel] = Field(...)
    tests: List[TestModel] = Field(...)
    diagnosis: dict = Field(...)    
    created_at: datetime = Field(default=datetime.now())
    updated_at: datetime = Field(default=datetime.now())
    

