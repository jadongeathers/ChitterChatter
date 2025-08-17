from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timezone
from app.models import db
from app.models.feedback_conversation import FeedbackConversation
from app.models.feedback_message import FeedbackMessage
from app.models import Conversation, PracticeCase
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import json
from openai import OpenAI

dialogic_feedback = Blueprint("dialogic_feedback", __name__)

@dialogic_feedback.route("/feedback/<int:feedback_conversation_id>/start", methods=["POST"])
@jwt_required()
def start_dialogic_feedback(feedback_conversation_id):
    """
    Initialize or resume a dialogic feedback session.
    Returns the summary feedback and initial suggestions.
    """
    try:
        user_id = get_jwt_identity()
        feedback_conv = FeedbackConversation.query.get(feedback_conversation_id)
        
        if not feedback_conv:
            return jsonify({"error": "Feedback conversation not found"}), 404
        
        if str(feedback_conv.user_id) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        # Parse JSON feedback if available
        feedback_json = None
        if feedback_conv.detailed_feedback:
            try:
                feedback_json = json.loads(feedback_conv.detailed_feedback)
                current_app.logger.info(f"✅ Parsed JSON feedback for conversation {feedback_conversation_id}")
            except json.JSONDecodeError:
                current_app.logger.info(f"ℹ️ Using text-based feedback for conversation {feedback_conversation_id}")

        # Generate contextual suggestions based on the feedback
        suggestions = generate_feedback_suggestions(feedback_conv, feedback_json)

        # If this is the first time accessing, add a welcome message from the AI
        if len(feedback_conv.feedback_messages) == 0:
            welcome_message = create_welcome_message(feedback_conv, feedback_json)
            feedback_conv.add_message("feedback_assistant", welcome_message)
            db.session.commit()

        return jsonify({
            "feedback_conversation_id": feedback_conv.id,
            "summary_feedback": feedback_conv.summary_feedback,
            "messages": feedback_conv.get_messages_history(),
            "suggestions": suggestions,
            "is_active": feedback_conv.is_active,
            "feedback_version": feedback_conv.feedback_version
        })

    except Exception as e:
        current_app.logger.error(f"❌ Error starting dialogic feedback: {str(e)}")
        return jsonify({"error": "Failed to start feedback session"}), 500


@dialogic_feedback.route("/feedback/<int:feedback_conversation_id>/chat", methods=["POST"])
@jwt_required()
def send_feedback_message(feedback_conversation_id):
    """
    Send a message in the dialogic feedback conversation and get AI response.
    """
    try:
        user_id = get_jwt_identity()
        data = request.json
        user_message = data.get("message", "").strip()
        is_suggestion = data.get("is_suggestion", False)

        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        feedback_conv = FeedbackConversation.query.get(feedback_conversation_id)
        
        if not feedback_conv:
            return jsonify({"error": "Feedback conversation not found"}), 404
        
        if str(feedback_conv.user_id) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        if not feedback_conv.is_active:
            return jsonify({"error": "Feedback session has ended"}), 400

        # Save user message
        user_msg = feedback_conv.add_message("user", user_message)
        user_msg.is_suggestion = is_suggestion
        
        # Parse JSON feedback if available
        feedback_json = None
        if feedback_conv.detailed_feedback:
            try:
                feedback_json = json.loads(feedback_conv.detailed_feedback)
            except json.JSONDecodeError:
                pass
        
        # Generate AI response
        ai_response = generate_ai_feedback_response(feedback_conv, user_message, feedback_json)
        
        # Save AI response
        feedback_conv.add_message("feedback_assistant", ai_response)
        
        db.session.commit()

        # Generate new suggestions based on the conversation
        suggestions = generate_feedback_suggestions(feedback_conv, feedback_json)

        return jsonify({
            "ai_response": ai_response,
            "messages": feedback_conv.get_messages_history(),
            "suggestions": suggestions
        })

    except Exception as e:
        current_app.logger.error(f"❌ Error in feedback chat: {str(e)}")
        return jsonify({"error": "Failed to process message"}), 500


@dialogic_feedback.route("/feedback/<int:feedback_conversation_id>/end", methods=["POST"])
@jwt_required()
def end_dialogic_feedback(feedback_conversation_id):
    """
    End the dialogic feedback session.
    """
    try:
        user_id = get_jwt_identity()
        feedback_conv = FeedbackConversation.query.get(feedback_conversation_id)
        
        if not feedback_conv:
            return jsonify({"error": "Feedback conversation not found"}), 404
        
        if str(feedback_conv.user_id) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        feedback_conv.end_session()
        db.session.commit()

        return jsonify({
            "message": "Feedback session ended",
            "duration": feedback_conv.calculate_duration()
        })

    except Exception as e:
        current_app.logger.error(f"❌ Error ending feedback session: {str(e)}")
        return jsonify({"error": "Failed to end session"}), 500


