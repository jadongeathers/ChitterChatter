import openai
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models import PracticeCase, Conversation, User, db
from datetime import datetime, timezone

practice_cases = Blueprint('practice_cases', __name__)

@practice_cases.route('/get_cases', methods=['GET'])
@jwt_required()
def get_practice_cases():
    """
    Retrieve all practice cases for the user's class,
    including the conversation completion status for the current student.
    Only return published and accessible cases for students.
    """
    try:
        # Get the current user's ID from the JWT token
        current_user_id = int(get_jwt_identity())
        
        # Retrieve the user from the database
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Use the user's actual class (assuming it's stored in user.class_name)
        class_name = user.class_name
        practice_case_list = PracticeCase.query.filter_by(class_name=class_name).all()

        cases_with_status = []
        for case in practice_case_list:
            # Only display published and accessible cases for students
            if user.is_student:
                if not case.published:
                    continue  # Skip unpublished cases

                # If the current time is before the accessible date, mark it as locked
                if case.accessible_on and case.accessible_on > datetime.now(timezone.utc):
                    accessible = False
                else:
                    accessible = True
            else:
                # Instructors can see all cases
                accessible = True

            # Format the case data for the frontend
            case_data = case.to_dict()
            case_data["accessible"] = accessible

            # Check if there's any completed conversation for this case and student
            conversation = Conversation.query.filter_by(
                practice_case_id=case.id, 
                student_id=current_user_id, 
                completed=True
            ).first()

            case_data["completed"] = True if conversation else False
            cases_with_status.append(case_data)

        current_app.logger.info(f"Retrieved practice cases for user {current_user_id}")
        return jsonify(cases_with_status), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching practice cases: {str(e)}")
        return jsonify({"error": "Failed to retrieve practice cases"}), 500

    

@practice_cases.route('/get_case/<int:case_id>', methods=['GET'])
@jwt_required()
def get_practice_case(case_id):
    """
    Retrieve a specific practice case by its ID.
    """
    try:
        practice_case = PracticeCase.query.get(case_id)

        if not practice_case:
            return jsonify({"error": "Practice case not found"}), 404

        # Return the practice case data as JSON
        return jsonify(practice_case.to_dict()), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching practice case: {str(e)}")
        return jsonify({"error": "Failed to retrieve practice case"}), 500
    

@practice_cases.route('/update_case/<int:case_id>', methods=['PUT'])
@jwt_required()
def update_practice_case(case_id):
    """
    Update an existing practice case, including all fields like feedback prompt, voice, goals, key items, etc.
    """
    try:
        data = request.get_json()
        practice_case = PracticeCase.query.get(case_id)

        if not practice_case:
            return jsonify({"error": "Practice case not found"}), 404

        # Core editable fields
        practice_case.system_prompt = data.get("system_prompt", practice_case.system_prompt)
        practice_case.min_time = int(data.get("min_time", practice_case.min_time))
        practice_case.max_time = int(data.get("max_time", practice_case.max_time))
        practice_case.description = data.get("description", practice_case.description)
        practice_case.title = data.get("title", practice_case.title)
        practice_case.published = data.get("published", practice_case.published)
        practice_case.accessible_on = data.get("accessible_on", practice_case.accessible_on)

        # AI prompts
        practice_case.feedback_prompt = data.get("feedback_prompt", practice_case.feedback_prompt)
        practice_case.system_prompt_goals = data.get("system_prompt_goals", practice_case.system_prompt_goals)
        practice_case.system_prompt_review = data.get("system_prompt_review", practice_case.system_prompt_review)
        practice_case.chatbot_suggestions = data.get("chatbot_suggestions", practice_case.chatbot_suggestions)

        # Language and speech
        practice_case.voice = data.get("voice", practice_case.voice)
        practice_case.language_code = data.get("language_code", practice_case.language_code)
        practice_case.language = data.get("language", practice_case.language)
        practice_case.proficiency_level = data.get("proficiency_level", practice_case.proficiency_level)

        # Case-specific details
        practice_case.key_items = data.get("key_items", practice_case.key_items)
        practice_case.situation = data.get("situation", practice_case.situation)
        practice_case.learning_objectives = data.get("learning_objectives", practice_case.learning_objectives)

        db.session.commit()
        return jsonify({"message": "Practice case updated successfully"}), 200

    except Exception as e:
        current_app.logger.error(f"Error updating practice case: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to update practice case"}), 500

