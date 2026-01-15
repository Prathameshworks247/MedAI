
import google.generativeai as genai,
from src.models.llm_extract import ExtractedClinicalData
import os

model = genai.GenerativeModel("gemini-2.5-flash")

def extract_clinical_data(text: str) -> ExtractedClinicalData:
    prompt = f"""
You are a clinical documentation assistant.

Extract structured clinical information from the text below.

RULES:
- Return ONLY valid JSON
- DO NOT include markdown
- DO NOT include explanations
- Follow this JSON schema exactly

SCHEMA:
{ExtractedClinicalData.model_json_schema()}

TEXT:
{text}
"""

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0,
            "response_mime_type": "application/json"
        }
    )

    return ExtractedClinicalData.model_validate_json(
        response.text
    )