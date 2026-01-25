"""
Chatbot API Routes for Multilingual Patient Interactions
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from src.services.multilingual_chatbot import (
    process_multilingual_message,
    text_to_speech,
    SUPPORTED_LANGUAGES,
    SPEAKER_OPTIONS
)
import base64

router = APIRouter()


class TextChatRequest(BaseModel):
    """Request model for text-based chat"""
    message: str
    target_language: str = "hi-IN"
    conversation_history: Optional[List[Dict[str, str]]] = None
    generate_audio: bool = True


class ChatResponse(BaseModel):
    """Response model for chat interactions"""
    response_text: str
    response_audio: Optional[str] = None  # Base64 encoded audio
    translated_input: Optional[str] = None


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages for the chatbot"""
    return {
        "languages": SUPPORTED_LANGUAGES,
        "speakers": SPEAKER_OPTIONS
    }


@router.post("/text", response_model=ChatResponse)
async def chat_with_text(request: TextChatRequest):
    """
    Send a text message to the chatbot and get a multilingual response.

    Args:
        request: TextChatRequest with message, target_language, and optional history

    Returns:
        ChatResponse with response_text and optional response_audio
    """
    try:
        # Validate language
        if request.target_language not in [lang["code"] for lang in SUPPORTED_LANGUAGES.values()]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported language: {request.target_language}"
            )

        # Process the message
        result = await process_multilingual_message(
            text_input=request.message,
            target_language=request.target_language,
            conversation_history=request.conversation_history,
            generate_audio=request.generate_audio
        )

        return ChatResponse(
            response_text=result["response_text"],
            response_audio=result["response_audio"],
            translated_input=result.get("translated_input")
        )

    except Exception as e:
        print(f"❌ Error in chat_with_text: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process text chat: {str(e)}"
        )


@router.post("/voice", response_model=ChatResponse)
async def chat_with_voice(
    audio_file: UploadFile = File(...),
    source_language: str = "hi-IN",
    target_language: str = "hi-IN",
    generate_audio: bool = True
):
    """
    Send a voice message to the chatbot and get a multilingual response.

    Args:
        audio_file: Audio file (WAV format recommended)
        source_language: Language of the audio input
        target_language: Language for the response
        generate_audio: Whether to generate audio response

    Returns:
        ChatResponse with response_text, response_audio, and translated_input (English)
    """
    try:
        # Validate languages
        if source_language not in [lang["code"] for lang in SUPPORTED_LANGUAGES.values()]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported source language: {source_language}"
            )

        if target_language not in [lang["code"] for lang in SUPPORTED_LANGUAGES.values()]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported target language: {target_language}"
            )

        # Read audio file
        audio_data = await audio_file.read()

        if not audio_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio file"
            )

        # Process the voice message
        result = await process_multilingual_message(
            audio_data=audio_data,
            source_language=source_language,
            target_language=target_language,
            generate_audio=generate_audio
        )

        return ChatResponse(
            response_text=result["response_text"],
            response_audio=result["response_audio"],
            translated_input=result["translated_input"]
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in chat_with_voice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process voice chat: {str(e)}"
        )


class SpeakRequest(BaseModel):
    """Request model for text-to-speech"""
    text: str
    target_language: str = "hi-IN"
    speaker: str = "anushka"


@router.post("/speak")
async def speak_text(request: SpeakRequest):
    """
    Convert text to speech using Sarvam Bulbul TTS.

    Args:
        request: SpeakRequest with text, target_language, and speaker

    Returns:
        Dict with base64 encoded audio
    """
    try:
        # Validate language
        if request.target_language not in [lang["code"] for lang in SUPPORTED_LANGUAGES.values()]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported language: {request.target_language}"
            )

        # Generate audio
        audio_bytes = await text_to_speech(
            text=request.text,
            target_language=request.target_language,
            speaker=request.speaker
        )

        # Convert to base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

        return {
            "audio": audio_base64,
            "language": request.target_language
        }

    except Exception as e:
        print(f"❌ Error in speak_text: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate speech: {str(e)}"
        )
