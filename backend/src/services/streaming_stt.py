import tempfile
import soundfile as sf
from faster_whisper import WhisperModel
import numpy as np

class StreamingTranscriber:
    def __init__(self):
        self.model = WhisperModel(
            "small",
            device="cpu",
            compute_type="int8"
        )
        self.audio_buffer = []
        self.transcript = ""

    def process_audio_chunk(self, chunk: bytes) -> str:
        audio_np = np.frombuffer(chunk, dtype=np.int16)
        self.audio_buffer.append(audio_np)

        if sum(len(x) for x in self.audio_buffer) < 32000:
            return ""

        audio = np.concatenate(self.audio_buffer)
        self.audio_buffer.clear()

        with tempfile.NamedTemporaryFile(suffix=".wav") as f:
            sf.write(f.name, audio, 16000)

            segments, _ = self.model.transcribe(
                f.name,
                language="en",
                vad_filter=True
            )

        partial = " ".join(seg.text for seg in segments)

        if partial and partial not in self.transcript:
            self.transcript += " " + partial
            return partial.strip()

        return ""

    def finalize(self) -> str:
        return self.transcript.strip()

