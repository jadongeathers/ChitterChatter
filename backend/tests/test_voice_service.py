import pytest
from unittest.mock import patch
from backend.app.services.voice_service import VoiceService

def test_create_session(app):
    """Test VoiceService's create_session method inside an app context."""
    service = VoiceService()

    with app.app_context():
        with patch("requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "id": "test_session_id",  
                "client_secret": {
                    "value": "test_client_secret",
                    "expires_at": 1738180339
                }
            }

            session = service.create_session("Test prompt text")

            assert session["session_id"] == "test_session_id"
            assert session["client_secret"] == "test_client_secret"
