from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timezone
from app.models import Conversation, Message, PracticeCase, db
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from openai import OpenAI

conversations = Blueprint("conversations", __name__)

@conversations.route("/conversation/start", methods=["POST"])
def start_conversation():
    """
    Start a new conversation and return the conversation ID.
    """
    try:
        data = request.json
        user_id = data.get("user_id")
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
            student_id=user_id,  # ✅ Ensure conversation links to a student
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
def get_conversation_messages(conversation_id):
    """
    Retrieve all messages for a conversation.
    """
    try:
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            current_app.logger.error(f"Conversation not found")
            return jsonify({"error": "Conversation not found"}), 404

        messages = [msg.to_dict() for msg in conversation.messages]

        return jsonify({"conversation_id": conversation.id, "messages": messages})

    except Exception as e:
        current_app.logger.error(f"Failed to retrieve messages")
        current_app.logger.error(f"Error retrieving messages: {str(e)}")
        return jsonify({"error": "Failed to fetch messages"}), 500
    

@conversations.route("/conversation/<int:conversation_id>/save_message", methods=["POST"])
def save_message(conversation_id):
    """
    Save a message to an existing conversation.
    """
    try:
        data = request.json
        role = data.get("role")  # "user" or "assistant"
        text = data.get("text")

        if not role or not text:
            return jsonify({"error": "Missing role or text"}), 400

        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

        message = Message(
            conversation_id=conversation.id,
            student_id=conversation.student_id,  # Ensure the message links to the student
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
def end_conversation(conversation_id):
    try:
        current_app.logger.info(f"🔄 Attempting to end conversation {conversation_id}")

        # ✅ Fetch conversation
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            current_app.logger.error(f"❌ Conversation {conversation_id} not found")
            return jsonify({"error": "Conversation not found"}), 404

        # ✅ Fetch associated practice case
        practice_case = conversation.practice_case  
        if not practice_case:
            current_app.logger.error(f"❌ No associated practice case found for conversation {conversation_id}")
            return jsonify({"error": "Practice case not found"}), 404

        # ✅ Load feedback prompt from the practice case
        feedback_prompt = practice_case.feedback_prompt  # Assuming `feedback_prompt` exists in `PracticeCase` model
        if not feedback_prompt:
            current_app.logger.error(f"❌ Feedback prompt missing for practice case {practice_case.id}")
            return jsonify({"error": "Feedback prompt not found"}), 500

        start_time = conversation.start_time
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        # ✅ Set conversation end time & duration
        conversation.end_time = datetime.now(timezone.utc)
        conversation.duration =  int((conversation.end_time - start_time).total_seconds())

        # ✅ Determine if conversation meets minimum required time
        if conversation.duration >= practice_case.min_time:
            conversation.completed = True
            current_app.logger.info(f"✅ Conversation {conversation_id} marked as completed.")

        # ✅ Compile messages for feedback generation
        compiled_messages = conversation.get_messages_history()
        current_app.logger.info(f"📜 Compiled conversation transcript: {compiled_messages}")

        # ✅ Check OpenAI API Key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            current_app.logger.error("❌ OPENAI_API_KEY is missing or not set in environment variables.")
            return jsonify({"error": "OpenAI API key is missing"}), 500

        # ✅ Generate AI Feedback using GPT-4o
        client = OpenAI(api_key=api_key)
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": feedback_prompt},
                    {"role": "user", "content": "\n".join([f"{msg['role']}: {msg['content']}" for msg in compiled_messages])},
                ]
            )

            # ✅ Extract feedback
            feedback = response.choices[0].message.content
            current_app.logger.info(f"✅ AI Feedback Generated: {feedback}")

            # ✅ Store feedback in DB
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
def get_feedback(conversation_id):
    """
    Retrieve feedback for a given conversation.
    """
    try:
        current_app.logger.info(f"🔄 Fetching feedback for conversation {conversation_id}")

        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            current_app.logger.error(f"❌ Conversation {conversation_id} not found")
            return jsonify({"error": "Conversation not found"}), 404

        if not conversation.feedback:
            current_app.logger.error(f"❌ Feedback not available for conversation {conversation_id}")
            return jsonify({"error": "Feedback not available"}), 404

        current_app.logger.info(f"✅ Feedback retrieved successfully: {conversation.feedback}")

        return jsonify({"feedback": conversation.feedback})

    except Exception as e:
        current_app.logger.error(f"❌ Error fetching feedback: {str(e)}")
        return jsonify({"error": "Failed to fetch feedback"}), 500


