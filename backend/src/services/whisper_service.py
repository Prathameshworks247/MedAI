import tempfile
from faster_whisper import WhisperModel
import shutil


model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)

async def transcribe_audio_file(file):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    segments, _ = model.transcribe(
        tmp_path,
        language="en",
        vad_filter=True
    )

    return " ".join(seg.text for seg in segments)
