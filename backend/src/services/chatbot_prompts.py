"""
Strict Anti-Hallucination Prompts for Doctor Chatbot
Ensures LLM only uses provided database context
"""

from langchain_core.prompts import ChatPromptTemplate
from typing import Optional, Dict, Any
import json
import asyncio
from src.llm.gemini import llm as gemini_llm

# Base system prompt with strict anti-hallucination rules
ANTI_HALLUCINATION_SYSTEM_PROMPT = """You are a clinical AI assistant for doctors. Your role is to help doctors analyze patient data stored in the database.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:

1. **NEVER HALLUCINATE**: Only use information explicitly provided in the context below. If information is not in the context, explicitly state "This information is not available in the database."

2. **NO ASSUMPTIONS**: Do not make assumptions, inferences, or educated guesses. Only state facts that are directly present in the provided data.

3. **CITE YOUR SOURCES**: When providing information, reference where it came from (e.g., "According to the appointment dated...", "The test results show...", "The patient's medical history indicates...").

4. **UNCERTAINTY IS OK**: If you're uncertain or the data is incomplete, say so explicitly. It's better to admit uncertainty than to invent information.

5. **DATABASE IS SOURCE OF TRUTH**: The MongoDB database is the ONLY source of truth. Do not use any external medical knowledge unless explicitly asked to interpret provided data.

6. **STRUCTURED RESPONSES**: Provide clear, structured responses with:
   - Direct answer to the question
   - Supporting evidence from the database
   - Any relevant context or patterns
   - Explicit statements about missing information

7. **MEDICAL DISCLAIMER**: Always include a disclaimer that your analysis is based on database records and should be verified by the doctor.

8. **CONVERSATION CONTEXT**: You may reference previous messages in the conversation for continuity, but always base your answers on the database context provided. If a question refers to something mentioned earlier in the conversation, you can acknowledge it, but verify facts against the database.

Remember: Your credibility depends on accuracy. Never invent data."""


def _format_value(val: Any, max_len: int = 800) -> str:
    """Format a value for inclusion in structured text; cap length."""
    s = json.dumps(val, indent=2, default=str) if isinstance(val, (dict, list)) else str(val)
    return s if len(s) <= max_len else s[:max_len] + "..."

