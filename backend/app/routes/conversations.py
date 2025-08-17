from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timezone
from app.models import Conversation, Message, PracticeCase, FeedbackConversation, db
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import json
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
        current_app.logger.info(f"🔥 Attempting to end conversation {conversation_id}")

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

        # Load feedback configuration and prompt from the practice case
        feedback_prompt = practice_case.feedback_prompt
        feedback_config = practice_case.feedback_config or {}
        
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

        # Generate structured JSON feedback using GPT-4o
        client = OpenAI(api_key=api_key)
        
        try:
            # Create enhanced prompt for structured JSON feedback
            json_feedback_prompt = f"""
            {feedback_prompt}
            
            CRITICAL INSTRUCTIONS FOR RESPONSE FORMAT:
            You must respond with ONLY a valid JSON object. No explanatory text, no markdown formatting, no backticks - just pure JSON.

            IMPORTANT PEDAGOGICAL REQUIREMENTS:
            1. **LANGUAGE**: Provide ALL feedback in English only, regardless of the target language being practiced. This reduces cognitive load for language learners.
            
            2. **PROFICIENCY-LEVEL AWARENESS**: The student's proficiency level is: {practice_case.proficiency_level}
               - Tailor your feedback complexity and expectations to this proficiency level
               - For beginners: Focus on basic communication success, simple corrections
               - For intermediate: Balance communication effectiveness with accuracy improvements  
               - For advanced: Include more nuanced feedback on style, register, and cultural appropriateness
               - Always reference this proficiency level when setting expectations
            
            3. **PRAGMATIC FOCUS**: Prioritize communication effectiveness over linguistic perfection
               - Emphasize whether the student successfully conveyed their intended meaning
               - Focus on communication breakdowns only when they actually impeded understanding
               - Celebrate successful meaning-making even if grammar/vocabulary isn't perfect
               - Remember: comprehensibility and communicative competence come before accuracy

            4. **STUDENT-FOCUSED LANGUAGE**: Address the student directly using "you" and "your" throughout, not "the student" or "they"

            Use this EXACT structure:
            {{
                "summary": {{
                    "strengths": ["2-3 overall communication successes from your conversation"],
                    "areas_for_improvement": ["2-3 pragmatic areas for you to focus on next"]
                }},
                "detailed_feedback": {{
                    "sections": [
                        {{
                            "area": "Area Name (exactly as specified in the 'Areas to evaluate' feedback areas above)",
                            "strengths": ["specific communicative successes with examples from your conversation", "another success that helped you get your message across"],
                            "areas_for_improvement": ["pragmatic improvement areas appropriate for {practice_case.proficiency_level} level", "communication aspects to work on"],
                            "tips": ["actionable suggestions appropriate for your proficiency level", "practical communication strategies for you"]
                        }}
                    ]
                }},
                "encouragement": "A brief, motivational closing message directly to you about your communication progress"
            }}

            IMPORTANT RULES:
            1. Create a detailed_feedback section for EACH feedback area mentioned above that applies to this conversation
            2. Each section must have the exact area name as specified in the instructions above
            3. Include 2-3 items in each array (strengths, areas_for_improvement, tips)
            4. Reference specific examples from the conversation transcript when possible
            5. If an area doesn't apply to this conversation, skip that section entirely
            6. Your response must be valid JSON that can be parsed by json.loads()
            7. ALL feedback must be in English only
            8. Adjust feedback complexity and expectations to match the {practice_case.proficiency_level} proficiency level
            9. Focus on pragmatic communication success over linguistic perfection
            10. Be encouraging and constructive - highlight communicative achievements

            DO NOT include any text outside the JSON structure. Start your response with {{ and end with }}.
            """

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": json_feedback_prompt},
                    {"role": "user", "content": "\n".join([f"{msg['role']}: {msg['content']}" for msg in compiled_messages])},
                ]
            )

            # Extract and parse JSON feedback
            feedback_text = response.choices[0].message.content.strip()
            current_app.logger.info(f"📝 Raw AI response: {feedback_text[:200]}...")
            
            # Clean up any potential markdown formatting
            if feedback_text.startswith("```json"):
                feedback_text = feedback_text.replace("```json", "").replace("```", "").strip()
            elif feedback_text.startswith("```"):
                feedback_text = feedback_text.replace("```", "").strip()
            
            # Fix common JSON formatting issues
            feedback_text = feedback_text.replace("areas*for*improvement", "areas_for_improvement")
            feedback_text = feedback_text.replace("*", "_")  # Replace any remaining asterisks with underscores
            
            # Ensure proper JSON closure if missing
            if not feedback_text.endswith('}'):
                # Count opening and closing braces to determine what's missing
                open_braces = feedback_text.count('{')
                close_braces = feedback_text.count('}')
                missing_braces = open_braces - close_braces
                feedback_text += '}' * missing_braces
            
            current_app.logger.info(f"🧹 Cleaned feedback text: {feedback_text[:200]}...")
            
            try:
                feedback_json = json.loads(feedback_text)
                current_app.logger.info(f"✅ Successfully parsed JSON feedback")
                current_app.logger.info(f"📊 JSON structure: summary={bool(feedback_json.get('summary'))}, sections={len(feedback_json.get('detailed_feedback', {}).get('sections', []))}")
                
                # Generate text summary for backward compatibility
                summary_text = generate_text_summary_from_json(feedback_json)
                current_app.logger.info(f"📄 Generated summary text: {summary_text[:100]}...")
                
                # Store text summary in conversation (for backward compatibility)
                conversation.feedback = summary_text
                
                # Create FeedbackConversation record with JSON structure
                feedback_conversation = FeedbackConversation(
                    original_conversation_id=conversation.id,
                    user_id=user_id,
                    summary_feedback=summary_text,
                    detailed_feedback=json.dumps(feedback_json),  # Store full JSON as string
                    start_time=datetime.now(timezone.utc),
                    model="gpt-4o",
                    feedback_version="json_v1"
                )

                db.session.add(feedback_conversation)
                db.session.commit()

                current_app.logger.info(f"✅ FeedbackConversation {feedback_conversation.id} created successfully")

                return jsonify({
                    "message": "Conversation ended",
                    "conversation": conversation.to_dict(),
                    "feedback": summary_text,
                    "feedback_json": feedback_json,  # Include structured feedback
                    "feedback_conversation_id": feedback_conversation.id,
                    "dialogic_feedback_available": True
                })
                
            except json.JSONDecodeError as json_error:
                current_app.logger.error(f"❌ Failed to parse JSON feedback: {str(json_error)}")
                current_app.logger.error(f"🔍 Problematic text: {feedback_text}")
                
                # Try to extract JSON from within the text if it's embedded
                import re
                json_match = re.search(r'\{.*\}', feedback_text, re.DOTALL)
                if json_match:
                    try:
                        extracted_json = json_match.group(0)
                        current_app.logger.info(f"🔧 Attempting to parse extracted JSON...")
                        feedback_json = json.loads(extracted_json)
                        current_app.logger.info(f"✅ Successfully parsed extracted JSON")
                        
                        # Generate text summary for backward compatibility
                        summary_text = generate_text_summary_from_json(feedback_json)
                        
                        # Store text summary in conversation (for backward compatibility)
                        conversation.feedback = summary_text
                        
                        # Create FeedbackConversation record with JSON structure
                        feedback_conversation = FeedbackConversation(
                            original_conversation_id=conversation.id,
                            user_id=user_id,
                            summary_feedback=summary_text,
                            detailed_feedback=json.dumps(feedback_json),
                            start_time=datetime.now(timezone.utc),
                            model="gpt-4o",
                            feedback_version="json_v1_extracted"
                        )

                        db.session.add(feedback_conversation)
                        db.session.commit()

                        return jsonify({
                            "message": "Conversation ended",
                            "conversation": conversation.to_dict(),
                            "feedback": summary_text,
                            "feedback_json": feedback_json,
                            "feedback_conversation_id": feedback_conversation.id,
                            "dialogic_feedback_available": True
                        })
                        
                    except json.JSONDecodeError:
                        current_app.logger.error(f"❌ Even extracted JSON failed to parse")
                
                # Fallback to text-based feedback
                return generate_fallback_feedback(conversation, feedback_text, user_id)

        except Exception as ai_error:
            current_app.logger.error(f"❌ OpenAI API call failed: {str(ai_error)}")
            return jsonify({"error": f"Failed to generate AI feedback: {str(ai_error)}"}), 500

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"❌ General error ending conversation: {str(e)}")
        return jsonify({"error": str(e)}), 500


