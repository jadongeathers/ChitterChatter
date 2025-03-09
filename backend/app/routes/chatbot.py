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
    # Get the data from the request
    content_type = request.headers.get('Content-Type')
    
    # Verify authorization in your backend
    auth_header = request.headers.get('Authorization')
    if not auth_header or not validate_auth_token(auth_header):
        return jsonify({"error": "Unauthorized"}), 401
    
    # Forward the request to OpenAI
    openai_url = "https://api.openai.com/v1/realtime"
    openai_headers = {
        "Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY')}",
        "Content-Type": content_type
    }
    
    try:
        response = requests.post(
            openai_url,
            headers=openai_headers,
            data=request.get_data(),
            stream=True
        )
        
        # Return the response from OpenAI to the client
        return Response(
            response.iter_content(chunk_size=1024),
            status=response.status_code,
            content_type=response.headers.get('Content-Type')
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
