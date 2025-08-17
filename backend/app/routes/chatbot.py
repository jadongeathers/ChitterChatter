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
        speed = data.get("speed")  # ← NEW

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        user = db.session.get(User, user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        practice_case = db.session.get(PracticeCase, practice_case_id)
        if not practice_case:
            return jsonify({"error": "Practice case not found"}), 404

        prompt_text = practice_case.system_prompt

        # (Optional) clamp server-side too
        if isinstance(speed, (int, float)):
            speed = max(0.25, min(1.5, float(speed)))
            current_app.logger.info(f"Realtime speed requested: {speed}")

        # ↓↓↓ pass speed
        session_data = voice_service.create_session(
            prompt_text,
            practice_case_id=practice_case_id,
            speed=speed,  # ← NEW
        )
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
    Generate a voice preview using the application's configured voice service.
    """
    try:
        data = request.get_json()
        voice_id = data.get("voice", "aura-asteria-en") # Use a valid default voice
        sample_text = data.get("text", "Hello! I'm here to help you practice your conversation skills.")
        
        # The `voice_service` now handles the API call
        audio_content = voice_service.generate_preview(voice_id, sample_text)
        
        if not audio_content:
            return jsonify({"error": "Failed to generate voice preview from service"}), 502

        # Return the audio file directly
        return Response(
            audio_content,
            mimetype="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=voice_preview.mp3",
                "Cache-Control": "no-cache"
            }
        )
        
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