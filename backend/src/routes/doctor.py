from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from pydantic import BaseModel, Field

from src.db import user_collection
from src.middlewares.auth import check_doctor_exists
from src.services.chatbot_intent import classify_intent
from src.services.chatbot_context import build_chatbot_context, verify_doctor_patient_access
from src.services.chatbot_prompts import build_chatbot_prompt
from src.llm.featherless import llm

router = APIRouter()


# Request/Response Models
class ChatRequest(BaseModel):
    question: str = Field(..., description="The doctor's question about the patient")
    patient_id: str = Field(..., description="Patient ID to query")
    appointment_id: str = Field(..., description="Appointment ID (required) - chatbot is appointment-specific. Context includes current appointment and previous 2 appointments + base")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="The AI assistant's answer")
    intent: str = Field(..., description="The classified intent of the question")
    confidence: float = Field(..., description="Confidence score of intent classification")
    context_used: dict = Field(..., description="Summary of database context used")


@router.get("/")
async def get_doctors(
    filter: Optional[str] = None,
):
    query: dict = {"role": "doctor"}
    if filter:
        query["$text"] = {"$search": filter}
        cursor = user_collection.find(
            query,
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(10)
    else:
        cursor = user_collection.find(query).limit(10)

    results = await cursor.to_list(length=10)
    
    # Convert ObjectId to string
    for user in results:
        if "_id" in user:
            user["_id"] = str(user["_id"])
            
    return results


@router.post("/chat", response_model=ChatResponse)
async def doctor_chat(
    request: ChatRequest,
    doctor: dict = Depends(check_doctor_exists)
):
    """
    Doctor-only chatbot endpoint for clinical AI assistance.
    
    Flow:
    1. Verify doctor has access to patient
    2. Classify question intent
    3. Fetch relevant MongoDB context
    4. Generate answer using only database context (no hallucination)
    
    The LLM is strictly instructed to:
    - Only use information from the database
    - Never invent or assume data
    - Explicitly state when information is unavailable
    """
    try:
        doctor_id = str(doctor["_id"])
        patient_id = request.patient_id
        question = request.question.strip()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question cannot be empty"
            )
        
        # Step 1: Verify doctor has access to this patient
        has_access = await verify_doctor_patient_access(doctor_id, patient_id, appointment_id=request.appointment_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this patient's data. You must have at least one appointment with this patient."
            )
        
        # Step 2: Classify intent
        print(f"🔍 Classifying intent for question: {question[:100]}...")
        intent_result = await classify_intent(question)
        intent = intent_result.intent
        confidence = intent_result.confidence
        print(f"✅ Classified as: {intent} (confidence: {confidence:.2f})")
        
        # Step 3: Build context from MongoDB
        print(f"📊 Building context for intent: {intent}")
        context = await build_chatbot_context(
            intent=intent,
            patient_id=patient_id,
            appointment_id=request.appointment_id
        )
        print(f"✅ Context built: {len(str(context))} characters")
        
        # Step 4: Build prompt with strict anti-hallucination instructions
        prompt = build_chatbot_prompt(
            intent=intent,
            context=context["data"],
            question=question
        )
        
        # Step 5: Generate answer using Featherless AI
        print(f"🤖 Generating answer with Featherless AI...")
        chain = prompt | llm
        response = chain.invoke({"question": question})
        
        answer = response.content if hasattr(response, 'content') else str(response)
        print(f"✅ Answer generated: {len(answer)} characters")
        
        # Step 6: Prepare response
        # Create summary of context used (for transparency)
        context_summary = {
            "intent": intent,
            "data_keys": list(context["data"].keys()),
            "has_appointment": "appointment" in context["data"] or "appointments" in context["data"],
            "has_patient": "patient" in context["data"],
            "has_tests": "tests" in context["data"],
            "has_reports": "reports" in context["data"],
            "has_time_series": "time_series" in context["data"]
        }
        
        return ChatResponse(
            answer=answer,
            intent=intent,
            confidence=confidence,
            context_used=context_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in doctor_chat: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat request: {str(e)}"
        )