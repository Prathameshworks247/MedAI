from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import Optional
from pydantic import BaseModel, Field
import uuid

from src.db import user_collection, chat_history_collection
from datetime import datetime
from bson import ObjectId
from src.middlewares.auth import check_doctor_exists
from src.services.chatbot_intent import classify_intent
from src.services.chatbot_context import build_chatbot_context, verify_doctor_patient_access
from src.services.chatbot_prompts import build_chatbot_prompt_async
from src.services.pdf_rag import pdf_rag_service, FAISS_AVAILABLE
from src.llm.featherless import llm

router = APIRouter()


# Request/Response Models
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")

class ChatRequest(BaseModel):
    question: str = Field(..., description="The doctor's question about the patient")
    patient_id: str = Field(..., description="Patient ID to query")
    appointment_id: str = Field(..., description="Appointment ID (required) - chatbot is appointment-specific. Context includes current appointment and previous 2 appointments + base")
    conversation_history: Optional[list[ChatMessage]] = Field(default=[], description="Previous conversation messages for context")
    pdf_document_id: Optional[str] = Field(default=None, description="Optional PDF document ID to use for context (if provided, only PDF context is used)")
    chat_id: Optional[str] = Field(default=None, description="Chat history ID to save messages to")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="The AI assistant's answer")
    intent: str = Field(..., description="The classified intent of the question")
    confidence: float = Field(..., description="Confidence score of intent classification")
    context_used: dict = Field(..., description="Summary of database context used")
    citations: Optional[list[dict]] = Field(default=[], description="PDF citations with page numbers and coordinates")
    chat_id: Optional[str] = Field(default=None, description="Chat history ID for saving messages")


class ChatHistoryRequest(BaseModel):
    chat_id: Optional[str] = Field(default=None, description="Chat ID (if updating existing chat)")
    appointment_id: str = Field(..., description="Appointment ID")
    patient_id: str = Field(..., description="Patient ID")
    title: str = Field(..., description="Chat title")
    messages: list[ChatMessage] = Field(..., description="List of messages in the chat")


class ChatHistoryResponse(BaseModel):
    chat_id: str = Field(..., description="Chat history ID")
    appointment_id: str = Field(..., description="Appointment ID")
    patient_id: str = Field(..., description="Patient ID")
    title: str = Field(..., description="Chat title")
    messages: list[ChatMessage] = Field(..., description="List of messages")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")


