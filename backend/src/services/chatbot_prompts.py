"""
Strict Anti-Hallucination Prompts for Doctor Chatbot
Ensures LLM only uses provided database context
"""

from langchain_core.prompts import ChatPromptTemplate
from typing import Optional

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


def build_chatbot_prompt(intent: str, context: dict, question: str, conversation_history: Optional[list] = None) -> ChatPromptTemplate:
    """
    Build a context-specific prompt based on intent.
    
    Args:
        intent: The classified intent
        context: The retrieved database context
        question: The doctor's question
        conversation_history: Previous conversation messages for context
        
    Returns:
        ChatPromptTemplate with appropriate prompt
    """
    
    # Format context as JSON string for the prompt
    import json
    
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
        # Truncate context if too large to stay within token limits
        # Estimate: ~4 characters per token, so 4096 tokens = ~16KB
        # Reserve space for system prompt (~500 tokens), conversation history (~500 tokens), question (~100 tokens)
        # So we have ~3000 tokens = ~12KB for context
        MAX_CONTEXT_CHARS = 12000
        
        context_json_raw = json.dumps(context, indent=2, default=str)
    
    # Truncate if too large (only for non-PDF contexts)
    if intent != "pdf_query" and len(context_json_raw) > MAX_CONTEXT_CHARS:
        # Try to truncate intelligently - keep structure but reduce content
        truncated = context_json_raw[:MAX_CONTEXT_CHARS]
        # Try to close JSON properly
        if truncated.rstrip().endswith('"'):
            truncated += '"\n... (context truncated due to size limits)'
        elif truncated.rstrip().endswith(','):
            truncated = truncated.rstrip(',') + '\n... (context truncated due to size limits)'
        else:
            truncated += '\n... (context truncated due to size limits)'
        context_json_raw = truncated
        print(f"⚠️  Context truncated from {len(json.dumps(context, indent=2, default=str))} to {len(context_json_raw)} characters")
    
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

DATABASE CONTEXT (JSON):
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
