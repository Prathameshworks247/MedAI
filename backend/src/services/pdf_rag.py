"""
PDF RAG Service with Coordinate Extraction and FAISS Vector Store
Extracts text with x,y coordinates for citation highlighting
"""
import os
import tempfile
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import numpy as np
from fastapi import UploadFile

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

try:
    import faiss
    from langchain_community.vectorstores import FAISS
    from langchain_community.embeddings import HuggingFaceEmbeddings
    # Try new location first (langchain-text-splitters package)
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError:
        # Fallback to old location
        from langchain.text_splitter import RecursiveCharacterTextSplitter
    FAISS_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  FAISS dependencies import error: {e}")
    FAISS_AVAILABLE = False

# No API key needed - using local HuggingFace embeddings


class PDFChunk:
    """Represents a chunk of text with its coordinates"""
    def __init__(
        self,
        text: str,
        page_number: int,
        x0: float,
        y0: float,
        x1: float,
        y1: float,
        chunk_index: int
    ):
        self.text = text
        self.page_number = page_number
        self.x0 = x0  # Left coordinate
        self.y0 = y0  # Top coordinate
        self.x1 = x1  # Right coordinate
        self.y1 = y1  # Bottom coordinate
        self.chunk_index = chunk_index
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "page_number": self.page_number,
            "coordinates": {
                "x0": self.x0,
                "y0": self.y0,
                "x1": self.x1,
                "y1": self.y1
            },
            "chunk_index": self.chunk_index
        }


