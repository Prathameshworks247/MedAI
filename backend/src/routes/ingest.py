"""
Medical Data Ingestion Routes using LangChain Tools
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
import tempfile
import os

from src.services.agent import process_medical_document

router = APIRouter()


@router.post("/document/{appointment_id}")
async def ingest_document(
    appointment_id: str,
    patient_id: str = Query(...),
    file: UploadFile = File(...)
):
    """
    Ingest a medical document (PDF) and extract structured clinical information.
    
    Uses LangChain Tools:
    1. extract_text_from_pdf - Extract text from PDF
    2. extract_clinical_info - Extract structured data using LLM
    3. save_to_mongo - Save to MongoDB collections
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Process using the agent pipeline
            result = await process_medical_document(
                document_text=None,  # Will extract from PDF
                patient_id=patient_id,
                appointment_id=appointment_id,
                file_path=tmp_file_path,
                file_name=file.filename,
                file_content=content
            )
            
            if result["errors"]:
                extracted = result.get("extracted_text") or ""
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "message": "Errors occurred during processing",
                        "errors": result["errors"],
                        "partial_results": {
                            "extracted_text_length": len(extracted),
                            "extracted_info": result.get("extracted_info"),
                            "save_result": result.get("save_result")
                        }
                    }
                )
            
            extracted = result.get("extracted_text") or ""
            return {
                "status": "success",
                "message": "Document processed and saved successfully",
                "results": {
                    "text_extracted": len(extracted) > 0,
                    "info_extracted": result.get("extracted_info") is not None,
                    "saved_to_db": result.get("save_result") is not None
                }
            }
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in ingest_document: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )


@router.post("/transcript/{appointment_id}")
async def ingest_transcript(
    appointment_id: str,
    patient_id: str = Query(...),
    transcript: str = Query(...)
):
    """
    Ingest a speech transcript (from consultation audio) and extract structured clinical information.
    
    Uses LangChain Tools:
    1. extract_clinical_info - Extract structured data from transcript
    2. save_to_mongo - Save to MongoDB collections
    """
    try:
        if not transcript or len(transcript.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transcript text is required"
            )
        
        # Process using the agent pipeline
        result = await process_medical_document(
            document_text=transcript,
            patient_id=patient_id,
            appointment_id=appointment_id,
            file_path=None  # No PDF file
        )
        
        if result["errors"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "message": "Errors occurred during processing",
                    "errors": result["errors"],
                    "partial_results": {
                        "extracted_info": result.get("extracted_info"),
                        "save_result": result.get("save_result")
                    }
                }
            )
        
        return {
            "status": "success",
            "message": "Transcript processed and saved successfully",
            "results": {
                "info_extracted": result.get("extracted_info") is not None,
                "saved_to_db": result.get("save_result") is not None,
                "extracted_data": result.get("extracted_info")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in ingest_transcript: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process transcript: {str(e)}"
        )


@router.post("/text/{appointment_id}")
async def ingest_text(
    appointment_id: str,
    patient_id: str = Query(...),
    text: str = Query(...)
):
    """
    Ingest raw text (from notes, forms, etc.) and extract structured clinical information.
    
    Uses LangChain Tools:
    1. extract_clinical_info - Extract structured data from text
    2. save_to_mongo - Save to MongoDB collections
    """
    try:
        if not text or len(text.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text content is required"
            )
        
        # Process using the agent pipeline
        result = await process_medical_document(
            document_text=text,
            patient_id=patient_id,
            appointment_id=appointment_id,
            file_path=None 
        )
        
        if result["errors"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "message": "Errors occurred during processing",
                    "errors": result["errors"],
                    "partial_results": {
                        "extracted_info": result.get("extracted_info"),
                        "save_result": result.get("save_result")
                    }
                }
            )
        
        return {
            "status": "success",
            "message": "Text processed and saved successfully",
            "results": {
                "info_extracted": result.get("extracted_info") is not None,
                "saved_to_db": result.get("save_result") is not None,
                "extracted_data": result.get("extracted_info")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in ingest_text: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process text: {str(e)}"
        )
