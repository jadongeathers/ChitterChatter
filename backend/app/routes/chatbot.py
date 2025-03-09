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
    """
    Create a new realtime session with OpenAI using a practice case determined
    by the user's institution, class_name, and the lesson.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON payload"}), 400

        user_id = data.get("user_id")
        practice_case_id = data.get("practice_case_id")

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        # Retrieve user
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Fetch practice case by class_name
        practice_case = PracticeCase.query.filter_by(
            class_name=user.class_name, id=practice_case_id
        ).first()

        if not practice_case:
            return jsonify({"error": "Practice case not found for class"}), 404

        # Send system prompt directly from the database
        prompt_text = practice_case.system_prompt

        # Create session with OpenAI API
        session_data = voice_service.create_session(prompt_text, practice_case_id=practice_case_id)
        return jsonify(session_data)

    except Exception as e:
        current_app.logger.error(f"Error creating session: {str(e)}")
        return jsonify({"error": str(e)}), 500


@chatbot.route("/conversation/start", methods=["POST"])
def start_conversation():
    """
    Start a new conversation session.
    """
    try:
        data = request.json
        user_id = data.get("user_id")
        practice_case_id = data.get("practice_case_id")

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400
        if not practice_case_id:
            return jsonify({"error": "Missing practice_case_id"}), 400

        # Retrieve the user
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Fetch practice case by class_name
        practice_case = PracticeCase.query.filter_by(
            class_name=user.class_name, id=practice_case_id
        ).first()

        if not practice_case:
            return jsonify({"error": "Practice case not found for class"}), 404

        # Retrieve prompt from the database instead of reading from files
        prompt_text = practice_case.system_prompt

        # Create a new conversation
        conversation = Conversation(
            user_id=user_id,
            practice_case_id=practice_case.id,
            start_time=datetime.now(timezone.utc),
            language=user.target_language or "en",
        )

        db.session.add(conversation)
        db.session.commit()

        return jsonify(
            {
                "conversation_id": conversation.id,
                "start_time": conversation.start_time.isoformat(),
                "max_time": practice_case.max_time,
            }
        )

    except Exception as e:
        current_app.logger.error(f"Error starting conversation: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to start conversation"}), 500


@chatbot.route("/realtime", methods=["POST"])
def proxy_openai_realtime():
    """
    Proxy OpenAI Realtime API through the backend.
    """
    try:
        if not OPENAI_API_KEY:
            return jsonify({"error": "OpenAI API key is missing"}), 500

        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/sdp",
        }

        # Forward request to OpenAI
        openai_response = requests.post(
            "https://api.openai.com/v1/realtime",
            headers=headers,
            data=request.data
        )

        # Log response details
        current_app.logger.info(f"OpenAI API response: {openai_response.status_code}, {openai_response.text}")

        # If OpenAI request fails, return error
        if openai_response.status_code != 200:
            return jsonify({
                "error": "Failed to fetch OpenAI API",
                "status": openai_response.status_code,
                "details": openai_response.text
            }), openai_response.status_code

        # Forward valid OpenAI response
        return openai_response.text, openai_response.status_code

    except Exception as e:
        current_app.logger.error(f"Error proxying OpenAI: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

