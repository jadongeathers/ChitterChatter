from flask import current_app
import requests
import os
from datetime import datetime
from app.models import PracticeCase, db

class VoiceService:
    def __init__(self):
        """Initialize the voice service with API configurations."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not configured")

        self.api_base = "https://api.openai.com/v1"

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "OpenAI-Beta": "realtime=v1", # TODO: Is this still needed?
        }

    def generate_preview(self, voice_id: str, text: str):
        """
        Generates a one-off audio preview using OpenAI's standard TTS API.

        NOTE: This API uses a different set of voices than the Realtime API.
        Only a subset of voices will work for preview.
        
        Args:
            voice_id (str): The voice to use for the preview.
            text (str): The sample text to convert to speech.
        
        Returns:
            bytes: The MP3 audio content, or None on failure.
        """
        try:
            # The standard TTS API endpoint is different from the realtime one.
            tts_url = f"{self.api_base}/audio/speech"

            # The voices for the tts-1 model are:
            # alloy, echo, fable, onyx, nova, shimmer
            # The realtime voices (ash, ballad, coral, sage, verse) are NOT supported here.
            # We log a warning if an unsupported voice is used, as the API call will likely fail.
            valid_preview_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
            if voice_id not in valid_preview_voices:
                current_app.logger.warning(
                    f"Voice preview requested for '{voice_id}', which is not supported by the standard TTS API. "
                    f"This will likely fail. Supported preview voices are: {', '.join(valid_preview_voices)}"
                )

            payload = {
                "model": "gpt-4o-mini-tts",  # Use the standard, fast TTS model
                "voice": voice_id,
                "input": text,
                "response_format": "mp3",
            }
            
            response = requests.post(tts_url, headers=self.headers, json=payload, timeout=20)
            
            # Raise an HTTPError for bad responses (e.g., 400 for an invalid voice)
            response.raise_for_status() 
            
            return response.content

        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Error calling OpenAI TTS API for preview: {e}")
            return None
        except Exception as e:
            # This will catch the HTTPError from an invalid voice and other issues
            current_app.logger.error(f"Failed to generate voice preview for voice '{voice_id}': {e}")
            return None

    def create_session(self, prompt_text, practice_case_id=None, speed: float | None = None):  # ← add speed
        try:
            voice = "verse"
            language_code = "en"

            if practice_case_id:
                try:
                    practice_case = PracticeCase.query.get(practice_case_id)
                    if practice_case:
                        voice = practice_case.voice or voice
                        language_code = practice_case.language_code or language_code
                        current_app.logger.info(
                            f"Using voice={voice}, language_code={language_code} from practice case {practice_case_id}"
                        )
                except Exception as e:
                    current_app.logger.error(f"Error fetching practice case settings: {str(e)}")

            payload = {
                # You can use the stable alias:
                "model": "gpt-4o-realtime-preview",
                "voice": voice,
                "instructions": prompt_text,
                "input_audio_transcription": {
                    "model": "whisper-1",
                    "language": language_code
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.75,
                    "prefix_padding_ms": 500,
                    "silence_duration_ms": 1000
                }
            }

            # include speed if provided
            if isinstance(speed, (int, float)):
                clamped = max(0.25, min(1.5, float(speed)))
                payload["speed"] = clamped
                current_app.logger.info(f"Including TTS speed={clamped}")

            response = requests.post(
                f"{self.api_base}/realtime/sessions",
                headers=self.headers,
                json=payload,
                timeout=10,
            )

            response.raise_for_status()
            session_data = response.json()

            session_id = session_data["id"]
            client_secret = session_data["client_secret"]["value"]
            expires_at = session_data["client_secret"]["expires_at"]
            websocket_url = f"wss://api.openai.com/v1/realtime/sessions/{session_id}/ws"

            return {
                "session_id": session_id,
                "client_secret": client_secret,
                "expires_at": expires_at,
                "websocket_url": websocket_url,
            }

        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Failed to create session: {str(e)}")
            raise Exception(f"Failed to create session: {str(e)}")

    def end_session(self, session_id):
        """
        End a realtime conversation session.
        """
        try:
            response = requests.delete(
                f"{self.api_base}/realtime/sessions/{session_id}",
                headers=self.headers,
                timeout=10,
            )

            response.raise_for_status()
            current_app.logger.info(f"Ended realtime session: {session_id}")
            return True

        except Exception as e:
            current_app.logger.error(f"Error ending session {session_id}: {str(e)}")
            raise

    def get_session_status(self, session_id):
        """
        Get the status of a realtime session.
        """
        try:
            response = requests.get(
                f"{self.api_base}/realtime/sessions/{session_id}",
                headers=self.headers,
                timeout=10,
            )

            response.raise_for_status()
            return response.json()

        except Exception as e:
            current_app.logger.error(f"Error checking session {session_id}: {str(e)}")
            raise