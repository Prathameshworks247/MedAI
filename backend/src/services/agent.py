"""
LangChain Agent for Medical Data Ingestion
Uses a sequential pipeline approach compatible with Gemini
"""

from typing import Optional
import io

from src.r2 import upload_to_r2
from src.services.tools import extract_clinical_info, extract_text_from_pdf, _save_to_mongo_impl


# Create a simple sequential pipeline function
async def process_medical_document(
    document_text: Optional[str],
    patient_id: str,
    appointment_id: str,
    file_path: Optional[str] | None = None,
    file_name: Optional[str] | None = None,
    file_content: bytes = b"",
    is_transcript: bool = False
) -> dict:
    """
    Sequential pipeline to process medical documents using tools.
    
    Args:
        document_text: Text content (if already extracted) or None
        patient_id: Patient MongoDB ID
        appointment_id: Appointment MongoDB ID
        file_path: Optional path to PDF file (if text needs extraction)
        
    Returns:
        Dictionary with processing results
    """
    results = {
        "extracted_text": None,
        "extracted_info": None,
        "save_result": None,
        "errors": []
    }
    
    try:
        # Step 1: Extract text from PDF if file_path provided and no text
        if file_path and not document_text:
            try:
                file_uri = upload_to_r2(io.BytesIO(file_content), file_name or "")
                print(file_uri)
                results["extracted_text"] = extract_text_from_pdf.invoke({"file_path": file_path})
                document_text = f"""
                file name: {file_name}
                
                file uri: {file_uri}

                file content: {results["extracted_text"]}
                """
            except Exception as e:
                error_msg = f"Error extracting PDF text: {str(e)}"
                results["errors"].append(error_msg)
                return results
        
        if not document_text:
            results["errors"].append("No document text provided")
            return results
        
        # Step 2: Extract clinical information
        try:
            results["extracted_info"] = extract_clinical_info.invoke({"document_text": document_text})
        except Exception as e:
            error_msg = f"Error extracting clinical info: {str(e)}"
            results["errors"].append(error_msg)
            return results
        
        # Step 3: Save to MongoDB
        try:
            # Determine if this is a transcript (not a PDF)
            # If file_path is None and document_text is provided, it's likely a transcript
            # Explicit is_transcript flag takes precedence
            is_transcript_flag = is_transcript or (file_path is None and document_text is not None)
            
            results["save_result"] = await _save_to_mongo_impl(
                patient_id=patient_id,
                appointment_id=appointment_id,
                extracted=results["extracted_info"],
                is_transcript=is_transcript_flag
            )
        except Exception as e:
            error_msg = f"Error saving to MongoDB: {str(e)}"
            results["errors"].append(error_msg)
        
        return results
        
    except Exception as e:
        results["errors"].append(f"Unexpected error: {str(e)}")
        return results
