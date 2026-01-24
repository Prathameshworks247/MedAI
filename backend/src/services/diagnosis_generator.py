"""
Diagnosis Generation Service using Med42
Generates 5 diagnoses based on comprehensive patient and appointment data
Step 1: Med42 generates plain text diagnosis
Step 2: Gemini converts text + context to structured JSON
"""
from typing import Dict, List, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from datetime import datetime
import json
import re

from src.llm.featherless import llm as med42_llm
from src.llm.gemini import llm as gemini_llm
from src.services.chatbot_context import get_patient_context, get_appointment_sequence, get_appointment_context, get_time_series_context
from src.services.timeseries_predictor import predict_future_metrics


async def compress_diagnosis_context_with_gemini(context: Dict[str, Any], max_chars: int = 8000) -> str:
    """
    Use Gemini to format and compress diagnosis context for Med42.
    Produces a structured clinical summary: Patient Profile, Trends, and History.
    """
    try:
        print(f"🔄 Compressing diagnosis context with Gemini (target: {max_chars} chars)...")
        original_json = json.dumps(context, indent=2, default=str)
        original_size = len(original_json)

        compression_prompt = (
            "You are a clinical context compressor. Your output will be used by Med42 for medical diagnosis.\n\n"
            "OUTPUT FORMAT (use these exact section headers, plain text only):\n\n"
            "## PATIENT PROFILE\n"
            "Include: Name, Age, Gender, DOB, and ID. Provide a comprehensive list of ALL medical history, chronic conditions, allergies, current medications, and past surgeries/procedures.\n\n"
            "## CLINICAL TRENDS (TIME SERIES & PREDICTIONS)\n"
            "Summarize all available vital signs and clinical metrics (Blood Pressure, Heart Rate, Glucose, etc.). Include historical trends across appointments and ALL LSTM predictions provided in the data.\n"
            "Format as: Metric: [Historical Values] -> [Predicted Future Values].\n\n"
            "## APPOINTMENT HISTORY\n"
            "For EACH appointment in the sequence (baseline, previous, and current), provide a high-fidelity summary:\n"
            "- Appointment ID, Date, and Type (Baseline/Follow-up/Current)\n"
            "- Chief Complaint\n"
            "- Full Clinical Discussion (Summarize the entire interaction, capturing all symptoms and patient-reported data)\n"
            "- Discussion Summary (Key clinical takeaways)\n"
            "- ALL Test Results (Name, Value, Unit, Normal Range, and any document references)\n"
            "- ALL Medical Reports (File Name, findings, and URIs)\n"
            "- Previous Diagnoses (Both AI-generated and doctor-provided)\n\n"
            "RULES:\n"
            "1. Stay within " + str(max_chars) + " characters total.\n"
            "2. DO NOT omit key clinical information. Be dense, factual, and medically rigorous.\n"
            "3. Preserve all document IDs, URIs, and clinical identifiers exactly.\n"
            "4. Med42 must be able to perform a complete clinical analysis from this summary alone.\n\n"
            "RAW CONTEXT (JSON):\n"
        ) + original_json

        from langchain_core.messages import HumanMessage, SystemMessage
        messages = [
            SystemMessage(content="You are a clinical data expert that compresses patient history into high-density medical summaries for diagnostic AI models."),
            HumanMessage(content=compression_prompt)
        ]

        response = await gemini_llm.ainvoke(messages)
        compressed_text = response.content if hasattr(response, 'content') else str(response)
        
        # Clean up any markdown code blocks
        compressed_text = re.sub(r'```[a-z]*\s*', '', compressed_text)
        compressed_text = re.sub(r'```\s*$', '', compressed_text, flags=re.MULTILINE)
        compressed_text = compressed_text.strip()

        compressed_size = len(compressed_text)
        print(f"✅ Diagnosis context compressed: {original_size} -> {compressed_size} chars")
        return compressed_text

    except Exception as e:
        print(f"⚠️ Gemini compression failed: {e}. Using intelligent fallback.")
        # Fallback to simple truncation or a basic formatter
        return json.dumps(context, indent=2, default=str)[:max_chars]


