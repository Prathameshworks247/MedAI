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
        "date_of_birth": patient_context.get("date_of_birth", "")
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
                if 0 < seq_num < (int(str(current.get("_id", "")).split("-")[-1]) if current and "-" in str(current.get("_id", "")) else 999):
                    previous.append(apt)
            except:
                pass
        
        # Sort previous by sequence and take last 2
        previous = sorted(previous, key=lambda x: int(str(x.get("_id", "")).split("-")[-1]) if "-" in str(x.get("_id", "")) else 0)[-2:]
        
        # Build appointment summaries (condensed to save tokens)
        appointments_data = []
        
        # Add baseline if exists
        if baseline:
            appointments_data.append({
                "appointment_id": str(baseline.get("_id", "")),
                "appointment_date": str(baseline.get("appointment_date", "")),
                "type": "baseline",
                "chief_complaint": baseline.get("chief_complaint", "")[:200] if baseline.get("chief_complaint") else "",
                "discussion_summary": baseline.get("discussion_summary", "")[:500] if baseline.get("discussion_summary") else "",
                "tests": baseline.get("tests", [])[:10],  # Limit to 10 tests
                "reports": baseline.get("reports", [])[:5]  # Limit to 5 reports
            })
        
        # Add previous 2
        for apt in previous:
            appointments_data.append({
                "appointment_id": str(apt.get("_id", "")),
                "appointment_date": str(apt.get("appointment_date", "")),
                "type": "followup",
                "chief_complaint": apt.get("chief_complaint", "")[:200] if apt.get("chief_complaint") else "",
                "discussion_summary": apt.get("discussion_summary", "")[:500] if apt.get("discussion_summary") else "",
                "tests": apt.get("tests", [])[:10],
                "reports": apt.get("reports", [])[:5]
            })
        
        # Add current (most detailed)
        if current:
            appointments_data.append({
                "appointment_id": str(current.get("_id", "")),
                "appointment_date": str(current.get("appointment_date", "")),
                "type": "current",
                "chief_complaint": current.get("chief_complaint", "")[:300] if current.get("chief_complaint") else "",
                "discussion_summary": current.get("discussion_summary", "")[:800] if current.get("discussion_summary") else "",
                "discussion": current.get("discussion", "")[:1000] if current.get("discussion") else "",  # Full discussion for current only
                "tests": current.get("tests", []),  # All tests for current
                "reports": current.get("reports", [])  # All reports for current
            })
        
        context["appointments"] = appointments_data
    
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
        
        # Format context as JSON (truncate if needed for token limits)
        context_json = json.dumps(context, indent=2, default=str)
        
        # Truncate context if too large (reserve ~2000 tokens for prompt + response)
        # Med42 has 4096 token limit, so we can use ~2000 tokens for context
        MAX_CONTEXT_CHARS = 8000  # ~2000 tokens
        if len(context_json) > MAX_CONTEXT_CHARS:
            context_json = context_json[:MAX_CONTEXT_CHARS] + "\n... (context truncated)"
            print(f"⚠️  Context truncated to {MAX_CONTEXT_CHARS} characters")
        
        # Build prompt - plain text output
        system_prompt = """You are a clinical AI assistant specialized in medical diagnosis using the Med42 model.

Your task is to analyze comprehensive patient data and generate 5 potential diagnoses ranked by confidence.

CRITICAL RULES:
1. **USE ALL AVAILABLE DATA**: Analyze patient medical history, all appointment discussions, test results, reports, and chief complaints
2. **COMPREHENSIVE REASONING**: For the primary diagnosis (highest confidence), provide a detailed, step-by-step reasoning chain that shows your complete thought process. Use the full extent of your medical knowledge.
3. **EVIDENCE-BASED**: Base all diagnoses on the provided data. Do not invent information.
4. **CONFIDENCE SCORES**: Assign realistic confidence scores (0.0-1.0) based on available evidence
5. **ICD-10 CODES**: Use appropriate ICD-10 diagnosis codes when possible
6. **RISK FACTORS**: Identify all relevant risk factors from the patient's medical history, test results, and clinical presentation

OUTPUT FORMAT:
Provide a comprehensive text response with the following structure:

1. PRIMARY DIAGNOSIS (Highest Confidence)
   - Diagnosis Code (ICD-10): [code]
   - Diagnosis Name: [name]
   - Confidence Score: [0.0-1.0]
   - Diagnosis Summary: [Concise but complete summary, 2-3 paragraphs]
   - Comprehensive Reasoning Chain: [THIS IS THE MOST IMPORTANT SECTION - Provide an extremely comprehensive, detailed, step-by-step reasoning chain. Use the FULL EXTENT of your medical knowledge. Explain:
     * How you analyzed the patient's symptoms, history, and test results
     * The differential diagnosis process you went through
     * Why this diagnosis is most likely based on the evidence
     * Pathophysiology and clinical reasoning
     * How each piece of evidence supports or refutes the diagnosis
     * Any alternative considerations and why they were ruled out
     * Clinical decision-making process
     Be THOROUGH and COMPREHENSIVE - this should be a detailed medical analysis (5-10 paragraphs minimum)]
   - Risk Factors: [List all risk factors involved, one per line]

2. ALTERNATIVE DIAGNOSES (Other 4, sorted by confidence descending)
   For each alternative diagnosis:
   - Diagnosis Code (ICD-10): [code]
   - Diagnosis Name: [name]
   - Confidence Score: [0.0-1.0]
   - Summary: [Brief summary of the diagnosis]

Format your response clearly with sections and subsections. Be thorough and comprehensive, especially in the reasoning chain for the primary diagnosis."""

        human_prompt_template = """PATIENT AND APPOINTMENT DATA:
{context_data}

Based on the above comprehensive patient data, appointment history (baseline, previous 2, and current), test results, reports, and medical history, generate 5 potential diagnoses.

Analyze:
- Patient demographics and medical history
- Chief complaints across all appointments
- Discussion summaries and clinical notes
- Test results and their values
- Reports and imaging findings
- Patterns and trends across appointments

Generate diagnoses with appropriate ICD-10 codes, confidence scores, and for the primary diagnosis, provide comprehensive reasoning."""

        # Escape curly braces in context_json for ChatPromptTemplate
        # ChatPromptTemplate interprets { and } as template variables, so we need to escape them
        escaped_context_json = context_json.replace("{", "{{").replace("}", "}}")
        
        # Create prompt template with placeholder
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", human_prompt_template)
        ])
        
        # Fill in the context_data using partial (this avoids template variable parsing issues)
        prompt = prompt.partial(context_data=escaped_context_json)
        
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
