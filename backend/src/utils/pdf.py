"""
PDF text extraction utilities
"""

import tempfile
import os
from fastapi import UploadFile
import PyPDF2


async def extract_text_from_pdf_bytes(contents: bytes) -> str:
    """
    Extract text from an uploaded PDF file.
    
    Args:
        file: FastAPI UploadFile object
        
    Returns:
        Extracted text as string
    """
    try:
        import pdfplumber
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(contents)
            tmp_file_path = tmp_file.name
        
        try:
            text_content = []
            with pdfplumber.open(tmp_file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
            
            return "\n".join(text_content)
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except ImportError:
        # Fallback if pdfplumber not installed
        try:            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(contents)
                tmp_file_path = tmp_file.name
            
            try:
                text_content = []
                with open(tmp_file_path, "rb") as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    for page in pdf_reader.pages:
                        text_content.append(page.extract_text())
                return "\n".join(text_content)
            finally:
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
        except Exception as e:
            return f"Error extracting PDF text: {str(e)}"
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"