async def build_diagnosis_context(patient_id: str, appointment_id: str) -> Dict[str, Any]:
    """
    Build comprehensive context for diagnosis generation.
    Includes: patient data, current appointment, baseline, and previous 2 appointments.
    Optimized for token limits.
    """
    context = {
        "patient": {},
        "appointments": []
    }
    
    # Get patient data
    patient_context = await get_patient_context(patient_id)
    context["patient"] = {
        "patient_id": patient_id,
        "name": patient_context.get("name", ""),
        "age": patient_context.get("age", ""),
        "gender": patient_context.get("gender", ""),
        "medical_history": patient_context.get("medical_history", []),
        "date_of_birth": patient_context.get("date_of_birth", ""),
        "allergies": patient_context.get("allergies", []),
        "medications": patient_context.get("medications", []),
        "surgeries": patient_context.get("surgeries", [])
    }
    
    # Get time series data from user collection
    time_series_data = await get_time_series_context(patient_id)
    context["time_series"] = time_series_data
    
    # Get LSTM predictions for time series
    try:
        predictions = await predict_future_metrics(time_series_data)
        context["predictions"] = predictions
    except Exception as e:
        print(f"⚠️ Failed to generate LSTM predictions: {e}")
        context["predictions"] = {}
    
    # Get appointment sequence: current, baseline (0), and previous 2
    appointment_sequence = await get_appointment_sequence(appointment_id)
    
    # Filter to get: current, baseline (seq 0), and previous 2
    if appointment_sequence:
        # Sort by sequence number
        sorted_appts = sorted(appointment_sequence, key=lambda x: int(str(x.get("_id", "")).split("-")[-1]) if "-" in str(x.get("_id", "")) else 0)
        
        # Get current (last in sequence)
        current = sorted_appts[-1] if sorted_appts else None
        
        # Get baseline (seq 0)
        baseline = next((apt for apt in sorted_appts if str(apt.get("_id", "")).endswith("-0")), None)
        
        # Get previous 2 (before current, excluding baseline)
        previous = []
        for apt in sorted_appts:
            seq_str = str(apt.get("_id", "")).split("-")[-1] if "-" in str(apt.get("_id", "")) else "0"
            try:
                seq_num = int(seq_str)
                if current and 0 < seq_num < int(str(current.get("_id", "")).split("-")[-1] if "-" in str(current.get("_id", "")) else "999"):
                    previous.append(apt)
            except:
                pass
        
        # Sort previous by sequence and take last 2
        previous = sorted(previous, key=lambda x: int(str(x.get("_id", "")).split("-")[-1]) if "-" in str(x.get("_id", "")) else 0)[-2:]
        
        # Build appointment data list (NO TRUNCATION HERE - let Gemini handle it)
        appointments_data = []
        
        # Function to format appointment data without truncation
        def format_apt(apt):
            if not apt: return None
            return {
                "appointment_id": str(apt.get("_id", "")),
                "appointment_date": str(apt.get("appointment_date", "")),
                "type": "baseline" if str(apt.get("_id", "")).endswith("-0") else ("current" if apt == current else "followup"),
                "chief_complaint": apt.get("chief_complaint", ""),
                "discussion": apt.get("discussion", ""),
                "discussion_summary": apt.get("discussion_summary", ""),
                "tests": apt.get("tests", []),
                "reports": apt.get("reports", []),
                "doctor_diagnosis": apt.get("doctor_diagnosis", {}),
                "generated_diagnosis": apt.get("generated_diagnosis", {})
            }

        # Add appointments in sequence
        if baseline:
            appointments_data.append(format_apt(baseline))
        
        for apt in previous:
            appointments_data.append(format_apt(apt))
            
        if current and current != baseline:
            appointments_data.append(format_apt(current))
        
        context["appointments"] = appointments_data
    
    return context
    
    return context