def _intelligent_truncate_context(context: Dict[str, Any], intent: str, max_chars: int) -> str:
    """
    Fallback: produce structured text (User Info, Medical History, Discussion Summary,
    Appointment-wise data) when Gemini formatting fails. Same format as Gemini output.
    """
    try:
        print(f"✂️  Applying intelligent truncation (target: {max_chars} chars)...")
        original_json = json.dumps(context, indent=2, default=str)
        print("\n" + "=" * 80)
        print("📊 ORIGINAL CONTEXT STRUCTURE:")
        print("=" * 80)
        print(f"Total size: {len(original_json)} characters. Top-level keys: {list(context.keys())}")
        print("=" * 80 + "\n")

        sections = []
        budget = max_chars - 200  # reserve for headers and truncation note

        # ## USER INFO
        user_lines = []
        patient = context.get("patient") or {}
        if isinstance(patient, dict):
            for k in ["name", "email", "age", "gender", "phone", "date_of_birth"]:
                v = patient.get(k)
                if v is not None and str(v).strip():
                    user_lines.append(f"  {k}: {v}")
        if not user_lines:
            user_lines.append("  (No user info available)")
        user_block = "## USER INFO\n" + "\n".join(user_lines)
        sections.append(user_block)
        budget -= len(user_block)

        # ## MEDICAL HISTORY
        med_lines = []
        med = context.get("patient_medical_history") or context.get("medical_history") or patient.get("medical_history")
        if isinstance(med, list):
            for i, item in enumerate(med[:15]):
                med_lines.append(f"  - {_format_value(item, 300)}")
        elif isinstance(med, (dict, str)) and med:
            med_lines.append(f"  {_format_value(med, 600)}")
        if not med_lines:
            med_lines.append("  (No medical history available)")
        med_block = "## MEDICAL HISTORY\n" + "\n".join(med_lines)
        sections.append(med_block)
        budget -= len(med_block)

        # ## DISCUSSION SUMMARY (TRANSCRIPT)
        disc_lines = []
        summaries = context.get("discussion_summaries") or []
        apt_seq = context.get("appointment_sequence") or []
        for i, s in enumerate(summaries[:8]):
            aid = s.get("appointment_id", "") if isinstance(s, dict) else ""
            date = s.get("appointment_date", "") if isinstance(s, dict) else ""
            disc = (s.get("discussion") or s.get("discussion_summary") or "") if isinstance(s, dict) else str(s)
            chief = (s.get("chief_complaint") or "") if isinstance(s, dict) else ""
            disc_lines.append(f"  Appointment {i+1} (ID: {aid}, Date: {date})")
            if chief:
                disc_lines.append(f"    Chief complaint: {chief[:400]}")
            dpreview = (disc[:800] + "...") if len(disc) > 800 else disc
            disc_lines.append(f"    Discussion: {dpreview}")
        if not disc_lines and apt_seq:
            for i, apt in enumerate(apt_seq[:5]):
                aid = str(apt.get("_id", ""))
                date = apt.get("appointment_date", "")
                d = apt.get("discussion") or apt.get("discussion_summary") or ""
                c = apt.get("chief_complaint") or ""
                disc_lines.append(f"  Appointment {i+1} (ID: {aid}, Date: {date})")
                if c:
                    disc_lines.append(f"    Chief complaint: {c[:400]}")
                dpreview = (d[:800] + "...") if len(d) > 800 else d
                disc_lines.append(f"    Discussion: {dpreview}")
        if not disc_lines:
            disc_lines.append("  (No discussion summary available)")
        disc_block = "## DISCUSSION SUMMARY (TRANSCRIPT)\n" + "\n".join(disc_lines)
        sections.append(disc_block)
        budget -= len(disc_block)

        # ## APPOINTMENT-WISE DATA
        apt_lines = []
        for apt in (apt_seq or context.get("recent_appointments") or [])[:6]:
            aid = str(apt.get("_id", ""))
            date = apt.get("appointment_date", "")
            apt_type = "baseline" if "0" in aid or apt.get("type") == "baseline" else "follow-up"
            apt_lines.append(f"  ### Appointment (ID: {aid}, Date: {date}, Type: {apt_type})")
            apt_lines.append(f"    Chief complaint: {(apt.get('chief_complaint') or '')[:400]}")
            apt_lines.append(f"    Discussion summary: {_format_value(apt.get('discussion_summary') or apt.get('discussion') or '', 500)}")
            tests = apt.get("tests") or apt.get("test_results") or []
            if tests:
                apt_lines.append("    Tests:")
                for t in (tests if isinstance(tests, list) else [tests])[:10]:
                    apt_lines.append(f"      - {_format_value(t, 200)}")
            reports = apt.get("reports") or []
            if reports:
                apt_lines.append("    Reports:")
                for r in (reports if isinstance(reports, list) else [reports])[:10]:
                    uri = r.get("uri") or r.get("url") or ""
                    name = r.get("doc_name") or r.get("name") or ""
                    apt_lines.append(f"      - {name or 'report'} {uri}")
            dx = apt.get("generated_diagnosis") or apt.get("doctor_diagnosis")
            if dx:
                apt_lines.append(f"    Diagnoses: {_format_value(dx, 300)}")

        if not apt_lines:
            apt_lines.append("  (No appointment-wise data available)")
        apt_block = "## APPOINTMENT-WISE DATA\n" + "\n".join(apt_lines)
        sections.append(apt_block)

        out = "\n\n".join(sections)
        if len(out) > max_chars:
            out = out[:max_chars] + "\n... (context truncated due to size limits)"
        print(f"✅ Intelligent truncation complete: {len(out)} chars")
        print(f"📄 Full truncated context:\n{out}\n")
        return out

    except Exception as e:
        print(f"⚠️  Error in intelligent truncation: {e}")
        import traceback
        traceback.print_exc()
        simple = json.dumps(context, indent=2, default=str)
        if len(simple) > max_chars:
            simple = simple[:max_chars] + "\n... (context truncated)"
        return simple