class PDFUploadResponse(BaseModel):
    document_id: str = Field(..., description="Unique document ID for referencing in chat")
    file_name: str = Field(..., description="Original file name")
    total_chunks: int = Field(..., description="Number of text chunks created")
    total_pages: int = Field(..., description="Total pages in PDF")
    status: str = Field(..., description="Processing status")


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
        
        # Step 3: Build context - use PDF if provided, otherwise use MongoDB
        pdf_context = None
        citations = []
        context = None  # Initialize context variable
        
        if request.pdf_document_id:
            # Use PDF context only
            if pdf_rag_service is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="PDF RAG service is not available. Please install required dependencies: faiss-cpu, langchain-community"
                )
            
            print(f"📄 Using PDF context from document: {request.pdf_document_id}")
            try:
                search_results = await pdf_rag_service.search(
                    document_id=request.pdf_document_id,
                    query=question,
                    k=5
                )
                
                # Build context from PDF search results
                pdf_context = {
                    "pdf_document_id": request.pdf_document_id,
                    "relevant_chunks": search_results
                }
                
                # Extract citations
                citations = [
                    {
                        "page_number": result["page_number"],
                        "coordinates": result["coordinates"],
                        "text_preview": result["text"][:200] + "..." if len(result["text"]) > 200 else result["text"],
                        "score": result["score"]
                    }
                    for result in search_results
                ]
                
                print(f"✅ Found {len(search_results)} relevant chunks from PDF")
            except Exception as e:
                print(f"⚠️ Error searching PDF: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error searching PDF: {str(e)}"
                )
        else:
            # Use MongoDB context
            print(f"📊 Building context for intent: {intent}")
            context = await build_chatbot_context(
                intent=intent,
                patient_id=patient_id,
                appointment_id=request.appointment_id
            )
            print(f"✅ Context built: {len(str(context))} characters")
        
        # Step 4: Build prompt with strict anti-hallucination instructions and conversation history
        if pdf_context:
            # Use PDF context only
            prompt = await build_chatbot_prompt_async(
                intent="pdf_query",
                context={"pdf_context": pdf_context},
                question=question,
                conversation_history=request.conversation_history or []
            )
        else:
            # Use MongoDB context
            if context is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to build context"
                )
            prompt = await build_chatbot_prompt_async(
                intent=intent,
                context=context["data"],
                question=question,
                conversation_history=request.conversation_history or []
            )
        
        # Step 5: Generate answer using Featherless AI
        print(f"🤖 Generating answer with Featherless AI...")
        chain = prompt | llm
        response = chain.invoke({"question": question})
        
        answer = response.content if hasattr(response, 'content') else str(response)
        print(f"✅ Answer generated: {len(answer)} characters")
        
        # Step 6: Prepare response
        # Create summary of context used (for transparency)
        if pdf_context:
            context_summary = {
                "intent": "pdf_query",
                "source": "pdf",
                "pdf_document_id": request.pdf_document_id,
                "chunks_used": len(citations)
            }
        else:
            if context is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to build context"
                )
            context_summary = {
                "intent": intent,
                "source": "database",
                "data_keys": list(context["data"].keys()),
                "has_appointment": "appointment" in context["data"] or "appointments" in context["data"],
                "has_patient": "patient" in context["data"],
                "has_tests": "tests" in context["data"],
                "has_reports": "reports" in context["data"],
                "has_time_series": "time_series" in context["data"]
            }
        
        # Ensure answer is a string
        answer_str = str(answer) if answer else "No answer generated"
        
        # Save messages to chat history if chat_id is provided
        chat_id = request.chat_id
        if chat_id:
            try:
                # Get or create chat history
                chat_history = await chat_history_collection.find_one({"_id": chat_id})
                
                # Prepare messages to save
                user_message = ChatMessage(role="user", content=question)
                assistant_message = ChatMessage(role="assistant", content=answer_str)
                
                if chat_history:
                    # Update existing chat
                    updated_messages = chat_history.get("messages", []) + [
                        user_message.dict(),
                        assistant_message.dict()
                    ]
                    await chat_history_collection.update_one(
                        {"_id": chat_id},
                        {
                            "$set": {
                                "messages": updated_messages,
                                "updated_at": datetime.now()
                            }
                        }
                    )
                else:
                    # Create new chat history
                    title = question[:50] if len(question) > 50 else question
                    new_chat = {
                        "_id": chat_id,
                        "doctor_id": doctor_id,
                        "patient_id": patient_id,
                        "appointment_id": request.appointment_id,
                        "title": title,
                        "messages": [user_message.dict(), assistant_message.dict()],
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    }
                    await chat_history_collection.insert_one(new_chat)
                print(f"✅ Chat history saved: {chat_id}")
            except Exception as e:
                print(f"⚠️  Error saving chat history: {e}")
                # Don't fail the request if history save fails
        
        return ChatResponse(
            answer=answer_str,
            intent=intent if not pdf_context else "pdf_query",
            confidence=confidence,
            context_used=context_summary,
            citations=citations,
            chat_id=chat_id
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


@router.post("/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf_for_chat(
    file: UploadFile = File(...),
    doctor: dict = Depends(check_doctor_exists)
):
    """
    Upload a PDF file for chatbot context.
    The PDF will be processed, chunked with coordinates, and stored in FAISS vector store.
    When a PDF document_id is provided in chat requests, only this PDF's context will be used.
    """
    try:
        if pdf_rag_service is None:
            # Check if it's an import issue or initialization issue
            if not FAISS_AVAILABLE:
                error_msg = "PDF RAG service is not available. Dependencies not installed. Please run: pip install faiss-cpu langchain-community sentence-transformers torch"
            else:
                error_msg = "PDF RAG service failed to initialize. Check server startup logs for details. Common causes: missing sentence-transformers package or model download failure. Install with: pip install sentence-transformers torch"
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_msg
            )
        
        # Validate file type
        if not file.filename or not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported"
            )
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Process PDF
        print(f"📄 Processing PDF: {file.filename}")
        result = await pdf_rag_service.process_pdf(file, document_id)
        
        print(f"✅ PDF processed: {result['total_chunks']} chunks from {result['total_pages']} pages")
        
        return PDFUploadResponse(
            document_id=document_id,
            file_name=file.filename or "unknown.pdf",
            total_chunks=result['total_chunks'],
            total_pages=result['total_pages'],
            status=result['status']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF: {str(e)}"
        )