async def generate_diagnosis(patient_id: str, appointment_id: str) -> str:
    """
    Generate 5 diagnoses using Med42 model based on comprehensive patient and appointment data.
    
    Returns:
        Plain text response with diagnoses
    """
    try:
        # Build comprehensive context
        print(f"📊 Building diagnosis context for appointment {appointment_id}...")
        context = await build_diagnosis_context(patient_id, appointment_id)
        
        # Compress context using Gemini
        # Med42 has a 4096 token limit, so we aim for ~8000-10000 characters
        MAX_CONTEXT_CHARS = 10000
        context_summary = await compress_diagnosis_context_with_gemini(context, MAX_CONTEXT_CHARS)
        
        # Print for transparency
        print("\n" + "=" * 80)
        print("📦 COMPRESSED DIAGNOSIS CONTEXT:")
        print("=" * 80)
        print(context_summary)
        print("=" * 80 + "\n")
        
        # Build prompt - plain text output
        system_prompt = """You are a clinical AI assistant specialized in medical diagnosis using the Med42 model.

Your task is to analyze a structured clinical summary and generate 5 potential diagnoses,
ranked by confidence, using conservative, evidence-based clinical reasoning.

⚠️ FORMATTING REQUIREMENT:
- Your ENTIRE response MUST be written in **Markdown**
- Use clear headers, bullet points, and structured sections
- Maintain professional clinical tone

────────────────────────────────────────
CRITICAL RULES (MANDATORY)
────────────────────────────────────────

1. **USE ALL AVAILABLE DATA**
   Analyze all provided symptoms, history, vitals, trends, and test results.
   Do not ignore relevant clinical context.

2. **CONSERVATIVE FIRST PRINCIPLE**
   When multiple explanations exist, always prefer the least severe diagnosis
   that sufficiently explains the presentation.

3. **SEVERITY CALIBRATION**
   Do NOT label any diagnosis as severe, systemic, bacterial, or life-threatening
   unless supported by objective evidence such as:
   - Organ dysfunction
   - Persistent hypotension requiring vasopressors
   - Elevated lactate
   - Confirmatory biomarkers (CRP, procalcitonin)
   - Positive cultures or diagnostic imaging

4. **NO PATHOGEN SPECULATION**
   Do NOT name a specific infectious organism
   unless supported by microbiological testing or pathognomonic findings.

5. **PROVISIONAL DIAGNOSIS RULE**
   If confirmatory evidence is missing, diagnoses MUST be described as
   “provisional”, “probable”, or “likely”.
   Absolute certainty is prohibited.

6. **LAB INTERPRETATION GUARDRAIL**
   Fever, leukocytosis, tachycardia, or transient hypotension
   MUST be interpreted in full clinical context.
   These findings alone MUST NOT trigger severe diagnoses.

7. **CONFIDENCE CALIBRATION**
   Assign confidence scores between 0.0 and 1.0.
   If no confirmatory diagnostic test is available,
   confidence MUST NOT exceed 0.60.

────────────────────────────────────────
COMPREHENSIVE REASONING REQUIREMENT
────────────────────────────────────────

8. **PRIMARY DIAGNOSIS REASONING (STRICT)**
   The PRIMARY diagnosis MUST include a detailed,
   step-by-step clinical reasoning chain that:

   - Identifies the dominant symptom pattern
   - Explains how each major symptom is accounted for
   - Interprets abnormal findings conservatively
   - Explicitly explains why dehydration, viral illness,
     or benign causes may explain systemic features
   - Clearly states why more severe diagnoses
     (e.g., sepsis, bacterial infection, organ failure)
     are LESS likely given the available data
   - Identifies missing data that limits diagnostic certainty

   Shallow or summary-only reasoning is NOT acceptable.

────────────────────────────────────────
OUTPUT FORMAT (STRICT)
────────────────────────────────────────

## 1. PRIMARY DIAGNOSIS (Highest Confidence)

- **Diagnosis Code (ICD-10):** [Code]
- **Diagnosis Name:** [Name]
- **Confidence Score:** [0.0–1.0]
- **Diagnosis Summary:** Concise clinical summary
- **Comprehensive Reasoning Chain:**
  - Step-by-step clinical logic (mandatory)
- **Risk Factors:** Relevant patient-specific factors

---

## 2. ALTERNATIVE DIAGNOSES (Next 4, Ranked by Confidence)

For each alternative diagnosis:

- **Diagnosis Code (ICD-10):** [Code]
- **Diagnosis Name:** [Name]
- **Confidence Score:** [0.0–1.0]
- **Summary:** Brief, evidence-based justification
"""

        human_prompt_template = """STRUCTURED CLINICAL CONTEXT:
{context_data}

Based on the structured patient profile, trends, and appointment history above, generate 5 potential diagnoses.

Analyze patterns in vitals, lab results, and clinical notes to provide evidence-based conclusions and thorough reasoning for the primary diagnosis."""

        # Escape any remaining curly braces in context_summary if any (though Gemini output usually doesn't have them in a way that breaks LangChain)
        escaped_context_summary = context_summary.replace("{", "{{").replace("}", "}}")
        
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", human_prompt_template)
        ])
        
        # Fill in the context_data
        prompt = prompt.partial(context_data=escaped_context_summary)
        
        # Invoke LLM
        print(f"🤖 Generating diagnoses using Med42...")
        chain = prompt | med42_llm
        
        # Get raw text response
        raw_response = chain.invoke({})
        response_text = str(raw_response.content if hasattr(raw_response, 'content') else raw_response)
        
        print(f"✅ Generated diagnosis text response ({len(response_text)} characters)")
        print(f"📝 Response preview (first 500 chars): {response_text[:500]}")
        
        return response_text
        
    except Exception as e:
        print(f"❌ Error generating diagnosis: {e}")
        import traceback
        traceback.print_exc()
        raise