def generate_text_summary_from_json(feedback_json):
    """
    Convert structured JSON feedback to a readable text summary for backward compatibility.
    """
    try:
        summary_parts = []
        
        # Add strengths
        if feedback_json.get("summary", {}).get("strengths"):
            summary_parts.append("**Strengths:**")
            for strength in feedback_json["summary"]["strengths"]:
                summary_parts.append(f"• {strength}")
            summary_parts.append("")
        
        # Add areas for improvement
        if feedback_json.get("summary", {}).get("areas_for_improvement"):
            summary_parts.append("**Areas for Improvement:**")
            for area in feedback_json["summary"]["areas_for_improvement"]:
                summary_parts.append(f"• {area}")
            summary_parts.append("")
        
        # Add encouragement
        if feedback_json.get("encouragement"):
            summary_parts.append(feedback_json["encouragement"])
        
        return "\n".join(summary_parts)
        
    except Exception as e:
        current_app.logger.error(f"Error generating text summary: {str(e)}")
        return "Feedback generated successfully."


def generate_fallback_feedback(conversation, feedback_text, user_id):
    """
    Generate fallback feedback when JSON parsing fails.
    """
    try:
        # Store the raw feedback
        conversation.feedback = feedback_text
        
        # Create basic FeedbackConversation
        feedback_conversation = FeedbackConversation(
            original_conversation_id=conversation.id,
            user_id=user_id,
            summary_feedback=feedback_text,
            detailed_feedback=feedback_text,
            start_time=datetime.now(timezone.utc),
            model="gpt-4o",
            feedback_version="fallback_v1"
        )

        db.session.add(feedback_conversation)
        db.session.commit()

        return jsonify({
            "message": "Conversation ended",
            "conversation": conversation.to_dict(),
            "feedback": feedback_text,
            "feedback_conversation_id": feedback_conversation.id,
            "dialogic_feedback_available": True,
            "note": "Feedback generated in fallback mode"
        })
        
    except Exception as fallback_error:
        current_app.logger.error(f"❌ Fallback feedback generation failed: {str(fallback_error)}")
        db.session.rollback()
        return jsonify({"error": "Failed to generate feedback"}), 500


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

        # Try to get structured feedback if available
        feedback_conversation = FeedbackConversation.query.filter_by(
            original_conversation_id=conversation.id
        ).first()
        
        response_data = {"feedback": conversation.feedback}
        
        if feedback_conversation and feedback_conversation.detailed_feedback:
            try:
                # Try to parse JSON feedback
                feedback_json = json.loads(feedback_conversation.detailed_feedback)
                response_data["feedback_json"] = feedback_json
                response_data["feedback_version"] = feedback_conversation.feedback_version
            except json.JSONDecodeError:
                # If it's not JSON, it's likely the old text format
                pass

        return jsonify(response_data)

    except Exception as e:
        current_app.logger.error(f"❌ Error fetching feedback: {str(e)}")
        return jsonify({"error": "Failed to fetch feedback"}), 500

