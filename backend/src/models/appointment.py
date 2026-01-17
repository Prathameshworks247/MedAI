from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Literal


class ReportModel(BaseModel):
    report_id: str = Field(...)
    file_name: str = Field(...)
    uri: str = Field(...) 
    summary: str = Field(...)

class TestItem(BaseModel):
    """Individual test within a test document"""
    name: str = Field(...)
    description: str = Field(default="")  # Optional, defaults to empty string

class TestModel(BaseModel):
    """Test document containing multiple tests"""
    doc_id: str = Field(...)
    doc_name: str = Field(...)
    uri: str = Field(...)
    summary: str = Field(...)
    tests: List[TestItem] = Field(...)


class AppointmentModel(BaseModel):
    patient_id: str = Field(...)
    doctor_id: str = Field(...)
    appointment_date: datetime = Field(...)
    status: Literal["scheduled", "in_progress", "paused", "completed", "cancelled"] = Field(...)
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

class UpdateAppointmentModel(BaseModel):
    patient_id: str | None = None
    doctor_id: str | None = None
    appointment_date: datetime | None = None
    status: Literal["scheduled", "in_progress", "paused", "completed", "cancelled"] | None = None
    chief_complaint: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    discussion: str | None = None
    discussion_summary: str | None = None
    reports: List[ReportModel] | None = None
    tests: List[TestModel] | None = None
    diagnosis: dict | None = None
