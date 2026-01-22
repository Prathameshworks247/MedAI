# llm/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal, Union, Any

class LLMReport(BaseModel):
    doc_id: Optional[str] = None
    doc_name: Optional[str] = "Unknown Document"
    summary: Optional[str] = ""
    uri: Optional[str] = None

class LLMTestItem(BaseModel):
    """Individual test item"""
    name: str
    description: Optional[str] = ""  # Optional, defaults to empty string

class LLMTestDocument(BaseModel):
    """Test document containing multiple tests"""
    doc_id: Optional[str] = None
    doc_name: Optional[str] = "Unknown Document"
    summary: Optional[str] = ""
    uri: Optional[str] = None
    tests: List[LLMTestItem]

class TimeSeriesMetric(BaseModel):
    metric: str  # Must be one of: blood_pressure, heart_rate, temperature, glucose, cholesterol, hemoglobin, wbc, rbc, platelets
    value: float
    unit: str
    timestamp: str  # ISO8601 format
    is_anomaly: bool = False  # True if value is outside normal range

class ExtractionResult(BaseModel):
    appointment_updates: Dict[str, Any] = Field(default_factory=dict)
    reports: List[LLMReport] = Field(default_factory=list)
    tests: List[LLMTestDocument] = Field(default_factory=list)
    patient_profile_updates: Union[Dict[str, Any], List[Any]] = Field(default_factory=dict)
    time_series_observations: List[TimeSeriesMetric] = Field(default_factory=list)