async def compress_context_with_gemini(context: Dict[str, Any], intent: str, max_chars: int = 12000) -> str:
    """
    Use Gemini to format context as structured text for Med42: User Info, Medical History,
    Discussion Summary (transcript), and appointment-wise data. Intent-aware, within max_chars.
    """
    try:
        print(f"🔄 Formatting context with Gemini (target: {max_chars} chars, intent: {intent})...")
        original_json = json.dumps(context, indent=2, default=str)
        original_size = len(original_json)

        print("\n" + "=" * 80)
        print("📊 ORIGINAL CONTEXT (BEFORE GEMINI FORMATTING):")
        print("=" * 80)
        print(f"Total size: {original_size} characters. Top-level keys: {list(context.keys())}")
        print("=" * 80 + "\n")

        intent_guidance = {
            "appointment_summary": "Prioritize discussion summaries, chief complaints, dates, and appointment sequence. Include full transcript excerpts where useful.",
            "test_analysis": "Prioritize test names, values, units, normal ranges, dates. Include report/file URIs and document IDs. Keep discussion summary brief.",
            "report_analysis": "Prioritize report file names, URIs, key findings, dates. Preserve all links. Keep discussion summary and chief complaints.",
            "diagnosis_reasoning": "Prioritize diagnoses (ICD, confidence), chief complaints, symptoms, test results, discussion summaries. Include clinical reasoning cues.",
            "time_series_analysis": "Prioritize metric values over time, trends, anomalies. Include appointment dates and relevant test/time-series data.",
            "general_inquiry": "Balance user info, medical history, discussion summaries, and appointment-wise data. Include all important facts.",
        }
        guidance = intent_guidance.get(intent, intent_guidance["general_inquiry"])

        compression_prompt = (
            "You are a medical context formatter. Your output will be passed to Med42 to answer doctor questions.\n\n"
            "OUTPUT FORMAT (use these exact section headers, plain text only; no JSON, no markdown code blocks):\n\n"
            "## USER INFO\n"
            "Patient demographics: name, age, gender, relevant identifiers. Keep concise.\n\n"
            "## MEDICAL HISTORY\n"
            "Relevant medical history, allergies, chronic conditions, medications. Bullet points or short paragraphs.\n\n"
            "## DISCUSSION SUMMARY (TRANSCRIPT)\n"
            "Condensed discussion/transcript content. Organize by appointment when relevant. Preserve key clinical points, symptoms, and decisions.\n\n"
            "## APPOINTMENT-WISE DATA\n"
            "For each appointment (baseline, follow-ups, current):\n"
            "- Appointment ID, date, type (baseline/follow-up).\n"
            "- Chief complaint.\n"
            "- Discussion summary and key transcript points.\n"
            "- Tests: names, values, units, normal ranges; include document IDs or URIs if present.\n"
            "- Reports: file names, URIs, key findings.\n"
            "- Diagnoses (if any).\n"
            "Preserve ALL URIs, file names, and document references exactly.\n\n"
            "RULES:\n"
            "1. Stay within " + str(max_chars) + " characters total.\n"
            "2. Preserve all factual data: dates, IDs, values, links, file names.\n"
            "3. Intent for this request: " + intent + ". " + guidance + "\n"
            "4. Be concise but complete. Med42 must infer from this alone.\n"
            "5. Output ONLY the four sections above, no preamble or footer.\n\n"
            "RAW CONTEXT (JSON):\n"
        ) + original_json

        from langchain_core.messages import HumanMessage, SystemMessage

        messages = [
            SystemMessage(
                content="You format patient context into structured text: User Info, Medical History, Discussion Summary (transcript), Appointment-wise data. Output plain text only, no JSON."
            ),
            HumanMessage(content=compression_prompt),
        ]

        response = gemini_llm.invoke(messages)
        out = response.content if hasattr(response, "content") else str(response)
        if not isinstance(out, str):
            out = str(out)

        import re
        out = re.sub(r"```\s*(?:json)?\s*", "", out)
        out = re.sub(r"```\s*$", "", out, flags=re.MULTILINE)
        out = out.strip()

        compressed_size = len(out)
        ratio = (1 - compressed_size / original_size) * 100 if original_size > 0 else 0
        print(f"✅ Gemini formatting done: {original_size} → {compressed_size} chars ({ratio:.1f}% reduction)")

        print("\n" + "=" * 80)
        print("📦 FORMATTED CONTEXT (AFTER GEMINI):")
        print("=" * 80)
        print(f"Total size: {compressed_size} characters")
        print(f"\n📄 Full formatted context:\n{out}")
        print("=" * 80 + "\n")

        if compressed_size > max_chars * 1.2:
            print(f"⚠️  Formatted context still large ({compressed_size} chars), using intelligent truncation...")
            return _intelligent_truncate_context(context, intent, max_chars)

        return out

    except Exception as e:
        print(f"⚠️  Error in Gemini formatting: {e}")
        import traceback
        traceback.print_exc()
        print("🔄 Falling back to intelligent truncation...")
        return _intelligent_truncate_context(context, intent, max_chars)


