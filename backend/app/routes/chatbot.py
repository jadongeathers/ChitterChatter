import os
import requests
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from flask import Blueprint, jsonify, request, current_app, send_file
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

        authorized_class_ids = {e.section.class_id for e in user.enrollments if e.role == "student"}
        if practice_case.class_id not in authorized_class_ids:
            return jsonify({"error": "Not authorized for this practice case"}), 403

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