"""
Strict Anti-Hallucination Prompts for Doctor Chatbot
Ensures LLM only uses provided database context
"""

from langchain_core.prompts import ChatPromptTemplate

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

Remember: Your credibility depends on accuracy. Never invent data."""


def build_chatbot_prompt(intent: str, context: dict, question: str) -> ChatPromptTemplate:
    """
    Build a context-specific prompt based on intent.
    
    Args:
        intent: The classified intent
        context: The retrieved database context
        question: The doctor's question
        
    Returns:
        ChatPromptTemplate with appropriate prompt
    """
    
    # Format context as JSON string for the prompt
    import json
    context_json_raw = json.dumps(context, indent=2, default=str)
    # Escape curly braces in JSON for .format() - double them so they're treated as literals
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
"""
    }
    
    intent_instruction = intent_specific_instructions.get(intent, "")
    
    # Build system message using .format() to properly handle JSON with curly braces
    # We can't use f-strings because JSON contains { and } which conflict with f-string syntax
    system_template = """{anti_hallucination_prompt}

INTENT: {intent}
{intent_instruction}

DATABASE CONTEXT (JSON):
{context_json}

Remember: Only use information from the DATABASE CONTEXT above. If information is not present, explicitly state it is not available."""
    
    system_message = system_template.format(
        anti_hallucination_prompt=ANTI_HALLUCINATION_SYSTEM_PROMPT,
        intent=intent,
        intent_instruction=intent_instruction,
        context_json=context_json  # Use original JSON, not escaped version
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", "Doctor's Question: {question}\n\nProvide a clear, evidence-based answer using ONLY the database context provided above.")
    ])
    print(prompt)
    return prompt