async def build_chatbot_prompt_async(intent: str, context: dict, question: str, conversation_history: Optional[list] = None) -> ChatPromptTemplate:
    """
    Build a context-specific prompt based on intent (async version with Gemini compression).
    
    Args:
        intent: The classified intent
        context: The retrieved database context
        question: The doctor's question
        conversation_history: Previous conversation messages for context
        
    Returns:
        ChatPromptTemplate with appropriate prompt
    """
    
    # For PDF queries, format PDF chunks differently
    if intent == "pdf_query" and "pdf_context" in context:
        # Format PDF context with relevant chunks
        pdf_context = context["pdf_context"]
        relevant_chunks = pdf_context.get("relevant_chunks", [])
        
        # Build formatted PDF context
        pdf_context_text = f"PDF Document ID: {pdf_context.get('pdf_document_id', 'unknown')}\n\n"
        pdf_context_text += "Relevant sections from the PDF:\n\n"
        
        for idx, chunk in enumerate(relevant_chunks, 1):
            pdf_context_text += f"[Section {idx} - Page {chunk.get('page_number', 'N/A')}]\n"
            pdf_context_text += f"Text: {chunk.get('text', '')}\n"
            pdf_context_text += f"Coordinates: x0={chunk.get('coordinates', {}).get('x0', 'N/A')}, "
            pdf_context_text += f"y0={chunk.get('coordinates', {}).get('y0', 'N/A')}, "
            pdf_context_text += f"x1={chunk.get('coordinates', {}).get('x1', 'N/A')}, "
            pdf_context_text += f"y1={chunk.get('coordinates', {}).get('y1', 'N/A')}\n"
            pdf_context_text += f"Relevance Score: {chunk.get('score', 0):.4f}\n\n"
        
        context_json_raw = pdf_context_text
    else:
        # Convert to JSON first
        context_json_raw = json.dumps(context, indent=2, default=str)
        
        # Format context as User Info, Medical History, Discussion Summary, Appointment-wise data (≤12000 chars)
        MAX_CONTEXT_CHARS = 12000
        
        if len(context_json_raw) > MAX_CONTEXT_CHARS:
            print(f"📦 Context too large ({len(context_json_raw)} chars), formatting with Gemini...")
            context_json_raw = await compress_context_with_gemini(context, intent, MAX_CONTEXT_CHARS)
        else:
            # Small enough: produce same structured format locally (no Gemini)
            print(f"✅ Context size OK ({len(context_json_raw)} chars), building structured format...")
            context_json_raw = _intelligent_truncate_context(context, intent, MAX_CONTEXT_CHARS)
    
    return _build_prompt_from_context(intent, context_json_raw, question, conversation_history)


def build_chatbot_prompt(intent: str, context: dict, question: str, conversation_history: Optional[list] = None) -> ChatPromptTemplate:
    """
    Build a context-specific prompt based on intent (synchronous wrapper).
    Uses asyncio to call the async version.
    
    Args:
        intent: The classified intent
        context: The retrieved database context
        question: The doctor's question
        conversation_history: Previous conversation messages for context
        
    Returns:
        ChatPromptTemplate with appropriate prompt
    """
    try:
        # Try to get existing event loop
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If loop is running, we can't use run_until_complete; use structured format locally
            print("⚠️  Event loop is running, building structured format locally (use async version)")
            context_json_raw = _intelligent_truncate_context(context, intent, 12000)
            return _build_prompt_from_context(intent, context_json_raw, question, conversation_history)
        else:
            return loop.run_until_complete(build_chatbot_prompt_async(intent, context, question, conversation_history))
    except RuntimeError:
        # No event loop, create one
        return asyncio.run(build_chatbot_prompt_async(intent, context, question, conversation_history))