@dialogic_feedback.route("/feedback/<int:feedback_conversation_id>/messages", methods=["GET"])
@jwt_required()
def get_feedback_messages(feedback_conversation_id):
    """
    Get all messages in a feedback conversation.
    """
    try:
        user_id = get_jwt_identity()
        feedback_conv = FeedbackConversation.query.get(feedback_conversation_id)
        
        if not feedback_conv:
            return jsonify({"error": "Feedback conversation not found"}), 404
        
        if str(feedback_conv.user_id) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        return jsonify({
            "feedback_conversation_id": feedback_conv.id,
            "messages": feedback_conv.get_messages_history(),
            "is_active": feedback_conv.is_active,
            "feedback_version": feedback_conv.feedback_version
        })

    except Exception as e:
        current_app.logger.error(f"❌ Error fetching feedback messages: {str(e)}")
        return jsonify({"error": "Failed to fetch messages"}), 500


def create_welcome_message(feedback_conv, feedback_json=None):
    """
    Create a welcoming initial message from the AI feedback assistant.
    Tailored based on whether structured feedback is available and personalized with user's name.
    """
    # Get user's name from the feedback conversation
    user = feedback_conv.user if hasattr(feedback_conv, 'user') else None
    user_name = ""
    
    if user and hasattr(user, 'first_name') and user.first_name:
        user_name = f"{user.first_name}, "
    
    if feedback_json and feedback_json.get("detailed_feedback", {}).get("sections"):
        # Create a more specific welcome message based on available sections
        sections = feedback_json["detailed_feedback"]["sections"]
        section_names = [section.get("area", "Unknown") for section in sections[:3]]
        
        if len(section_names) > 2:
            sections_text = f"{', '.join(section_names[:-1])}, and {section_names[-1]}"
        elif len(section_names) == 2:
            sections_text = f"{section_names[0]} and {section_names[1]}"
        else:
            sections_text = section_names[0] if section_names else "various areas"
        
        return f"""Hi {user_name}I'm here to help you understand your feedback and answer any questions about your practice session.

Feel free to ask me about specific examples from your conversation, how to improve in any particular area, tips for your next practice session, or clarification on any feedback points.

What would you like to explore first?"""
    else:
        # Fallback welcome message for text-based feedback
        return f"""Hi {user_name}I'm here to help you understand your feedback and answer any questions you might have about your practice session. 

Feel free to ask me about specific areas where you did well, how to improve in certain areas, examples from your conversation, or tips for your next practice session.

What would you like to know more about?"""


def generate_feedback_suggestions(feedback_conv, feedback_json=None):
    """
    Generate contextual suggestion buttons based on the feedback content and conversation history.
    Enhanced to work with structured JSON feedback.
    """
    try:
        # Get the original conversation and practice case for context
        original_conv = feedback_conv.original_conversation
        practice_case = original_conv.practice_case if original_conv else None
        
        # Base suggestions that are always relevant
        base_suggestions = [
            "What did I do well in this conversation?",
            "How can I improve for next time?",
            "Can you give me specific examples?",
            "Can we practice one better sentence together?",
            "Which mistake should I fix first?",
        ]
        
        # Add contextual suggestions based on feedback content
        contextual_suggestions = []
        
        if feedback_json:
            # Generate suggestions based on structured feedback
            sections = feedback_json.get("detailed_feedback", {}).get("sections", [])
            
            for section in sections[:3]:  # Limit to first 3 sections
                area = section.get("area", "")
                if area:
                    contextual_suggestions.append(f"Tell me more about my {area.lower()}")
                    
                    # Add specific suggestions based on the area
                    if "grammar" in area.lower():
                        contextual_suggestions.append("What grammar mistakes should I focus on?")
                    elif "vocabulary" in area.lower():
                        contextual_suggestions.append("How can I expand my vocabulary?")
                    elif "conversation" in area.lower():
                        contextual_suggestions.append("How can I improve my conversation flow?")
                    elif "pronunciation" in area.lower():
                        contextual_suggestions.append("What pronunciation tips do you have?")
                    elif "cultural" in area.lower():
                        contextual_suggestions.append("How can I be more culturally appropriate?")
        else:
            # Generate suggestions based on text feedback
            feedback_text = feedback_conv.detailed_feedback or feedback_conv.summary_feedback or ""
            
            # Look for key terms in feedback to generate relevant suggestions
            if any(word in feedback_text.lower() for word in ["grammar", "grammatical", "tense"]):
                contextual_suggestions.append("Can you explain the grammar issues you mentioned?")
            
            if any(word in feedback_text.lower() for word in ["vocabulary", "word choice", "expression"]):
                contextual_suggestions.append("How can I expand my vocabulary?")
            
            if any(word in feedback_text.lower() for word in ["fluency", "pace", "hesitation"]):
                contextual_suggestions.append("What can I do to speak more fluently?")
            
            if any(word in feedback_text.lower() for word in ["confidence", "nervous", "hesitant"]):
                contextual_suggestions.append("How can I build more confidence when speaking?")
            
            if any(word in feedback_text.lower() for word in ["pronunciation", "accent", "clear"]):
                contextual_suggestions.append("How can I improve my pronunciation?")

        # Combine and limit suggestions
        all_suggestions = base_suggestions + contextual_suggestions
        
        # Remove duplicates while preserving order
        seen = set()
        unique_suggestions = []
        for suggestion in all_suggestions:
            if suggestion not in seen:
                seen.add(suggestion)
                unique_suggestions.append(suggestion)
        
        return unique_suggestions[:6]  # Limit to 6 suggestions to avoid overwhelming the UI
        
    except Exception as e:
        current_app.logger.error(f"❌ Error generating suggestions: {str(e)}")
        return ["What did I do well?", "How can I improve?", "Any specific tips?"]


