"""
LangChain Tools for Medical Data Ingestion Pipeline
"""

from langchain.tools import tool  # pyright: ignore[reportMissingImports]
from langchain_core.tools import StructuredTool  # pyright: ignore[reportMissingImports]
from langchain_core.output_parsers import PydanticOutputParser  # pyright: ignore[reportMissingImports]
from langchain_core.prompts import ChatPromptTemplate  # pyright: ignore[reportMissingImports]
from typing import Dict, List, Any
import json
from bson import ObjectId
from datetime import datetime

from src.llm.gemini import llm
from src.db import appointment_collection, user_collection
from src.models.llm import ExtractionResult
import json
import re


@tool
def extract_clinical_info(document_text: str) -> Dict[str, Any]:
    """
    Extract structured clinical information from medical documents, transcripts, or notes using Gemini.
    
    Args:
        document_text: Raw text from PDF, transcript, or handwritten notes
        
    Returns:
        Dictionary with the following schema:
        {
            "appointment_updates": {
                "chief_complaint": str,
                "diagnosis": dict,
                "discussion_summary": str,
                "status": "scheduled" | "in_progress" | "paused" | "completed" | "cancelled"
            },
            "reports": [
                {
                    "file_name": str,
                    "summary": str
                }
            ],
            "tests": [
                {
                    "file_name": str,
                    "summary": str
                }
            ],
            "patient_profile_updates": {
                "medical_history": list,
                "allergies": list,
                "medications": list,
                "conditions": list
            },
            "time_series_observations": [
                {
                    "metric": str,  # e.g., "blood_pressure", "heart_rate", "temperature"
                    "value": float,
                    "unit": str,     # e.g., "mmHg", "bpm", "°C"
                    "timestamp": str  # ISO8601 format
                }
            ]
        }
    """
    # Create Pydantic parser for validation
    parser = PydanticOutputParser(pydantic_object=ExtractionResult)
    
    # Build the system message without format_instructions to avoid template variable conflicts
    # The Pydantic parser will validate the output anyway
    system_message = """You are a clinical data extraction AI powered by Gemini.

CRITICAL RULES:
- Extract ONLY information that is explicitly present in the document
- Do NOT invent, infer, or assume any values
- If a field is not mentioned, use empty values (empty dict {{}}, empty list [], empty string "")
- Return valid JSON that matches the exact schema described below

EXTRACTION GUIDELINES:

1. appointment_updates (dict):
   - chief_complaint: Main reason for visit (string)
   - diagnosis: Structured diagnosis object with codes, descriptions (dict)
   - discussion_summary: Brief summary of consultation (string)
   - status: Current appointment status (one of: scheduled, in_progress, paused, completed, cancelled)

2. reports (array of objects):
   - Each report object must have: "file_name" (string) and "summary" (string)
   - Example: [{{"file_name": "name.pdf", "summary": "brief description"}}]
   - Only include if reports are mentioned in the document

3. tests (array of test documents):
   - CRITICAL: Group ALL tests from the SAME document into ONE test document object
   - If only one PDF/document was uploaded, create ONLY ONE test document containing all tests
   - Each test document must have: "doc_id" (string - use document ID if available, otherwise generate one), "doc_name" (string - name of the test report/document), "summary" (string - brief summary of all tests in this document), and "tests" (array)
   - Each test in the "tests" array must have: "name" (string - test name) and "description" (string - MUST contain the actual test value with unit, e.g., "46.00 mg/dL", "1.00 mg/L", "4 ng/L", "<20 mg/dL")
   - The description field MUST contain the numeric value and unit from the document - this is the actual test result
   - If a test value is not found, use empty string "" (NEVER use null)
   - Example for a single document with multiple tests: [{{"doc_id": "Z6152301", "doc_name": "HEART HEALTH SCREEN, ADVANCED", "summary": "Cardiac risk assessment panel", "tests": [{{"name": "Apo B (Apolipoprotein B)", "description": "46.00 mg/dL"}}, {{"name": "hsCRP (Cardio C-Reactive Protein), Serum", "description": "1.00 mg/L"}}, {{"name": "Troponin-I, Serum High Sensitive", "description": "4 ng/L"}}]}}]
   - IMPORTANT: Extract the actual test values (numbers with units) and put them in the description field
   - IMPORTANT: Group all tests from the same source document together - do NOT create separate documents for each test

4. patient_profile_updates (dict):
   - medical_history: Array of past medical conditions/events (list of strings)
   - allergies: Array of known allergies (list of strings)
   - medications: Array of current medications (list of strings)
   - conditions: Array of chronic conditions (list of strings)

5. time_series_observations (array of objects):
   - ONLY include if there are repeated measurements over time (vitals, lab trends, etc.)
   - Each observation must have: "metric" (string), "value" (number), "unit" (string), "timestamp" (ISO8601 string)
   - Example: [{{"metric": "blood_pressure", "value": 120.0, "unit": "mmHg", "timestamp": "2025-01-11T10:30:00"}}]
   - NOTE: Test results from lab reports should go in the "tests" array with values in "description", NOT in time_series_observations
   - Only use time_series_observations for actual time-series data (multiple measurements over time)

OUTPUT FORMAT:
Return a valid JSON object with these exact keys: appointment_updates, reports, tests, patient_profile_updates, time_series_observations.
Return ONLY the JSON object, no additional text or markdown formatting."""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", """
Document content:
{document_text}

