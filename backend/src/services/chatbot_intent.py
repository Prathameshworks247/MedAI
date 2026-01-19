"""
Intent Classification Service for Doctor Chatbot
Uses Featherless AI to classify doctor questions into specific intents
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import Literal
import os

from src.config import FEATHERLESS_API_KEY

if not FEATHERLESS_API_KEY:
    raise ValueError("FEATHERLESS_API_KEY environment variable is required. Get your API key from https://featherless.ai")

# Initialize Featherless AI for intent classification - use same model as main LLM
intent_llm = ChatOpenAI(
    model="m42-health/Llama3-Med42-70B",  # Medical-focused model
    temperature=0,
    base_url="https://api.featherless.ai/v1",
    api_key=FEATHERLESS_API_KEY or "",  # Ensure string type
    timeout=60
)


class IntentClassification(BaseModel):
    """Intent classification result"""
    intent: Literal[
        "appointment_summary",
        "test_analysis",
        "report_analysis",
        "diagnosis_reasoning",
        "time_series_analysis",
        "general_inquiry"
    ] = Field(..., description="The classified intent of the doctor's question")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0 and 1")


INTENT_CLASSIFICATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a medical intent classification system for a doctor's clinical AI assistant.

Your task is to classify doctor questions into one of these specific intents:

1. **appointment_summary**: Questions about appointment details, consultation summary, chief complaint, discussion notes
   - Examples: "What was discussed in the last appointment?", "Summarize the consultation", "What was the chief complaint?"

2. **test_analysis**: Questions about lab tests, test results, test values, test interpretations
   - Examples: "What are the test results?", "Analyze the lab values", "Are there any abnormal tests?", "What does this test mean?"

3. **report_analysis**: Questions about medical reports, imaging reports, document summaries
   - Examples: "What's in the report?", "Summarize the imaging report", "What did the report say?"

4. **diagnosis_reasoning**: Questions about diagnosis, differential diagnosis, clinical reasoning, patient condition
   - Examples: "What's the diagnosis?", "Why was this diagnosis made?", "What are the differential diagnoses?", "Explain the clinical reasoning"

5. **time_series_analysis**: Questions about trends, vitals over time, lab trends, progress tracking
   - Examples: "How has blood pressure changed?", "Show me the trends", "Is the patient improving?", "What are the vitals over time?"

6. **general_inquiry**: General questions that don't fit the above categories
   - Examples: "Who is this patient?", "What medications are they on?"

{format_instructions}

The confidence should be between 0.0 and 1.0, where 1.0 means very confident."""),
    ("human", "Classify this doctor's question: {question}")
])


async def classify_intent(question: str) -> IntentClassification:
    """
    Classify the intent of a doctor's question.
    
    Args:
        question: The doctor's question
        
    Returns:
        IntentClassification with intent and confidence
    """
    try:
        # Create parser
        parser = PydanticOutputParser(pydantic_object=IntentClassification)
        
        # Update prompt to include format instructions
        format_instructions = parser.get_format_instructions()
        prompt_with_format = INTENT_CLASSIFICATION_PROMPT.partial(format_instructions=format_instructions)
        # print(prompt_with_format)
        # Create chain with parser
        chain = prompt_with_format | intent_llm | parser
        
        # Get response (already parsed)
        result = chain.invoke({"question": question, "format_instructions": format_instructions})
        return result
            
    except Exception as e:
        print(f"Error classifying intent: {e}")
        import traceback
        traceback.print_exc()
        # Default to general_inquiry if classification fails
        return IntentClassification(intent="general_inquiry", confidence=0.5)