@router.post("/chat/history", response_model=ChatHistoryResponse)
async def save_chat_history(
    request: ChatHistoryRequest,
    doctor: dict = Depends(check_doctor_exists)
):
    """
    Save or update a chat history.
    If chat_id is provided, updates existing chat. Otherwise, creates a new chat.
    """
    try:
        doctor_id = str(doctor["_id"])
        
        # Verify doctor has access to this patient
        has_access = await verify_doctor_patient_access(doctor_id, request.patient_id, appointment_id=request.appointment_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this patient's data."
            )
        
        now = datetime.now()
        
        if request.chat_id:
            # Update existing chat
            chat_id = request.chat_id
            result = await chat_history_collection.update_one(
                {"_id": chat_id, "doctor_id": doctor_id},
                {
                    "$set": {
                        "title": request.title,
                        "messages": [msg.dict() for msg in request.messages],
                        "updated_at": now
                    }
                }
            )
            
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat history not found"
                )
            
            chat_history = await chat_history_collection.find_one({"_id": chat_id})
            if not chat_history:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat history not found"
                )
        else:
            # Create new chat
            chat_id = str(uuid.uuid4())
            new_chat = {
                "_id": chat_id,
                "doctor_id": doctor_id,
                "patient_id": request.patient_id,
                "appointment_id": request.appointment_id,
                "title": request.title,
                "messages": [msg.dict() for msg in request.messages],
                "created_at": now,
                "updated_at": now
            }
            await chat_history_collection.insert_one(new_chat)
            chat_history = new_chat
        
        # Ensure chat_history is not None (type narrowing for linter)
        if not chat_history:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve chat history"
            )
        
        # Type narrowing: chat_history is guaranteed to be dict at this point
        final_history: dict = chat_history
        
        return ChatHistoryResponse(
            chat_id=str(final_history["_id"]),
            appointment_id=final_history["appointment_id"],
            patient_id=final_history["patient_id"],
            title=final_history["title"],
            messages=[ChatMessage(**msg) for msg in final_history["messages"]],
            created_at=final_history["created_at"].isoformat() if isinstance(final_history["created_at"], datetime) else str(final_history["created_at"]),
            updated_at=final_history["updated_at"].isoformat() if isinstance(final_history["updated_at"], datetime) else str(final_history["updated_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving chat history: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save chat history: {str(e)}"
        )


@router.get("/chat/history/{appointment_id}", response_model=list[ChatHistoryResponse])
async def get_chat_histories(
    appointment_id: str,
    doctor: dict = Depends(check_doctor_exists)
):
    """
    Get all chat histories for a specific appointment.
    """
    try:
        doctor_id = str(doctor["_id"])
        
        # Get chat histories for this appointment and doctor
        cursor = chat_history_collection.find({
            "appointment_id": appointment_id,
            "doctor_id": doctor_id
        }).sort("updated_at", -1).limit(50)  # Limit to last 50 chats
        
        histories = await cursor.to_list(length=50)
        
        result = []
        for history in histories:
            result.append(ChatHistoryResponse(
                chat_id=str(history["_id"]),
                appointment_id=history["appointment_id"],
                patient_id=history["patient_id"],
                title=history["title"],
                messages=[ChatMessage(**msg) for msg in history["messages"]],
                created_at=history["created_at"].isoformat() if isinstance(history["created_at"], datetime) else str(history["created_at"]),
                updated_at=history["updated_at"].isoformat() if isinstance(history["updated_at"], datetime) else str(history["updated_at"])
            ))
        
        return result
        
    except Exception as e:
        print(f"❌ Error fetching chat histories: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chat histories: {str(e)}"
        )


@router.delete("/chat/history/{chat_id}")
async def delete_chat_history(
    chat_id: str,
    doctor: dict = Depends(check_doctor_exists)
):
    """
    Delete a chat history.
    """
    try:
        doctor_id = str(doctor["_id"])
        
        result = await chat_history_collection.delete_one({
            "_id": chat_id,
            "doctor_id": doctor_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat history not found"
            )
        
        return {"success": True, "message": "Chat history deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting chat history: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat history: {str(e)}"
        )