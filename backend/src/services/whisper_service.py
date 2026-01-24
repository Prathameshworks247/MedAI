import tempfile
import requests
import os
from src.config import SARVAM_AI_API_KEY

def transcribe_audio_file(file):
    """
    Transcribe an audio file using Sarvam AI (English translation).
    Supports multiple Indian languages and translates them to English.
    """
    if not SARVAM_AI_API_KEY:
        print("❌ SARVAM_AI_API_KEY not found in config")
        return "Error: Sarvam AI API key not configured."

    url = "https://api.sarvam.ai/speech-to-text-translate"
    
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        file.file.seek(0)
        tmp.write(file.file.read())
        tmp_path = tmp.name

    try:
        payload = {
            'model': 'saaras:v1'
        }
        
        with open(tmp_path, 'rb') as audio_file:
            files = [
                ('file', (os.path.basename(tmp_path), audio_file, 'audio/wav'))
            ]
            headers = {
                'api-subscription-key': SARVAM_AI_API_KEY
            }
            
            response = requests.post(url, headers=headers, data=payload, files=files)
            
        if response.status_code == 200:
            result = response.json()
            return result.get("transcript", "")
        else:
            print(f"❌ Sarvam AI Error: {response.status_code} - {response.text}")
            return f"Error transcribing file: {response.text}"
            
    except Exception as e:
        print(f"❌ Error in Sarvam AI transcription: {e}")
        return f"Error: {str(e)}"
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