@practice_cases.route('/add_case', methods=['POST'])
@jwt_required()
def add_practice_case():
    try:
        data = request.json
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        default_feedback_prompt = """You are an AI tutor--a Virtual Practice Partner (VPP)..."""  # shorten if needed
        default_goals_prompt = """You are a supportive assistant helping language instructors..."""

        new_case = PracticeCase(
            institution=user.institution,
            class_name=user.class_name,
            title=data.get('title'),
            description=data.get('description'),
            system_prompt=data.get('system_prompt'),
            system_prompt_goals=data.get('system_prompt_goals', default_goals_prompt),
            system_prompt_review=data.get('system_prompt_review'),
            chatbot_suggestions=data.get('chatbot_suggestions'),
            voice=data.get("voice", "verse"),
            language_code=data.get("language_code", "en"),
            feedback_prompt=data.get("feedback_prompt", default_feedback_prompt),
            min_time=int(data.get('min_time', 0)),
            max_time=int(data.get('max_time', 0)),
            accessible_on=datetime.fromisoformat(data.get('accessible_on')) if data.get('accessible_on') else None,
            published=False,

            # Additional fields
            learning_objectives=data.get("learning_objectives"),
            key_items=data.get("key_items"),
            situation=data.get("situation"),
            proficiency_level=data.get("proficiency_level"),
        )

        db.session.add(new_case)
        db.session.commit()
        return jsonify(new_case.to_dict()), 201

    except Exception as e:
        current_app.logger.error(f"Error adding practice case: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to add practice case"}), 500


@practice_cases.route('/publish/<int:case_id>', methods=['PUT'])
@jwt_required()
def publish_practice_case(case_id):
    """
    Toggle the published status of a practice case.
    """
    try:
        data = request.get_json()
        published = data.get("published")

        if published is None:
            return jsonify({"error": "Published status not provided"}), 400

        practice_case = PracticeCase.query.get(case_id)
        if not practice_case:
            return jsonify({"error": "Practice case not found"}), 404

        # Update the published status
        practice_case.published = bool(published)
        db.session.commit()

        status = "published" if practice_case.published else "unpublished"
        return jsonify({"message": f"Practice case {status} successfully."}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error publishing practice case: {str(e)}")
        return jsonify({"error": "Failed to update publish status"}), 500


@practice_cases.route('/delete_case/<int:case_id>', methods=['DELETE'])
@jwt_required()
def delete_practice_case(case_id):
    """
    Delete a practice case by ID.
    """
    try:
        practice_case = PracticeCase.query.get(case_id)
        if not practice_case:
            return jsonify({"error": "Practice case not found"}), 404

        # Delete the practice case
        db.session.delete(practice_case)
        db.session.commit()

        return jsonify({"message": "Practice case deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting practice case: {str(e)}")
        return jsonify({"error": "Failed to delete practice case"}), 500
    
@practice_cases.route("/chatbot_prompt/<int:case_id>/<string:prompt_type>", methods=["GET"])
@jwt_required()
def get_prompt(case_id, prompt_type):
    case = PracticeCase.query.get_or_404(case_id)
    prompt_map = {
        "main": case.system_prompt,
        "goals": case.system_prompt_goals,
        "review": case.system_prompt_review,
    }
    return jsonify({"prompt": prompt_map.get(prompt_type, "")}), 200

@practice_cases.route("/chatbot_respond", methods=["POST"])
@jwt_required()
def chatbot_respond():
    openai.api_key = current_app.config["OPENAI_API_KEY"]
    data = request.get_json()

    prompt = data.get("prompt")
    user_input = data.get("message")

    if not prompt or not user_input:
        return jsonify({"error": "Missing prompt or message"}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_input}
            ]
        )
        return jsonify({"response": response.choices[0].message["content"]}), 200

    except openai.error.OpenAIError as e:
        current_app.logger.error(f"OpenAI API Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
@practice_cases.route("/suggestions", methods=["POST"])
@jwt_required()
def suggest_ideas():
    try:
        data = request.get_json()
        prompt = data.get("prompt")
        message = data.get("message")

        if not prompt or not message:
            return jsonify({"error": "Missing prompt or message"}), 400

        openai.api_key = current_app.config["OPENAI_API_KEY"]
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": message}
            ]
        )
        return jsonify({"response": response.choices[0].message["content"]}), 200

    except openai.error.OpenAIError as e:
        current_app.logger.error(f"OpenAI error: {str(e)}")
        return jsonify({"error": str(e)}), 500
