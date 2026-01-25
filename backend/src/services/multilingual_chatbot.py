"""
Multilingual Chatbot Service with Sarvam AI Integration
- Speech-to-Text with Translation (Sarvam)
- Gemini LLM for multilingual responses
- Text-to-Speech (Sarvam Bulbul)
"""

import httpx
import base64
import asyncio
import json
import ssl
import certifi
import websockets
import io
from typing import Optional, Dict, Any
from langchain_core.messages import HumanMessage, SystemMessage
from pydub import AudioSegment

from src.config import SARVAM_AI_API_KEY
from src.llm.gemini import llm as gemini_llm

# Supported languages mapping
SUPPORTED_LANGUAGES = {
    "hindi": {"code": "hi-IN", "name": "Hindi"},
    "tamil": {"code": "ta-IN", "name": "Tamil"},
    "telugu": {"code": "te-IN", "name": "Telugu"},
    "bengali": {"code": "bn-IN", "name": "Bengali"},
    "gujarati": {"code": "gu-IN", "name": "Gujarati"},
    "kannada": {"code": "kn-IN", "name": "Kannada"},
    "malayalam": {"code": "ml-IN", "name": "Malayalam"},
    "marathi": {"code": "mr-IN", "name": "Marathi"},
    "odia": {"code": "or-IN", "name": "Odia"},
    "punjabi": {"code": "pa-IN", "name": "Punjabi"},
    "english": {"code": "en-IN", "name": "English"}
}

# Speaker options for Bulbul TTS v2 (WebSocket API)
SPEAKER_OPTIONS = [
    "anushka",  # Default for bulbul:v2
    "abhilash",
    "manisha",
    "vidya",
    "arya",
    "karun",
    "hitesh"
]


async def convert_audio_to_wav(audio_data: bytes) -> bytes:
    """
    Convert audio to WAV format with 16000 sample rate (required by Sarvam).

    Args:
        audio_data: Raw audio bytes (any format)

    Returns:
        WAV audio bytes with 16000 sample rate
    """
    try:
        # Load audio from bytes (pydub auto-detects format)
        audio = AudioSegment.from_file(io.BytesIO(audio_data))

        # Convert to mono, 16000 Hz, 16-bit PCM WAV
        audio = audio.set_channels(1)  # Mono
        audio = audio.set_frame_rate(16000)  # 16kHz sample rate
        audio = audio.set_sample_width(2)  # 16-bit

        # Export to WAV format
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_bytes = wav_buffer.getvalue()

        print(f"✅ Converted audio: {len(audio_data)} bytes → {len(wav_bytes)} bytes (16kHz WAV)")
        return wav_bytes

    except Exception as e:
        print(f"❌ Error converting audio: {e}")
        # If conversion fails, return original data
        return audio_data


async def speech_to_text_translate(audio_data: bytes, source_language: str = "hi-IN") -> Dict[str, Any]:
    """
    Convert speech to English text using Sarvam AI Speech-to-Text-Translate WebSocket API.

    Args:
        audio_data: Raw audio bytes (will be converted to WAV format)
        source_language: Source language code (e.g., "hi-IN")

    Returns:
        Dict with translated_text and detected_language
    """
    try:
        if not SARVAM_AI_API_KEY:
            raise ValueError("SARVAM_AI_API_KEY not configured")

        # Convert audio to proper WAV format with 16000 sample rate
        print(f"📥 Received audio data size: {len(audio_data)} bytes")
        audio_data = await convert_audio_to_wav(audio_data)

        ws_url = "wss://api.sarvam.ai/speech-to-text-translate/ws"
        params = "model=saaras:v2.5&sample_rate=16000"
        full_url = f"{ws_url}?{params}"

        # Create SSL context
        ssl_context = ssl.create_default_context(cafile=certifi.where())

        transcript = ""
        detected_language = None

        # Connect to WebSocket
        async with websockets.connect(
            full_url,
            additional_headers={"api-subscription-key": SARVAM_AI_API_KEY},
            ssl=ssl_context
        ) as websocket:
            # Send config message
            config_msg = {
                "type": "config",
                "prompt": ""
            }
            await websocket.send(json.dumps(config_msg))

            # Convert audio to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')

            # Send audio message
            audio_msg = {
                "audio": {
                    "data": audio_base64,
                    "sample_rate": "16000",
                    "encoding": "audio/wav"
                }
            }
            await websocket.send(json.dumps(audio_msg))

            # Send flush signal to get final result
            flush_msg = {"type": "flush"}
            await websocket.send(json.dumps(flush_msg))

            # Receive messages until we get the final transcript (with timeout)
            try:
                async with asyncio.timeout(30):  # 30 second timeout
                    message_count = 0
                    max_wait_after_transcript = 2  # Wait for 2 seconds after getting transcript
                    got_transcript = False

                    async for message in websocket:
                        data = json.loads(message)
                        msg_type = data.get("type")

                        if msg_type == "data":
                            result_data = data.get("data", {})
                            new_transcript = result_data.get("transcript", "").strip()
                            lang_code = result_data.get("language_code")

                            if new_transcript:
                                transcript = new_transcript
                                got_transcript = True
                            if lang_code:
                                detected_language = lang_code

                            print(f"📥 Received transcript: {transcript}")

                        elif msg_type == "error":
                            error_msg = data.get("data", {}).get("error", "Unknown error")
                            print(f"❌ Sarvam AI Error: {error_msg}")
                            raise ValueError(f"Sarvam AI Error: {error_msg}")

                        # If we got a transcript, wait a bit more for any final updates then break
                        if got_transcript:
                            message_count += 1
                            if message_count > 2:  # Wait for a couple more messages
                                await asyncio.sleep(1)  # Final wait
                                break

            except asyncio.TimeoutError:
                print(f"⚠️ WebSocket receive timeout, using transcript so far: {transcript}")

            # Close the connection
            await websocket.close()

        # Validate we got a transcript
        if not transcript or transcript.strip() == "":
            raise ValueError(
                "No transcript received from audio. This could be due to: "
                "1) Silent/empty audio, 2) Audio too short, 3) Unsupported audio format, "
                "4) Poor audio quality. Please try speaking louder and clearer."
            )

        return {
            "translated_text": transcript,
            "detected_language": detected_language or source_language
        }

    except Exception as e:
        print(f"❌ Error in speech_to_text_translate: {e}")
        raise