class PDFRAGService:
    """Service for PDF processing with RAG and coordinate tracking"""
    
    def __init__(self):
        if not FAISS_AVAILABLE:
            raise ImportError("FAISS and required dependencies are not available. Please install faiss-cpu and langchain-community.")
        
        # Use HuggingFace embeddings (sentence-transformers) - free, local, no API key needed
        # Using a lightweight model for fast embeddings
        try:
            print("🔧 Loading embedding model (this may take a moment on first run - downloading ~80MB)...")
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",  # Lightweight, fast model
                model_kwargs={'device': 'cpu'},  # Use CPU (change to 'cuda' if GPU available)
                encode_kwargs={'normalize_embeddings': True}  # Normalize for better similarity search
            )
            # Test the embeddings to make sure they work
            test_embedding = self.embeddings.embed_query("test")
            print(f"✅ Embedding model loaded successfully (embedding dimension: {len(test_embedding)})")
        except ImportError as e:
            error_msg = f"Missing dependency: {e}. Please install: pip install sentence-transformers torch"
            print(f"❌ {error_msg}")
            raise ImportError(error_msg) from e
        except Exception as e:
            error_msg = f"Error loading embedding model: {e}. Make sure sentence-transformers is installed: pip install sentence-transformers"
            print(f"❌ {error_msg}")
            import traceback
            traceback.print_exc()
            raise RuntimeError(error_msg) from e
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self.vector_stores: Dict[str, FAISS] = {}  # Store FAISS indices by document ID
        self.chunk_stores: Dict[str, List[PDFChunk]] = {}  # Store chunks by document ID
    
    async def process_pdf(
        self,
        file: UploadFile,
        document_id: str
    ) -> Dict[str, Any]:
        """
        Process PDF file: extract text with coordinates, chunk, and create vector store.
        
        Args:
            file: Uploaded PDF file
            document_id: Unique identifier for this document
            
        Returns:
            Dictionary with processing results
        """
        if not PDFPLUMBER_AVAILABLE:
            raise ImportError("pdfplumber is required for PDF processing")
        
        if not FAISS_AVAILABLE:
            raise ImportError("faiss-cpu and langchain-community are required for vector store")
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract text with coordinates
            chunks = []
            all_texts = []
            
            with pdfplumber.open(tmp_file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    # Extract text from page
                    page_text = page.extract_text()
                    
                    if not page_text:
                        continue
                    
                    # Get page dimensions for coordinate calculation
                    page_width = page.width
                    page_height = page.height
                    
                    # Split text into chunks
                    text_chunks = self.text_splitter.split_text(page_text)
                    
                    # Create chunks with approximate coordinates
                    # Since we're using text_splitter, we'll estimate coordinates based on position in text
                    for chunk_idx, chunk_text in enumerate(text_chunks):
                        # Estimate coordinates - divide page into sections based on chunk position
                        # This is an approximation since text_splitter doesn't preserve exact positions
                        # For more accurate coordinates, we'd need to track word positions during splitting
                        estimated_y = (chunk_idx / len(text_chunks)) * page_height if text_chunks else 0
                        
                        chunk = PDFChunk(
                            text=chunk_text,
                            page_number=page_num,
                            x0=0,  # Left margin
                            y0=estimated_y,
                            x1=page_width,  # Right margin
                            y1=estimated_y + (page_height / len(text_chunks)) if text_chunks else page_height,
                            chunk_index=len(chunks)
                        )
                        chunks.append(chunk)
                        all_texts.append(chunk_text)
            
            # Create FAISS vector store
            if all_texts:
                vector_store = FAISS.from_texts(
                    texts=all_texts,
                    embedding=self.embeddings
                )
                
                # Store vector store and chunks
                self.vector_stores[document_id] = vector_store
                self.chunk_stores[document_id] = chunks
                
                return {
                    "document_id": document_id,
                    "file_name": file.filename,
                    "total_chunks": len(chunks),
                    "total_pages": max([chunk.page_number for chunk in chunks]) if chunks else 0,
                    "status": "processed"
                }
            else:
                raise ValueError("No text extracted from PDF")
                
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    
    async def search(
        self,
        document_id: str,
        query: str,
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant chunks in the PDF using semantic search.
        
        Args:
            document_id: Document ID to search in
            query: Search query
            k: Number of results to return
            
        Returns:
            List of relevant chunks with metadata
        """
        if document_id not in self.vector_stores:
            raise ValueError(f"Document {document_id} not found. Please upload and process the PDF first.")
        
        vector_store = self.vector_stores[document_id]
        chunks = self.chunk_stores[document_id]
        
        # Perform similarity search
        docs_with_scores = vector_store.similarity_search_with_score(query, k=k)
        
        results = []
        for doc, score in docs_with_scores:
            # Find the corresponding chunk
            chunk_text = doc.page_content
            chunk = next(
                (c for c in chunks if c.text == chunk_text or chunk_text in c.text),
                None
            )
            
            if chunk:
                results.append({
                    "text": chunk.text,
                    "page_number": chunk.page_number,
                    "coordinates": {
                        "x0": chunk.x0,
                        "y0": chunk.y0,
                        "x1": chunk.x1,
                        "y1": chunk.y1
                    },
                    "score": float(score),
                    "chunk_index": chunk.chunk_index
                })
        
        return results
    
    def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all chunks for a document"""
        if document_id not in self.chunk_stores:
            return []
        
        return [chunk.to_dict() for chunk in self.chunk_stores[document_id]]
    
    def delete_document(self, document_id: str):
        """Delete a document and its vector store"""
        if document_id in self.vector_stores:
            del self.vector_stores[document_id]
        if document_id in self.chunk_stores:
            del self.chunk_stores[document_id]


# Global instance - only create if dependencies are available
pdf_rag_service = None
if FAISS_AVAILABLE:
    try:
        print("🔧 Initializing PDF RAG service...")
        pdf_rag_service = PDFRAGService()
        print("✅ PDF RAG service initialized successfully")
    except Exception as e:
        print(f"❌ Warning: Could not initialize PDF RAG service: {e}")
        import traceback
        traceback.print_exc()
        pdf_rag_service = None
else:
    print("⚠️  PDF RAG service not available: FAISS dependencies not installed")
    print("   Please install: pip install faiss-cpu langchain-community")
