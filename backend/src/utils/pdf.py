"""
PDF text extraction utilities
"""

import tempfile
import os
import io
import shutil
from fastapi import UploadFile
import PyPDF2


def extract_text_from_pdf_ocr_fallback(file_path: str) -> str:
    """
    Fallback OCR using Tesseract when PDF has no extractable text (e.g. image-only/scanned).
    Converts each page to an image, runs Tesseract OCR, and returns combined text.

    Requires: pymupdf (fitz), pytesseract, Pillow. System: Tesseract OCR installed.

    Args:
        file_path: Path to the PDF file.

    Returns:
        Extracted text from OCR, or empty string on failure.
    """
    try:
        import fitz  # PyMuPDF
        from PIL import Image
        import pytesseract
    except ImportError as e:
        return f"OCR fallback unavailable (missing deps): {e}"

    tesseract_cmd = shutil.which("tesseract")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    else:
        return "OCR fallback unavailable (Tesseract not found in PATH; install it and ensure 'tesseract' is available)"

    try:
        text_parts = []
        with fitz.open(file_path) as doc:
            num_pages = len(doc)
            print(f"[OCR fallback] Processing {num_pages} page(s) from {file_path!r}")
            for page_num in range(num_pages):
                page = doc[page_num]
                pix = page.get_pixmap(dpi=150, alpha=False)
                png_bytes = pix.tobytes("png")
                img = Image.open(io.BytesIO(png_bytes))
                page_text = pytesseract.image_to_string(img)
                if page_text and page_text.strip():
                    text_parts.append(page_text.strip())
        out = "\n\n".join(text_parts) if text_parts else ""
        print(f"[OCR fallback] Extracted {len(out)} chars from {num_pages} page(s)")
        return out
    except Exception as e:
        msg = f"Error during OCR fallback: {str(e)}"
        print(f"[OCR fallback] {msg}")
        return msg


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
