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
            # Get the existing appointment to preserve all system fields
            existing_appointment = await appointment_collection.find_one({"_id": appointment_object_id})
            
            if not existing_appointment:
                print(f"⚠️  Appointment {appointment_id} not found, skipping update")
                return f"Appointment {appointment_id} not found"
            
            updates = extracted["appointment_updates"].copy()  # Work with a copy
            updates["updated_at"] = datetime.now()
            
            # Preserve critical system fields that should never be overwritten
            system_fields_to_preserve = [
                "patient_id", "doctor_id", "appointment_date", 
                "start_time", "end_time", "created_at", "_id"
            ]
            
            for field in system_fields_to_preserve:
                if field in existing_appointment:
                    # Only preserve if update doesn't have a valid value or is trying to set empty
                    if field not in updates or not updates.get(field) or updates[field] == "":
                        updates[field] = existing_appointment[field]
                        if field == "doctor_id":
                            print(f"📋 Preserved {field}: {existing_appointment[field]}")
            
            # Only update fields that have actual values (not empty strings for important fields)
            # Remove empty string updates for critical fields to preserve existing data
            fields_to_check = ["chief_complaint", "discussion_summary", "status", "diagnosis"]
            for field in fields_to_check:
                if field in updates and updates[field] == "" and field in existing_appointment:
                    # Don't overwrite with empty string if existing value exists
                    if existing_appointment[field]:
                        del updates[field]
                        print(f"📋 Preserved existing {field} (LLM returned empty)")
            
            # Only update if there are actual changes
            if updates:
                await appointment_collection.update_one(
                    {"_id": appointment_object_id},
                    {"$set": updates}
                )
                print(f"✓ Updated appointment: {appointment_id} with {len(updates)} fields")
            else:
                print(f"ℹ️  No appointment updates to apply (all fields preserved)")
        
        # 2. Store reports (append, don't replace)
        if extracted.get("reports"):
            # Ensure reports array exists in appointment
            existing_appointment = await appointment_collection.find_one({"_id": appointment_object_id})
            if existing_appointment and "reports" not in existing_appointment:
                await appointment_collection.update_one(
                    {"_id": appointment_object_id},
                    {"$set": {"reports": []}}
                )
            
            for report in extracted["reports"]:
                report_doc = {
                    "report_id": str(ObjectId()),
                    "file_name": report.get("file_name", "unknown"),
                    "uri": report.get("uri", ""),
                    "summary": report.get("summary", ""),
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                # Use $push to append, preserving existing reports
                await appointment_collection.update_one(
                    {"_id": appointment_object_id},
                    {"$push": {"reports": report_doc}, "$set": {"updated_at": datetime.now()}}
                )
            print(f"✓ Stored {len(extracted['reports'])} reports (appended to existing)")
        
        # 3. Store tests (append, don't replace)
        if extracted.get("tests"):
            # Ensure tests array exists in appointment
            existing_appointment = await appointment_collection.find_one({"_id": appointment_object_id})
            if existing_appointment and "tests" not in existing_appointment:
                await appointment_collection.update_one(
                    {"_id": appointment_object_id},
                    {"$set": {"tests": []}}
                )
            
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
                # Use $push to append, preserving existing tests
                await appointment_collection.update_one(
                    {"_id": appointment_object_id},
                    {"$push": {"tests": test_doc}, "$set": {"updated_at": datetime.now()}}
                )
            print(f"✓ Stored {len(extracted['tests'])} test documents (appended to existing)")
        
        # 4. Update patient profile
        if extracted.get("patient_profile_updates"):
            # Get existing patient to preserve system fields
            existing_patient = await user_collection.find_one({"_id": patient_object_id})
            
            if not existing_patient:
                print(f"⚠️  Patient {patient_id} not found, skipping profile update")
            else:
                patient_updates = extracted["patient_profile_updates"].copy()
                patient_updates["updated_at"] = datetime.now()
                
                # Preserve critical system fields
                system_fields_to_preserve = [
                    "_id", "email", "full_name", "phone", "gender", 
                    "date_of_birth", "blood_group", "user_type", "hashed_password"
                ]
                
                for field in system_fields_to_preserve:
                    if field in existing_patient:
                        if field not in patient_updates or not patient_updates.get(field):
                            patient_updates[field] = existing_patient[field]
                
                # For array fields (medical_history, allergies, etc.), merge instead of replace
                array_fields = ["medical_history", "allergies", "medications", "conditions"]
                for field in array_fields:
                    if field in patient_updates and isinstance(patient_updates[field], list):
                        existing_array = existing_patient.get(field, [])
                        if isinstance(existing_array, list):
                            # Merge arrays, avoiding duplicates
                            merged = list(existing_array)
                            for item in patient_updates[field]:
                                if item and item not in merged:
                                    merged.append(item)
                            patient_updates[field] = merged
                            print(f"📋 Merged {field}: {len(existing_array)} existing + {len(patient_updates[field]) - len(existing_array)} new")
                
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