async def generate_multilingual_response(
    user_message: str,
    target_language: str = "hi-IN",
    conversation_history: Optional[list] = None
) -> str:
    """
    Generate a response in the target language using Gemini.

    Args:
        user_message: User's message in English (already translated)
        target_language: Target language code (e.g., "hi-IN")
        conversation_history: Previous conversation messages

    Returns:
        Response text in target language
    """
    try:
        # Validate user message is not empty
        if not user_message or user_message.strip() == "":
            raise ValueError("User message cannot be empty")
        # Get language name from code
        lang_name = None
        for lang_key, lang_info in SUPPORTED_LANGUAGES.items():
            if lang_info["code"] == target_language:
                lang_name = lang_info["name"]
                break

        if not lang_name:
            lang_name = "Hindi"  # Default fallback

        # Build system prompt with language instruction
        system_prompt = f"""You are a helpful health assistant chatbot for patients.

CRITICAL INSTRUCTION: You MUST respond ONLY in {lang_name} language. Do NOT use English in your response except for medical terms that don't have common translations.

Guidelines:
1. Be empathetic, friendly, and professional
2. Provide helpful information about medications, diet, and general health queries
3. Keep responses concise and easy to understand
4. If asked about serious medical conditions, advise consulting a doctor
5. For emergencies, advise calling emergency services immediately
6. ALWAYS respond in {lang_name} language

Remember: Your entire response should be in {lang_name}."""

        # Build messages
        messages = [SystemMessage(content=system_prompt)]

        # Add conversation history if provided (last 5 messages)
        if conversation_history:
            recent_history = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
            for msg in recent_history:
                role = msg.get("role") if isinstance(msg, dict) else getattr(msg, "role", None)
                content = msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", None)

                if role == "user":
                    messages.append(HumanMessage(content=content))
                elif role == "assistant":
                    from langchain_core.messages import AIMessage
                    messages.append(AIMessage(content=content))

        # Add current user message
        messages.append(HumanMessage(content=user_message))

        # Generate response using Gemini
        response = gemini_llm.invoke(messages)
        response_text = response.content if hasattr(response, "content") else str(response)

        return response_text

    except Exception as e:
        print(f"❌ Error in generate_multilingual_response: {e}")
        raise