@conversations.route("/conversation/latest", methods=["GET"])
@jwt_required()
def get_latest_conversation():
    """
    Retrieve the most recent conversation for the authenticated user with optional class filtering.
    Now includes dialogic feedback information and structured feedback.
    
    Query Parameters:
    - class_id (optional): Filter for latest conversation in a specific class
    - section_id (optional): Filter for latest conversation in a specific section
    """
    try:
        current_app.logger.info("🔥 [START] Attempting to fetch the latest conversation for the current user.")

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

        # Get messages and feedback
        messages_history = conversation.get_messages_history()
        current_app.logger.debug(f"📝 Retrieved messages history: {messages_history}")
        feedback = conversation.feedback or "No feedback available."
        current_app.logger.debug(f"💬 Retrieved feedback: {feedback}")

        # Check if there's a corresponding FeedbackConversation
        feedback_conversation = None
        dialogic_available = False
        feedback_json = None
        
        try:
            # Import here to avoid circular imports
            from app.models.feedback_conversation import FeedbackConversation
            
            feedback_conversation = FeedbackConversation.query.filter_by(
                original_conversation_id=conversation.id
            ).first()
            
            if feedback_conversation:
                dialogic_available = True
                current_app.logger.info(f"✅ Found FeedbackConversation {feedback_conversation.id} for conversation {conversation.id}")
                
                # Try to parse structured feedback
                if feedback_conversation.detailed_feedback:
                    try:
                        feedback_json = json.loads(feedback_conversation.detailed_feedback)
                        current_app.logger.info(f"✅ Structured feedback parsed successfully")
                    except json.JSONDecodeError:
                        current_app.logger.info(f"ℹ️ Feedback is in text format")
            else:
                current_app.logger.info(f"ℹ️ No FeedbackConversation found for conversation {conversation.id}")
                
        except Exception as e:
            current_app.logger.error(f"❌ Error checking for FeedbackConversation: {str(e)}")
            # Don't fail the whole request if we can't check for dialogic feedback

        # Build response with dialogic feedback information
        response_data = {
            "conversation_id": conversation.id,
            "messages": messages_history,
            "feedback": feedback,
            "dialogic_feedback_available": dialogic_available
        }
        
        # Add structured feedback if available
        if feedback_json:
            response_data["feedback_json"] = feedback_json
            response_data["feedback_version"] = feedback_conversation.feedback_version
        
        # Add feedback conversation ID if available
        if feedback_conversation:
            response_data["feedback_conversation_id"] = feedback_conversation.id

        current_app.logger.info(f"📤 Returning response with dialogic_available: {dialogic_available}")
        return jsonify(response_data)

    except Exception as e:
        current_app.logger.error(f"❌ [ERROR] Failed to fetch recent conversation for user {user_id if 'user_id' in locals() else 'Unknown'}: {str(e)}")
        return jsonify({"error": "Failed to fetch recent conversation"}), 500

