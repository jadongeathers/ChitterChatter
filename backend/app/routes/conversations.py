from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timezone
from app.models import Conversation, Message, PracticeCase, db
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from openai import OpenAI

conversations = Blueprint("conversations", __name__)

@conversations.route("/conversation/start", methods=["POST"])
@jwt_required()
def start_conversation():
    """
    Start a new conversation and return the conversation ID.
    """
    try:
        data = request.json
        user_id = get_jwt_identity()
        practice_case_id = data.get("practice_case_id")

        if not user_id or not practice_case_id:
            return jsonify({"error": "Missing user_id or practice_case_id"}), 400
            
        # Get the practice case to extract language code
        practice_case = PracticeCase.query.get(practice_case_id)
        if not practice_case:
            return jsonify({"error": "Practice case not found"}), 404
            
        # Extract language code from practice case
        language_code = practice_case.language_code or "en"

        conversation = Conversation(
            user_id=user_id,  # ✅ Ensure conversation links to a student
            practice_case_id=practice_case_id,
            start_time=datetime.now(timezone.utc),
            language=language_code  # Set language from practice case
        )

        db.session.add(conversation)
        db.session.commit()

        return jsonify({"conversation_id": conversation.id, "start_time": conversation.start_time.isoformat()})

    except Exception as e:
        current_app.logger.error(f"Error starting conversation: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to start conversation"}), 500


@conversations.route("/conversation/<int:conversation_id>/messages", methods=["GET"])
@jwt_required()
def get_conversation_messages(conversation_id):
    """
    Retrieve all messages for a conversation.
    """
    try:
        user_id = get_jwt_identity()
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            current_app.logger.error(f"Conversation not found")
            return jsonify({"error": "Conversation not found"}), 404
        
        if str(conversation.user_id) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        messages = [msg.to_dict() for msg in conversation.messages]

        return jsonify({"conversation_id": conversation.id, "messages": messages})

    except Exception as e:
        current_app.logger.error(f"Failed to retrieve messages")
        current_app.logger.error(f"Error retrieving messages: {str(e)}")
        return jsonify({"error": "Failed to fetch messages"}), 500
    

@conversations.route("/conversation/<int:conversation_id>/save_message", methods=["POST"])
@jwt_required()
def save_message(conversation_id):
    """
    Save a message to an existing conversation.
    """
    try:
        user_id = get_jwt_identity()
        data = request.json
        role = data.get("role")  # "user" or "assistant"
        text = data.get("text")

        if not role or not text:
            return jsonify({"error": "Missing role or text"}), 400

        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        if str(conversation.user_id) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        message = Message(
            conversation_id=conversation.id,
            user_id=conversation.user_id,  # Ensure the message links to the student
            role=role,
            content=text
        )

        db.session.add(message)
        db.session.commit()

        return jsonify({"message_id": message.id, "status": "saved"})

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving message: {str(e)}")
        return jsonify({"error": "Failed to save message"}), 500
    

