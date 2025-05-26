from flask import current_app
import requests
import os
from datetime import datetime
from backend.app.models import PracticeCase, db

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
        }

    def create_session(self, prompt_text, practice_case_id=None):
        """
        Create a new realtime conversation session with the provided prompt text.
        
        Args:
            prompt_text (str): The system prompt for the conversation
            practice_case_id (int, optional): The ID of the practice case to use for voice/language settings
        """
        try:
            # Default values
            voice = "verse"
            language_code = "en"
            
            # If practice_case_id is provided, fetch voice and language settings
            if practice_case_id:
                try:
                    practice_case = PracticeCase.query.get(practice_case_id)
                    if practice_case:
                        voice = practice_case.voice or voice
                        language_code = practice_case.language_code or language_code
                        current_app.logger.info(f"Using voice={voice}, language_code={language_code} from practice case {practice_case_id}")
                except Exception as e:
                    current_app.logger.error(f"Error fetching practice case settings: {str(e)}")
                    # Continue with defaults
            
            current_app.logger.info(f"Creating realtime session with voice={voice}, language_code={language_code}")
            
            response = requests.post(
                f"{self.api_base}/realtime/sessions",
                headers=self.headers,
                json={
                    "model": "gpt-4o-realtime-preview-2024-12-17",
                    "voice": voice,
                    "instructions": prompt_text,
                    "input_audio_transcription": {
                        "model": "whisper-1",
                        "language": language_code
                    },
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "prefix_padding_ms": 500,
                        "silence_duration_ms": 500
                    }
                },
                timeout=10,
            )

            # Handle response
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