async def text_to_speech(
    text: str,
    target_language: str = "hi-IN",
    speaker: str = "meera",
    model: str = "bulbul:v2"
) -> bytes:
    """
    Convert text to speech using Sarvam Bulbul TTS WebSocket API for streaming.

    Args:
        text: Text to convert to speech
        target_language: Target language code (e.g., "hi-IN")
        speaker: Voice speaker name (anushka, abhilash, manisha, vidya, etc.)
        model: Bulbul model version (bulbul:v2 or bulbul:v3-beta)

    Returns:
        Audio bytes (combined from streaming chunks)
    """
    try:
        if not SARVAM_AI_API_KEY:
            raise ValueError("SARVAM_AI_API_KEY not configured")

        # WebSocket URL with query parameters
        ws_url = "wss://api.sarvam.ai/text-to-speech/ws"
        params = f"model={model}&send_completion_event=true"
        full_url = f"{ws_url}?{params}"

        # Create SSL context
        ssl_context = ssl.create_default_context(cafile=certifi.where())

        audio_chunks = []

        # Connect to WebSocket
        async with websockets.connect(
            full_url,
            additional_headers={"Api-Subscription-Key": SARVAM_AI_API_KEY},
            ssl=ssl_context
        ) as websocket:
            # Send config message
            config_msg = {
                "type": "config",
                "data": {
                    "target_language_code": target_language,
                    "speaker": speaker,
                    "enable_preprocessing": True
                }
            }
            await websocket.send(json.dumps(config_msg))
            print(f"📤 Sent TTS config: {target_language}, {speaker}")

            # Send text message
            text_msg = {
                "type": "text",
                "data": {
                    "text": text
                }
            }
            await websocket.send(json.dumps(text_msg))
            print(f"📤 Sent text for TTS: {text[:50]}...")

            # Send flush signal to complete the request
            flush_msg = {"type": "flush"}
            await websocket.send(json.dumps(flush_msg))
            print(f"📤 Sent flush signal")

            # Receive messages until completion (with timeout)
            try:
                async with asyncio.timeout(30):  # 30 second timeout
                    async for message in websocket:
                        data = json.loads(message)
                        msg_type = data.get("type")

                        if msg_type == "audio":
                            # Extract base64 audio from response
                            audio_data = data.get("data", {})
                            audio_base64 = audio_data.get("audio")
                            if audio_base64:
                                # Decode and store audio chunk
                                audio_chunk = base64.b64decode(audio_base64)
                                audio_chunks.append(audio_chunk)
                                print(f"📥 Received audio chunk: {len(audio_chunk)} bytes")

                        elif msg_type == "event":
                            # Check for completion event
                            event_data = data.get("data", {})
                            event_type = event_data.get("event_type")
                            if event_type == "final":
                                print(f"✅ TTS streaming complete")
                                break

                        elif msg_type == "error":
                            error_data = data.get("data", {})
                            error_msg = error_data.get("message", "Unknown error")
                            print(f"❌ Sarvam TTS Error: {error_msg}")
                            raise ValueError(f"Sarvam TTS Error: {error_msg}")

            except asyncio.TimeoutError:
                print(f"⚠️ TTS WebSocket timeout")
                if not audio_chunks:
                    raise ValueError("TTS timeout: No audio received")

            # Close the connection
            await websocket.close()

        # Combine all audio chunks
        if not audio_chunks:
            raise ValueError("No audio data received from TTS API")

        combined_audio = b"".join(audio_chunks)
        print(f"✅ Combined TTS audio: {len(combined_audio)} bytes from {len(audio_chunks)} chunks")
        return combined_audio

    except Exception as e:
        print(f"❌ Error in text_to_speech: {e}")
        raise


async def process_multilingual_message(
    audio_data: Optional[bytes] = None,
    text_input: Optional[str] = None,
    source_language: str = "hi-IN",
    target_language: str = "hi-IN",
    conversation_history: Optional[list] = None,
    generate_audio: bool = True
) -> Dict[str, Any]:
    """
    Process a multilingual chatbot message (audio or text input).

    Args:
        audio_data: Audio bytes if using voice input
        text_input: Text string if using text input
        source_language: Source language for STT
        target_language: Target language for response
        conversation_history: Previous conversation messages
        generate_audio: Whether to generate audio response

    Returns:
        Dict with response_text, response_audio (base64), and translated_input
    """
    try:
        # Step 1: Get English text from input
        if audio_data:
            # Speech to English translation
            stt_result = await speech_to_text_translate(audio_data, source_language)
            english_text = stt_result["translated_text"]
            print(f"🎤 Speech translated to English: {english_text}")
        elif text_input:
            # If text input is not in English, we assume it's already in target language
            # For now, we'll use it directly (you could add text translation here)
            english_text = text_input
            print(f"📝 Text input: {english_text}")
        else:
            raise ValueError("Either audio_data or text_input must be provided")

        # Validate we have text to process
        if not english_text or english_text.strip() == "":
            raise ValueError("Could not extract text from input. Please try again with a clearer message.")

        # Step 2: Generate response in target language using Gemini
        response_text = await generate_multilingual_response(
            user_message=english_text,
            target_language=target_language,
            conversation_history=conversation_history
        )
        print(f"💬 Generated response in {target_language}: {response_text}")

        # Step 3: Convert response to speech (if requested)
        response_audio_base64 = None
        if generate_audio:
            response_audio = await text_to_speech(
                text=response_text,
                target_language=target_language,
                speaker="anushka"  # Default speaker for bulbul:v2
            )
            response_audio_base64 = base64.b64encode(response_audio).decode('utf-8')
            print(f"🔊 Generated audio response")

        return {
            "response_text": response_text,
            "response_audio": response_audio_base64,
            "translated_input": english_text if audio_data else None
        }

    except Exception as e:
        print(f"❌ Error in process_multilingual_message: {e}")
        raise