@conversations.route("/conversation/latest", methods=["GET"])
@jwt_required()
def get_latest_conversation():
    """
    Retrieve the most recent conversation for the authenticated user, including transcript & AI feedback.
    """
    try:
        current_app.logger.info("🔄 [START] Attempting to fetch the latest conversation for the current user.")

        # Get the user ID from the JWT token
        student_id = get_jwt_identity()
        current_app.logger.debug(f"🔑 Retrieved user ID from JWT: {student_id}")

        # Check if user ID is valid
        if not student_id:
            current_app.logger.error("❌ No user ID found in JWT token.")
            return jsonify({"error": "User ID not found in token."}), 400

        # Filter conversations by user ID and get the most recent one
        current_app.logger.debug("📥 Querying the database for the user's latest conversation.")
        conversation = (
            Conversation.query
            .filter_by(student_id=student_id, completed=True)  # Filter conversations for the logged-in user
            .order_by(Conversation.id.desc())  # Order by the latest conversation ID
            .first()
        )

        # Check if a conversation was found
        if not conversation:
            current_app.logger.warning(f"⚠️ No recent conversation found for user ID: {student_id}")
            return jsonify({"error": "No recent conversation found."}), 404

        current_app.logger.info(f"✅ Latest conversation found for user ID {student_id} with conversation ID {conversation.id}")

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
        current_app.logger.error(f"❌ [ERROR] Failed to fetch recent conversation for user {student_id if 'student_id' in locals() else 'Unknown'}: {str(e)}")
        return jsonify({"error": "Failed to fetch recent conversation"}), 500
    
@conversations.route("/feedback-chat", methods=["POST"])  # Use 'conversations' not 'conversations_bp'
@jwt_required()
def feedback_chat():
    """Handle feedback chatbot conversations using OpenAI API"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        conversation_id = data.get('conversation_id')
        user_message = data.get('user_message')
        conversation_history = data.get('conversation_history', [])
        original_conversation = data.get('original_conversation', [])
        existing_feedback = data.get('existing_feedback', '')
        
        if not conversation_id or not user_message:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Verify user owns this conversation
        conversation = db.session.query(Conversation).filter_by(
            id=conversation_id, 
            student_id=current_user_id
        ).first()
        
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Initialize OpenAI client
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Format the original conversation transcript
        formatted_transcript = format_conversation_for_ai(original_conversation)
        
        # Build context for OpenAI - Include the original conversation transcript
        system_prompt = f"""You are an AI tutor--a Virtual Practice Partner (VPP)--that provides personalized feedback to students practicing their language skills. You must use English to provide feedback. You should not make it clear that you are AI.

ORIGINAL PRACTICE CONVERSATION TRANSCRIPT:
{formatted_transcript}

EXISTING AI FEEDBACK (if any):
{existing_feedback if existing_feedback else "No previous feedback provided."}

To provide feedback, you will use the transcript above from a student-VPP interaction. Your responses should be anchored in the transcript.

Your primary goal is to help students **improve proficiency, comfort, and confidence** in their target language.

Provide feedback in a **constructive, supportive, and encouraging tone**.
Follow the structure of the three sections below. Keep your response conversational and ask them to pick one option or tell you what they're most curious about. Don't give detailed feedback yet - wait for their choice.
Keep responses focused and conversational. Don't overwhelm them with too much information at once.
Other than section 1, wait for the student to respond after each feedback.

SECTION 1:
Welcome the student to the "interactive feedback portion of today's conversation." Positively encourage and affirm the student on the effort and work the student did today. You will then provide a short holistic summary of how the student did. You will base this summary on the students performance on several aspects, such as how well the student...
Do not prompt the student to ask questions yet, just provide a summary of their performance.

- Fulfilled instructor-given goals ('Curricular Goals' and 'Key Items to Use')
- Utilized contextually significant vocabulary 
- Followed grammar constructions 
- Elaborated their ideas/Used complexity 

Each aspect should be expressed in 1-2 short sentences.

SECTION 2:
To start, you will provide feedback to the student using the 'feedback sandwich', which follows this structure:

1. Provide a piece of positive feedback based on which 'Curricular Goals' and 'Key Items to Use' were fulfilled in the transcript. 
2. Provide constructive criticism for the student. 
3. Continue to the second positive feedback.

SECTION 3:
After feedback has been provided, allow the student to ask any clarifying questions or further explanation for the provided feedback.

Guide the student in revising their transcript. You will suggest 3 responses that the student can explore related to their performance on their activity. There should be 1 question related to each option:

Option 1: Hypothesis Testing - Prompt the student by highlighting a specific part of their text and inviting them to self-correct. You should first present negative evidence and ask an open-ended question, encouraging reflection. After the student responds, you should offer positive evidence by modeling a more accurate or natural phrasing.

Option 2: Further exploration - Prompt the student into exploring contextually related content to deepen their understanding by offering additional support. Offer related vocabulary, expression, or grammatical structure that could strengthen or expand the student's original statement.

Option 3: Continue on - Prompt the student into continuing onto the next section of the interactive feedback, the student self-guided review.

Answer the student's questions based on the conversation transcript above and provide specific examples from their practice session."""

        # Prepare messages for OpenAI
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (limit to last 10 messages to avoid token limits)
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        messages.extend(recent_history)
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=400,
            temperature=0.7,
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        return jsonify({
            "response": ai_response,
            "status": "success"
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in feedback chat: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def format_conversation_for_ai(messages):
    """Format conversation messages for AI context"""
    if not messages:
        return "No conversation data available."
    
    formatted = []
    for msg in messages:
        # Handle different message formats that might come from frontend
        if isinstance(msg, dict):
            role = "Student" if msg.get('role') == 'user' else "Practice Partner"
            content = msg.get('content', '')
        else:
            # Fallback for other formats
            role = "Unknown"
            content = str(msg)
        
        formatted.append(f"{role}: {content}")
    
    return "\n".join(formatted)