Extract structured medical data following the schema exactly.
""")
    ])
    
    # Create chain without parser first to see raw output
    chain_without_parser = prompt | llm
    chain_with_parser = prompt | llm | parser
    
    try:
        # Get raw LLM response for debugging
        raw_response = chain_without_parser.invoke({"document_text": document_text})
        print("=" * 80)
        print("🤖 RAW LLM RESPONSE:")
        print("=" * 80)
        print(raw_response.content if hasattr(raw_response, 'content') else str(raw_response))
        print("=" * 80)
        
        # Invoke chain with parser and get Pydantic model
        try:
            result_model = chain_with_parser.invoke({"document_text": document_text})
        except Exception as parse_error:
            # If parsing fails, try to fix null values and retry
            print(f"⚠️  Parsing error, attempting to fix null values: {parse_error}")
            # Get the raw JSON from LLM response
            raw_content = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)
            raw_content_str = str(raw_content) if not isinstance(raw_content, str) else raw_content
            
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', raw_content_str, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                # Replace null with empty string for description fields
                json_str = re.sub(r'"description":\s*null', '"description": ""', json_str)
                # Parse and validate manually
                json_obj = json.loads(json_str)
                # Fix any remaining null descriptions
                if "tests" in json_obj:
                    for test_doc in json_obj["tests"]:
                        if "tests" in test_doc:
                            for test_item in test_doc["tests"]:
                                if test_item.get("description") is None:
                                    test_item["description"] = ""
                
                # Create Pydantic model from fixed JSON
                result_model = ExtractionResult.model_validate(json_obj)
            else:
                raise parse_error
        
        # Convert Pydantic model to dict
        result = result_model.model_dump()
        
        # Post-process: Merge test documents with the same doc_id
        if "tests" in result and len(result["tests"]) > 0:
            merged_tests = {}
            for test_doc in result["tests"]:
                doc_id = test_doc.get("doc_id", "unknown")
                if doc_id not in merged_tests:
                    merged_tests[doc_id] = {
                        "doc_id": doc_id,
                        "doc_name": test_doc.get("doc_name", "Unknown Document"),
                        "summary": test_doc.get("summary", ""),
                        "tests": []
                    }
                # Merge tests from this document
                if "tests" in test_doc:
                    merged_tests[doc_id]["tests"].extend(test_doc["tests"])
                    # Update summary if this one is more descriptive
                    if test_doc.get("summary") and len(test_doc.get("summary", "")) > len(merged_tests[doc_id]["summary"]):
                        merged_tests[doc_id]["summary"] = test_doc["summary"]
            
            # Convert back to list
            result["tests"] = list(merged_tests.values())
            print(f"📊 Merged {len(result['tests'])} test document(s) from {len(result_model.tests)} original entries")
        
        # Console log the parsed LLM output
        print("=" * 80)
        print("✅ PARSED LLM EXTRACTION OUTPUT (after post-processing):")
        print("=" * 80)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("=" * 80)
        
        return result
    except Exception as e:
        print(f"Error in extract_clinical_info: {e}")
        import traceback
        traceback.print_exc()
        # Return empty structure on error
        return {
            "appointment_updates": {},
            "reports": [],
            "tests": [],
            "patient_profile_updates": {},
            "time_series_observations": []
        }


async def _save_to_mongo_impl(
    patient_id: str,
    appointment_id: str,
    extracted: Dict[str, Any]
) -> str:
    """
    Save extracted clinical information to MongoDB collections.
    
    Args:
        patient_id: MongoDB ObjectId string of the patient
        appointment_id: MongoDB ObjectId string of the appointment
        extracted: Dictionary from extract_clinical_info tool
        
    Returns:
        Success message
    """
    try:
        # Convert string IDs to ObjectId (handle custom formats like "ObjectId-number")
        try:
            # Try to extract ObjectId from custom format (e.g., "507f1f77bcf86cd799439011-0")
            if "-" in patient_id:
                patient_object_id = ObjectId(patient_id.split("-")[0])
            else:
                patient_object_id = ObjectId(patient_id)
        except:
            patient_object_id = patient_id
            
        # Appointment ID can be in custom format "ObjectId-number", use as-is for queries
        # MongoDB will match the exact string if it's stored as a string
        appointment_object_id = appointment_id
        
        # 1. Update appointment
        if extracted.get("appointment_updates"):
            # Get the existing appointment to preserve system fields like doctor_id
            existing_appointment = await appointment_collection.find_one({"_id": appointment_object_id})
            
            updates = extracted["appointment_updates"]
            updates["updated_at"] = datetime.now()
            
            # Preserve doctor_id if it exists in the appointment but not in updates
            if existing_appointment and "doctor_id" in existing_appointment:
                if "doctor_id" not in updates or not updates.get("doctor_id"):
                    updates["doctor_id"] = existing_appointment["doctor_id"]
                    print(f"📋 Preserved doctor_id: {existing_appointment['doctor_id']}")
            
            await appointment_collection.update_one(
                {"_id": appointment_object_id},
                {"$set": updates}
            )
            print(f"✓ Updated appointment: {appointment_id}")
        
        # 2. Store reports
        if extracted.get("reports"):
            for report in extracted["reports"]:
                report_doc = {
                    "report_id": str(ObjectId()),
                    "file_name": report.get("file_name", "unknown"),
                    "uri": report.get("uri", ""),
                    "summary": report.get("summary", ""),
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                await appointment_collection.update_one(
                    {"_id": appointment_object_id},
                    {"$push": {"reports": report_doc}}
                )
            print(f"✓ Stored {len(extracted['reports'])} reports")
        
        # 3. Store tests
        if extracted.get("tests"):
            for test_document in extracted["tests"]:
                # Create test document with nested tests
                test_doc = {
                    "doc_id": test_document.get("doc_id", str(ObjectId())),
                    "doc_name": test_document.get("doc_name", "unknown"),
                    "summary": test_document.get("summary", ""),
                    "tests": [
                        {
                            "name": test_item.get("name", ""),
                            "description": test_item.get("description", "")
                        }
                        for test_item in test_document.get("tests", [])
                    ],
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                await appointment_collection.update_one(
                    {"_id": appointment_object_id},
                    {"$push": {"tests": test_doc}}
                )
            print(f"✓ Stored {len(extracted['tests'])} test documents")
        
        # 4. Update patient profile
        if extracted.get("patient_profile_updates"):
            patient_updates = extracted["patient_profile_updates"]
            patient_updates["updated_at"] = datetime.now()
            await user_collection.update_one(
                {"_id": patient_object_id},
                {"$set": patient_updates}
            )
            print(f"✓ Updated patient profile: {patient_id}")
        
        # 5. Store time series observations
        if extracted.get("time_series_observations"):
            for obs in extracted["time_series_observations"]:
                time_series_doc = {
                    "patient_id": patient_id,
                    "metric": obs.get("metric", ""),
                    "value": obs.get("value", 0.0),
                    "unit": obs.get("unit", ""),
                    "timestamp": datetime.fromisoformat(obs["timestamp"]) if isinstance(obs.get("timestamp"), str) else datetime.now()
                }
                await user_collection.update_one(
                    {"_id": patient_object_id},
                    {"$addToSet": {"time_series": time_series_doc}}
                )
            print(f"✓ Stored {len(extracted['time_series_observations'])} time-series observations")
        
        return "Successfully saved all extracted data to MongoDB"
        
    except Exception as e:
        error_msg = f"Error saving to MongoDB: {str(e)}"
        print(f"✗ {error_msg}")
        import traceback
        traceback.print_exc()
        return error_msg


# Create async tool using StructuredTool
save_to_mongo = StructuredTool.from_function(
    func=_save_to_mongo_impl,
    name="save_to_mongo",
    description="Save extracted clinical information to MongoDB collections. Takes patient_id, appointment_id, and extracted data dictionary."
)


@tool
def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract raw text from a PDF file.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Extracted text as a string
    """
    try:
        import pdfplumber
        
        text_content = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
        
        return "\n".join(text_content)
    except ImportError:
        # Fallback if pdfplumber not installed
        try:
            import PyPDF2
            text_content = []
            with open(file_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text_content.append(page.extract_text())
            return "\n".join(text_content)
        except Exception as e:
            return f"Error extracting PDF text: {str(e)}"
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"
