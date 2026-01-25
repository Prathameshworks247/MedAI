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

try:
    import tiktoken
    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False
    print("⚠️  tiktoken not available. Install with: pip install tiktoken")

# No API key needed - using local HuggingFace embeddings

# Token counting function for chunking
def _count_tokens(text: str) -> int:
    """Count tokens in text using tiktoken (cl100k_base encoding)"""
    if not TIKTOKEN_AVAILABLE:
        # Fallback: approximate token count (roughly 1 token = 4 characters)
        return len(text) // 4
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception as e:
        print(f"⚠️  Error counting tokens, using character approximation: {e}")
        return len(text) // 4


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
    
    # Version marker to verify code is loaded
    CHUNKING_VERSION = "v2.0-force-split-300chars"
    
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
        # Character-based chunking strategy:
        # - Chunk size: 300 characters (target)
        # - Overlap: 50 characters
        # - Max chunk size: 300 characters (hard cap, enforced in post-processing)
        # Using separators optimized for PDF text to ensure proper splitting
        print(f"📦 PDFRAGService initialized with chunking {self.CHUNKING_VERSION}")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=300,  # Target chunk size in characters
            chunk_overlap=50,  # Overlap in characters
            length_function=len,  # Use character count
            separators=["\n\n", "\n", ". ", " ", ""]  # Explicit separators for better splitting
        )
        self.max_chunk_size = 300  # Hard cap: any chunk larger than target size will be split
        self.vector_stores: Dict[str, FAISS] = {}  # Store FAISS indices by document ID
        self.chunk_stores: Dict[str, List[PDFChunk]] = {}  # Store chunks by document ID
    
    def _force_split_text(self, text: str, target_size: int = 300, overlap: int = 50) -> List[str]:
        """
        Force split text into chunks of approximately target_size with overlap.
        This ensures we get more chunks even if RecursiveCharacterTextSplitter merges them.
        """
        if not text or len(text.strip()) == 0:
            return []
        
        text = text.strip()
        text_len = len(text)
        
        if text_len <= target_size:
            return [text]
        
        # Debug: log when we're splitting large text
        if text_len > target_size * 2:
            print(f"      [Force Split] Splitting {text_len} chars into ~{text_len // target_size + 1} chunks")
        
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            # Calculate end position
            end = min(start + target_size, text_len)
            
            # If we're at or past the end, take the rest
            if start >= text_len:
                break
            if end >= text_len:
                remaining = text[start:].strip()
                if remaining:
                    chunks.append(remaining)
                break
            
            # Try to find a good break point (sentence end, newline, or space)
            # Look backwards from end to find a natural break
            break_point = end
            search_start = max(start, end - min(100, target_size // 2))
            
            # First, try to find sentence endings
            for i in range(end, search_start, -1):
                if i < text_len and text[i] in ['.', '!', '?']:
                    # Check if it's followed by space or newline (not a decimal point)
                    if i + 1 < text_len and text[i + 1] in [' ', '\n', '\t']:
                        break_point = i + 1
                        break
            
            # If no sentence ending found, try newline
            if break_point == end:
                for i in range(end, search_start, -1):
                    if i < text_len and text[i] == '\n':
                        break_point = i + 1
                        break
            
            # If still no break found, try space
            if break_point == end:
                for i in range(end, search_start, -1):
                    if i < text_len and text[i] == ' ':
                        break_point = i + 1
                        break
            
            # Extract chunk
            chunk = text[start:break_point].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            if break_point > start:
                start = max(break_point - overlap, start + 1)  # Ensure we make progress
            else:
                # If no break found, force split at target_size
                start = start + target_size
            
            # Safety check to prevent infinite loop
            if start >= text_len:
                break
        
        return chunks if chunks else [text]  # Fallback: return original text if splitting failed
    
    def _split_oversized_chunk(
        self, 
        text: str, 
        page_number: int, 
        x0: float, 
        y0: float, 
        x1: float, 
        y1: float, 
        base_chunk_index: int,
        recursion_depth: int = 0
    ) -> List[PDFChunk]:
        """
        Split a chunk that exceeds max_chunk_size into smaller chunks.
        Returns a list of PDFChunk objects.
        
        Args:
            recursion_depth: Safety check to prevent infinite recursion (max 10 levels)
        """
        # Safety check: prevent infinite recursion
        if recursion_depth > 10:
            print(f"⚠️  Max recursion depth reached for chunk splitting. Forcing split at character level.")
            # Force split at character level
            chunks = []
            chunk_height = (y1 - y0) / (len(text) // self.max_chunk_size + 1) if text else (y1 - y0)
            for i in range(0, len(text), self.max_chunk_size):
                chunk_text = text[i:i + self.max_chunk_size]
                chunk_y0 = y0 + (i // self.max_chunk_size) * chunk_height
                chunk_y1 = y0 + ((i // self.max_chunk_size) + 1) * chunk_height
                chunks.append(PDFChunk(
                    text=chunk_text,
                    page_number=page_number,
                    x0=x0,
                    y0=chunk_y0,
                    x1=x1,
                    y1=chunk_y1,
                    chunk_index=base_chunk_index + (i // self.max_chunk_size)
                ))
            return chunks
        
        chunks = []
        char_count = len(text)
        
        if char_count <= self.max_chunk_size:
            # Chunk is within limit, return as single chunk
            return [PDFChunk(
                text=text,
                page_number=page_number,
                x0=x0,
                y0=y0,
                x1=x1,
                y1=y1,
                chunk_index=base_chunk_index
            )]
        
        # Chunk exceeds limit, split it further
        # Use a smaller splitter for sub-chunking
        sub_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.max_chunk_size,
            chunk_overlap=0,  # No overlap for hard splits
            length_function=len,  # Use character count
            separators=["\n\n", "\n", ". ", " ", ""]  # Same separators
        )
        sub_chunks = sub_splitter.split_text(text)
        
        # Create PDFChunk objects for each sub-chunk
        # Distribute coordinates proportionally
        chunk_height = (y1 - y0) / len(sub_chunks) if sub_chunks else (y1 - y0)
        current_chunk_index = base_chunk_index
        
        for idx, sub_chunk_text in enumerate(sub_chunks):
            sub_y0 = y0 + (idx * chunk_height)
            sub_y1 = y0 + ((idx + 1) * chunk_height) if idx < len(sub_chunks) - 1 else y1
            
            # Recursively check if this sub-chunk is still too large
            if len(sub_chunk_text) > self.max_chunk_size:
                # Split again recursively
                nested_chunks = self._split_oversized_chunk(
                    text=sub_chunk_text,
                    page_number=page_number,
                    x0=x0,
                    y0=sub_y0,
                    x1=x1,
                    y1=sub_y1,
                    base_chunk_index=current_chunk_index,
                    recursion_depth=recursion_depth + 1
                )
                chunks.extend(nested_chunks)
                current_chunk_index += len(nested_chunks)
            else:
                chunks.append(PDFChunk(
                    text=sub_chunk_text,
                    page_number=page_number,
                    x0=x0,
                    y0=sub_y0,
                    x1=x1,
                    y1=sub_y1,
                    chunk_index=current_chunk_index
                ))
                current_chunk_index += 1
        
        return chunks
    
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
            
            print("=" * 80)
            print("🔍 NEW CHUNKING CODE ACTIVE - Force split (target: 300 chars, overlap: 50 chars)")
            print("=" * 80)
            
            with pdfplumber.open(tmp_file_path) as pdf:
                total_pages = len(pdf.pages)
                print(f"📑 PDF has {total_pages} total pages")
                total_pages_processed = 0
                for page_num, page in enumerate(pdf.pages, start=1):
                    # Extract text from page
                    page_text = page.extract_text()
                    
                    if not page_text:
                        print(f"⚠️  Page {page_num}: No text extracted (skipped)")
                        continue
                    
                    total_pages_processed += 1
                    page_char_count = len(page_text)
                    expected_chunks = max(1, (page_char_count + 50) // 250)  # Rough estimate accounting for overlap
                    print(f"📄 Page {page_num}: {page_char_count} characters extracted (expected ~{expected_chunks} chunks)")
                    
                    # Get page dimensions for coordinate calculation
                    page_width = page.width
                    page_height = page.height
                    
                    # Split text into chunks using aggressive splitting
                    # Use force split as primary method to ensure proper chunk sizes
                    text_chunks = self._force_split_text(page_text, target_size=300, overlap=50)
                    
                    if not text_chunks:
                        print(f"   ⚠️  WARNING: Force split returned no chunks for page {page_num}!")
                        continue
                    
                    # Double-check: if any chunk is still too large, split it again
                    final_chunks = []
                    for chunk in text_chunks:
                        if len(chunk) > self.max_chunk_size:
                            # Force split this chunk again (shouldn't happen often)
                            forced_chunks = self._force_split_text(chunk, target_size=self.max_chunk_size, overlap=0)
                            final_chunks.extend(forced_chunks)
                        else:
                            final_chunks.append(chunk)
                    
                    text_chunks = final_chunks
                    chunk_sizes = [len(chunk) for chunk in text_chunks]
                    avg_chunk_size = sum(chunk_sizes) / len(chunk_sizes) if chunk_sizes else 0
                    max_chunk_size = max(chunk_sizes) if chunk_sizes else 0
                    min_chunk_size = min(chunk_sizes) if chunk_sizes else 0
                    print(f"   → Split into {len(text_chunks)} chunks (min: {min_chunk_size}, avg: {avg_chunk_size:.0f}, max: {max_chunk_size} chars)")
                    
                    # Extract words with their actual positions from pdfplumber
                    # This gives us more accurate coordinates than estimation
                    words_with_positions = None
                    word_positions_list = []  # List of all word positions for chunk matching
                    try:
                        words = page.extract_words()
                        # Build a list of word positions and a map for quick lookup
                        text_to_positions = {}
                        for word in words:
                            word_text = word.get('text', '').strip()
                            if word_text:
                                x0 = word.get('x0', 0)
                                y0 = word.get('y0', 0)  # Top in pdfplumber (top-left origin)
                                x1 = word.get('x1', x0)
                                y1 = word.get('y1', y0)  # Bottom in pdfplumber
                                
                                # Convert to PDF coordinate system (bottom-left origin)
                                # pdfplumber uses top-left, PDF uses bottom-left
                                pdf_y0 = page_height - y1  # Bottom in PDF coords (smaller Y)
                                pdf_y1 = page_height - y0  # Top in PDF coords (larger Y)
                                
                                word_positions_list.append({
                                    'text': word_text,
                                    'x0': x0, 'y0': pdf_y0,  # Bottom-left in PDF coords
                                    'x1': x1, 'y1': pdf_y1   # Top-right in PDF coords
                                })
                                
                                # Also build lookup map (use first occurrence for simplicity)
                                if word_text not in text_to_positions:
                                    text_to_positions[word_text] = {
                                        'x0': x0, 'y0': pdf_y0,
                                        'x1': x1, 'y1': pdf_y1
                                    }
                        words_with_positions = text_to_positions
                    except Exception as e:
                        print(f"   ⚠️  Could not extract word positions: {e}, using estimation")
                        words_with_positions = None
                    
                    # Create chunks with coordinates
                    for chunk_idx, chunk_text in enumerate(text_chunks):
                        # Try to find actual word positions for this chunk
                        if words_with_positions and word_positions_list:
                            # Find words in the chunk text and get their positions
                            chunk_words = [w.strip() for w in chunk_text.split() if w.strip()]
                            chunk_x0 = page_width
                            chunk_y0 = page_height  # Start at bottom (PDF coords, smaller Y)
                            chunk_x1 = 0
                            chunk_y1 = 0  # Start at top (PDF coords, larger Y)
                            found_positions = False
                            matched_words = 0
                            
                            # Try to match chunk words with word positions
                            # Match first few words to get approximate position
                            for word in chunk_words[:min(10, len(chunk_words))]:
                                if word in words_with_positions:
                                    pos = words_with_positions[word]
                                    chunk_x0 = min(chunk_x0, pos['x0'])
                                    chunk_y0 = min(chunk_y0, pos['y0'])  # Bottom (smaller Y)
                                    chunk_x1 = max(chunk_x1, pos['x1'])
                                    chunk_y1 = max(chunk_y1, pos['y1'])  # Top (larger Y)
                                    found_positions = True
                                    matched_words += 1
                            
                            # If we found some positions, expand the bbox to include nearby words
                            if found_positions:
                                # Expand bbox to include words in the same area
                                for wp in word_positions_list:
                                    # Check if word is near our chunk area
                                    if (wp['x0'] >= chunk_x0 - 50 and wp['x1'] <= chunk_x1 + 50 and
                                        wp['y0'] >= chunk_y0 - 50 and wp['y1'] <= chunk_y1 + 50):
                                        chunk_x0 = min(chunk_x0, wp['x0'])
                                        chunk_y0 = min(chunk_y0, wp['y0'])
                                        chunk_x1 = max(chunk_x1, wp['x1'])
                                        chunk_y1 = max(chunk_y1, wp['y1'])
                                
                                # Use actual positions
                                x0_coord = max(0, chunk_x0 - 10)  # Add small margin
                                y0_coord = max(0, chunk_y0 - 10)  # Bottom in PDF coords
                                x1_coord = min(page_width, chunk_x1 + 10)
                                y1_coord = min(page_height, chunk_y1 + 10)  # Top in PDF coords
                            else:
                                # Fallback to estimation
                                estimated_y_top = (chunk_idx / len(text_chunks)) * page_height if text_chunks else 0
                                estimated_y_bottom = estimated_y_top + (page_height / len(text_chunks)) if text_chunks else page_height
                                # Convert to PDF coords (bottom-left origin)
                                x0_coord = 0
                                y0_coord = page_height - estimated_y_bottom  # Bottom
                                x1_coord = page_width
                                y1_coord = page_height - estimated_y_top  # Top
                        else:
                            # Estimate coordinates - divide page into sections
                            # pdfplumber uses top-left origin, but we need PDF coords (bottom-left)
                            estimated_y_top = (chunk_idx / len(text_chunks)) * page_height if text_chunks else 0
                            estimated_y_bottom = estimated_y_top + (page_height / len(text_chunks)) if text_chunks else page_height
                            # Convert to PDF coordinate system (bottom-left origin)
                            x0_coord = 0
                            y0_coord = page_height - estimated_y_bottom  # Bottom in PDF coords
                            x1_coord = page_width
                            y1_coord = page_height - estimated_y_top  # Top in PDF coords
                        
                        # Check if chunk exceeds max size and split if necessary
                        split_chunks = self._split_oversized_chunk(
                            text=chunk_text,
                            page_number=page_num,
                            x0=x0_coord,
                            y0=y0_coord,  # Bottom in PDF coords
                            x1=x1_coord,
                            y1=y1_coord,  # Top in PDF coords
                            base_chunk_index=len(chunks)
                        )
                        
                        # Add all resulting chunks (may be 1 or more if split was needed)
                        for split_chunk in split_chunks:
                            chunks.append(split_chunk)
                            all_texts.append(split_chunk.text)
                    
                    print(f"   → Page {page_num}: Created {len(text_chunks)} chunks (total so far: {len(chunks)})")
            
            print(f"📊 Total: {total_pages_processed} pages processed, {len(chunks)} total chunks created")
            if len(chunks) < total_pages_processed * 2:
                print(f"⚠️  WARNING: Very few chunks created ({len(chunks)} chunks from {total_pages_processed} pages).")
                print(f"   This might indicate pages have very little text, or chunking is not working as expected.")
            
            # Create FAISS vector store with metadata to track chunk indices
            if all_texts:
                # Create metadata for each chunk to track its index
                metadatas = [{"chunk_index": i} for i in range(len(all_texts))]
                vector_store = FAISS.from_texts(
                    texts=all_texts,
                    embedding=self.embeddings,
                    metadatas=metadatas
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
        
        # Perform similarity search with metadata
        docs_with_scores = vector_store.similarity_search_with_score(query, k=k)
        
        results = []
        for doc, score in docs_with_scores:
            # Get chunk index from metadata
            chunk_index = None
            if hasattr(doc, 'metadata') and doc.metadata:
                chunk_index = doc.metadata.get('chunk_index')
            
            # Find the corresponding chunk by index (more reliable than text matching)
            if chunk_index is not None and 0 <= chunk_index < len(chunks):
                chunk = chunks[chunk_index]
            else:
                # Fallback: try to match by text content
                chunk_text = doc.page_content
                chunk = next(
                    (c for c in chunks if c.text.strip() == chunk_text.strip() or 
                     chunk_text.strip() in c.text.strip() or c.text.strip() in chunk_text.strip()),
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
            else:
                # Log warning if chunk not found
                print(f"⚠️  Warning: Could not find chunk for search result. Index: {chunk_index}, Text preview: {doc.page_content[:50]}...")
        
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