def generate_ai_feedback_response(feedback_conv, user_message, feedback_json=None):
    """
    Generate AI response to user's question about their feedback.
    Enhanced to work with structured JSON feedback.
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "I'm sorry, I'm having trouble connecting right now. Please try again later."

        client = OpenAI(api_key=api_key)
        
        # Get conversation history for context
        messages_history = feedback_conv.get_messages_history()
        original_conversation = feedback_conv.original_conversation
        practice_transcript = original_conversation.get_messages_history() if original_conversation else []
        
        # Prepare feedback context based on format
        feedback_context = ""
        if feedback_json:
            # Use structured feedback
            feedback_context = f"STRUCTURED FEEDBACK:\n{json.dumps(feedback_json, indent=2)}"
        else:
            # Use text feedback
            feedback_context = f"ORIGINAL FEEDBACK:\n{feedback_conv.detailed_feedback or feedback_conv.summary_feedback}"
        
        # Build system prompt with full context
        system_prompt = f"""You are a supportive, *conversational* AI feedback coach for language learners.

STYLE:
- Use friendly, natural language (think encouraging tutor, not formal report).
- Keep answers concise (3–7 short sentences)
- Avoid using markdown formatting in responses. Use clear text.
- Reference specific moments from the transcript when helpful.
- Offer 1 actionable tip at a time; avoid overwhelming the student.
- Occasionally employ short, motivational or reflective questions to gauge feelings or next steps.
- If the student seems discouraged, validate their effort before giving advice.

CONTEXT:
- Student completed a practice conversation.
- You have feedback (structured or text) and the original transcript.

{feedback_context}

ORIGINAL PRACTICE TRANSCRIPT:
{format_transcript_for_context(practice_transcript)}

WHEN ANSWERING:
- If asked about a topic present in structured feedback, cite it by name (e.g., **Grammar & Syntax**).
- If the question is broad, give a quick high-level answer + one concrete example.
- If information is missing, say so briefly and pivot to a useful suggestion.

ALWAYS finish with one question, e.g.:
- “How did that feel on your end?”
- “Which tip would you like to try next?”
- “Would you like a quick practice line for that?”
"""

        # Build conversation history for the API call
        api_messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent conversation history (last 10 messages to stay within token limits)
        recent_messages = messages_history[-10:] if len(messages_history) > 10 else messages_history
        for msg in recent_messages:
            if msg["role"] in ["user", "feedback_assistant"]:
                role = "user" if msg["role"] == "user" else "assistant"
                api_messages.append({"role": role, "content": msg["content"]})

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=api_messages,
            max_tokens=350,  # Reduced for faster responses
            temperature=0.7,  
            presence_penalty=0.2
        )

        return response.choices[0].message.content

    except Exception as e:
        current_app.logger.error(f"❌ Error generating AI response: {str(e)}")
        return "I'm sorry, I'm having trouble processing your question right now. Could you try rephrasing it?"


def format_transcript_for_context(transcript):
    """
    Format the practice conversation transcript for inclusion in the AI context.
    """
    if not transcript:
        return "No transcript available."
    
    formatted = []
    for msg in transcript:
        role = "Student" if msg["role"] == "user" else "AI Partner"
        formatted.append(f"{role}: {msg['content']}")
    
    return "\n".join(formatted)