import tempfile
import soundfile as sf
from faster_whisper import WhisperModel
import numpy as np
from pydub import AudioSegment
import io
import os
import time

class StreamingTranscriber:
    def __init__(self):
        """Initialize transcriber."""
        self.model = WhisperModel(
            "small",
            device="cpu",
            compute_type="int8"
        )
        self.transcript = ""
        self.chunk_count = 0
        self.last_process_time = time.time()
        self.last_transcription = ""
        
    def decode_webm_to_wav(self, webm_data: bytes) -> str:
        """Convert WebM/Opus audio to WAV format using pydub"""
        try:
            audio = AudioSegment.from_file(io.BytesIO(webm_data), format="webm")
            audio = audio.set_frame_rate(16000).set_channels(1)
            
            wav_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            audio.export(wav_file.name, format="wav")
            wav_file.close()
            
            return wav_file.name
        except FileNotFoundError as e:
            if 'ffprobe' in str(e) or 'ffmpeg' in str(e):
                raise RuntimeError(
                    "ffmpeg is not installed. Please install it:\n"
                    "  macOS: brew install ffmpeg\n"
                    "  Linux: sudo apt-get install ffmpeg\n"
                    "  Windows: Download from https://ffmpeg.org/"
                ) from e
            raise
        except Exception as e:
            print(f"Error decoding WebM: {e}")
            raise

    def process_audio_chunk(self, chunk: bytes) -> str:
        """
        Process complete WebM segments from frontend.
        Frontend sends complete segments every 2 seconds, so process immediately.
        """
        self.chunk_count += 1
        chunk_size_kb = len(chunk) / 1024
        print(f"📦 Received segment {self.chunk_count}: {len(chunk)} bytes ({chunk_size_kb:.1f} KB)")
        
        # Frontend sends complete WebM segments, so process immediately
        # But skip if too small (likely just header or empty)
        # Lowered threshold since 15-second segments might start small
        if len(chunk) < 2000:  # Less than 2KB is probably incomplete/header only
            print(f"⏳ Segment too small ({chunk_size_kb:.1f} KB), skipping (likely header or empty)")
            return ""
        
        # Process this complete segment immediately
        print(f"🔄 Processing complete segment ({chunk_size_kb:.1f} KB)...")
        return self._process_segment(chunk)
    
    def _remove_overlap(self, new_text: str, old_text: str) -> str:
        """
        Remove overlapping text between old and new transcriptions.
        """
        if not old_text or not new_text:
            return new_text
            
        old_words = old_text.split()
        new_words = new_text.split()
        
        # Find longest matching suffix of old_text that matches prefix of new_text
        max_overlap = min(len(old_words), len(new_words))
        
        for overlap_len in range(max_overlap, 0, -1):
            if old_words[-overlap_len:] == new_words[:overlap_len]:
                return ' '.join(new_words[overlap_len:])
        
        return new_text
    
    def _process_segment(self, segment_data: bytes) -> str:
        """Process a complete WebM segment"""
        try:
            # Decode the complete WebM segment
            wav_file = self.decode_webm_to_wav(segment_data)
            
            try:
                print("🎤 Starting Whisper transcription...")
                start_time = time.time()
                
                segments, info = self.model.transcribe(
                    wav_file,
                    language="en",
                    vad_filter=True,
                    beam_size=5,
                    temperature=0.0,
                    condition_on_previous_text=False,
                    word_timestamps=False
                )
                
                transcribe_time = time.time() - start_time
                print(f"📊 Audio: duration={info.duration:.2f}s, language={info.language}, transcribe_time={transcribe_time:.2f}s")
                
                segment_list = list(segments)
                segment_texts = [seg.text.strip() for seg in segment_list]
                current_transcription = " ".join(segment_texts).strip()
                
                print(f"📝 Raw transcription: '{current_transcription}' ({len(segment_list)} segments)")
                
                if current_transcription:
                    # Remove overlap with previous transcription
                    new_text = self._remove_overlap(current_transcription, self.last_transcription)
                    
                    if new_text:
                        print(f"✨ New text: '{new_text}'")
                        self.transcript += " " + new_text if self.transcript else new_text
                        self.last_transcription = current_transcription
                        print(f"✓ Total transcript: {len(self.transcript)} chars")
                        self.last_process_time = time.time()
                        return new_text.strip()
                    else:
                        print("⚠ No new text after overlap removal")
                        self.last_process_time = time.time()
                        return ""
                else:
                    print("⚠ Empty transcription (silence or noise)")
                    self.last_process_time = time.time()
                    return ""
                    
            finally:
                if os.path.exists(wav_file):
                    os.unlink(wav_file)
                    
        except Exception as e:
            print(f"✗ Processing error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            self.last_process_time = time.time()
            return ""

    def finalize(self) -> str:
        """Return final transcript (no buffering needed since we process segments immediately)"""
        print(f"🏁 Finalizing transcript...")
        
        self.chunk_count = 0
        self.last_transcription = ""
        
        final = self.transcript.strip()
        print(f"✓ Final transcript ({len(final)} chars): '{final}'")
        return final
    
    def reset(self):
        """Reset the transcriber state for a new recording"""
        self.transcript = ""
        self.chunk_count = 0
        self.last_transcription = ""
        self.last_process_time = time.time()
        print("🔄 Transcriber reset")