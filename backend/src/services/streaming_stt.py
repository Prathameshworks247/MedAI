import asyncio
import base64
import json
import os
import subprocess
import tempfile
import time
import ssl
import certifi
import websockets
from typing import Optional, List
from src.config import SARVAM_AI_API_KEY

class StreamingTranscriber:
    def __init__(self):
        """Initialize transcriber for Sarvam AI."""
        self.ws_url = "wss://api.sarvam.ai/speech-to-text-translate/ws"
        self.api_key = SARVAM_AI_API_KEY
        self.ws = None
        self.transcript = ""
        self.session_transcript = "" # Cumulative transcript across all chunks
        self.current_partial = ""
        self.chunk_count = 0
        self.last_process_time = time.time()
        self.is_connected = False
        self._receive_task: Optional[asyncio.Task] = None
        self.transcript_queue = asyncio.Queue()
        
    async def connect(self):
        """Establish connection to Sarvam AI WebSocket."""
        if not self.api_key:
            print("❌ SARVAM_AI_API_KEY not found in config")
            return False
            
        # If we were previously connected but now connecting again, 
        # it means the previous connection ended. Commit its partial results.
        if self.current_partial:
            self.session_transcript += (" " if self.session_transcript else "") + self.current_partial
            self.current_partial = ""

        try:
            # Query parameters for Sarvam AI
            params = "model=saaras:v2.5&sample_rate=16000"
            full_url = f"{self.ws_url}?{params}"
            
            # Create SSL context with certifi for macOS compatibility
            ssl_context = ssl.create_default_context(cafile=certifi.where())
            
            self.ws = await websockets.connect(
                full_url,
                additional_headers={"api-subscription-key": self.api_key},
                ssl=ssl_context
            )
            
            # Send initial config
            config_msg = {
                "type": "config",
                "prompt": ""
            }
            await self.ws.send(json.dumps(config_msg))
            
            self.is_connected = True
            self._receive_task = asyncio.create_task(self._receive_loop())
            print("✅ Connected to Sarvam AI WebSocket")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to Sarvam AI: {e}")
            return False

    async def _receive_loop(self):
        """Loop to receive messages from Sarvam AI."""
        try:
            async for message in self.ws:
                data = json.loads(message)
                msg_type = data.get("type")
                
                if msg_type == "data":
                    # data format: {"type": "data", "data": {"transcript": "...", "language_code": "..."}}
                    res_data = data.get("data", {})
                    new_snippet = res_data.get("transcript", "").strip()
                    
                    if new_snippet:
                        # Logic to handle both incremental and discrete updates
                        # If new_snippet starts with current_partial, it's likely an incremental update
                        if self.current_partial and new_snippet.startswith(self.current_partial):
                            self.current_partial = new_snippet
                        else:
                            # It's a new discrete segment or a non-incremental update
                            # Commit the previous partial to session history
                            if self.current_partial:
                                self.session_transcript += (" " if self.session_transcript else "") + self.current_partial
                            self.current_partial = new_snippet
                    
                    # Total transcript = history + current session's partial
                    full_current = self.session_transcript
                    if self.current_partial:
                        full_current += (" " if full_current else "") + self.current_partial
                    
                    await self.transcript_queue.put(full_current)
                    print(f"📥 Received transcript: {new_snippet}")
                elif msg_type == "error":
                    print(f"📥 Sarvam AI Error: {data.get('data')}")
                elif msg_type == "events":
                    print(f"📥 Sarvam AI Event: {data.get('data')}")
                    
        except websockets.ConnectionClosed:
            print("📥 Sarvam AI WebSocket connection closed")
        except Exception as e:
            print(f"📥 Error in Sarvam AI receive loop: {e}")
        finally:
            # Commit current partial to session transcript on loop exit (socket closed)
            if self.current_partial:
                self.session_transcript += (" " if self.session_transcript else "") + self.current_partial
                self.current_partial = ""
            self.is_connected = False

    def _convert_webm_to_wav_base64(self, webm_data: bytes) -> Optional[str]:
        """Convert WebM to WAV (16kHz, mono) using ffmpeg and return base64 string."""
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as webm_tmp:
            webm_tmp.write(webm_data)
            webm_path = webm_tmp.name
            
        wav_path = webm_path + ".wav"
        try:
            # Convert to 16kHz, mono WAV
            subprocess.run([
                "ffmpeg", "-y", "-i", webm_path,
                "-ar", "16000", "-ac", "1",
                wav_path
            ], check=True, capture_output=True)
            
            with open(wav_path, "rb") as wav_file:
                wav_data = wav_file.read()
                return base64.b64encode(wav_data).decode("utf-8")
        except Exception as e:
            print(f"❌ ffmpeg conversion error: {e}")
            return None
        finally:
            if os.path.exists(webm_path): os.unlink(webm_path)
            if os.path.exists(wav_path): os.unlink(wav_path)

    async def process_audio_chunk(self, chunk: bytes) -> str:
        """
        Process audio chunk by sending it to Sarvam AI.
        Returns the current full transcript.
        """
        if not self.is_connected:
            connected = await self.connect()
            if not connected: return ""

        self.chunk_count += 1
        
        # Sarvam expects base64 encoded WAV data
        base64_audio = self._convert_webm_to_wav_base64(chunk)
        if not base64_audio:
            return ""
            
        try:
            audio_msg = {
                "audio": {
                    "data": base64_audio,
                    "sample_rate": "16000",
                    "encoding": "audio/wav"
                }
            }
            await self.ws.send(json.dumps(audio_msg))
            
            # Wait a bit for the receive loop to update current_partial
            # Since Sarvam is streaming, the transcript builds up.
            await asyncio.sleep(0.1)
            
            return self.current_partial
        except Exception as e:
            print(f"❌ Error sending audio to Sarvam AI: {e}")
            return self.current_partial

    async def finalize(self) -> str:
        """Send flush signal and return final transcript."""
        if self.is_connected:
            try:
                flush_msg = {"type": "flush"}
                await self.ws.send(json.dumps(flush_msg))
                
                # Give it some time to process final bits
                await asyncio.sleep(1.0)
                
                # Final connection close will trigger the commit in _receive_loop's exception handler
                # but we'll do one final check here to be safe
                if self.current_partial:
                    self.session_transcript += (" " if self.session_transcript else "") + self.current_partial
                    self.current_partial = ""
                
                self.transcript = self.session_transcript
                
                await self.ws.close()
            except Exception as e:
                print(f"❌ Error finalizing Sarvam AI: {e}")
        else:
            # If not connected, make sure transcript is set to what we have
            if self.current_partial:
                self.session_transcript += (" " if self.session_transcript else "") + self.current_partial
                self.current_partial = ""
            self.transcript = self.session_transcript
        
        self.is_connected = False
        if self._receive_task:
            self._receive_task.cancel()
            
        return self.transcript

    def reset(self):
        """Reset the transcriber state."""
        self.transcript = ""
        self.session_transcript = ""
        self.current_partial = ""
        self.chunk_count = 0
        self.last_process_time = time.time()
        print("🔄 Transcriber reset")
