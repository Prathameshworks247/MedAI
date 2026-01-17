# llm/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal

class LLMReport(BaseModel):
    file_name: str
    summary: str

class LLMTestItem(BaseModel):
    """Individual test item"""
    name: str
    description: Optional[str] = ""  # Optional, defaults to empty string

class LLMTestDocument(BaseModel):
    """Test document containing multiple tests"""
    doc_id: str
    doc_name: str
    summary: str
    tests: List[LLMTestItem]

class TimeSeriesMetric(BaseModel):
    metric: str
    value: float
    unit: str
    timestamp: str

class ExtractionResult(BaseModel):
    appointment_updates: Dict
    reports: List[LLMReport]
    tests: List[LLMTestDocument]
    patient_profile_updates: Dict
    time_series_observations: List[TimeSeriesMetric]