async def convert_med42_to_structured_json(
    med42_text: str,
    patient_id: str,
    appointment_id: str,
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Convert Med42 plain text diagnosis to structured JSON using Gemini.
    
    Args:
        med42_text: Plain text diagnosis from Med42
        patient_id: Patient ID
        appointment_id: Appointment ID
        context: Full patient and appointment context
    
    Returns:
        Structured JSON matching the dashboard schema
    """
    try:
        print(f"🔄 Converting Med42 text to structured JSON using Gemini...")
        
        # Format context as JSON
        context_json = json.dumps(context, indent=2, default=str)
        
        # Build prompt for Gemini
        system_prompt = """You are a medical data structuring AI. Your task is to convert a Med42 diagnosis text analysis into a structured JSON format for a clinical dashboard.

CRITICAL RULES:
1. Extract ALL information from the Med42 text
2. Use the patient and appointment context to enrich the data
3. Return ONLY valid JSON - no markdown, no explanations
4. Follow the exact schema provided
5. For dates, use ISO 8601 format (YYYY-MM-DD)
6. For enums, use only the allowed values: "improving" | "worsening" | "stable" for status, "better" | "worse" | "same" for change, "lower" | "higher" for better
7. **CRITICAL: Extract test trends from time_series data AND the provided LSTM predictions. Mark predicted data points with is_prediction: true.**
8. Build evidence chain from appointment history
9. Calculate risk scores where applicable
10. Create progress metrics comparing baseline to current

OUTPUT SCHEMA (return valid JSON with these exact fields):

Required root fields:
- patient: object with "name" (string) and "last_updated" (ISO 8601 datetime string)
- primary_diagnosis: object with "condition" (string), "icd_code" (string ICD-10), "confidence" (number 0.0-1.0), "status" (one of: "improving", "worsening", "stable"), "evidence_chain" (array of objects with "appointment", "date", "value", "change")
- test_trends: object where keys are test names, values are objects with "test_name", "unit", "normal_range" (array of 2 numbers), "data" (array of objects with "date", "value", "appointment_number", "is_prediction")
  * IMPORTANT: test_trends MUST include both historical data (from patient.time_series.metrics) and forecasted data (from the predictions field in context).
  * Mark all forecasted data points with "is_prediction": true. Historical points should have "is_prediction": false or omit the field.
  * Only use the 5 fixed parameters available in time_series: blood_pressure, heart_rate, temperature, glucose, cholesterol (and optionally hemoglobin, wbc, rbc, platelets if available)
- clinical_reasoning: object with "nodes" (array) and "connections" (array)
  * nodes: array of objects with "id" (string), "label" (string), "type" (one of: "input", "process", "output", "evidence"), "icon" (string emoji)
  * connections: array of objects with "from" (string node id), "to" (string node id), "label" (optional string)
- risk_scores: array of objects with "name", "value" (number), "max" (number), "interpretation" (string)
- progress_metrics: array of objects with "name", "baseline" (number), "current" (number), "unit" (string), "target" (number), "better" (one of: "lower", "higher"), "icon" (string), "is_prediction" (boolean)
  * Set "is_prediction": true if the "current" value is based on an LSTM forecast rather than a recorded measurement.
- alternative_diagnoses: array of objects with "icd_10_code", "diagnosis_name", "confidence_score" (number 0.0-1.0), "rationale" (string)

CRITICAL: Return ONLY valid JSON. Do NOT use double curly braces. Use single curly braces for JSON objects. Do NOT wrap in markdown code blocks. Return pure JSON only."""

        human_prompt_template = """MED42 DIAGNOSIS TEXT:
{med42_text}

PATIENT AND APPOINTMENT CONTEXT:
{context_data}

Based on the Med42 diagnosis text above and the patient/appointment context, extract and structure all information into the JSON schema provided. 

Key tasks:
1. Extract primary diagnosis details (condition, ICD code, confidence, status)
2. Build evidence chain from appointment history showing progression
3. **CRITICAL: Extract test trends from time_series data AND the provided LSTM predictions**
   - The time_series field contains metrics: blood_pressure, heart_rate, temperature, glucose, cholesterol, hemoglobin, wbc, rbc, platelets
   - Each metric has historical time series data with timestamps as keys
   - The "predictions" field in context contains forecasted values for these metrics
   - Convert both history and predictions into test_trends format with test_name, unit, normal_range, and data array
   - Mark predicted data points with "is_prediction": true
   - Use appropriate units: blood_pressure (mmHg), heart_rate (bpm), temperature (°C), glucose (mg/dL), cholesterol (mg/dL), hemoglobin (g/dL), wbc (x10^9/L), rbc (x10^12/L), platelets (x10^9/L)
   - Set normal ranges appropriately for each metric
   - Map timestamps to appointment dates where possible
4. Calculate risk scores (TIMI, CHA2DS2-VASc, etc.) if applicable
5. Create progress metrics comparing baseline to current values using time_series data
6. Include all alternative diagnoses with rationale
7. Use patient name and last updated timestamp from context
8. **CRITICAL: Build clinical_reasoning nodes and connections** - Create a reasoning flow graph:
   - Start with "input" nodes: Patient baseline data, chief complaints, medical history
   - Add "evidence" nodes: Key symptoms, test results, risk factors, clinical findings
   - Add "process" nodes: Differential diagnosis steps, analysis stages, decision points
   - End with "output" nodes: Final diagnosis, treatment recommendations, follow-up plans
   - Create "connections" between nodes showing the reasoning flow (from -> to)
   - Use appropriate icons (emoji) for each node type
   - Make the flow logical and traceable from input to diagnosis to outcome

CLINICAL REASONING STRUCTURE:
- nodes: Array of reasoning nodes, each with id, label, type, and icon
- connections: Array of connections showing flow between nodes
- Example node types:
  * "input": Patient baseline, initial presentation (icons: 👤, 📋, 🏥)
  * "evidence": Symptoms, test results, risk factors (icons: 💊, 🧪, ⚠️, 📊)
  * "process": Analysis steps, differential diagnosis (icons: 🔍, 🧠, ⚖️)
  * "output": Final diagnosis, treatment, outcomes (icons: 🎯, 💊, 📈)

Return ONLY valid JSON matching the schema."""

        # Escape curly braces in context_json
        escaped_context_json = context_json.replace("{", "{{").replace("}", "}}")
        escaped_med42_text = med42_text.replace("{", "{{").replace("}", "}}")
        
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", human_prompt_template)
        ])
        
        # Fill in variables using partial
        prompt = prompt.partial(
            med42_text=escaped_med42_text,
            context_data=escaped_context_json
        )
        
        # Invoke Gemini (without parser first to clean the response)
        print(f"🤖 Processing with Gemini...")
        chain = prompt | gemini_llm
        
        # Get raw response first
        raw_response = chain.invoke({})
        raw_text = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)
        
        print(f"📝 Raw Gemini response (first 500 chars): {raw_text[:500]}")
        
        # Clean up the response - remove markdown code blocks if present
        # Remove ```json and ``` markers
        cleaned_text = re.sub(r'```json\s*', '', raw_text)
        cleaned_text = re.sub(r'```\s*$', '', cleaned_text, flags=re.MULTILINE)
        cleaned_text = cleaned_text.strip()
        
        # Fix double curly braces that Gemini might have output (from seeing escaped braces in prompt)
        # Replace {{ with { and }} with } (but be careful - only do this if they appear as escaped JSON)
        # Check if the text starts with {{ - if so, it's likely escaped JSON
        if cleaned_text.startswith('{{'):
            cleaned_text = cleaned_text.replace('{{', '{').replace('}}', '}')
        
        # Parse JSON manually
        try:
            result = json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}")
            print(f"Cleaned text (first 1000 chars): {cleaned_text[:1000]}")
            # Try one more time with more aggressive cleaning
            cleaned_text = cleaned_text.replace('{{', '{').replace('}}', '}')
            try:
                result = json.loads(cleaned_text)
            except json.JSONDecodeError as e2:
                print(f"❌ Second JSON parsing attempt also failed: {e2}")
                raise
        
        print(f"✅ Converted to structured JSON")
        print(f"📊 JSON keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error converting Med42 text to JSON: {e}")
        import traceback
        traceback.print_exc()
        raise