@conversations.route("/conversation/<int:conversation_id>/end", methods=["POST"])
@jwt_required()
def end_conversation(conversation_id):
    try:
        current_app.logger.info(f"🔄 Attempting to end conversation {conversation_id}")

        user_id = get_jwt_identity()
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            current_app.logger.error(f"❌ Conversation {conversation_id} not found")
            return jsonify({"error": "Conversation not found"}), 404
        
        if str(conversation.user_id) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        # Fetch associated practice case
        practice_case = conversation.practice_case  
        if not practice_case:
            current_app.logger.error(f"❌ No associated practice case found for conversation {conversation_id}")
            return jsonify({"error": "Practice case not found"}), 404

        # Load feedback prompt from the practice case
        feedback_prompt = practice_case.feedback_prompt  # Assuming `feedback_prompt` exists in `PracticeCase` model
        if not feedback_prompt:
            current_app.logger.error(f"❌ Feedback prompt missing for practice case {practice_case.id}")
            return jsonify({"error": "Feedback prompt not found"}), 500

        # Set conversation end time & duration
        conversation.end_time = datetime.now(timezone.utc)
        conversation.duration = int((conversation.end_time - conversation.start_time).total_seconds())

        # Determine if conversation meets minimum required time
        if conversation.duration >= practice_case.min_time:
            conversation.completed = True
            current_app.logger.info(f"✅ Conversation {conversation_id} marked as completed.")

        # Compile messages for feedback generation
        compiled_messages = conversation.get_messages_history()
        current_app.logger.info(f"📜 Compiled conversation transcript: {compiled_messages}")

        # Check OpenAI API Key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            current_app.logger.error("❌ OPENAI_API_KEY is missing or not set in environment variables.")
            return jsonify({"error": "OpenAI API key is missing"}), 500

        # Generate AI Feedback using GPT-4o
        client = OpenAI(api_key=api_key)
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": feedback_prompt},
                    {"role": "user", "content": "\n".join([f"{msg['role']}: {msg['content']}" for msg in compiled_messages])},
                ]
            )

            # Extract feedback
            feedback = response.choices[0].message.content
            current_app.logger.info(f"✅ AI Feedback Generated: {feedback}")

            # Store feedback in DB
            conversation.feedback = feedback
            db.session.commit()

            return jsonify({
                "message": "Conversation ended",
                "conversation": conversation.to_dict(),
                "feedback": feedback
            })
        except Exception as ai_error:
            current_app.logger.error(f"❌ OpenAI API call failed: {str(ai_error)}")
            return jsonify({"error": f"Failed to generate AI feedback: {str(ai_error)}"}), 500

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"❌ General error ending conversation: {str(e)}")
        return jsonify({"error": str(e)}), 500

@conversations.route("/conversation/<int:conversation_id>/feedback", methods=["GET"])
@jwt_required()
def get_feedback(conversation_id):
    """
    Retrieve feedback for a given conversation.
    """
    try:
        user_id = get_jwt_identity()
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        if str(conversation.user_id) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        if not conversation.feedback:
            return jsonify({"error": "Feedback not available"}), 404

        return jsonify({"feedback": conversation.feedback})

    except Exception as e:
        current_app.logger.error(f"❌ Error fetching feedback: {str(e)}")
        return jsonify({"error": "Failed to fetch feedback"}), 500

@conversations.route("/conversation/latest", methods=["GET"])
@jwt_required()
def get_latest_conversation():
    """
    Retrieve the most recent conversation for the authenticated user with optional class filtering.
    
    Query Parameters:
    - class_id (optional): Filter for latest conversation in a specific class
    - section_id (optional): Filter for latest conversation in a specific section
    """
    try:
        current_app.logger.info("🔄 [START] Attempting to fetch the latest conversation for the current user.")

        # Get the user ID from the JWT token
        user_id = get_jwt_identity()
        current_app.logger.debug(f"🔑 Retrieved user ID from JWT: {user_id}")

        # Check if user ID is valid
        if not user_id:
            current_app.logger.error("❌ No user ID found in JWT token.")
            return jsonify({"error": "User ID not found in token."}), 400

        # Get optional filters
        class_id = request.args.get('class_id', type=int)
        section_id = request.args.get('section_id', type=int)

        # Build query with optional class filter
        query = Conversation.query.filter_by(user_id=user_id, completed=True)
        
        if class_id:
            query = query.join(PracticeCase).filter(PracticeCase.class_id == class_id)
        
        conversation = query.order_by(Conversation.id.desc()).first()

        # Check if a conversation was found
        if not conversation:
            current_app.logger.warning(f"⚠️ No recent conversation found for user ID: {user_id}")
            return jsonify({"error": "No recent conversation found."}), 404

        current_app.logger.info(f"✅ Latest conversation found for user ID {user_id} with conversation ID {conversation.id}")

        # Debugging: Log the messages and feedback details
        messages_history = conversation.get_messages_history()
        current_app.logger.debug(f"📝 Retrieved messages history: {messages_history}")
        feedback = conversation.feedback or "No feedback available."
        current_app.logger.debug(f"💬 Retrieved feedback: {feedback}")

        # Return the conversation data
        return jsonify({
            "conversation_id": conversation.id,
            "messages": messages_history,
            "feedback": feedback
        })

    except Exception as e:
        current_app.logger.error(f"❌ [ERROR] Failed to fetch recent conversation for user {user_id if 'user_id' in locals() else 'Unknown'}: {str(e)}")
        return jsonify({"error": "Failed to fetch recent conversation"}), 500
