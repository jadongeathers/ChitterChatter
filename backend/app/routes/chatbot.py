import os
import requests
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from flask import Blueprint, Response, jsonify, request, current_app, send_file
from app.models import User, PracticeCase, Conversation, Message, db
from app.services.voice_service import VoiceService
from pathlib import Path
from werkzeug.exceptions import NotFound

# Import environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

chatbot = Blueprint("chatbot", __name__)
voice_service = VoiceService()


@chatbot.route("/session", methods=["POST"])
def create_session():
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        practice_case_id = data.get("practice_case_id")

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        user = db.session.get(User, user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        practice_case = db.session.get(PracticeCase, practice_case_id)
        if not practice_case:
            return jsonify({"error": "Practice case not found"}), 404

        prompt_text = practice_case.system_prompt
        session_data = voice_service.create_session(prompt_text, practice_case_id=practice_case_id)
        return jsonify(session_data)

    except Exception as e:
        current_app.logger.error(f"Error creating session: {str(e)}")
        return jsonify({"error": str(e)}), 500


@chatbot.route("/realtime", methods=["POST"])
def proxy_openai_realtime():
    """
    Debug endpoint for realtime API
    """
    try:
        # Log that this endpoint was accessed
        current_app.logger.warning(
            "The /api/chatbot/realtime endpoint was accessed, but this should not be used. "
            "SDP exchange should happen over WebSocket directly with OpenAI."
        )
        
        # Return a helpful error message
        return jsonify({
            "error": "This endpoint is not intended for direct SDP exchange. "
            "WebRTC connections should be established using the WebSocket URL from session creation."
        }), 400
    except Exception as e:
        current_app.logger.error(f"Error in realtime proxy: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
    
@chatbot.route("/voice/preview", methods=["POST"])
def preview_voice():
    """
    Generate a voice preview using OpenAI's TTS API for instructor voice selection.
    """
    try:
        data = request.get_json()
        voice_id = data.get("voice", "alloy")
        sample_text = data.get("text", "Hello! I'm here to help you practice your conversation skills. Let's have a great learning session together.")
        
        # Validate voice_id against OpenAI's available voices
        valid_voices = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"]
        if voice_id not in valid_voices:
            return jsonify({"error": f"Invalid voice. Must be one of: {', '.join(valid_voices)}"}), 400
        
        # Make request to OpenAI TTS API
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "tts-1",
            "voice": voice_id,
            "input": sample_text,
            "response_format": "mp3"
        }
        
        current_app.logger.info(f"Generating voice preview for voice: {voice_id}")
        
        response = requests.post(
            "https://api.openai.com/v1/audio/speech",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if not response.ok:
            current_app.logger.error(f"OpenAI TTS API error: {response.status_code} - {response.text}")
            return jsonify({"error": "Failed to generate voice preview"}), 500
        
        # Return the audio file directly
        return Response(
            response.content,
            mimetype="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=voice_preview.mp3",
                "Cache-Control": "no-cache"
            }
        )
        
    except requests.RequestException as e:
        current_app.logger.error(f"Request error in voice preview: {str(e)}")
        return jsonify({"error": "Failed to connect to voice service"}), 503
    except Exception as e:
        current_app.logger.error(f"Error generating voice preview: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@chatbot.route("/voice/options", methods=["GET"])
def get_voice_options():
    """
    Get available voice options with descriptions for the frontend.
    """
    try:
        voice_options = [
            {"id": "alloy", "name": "Alloy", "description": "Neutral, balanced tone"},
            {"id": "ash", "name": "Ash", "description": "Warm, friendly voice"},
            {"id": "ballad", "name": "Ballad", "description": "Calm, soothing tone"},
            {"id": "coral", "name": "Coral", "description": "Bright, energetic voice"},
            {"id": "echo", "name": "Echo", "description": "Clear, professional tone"},
            {"id": "sage", "name": "Sage", "description": "Wise, measured voice"},
            {"id": "shimmer", "name": "Shimmer", "description": "Light, pleasant tone"},
            {"id": "verse", "name": "Verse", "description": "Expressive, dynamic voice"}
        ]
        
        return jsonify({
            "voices": voice_options,
            "default": "verse"
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting voice options: {str(e)}")
        return jsonify({"error": "Failed to get voice options"}), 500