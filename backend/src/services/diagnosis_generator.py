"""
Diagnosis Generation Service using Med42
Generates 5 diagnoses based on comprehensive patient and appointment data
Returns plain text response (no JSON parsing)
"""
from typing import Dict, List, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from datetime import datetime
import json

from src.llm.featherless import llm
from src.services.chatbot_context import get_patient_context, get_appointment_sequence, get_appointment_context


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
        chain = prompt | llm
        
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