@conversations.route("/conversation/<int:conversation_id>/transcript", methods=["GET"])
@jwt_required()
def get_conversation_transcript(conversation_id):
    """
    Retrieve the conversation transcript with formatted messages for the feedback view.
    Returns messages in a format suitable for the transcript display.
    """
    try:
        current_app.logger.info(f"🔥 Fetching transcript for conversation {conversation_id}")
        
        # Get the user ID from the JWT token
        user_id = get_jwt_identity()
        
        # Find the conversation
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            current_app.logger.error(f"❌ Conversation {conversation_id} not found")
            return jsonify({"error": "Conversation not found"}), 404
        
        # Check authorization - user must own this conversation
        if str(conversation.user_id) != str(user_id):
            current_app.logger.warning(f"⚠️ Unauthorized access attempt to conversation {conversation_id} by user {user_id}")
            return jsonify({"error": "Unauthorized"}), 403
        
        # Get all messages for this conversation, ordered by timestamp
        messages = Message.query.filter_by(conversation_id=conversation_id)\
                                .order_by(Message.timestamp.asc())\
                                .all()
        
        if not messages:
            current_app.logger.info(f"ℹ️ No messages found for conversation {conversation_id}")
            return jsonify({
                "conversation_id": conversation_id,
                "messages": [],
                "total_messages": 0
            })
        
        # Format messages for the frontend transcript display
        formatted_messages = []
        for message in messages:
            formatted_message = {
                "id": str(message.id),
                "role": message.role,  # 'user' or 'assistant'
                "content": message.content,
                "timestamp": message.timestamp.isoformat()
            }
            formatted_messages.append(formatted_message)
        
        current_app.logger.info(f"✅ Successfully retrieved {len(formatted_messages)} messages for conversation {conversation_id}")
        
        # Return the transcript data
        return jsonify({
            "conversation_id": conversation_id,
            "messages": formatted_messages,
            "total_messages": len(formatted_messages),
            "start_time": conversation.start_time.isoformat() if conversation.start_time else None,
            "end_time": conversation.end_time.isoformat() if conversation.end_time else None,
            "duration": conversation.duration,
            "practice_case_id": conversation.practice_case_id
        })
        
    except Exception as e:
        current_app.logger.error(f"❌ Error fetching transcript for conversation {conversation_id}: {str(e)}")
        return jsonify({"error": "Failed to fetch conversation transcript"}), 500