def _build_prompt_from_context(intent: str, context_json_raw: str, question: str, conversation_history: Optional[list] = None) -> ChatPromptTemplate:
    """
    Build prompt from already-formatted context (User Info, Medical History, Discussion Summary, Appointment-wise data).
    """
    # Escape curly braces for .format() - double them so they're treated as literals
    context_json = context_json_raw.replace("{", "{{").replace("}", "}}")
    
    intent_specific_instructions = {
        "appointment_summary": """
Focus on:
- Appointment sequence (current and previous appointments: -2, -1, -0)
- Appointment dates, times, and statuses
- Chief complaints across appointments
- Discussion summaries and notes from all appointments in sequence
- Any diagnoses mentioned
- Reports and tests associated with appointments
- Patient medical history (always available)
""",
        "test_analysis": """
Focus on:
- Test names and values from current and previous appointments
- Test descriptions and results
- Abnormal values (if any)
- Test dates and context
- Trends across appointment sequence
- Patient medical history (always available)
""",
        "report_analysis": """
Focus on:
- Report summaries from current and previous appointments
- Report file names
- Key findings mentioned in reports
- Report dates and context
- Patient medical history (always available)
""",
        "diagnosis_reasoning": """
Focus on:
- Diagnoses (both generated and doctor's) from appointment sequence
- Chief complaints and symptoms across appointments
- Test results that support diagnosis
- Patient medical history (always available) - critical for diagnosis reasoning
- Discussion summaries from all appointments
- Clinical reasoning based on available data across appointments
""",
        "time_series_analysis": """
Focus on:
- Metric values over time
- Trends and patterns
- Anomalous values
- Progress or deterioration
- Specific time periods mentioned
- Patient medical history (always available)
""",
        "general_inquiry": """
Focus on:
- Patient basic information
- Patient medical history (always available)
- Appointment sequence (current and previous: -2, -1, -0)
- Discussion summaries from all appointments
- Any relevant data from the database
""",
        "pdf_query": """
Focus on:
- ONLY use information from the uploaded PDF document provided in the context
- Reference specific page numbers and sections when citing information
- If the question cannot be answered from the PDF, explicitly state that the information is not available in the uploaded document
- Do NOT use any database information - only the PDF content
- Cite page numbers when providing information
"""
    }
    
    intent_instruction = intent_specific_instructions.get(intent, "")
    
    # Build system message using .format() to properly handle JSON with curly braces
    # We can't use f-strings because JSON contains { and } which conflict with f-string syntax
    system_template = """{anti_hallucination_prompt}

INTENT: {intent}
{intent_instruction}

DATABASE CONTEXT:
{context_json}

Remember: Only use information from the DATABASE CONTEXT above. If information is not present, explicitly state it is not available."""
    
    system_message = system_template.format(
        anti_hallucination_prompt=ANTI_HALLUCINATION_SYSTEM_PROMPT,
        intent=intent,
        intent_instruction=intent_instruction,
        context_json=context_json  # Use original JSON, not escaped version
    )
    
    # Build messages list with system message, conversation history, and current question
    messages = [("system", system_message)]
    
    # Add conversation history if provided
    # Limit to last 5 messages to avoid token limits
    if conversation_history:
        # Take only the last 5 messages to stay within token limits
        recent_history = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
        
        for msg in recent_history:
            role = msg.get("role") if isinstance(msg, dict) else getattr(msg, "role", None)
            content = msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", None)
            
            # Skip if role or content is missing
            if not role or not content:
                continue
            
            # Truncate very long messages to avoid token limits
            # Limit each message to ~500 characters (~125 tokens)
            MAX_MESSAGE_LENGTH = 500
            content_str = str(content)
            if len(content_str) > MAX_MESSAGE_LENGTH:
                content_str = content_str[:MAX_MESSAGE_LENGTH] + "... (message truncated)"
            
            # Escape curly braces in content to prevent template variable interpretation
            # Replace { with {{ and } with }} to make them literal
            # This prevents ChatPromptTemplate from interpreting {error} or {question} as variables
            escaped_content = content_str.replace("{", "{{").replace("}", "}}")
                
            if role == "user":
                messages.append(("human", escaped_content))
            elif role == "assistant":
                messages.append(("assistant", escaped_content))
    
    # Add current question
    messages.append(("human", "Doctor's Question: {question}\n\nProvide a clear, evidence-based answer using ONLY the database context provided above. If this question refers to previous messages in our conversation, you may reference them, but always base your answer on the database context."))
    
    prompt = ChatPromptTemplate.from_messages(messages)
    return prompt
