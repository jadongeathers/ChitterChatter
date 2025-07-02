from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from app.models import db, User
from app.models.survey import Survey
import logging

surveys = Blueprint('surveys', __name__)
logger = logging.getLogger(__name__)

def get_user_by_email(email):
    """Helper to find user by encrypted email."""
    temp = User()
    encrypted_email = temp.encrypt_data(email)
    return User.query.filter_by(email_encrypted=encrypted_email).first()

@surveys.route('/start-survey', methods=['POST'])
def start_survey():
    """Record when a user starts a survey."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get('email')
    survey_type = data.get('survey_type')
    if not email or not survey_type:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        user = get_user_by_email(email)
        user_id = user.id if user else None

        # Check if completed survey exists
        existing_survey = Survey.query.filter_by(
            user_id=user_id,
            survey_type=survey_type,
            completed=True
        ).first() if user_id else None

        if existing_survey:
            return jsonify({
                "success": True,
                "message": "Survey already completed",
                "survey_id": existing_survey.id,
                "completed": True
            }), 200

        # Check for existing incomplete survey
        existing_incomplete = Survey.query.filter_by(
            user_id=user_id,
            survey_type=survey_type,
            completed=False
        ).first() if user_id else None

        if existing_incomplete:
            return jsonify({
                "success": True,
                "message": "Continuing existing survey",
                "survey_id": existing_incomplete.id,
                "completed": False
            }), 200

        # Create new survey record
        new_survey = Survey(
            email=email,
            survey_type=survey_type,
            user_id=user_id
        )
        db.session.add(new_survey)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Survey started",
            "survey_id": new_survey.id,
            "completed": False
        }), 200

    except Exception as e:
        logger.error(f"Error starting survey: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to start survey: {str(e)}"}), 500


@surveys.route('/submit-responses', methods=['POST'])
def submit_survey_responses():
    """Submit user responses and update survey + user record."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    user_id = data.get('user_id')
    email = data.get('email')
    survey_type = data.get('survey_type')
    responses = data.get('responses')
    if not responses or not survey_type or (not user_id and not email):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        user = User.query.get(user_id) if user_id else get_user_by_email(email)
        if not user:
            return jsonify({"error": "User not found"}), 404

        survey = Survey.query.filter_by(
            user_id=user.id,
            survey_type=survey_type,
            completed=False
        ).order_by(Survey.started_at.desc()).first()

        if not survey:
            survey = Survey(
                email=email,
                survey_type=survey_type,
                user_id=user.id,
                responses=responses
            )
            db.session.add(survey)
        else:
            survey.responses = responses
            survey.mark_completed()

        user.has_completed_survey = True
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Survey responses recorded",
            "survey_id": survey.id,
            "has_completed_survey": user.has_completed_survey
        }), 200

    except Exception as e:
        logger.error(f"Error submitting responses: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to submit survey responses: {str(e)}"}), 500


@surveys.route('/status/<int:user_id>', methods=['GET'])
@jwt_required()
def get_survey_status(user_id):
    """Return the survey completion status of a user."""
    try:
        current_user = User.query.get(get_jwt_identity())
        if not current_user or (current_user.id != user_id and not current_user.is_master):
            return jsonify({"error": "Unauthorized access"}), 403

        completed_surveys = Survey.query.filter_by(
            user_id=user_id,
            completed=True
        ).all()

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "success": True,
            "user_id": user_id,
            "completedSurveys": [s.survey_type for s in completed_surveys],
            "has_completed_survey": user.has_completed_survey
        }), 200

    except Exception as e:
        logger.error(f"Error getting survey status: {str(e)}")
        return jsonify({"error": f"Failed to get survey status: {str(e)}"}), 500


@surveys.route('/get-responses/<int:user_id>/<string:survey_type>', methods=['GET'])
@jwt_required()
def get_survey_responses(user_id, survey_type):
    """Return the responses to a completed survey."""
    try:
        current_user = User.query.get(get_jwt_identity())
        if not current_user or (current_user.id != user_id and not current_user.is_master):
            return jsonify({"error": "Unauthorized access"}), 403

        survey = Survey.query.filter_by(
            user_id=user_id,
            survey_type=survey_type,
            completed=True
        ).order_by(Survey.completed_at.desc()).first()

        if not survey:
            return jsonify({"error": "No completed survey found"}), 404

        return jsonify({
            "success": True,
            "user_id": user_id,
            "survey_type": survey_type,
            "submitted_at": survey.completed_at.isoformat() if survey.completed_at else None,
            "responses": survey.responses
        }), 200

    except Exception as e:
        logger.error(f"Error fetching survey responses: {str(e)}")
        return jsonify({"error": f"Failed to fetch survey responses: {str(e)}"}), 500
