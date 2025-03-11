from flask import Blueprint, request, jsonify, redirect
from datetime import datetime, timezone
from app.models import db, User
from app.models.survey import Survey
import logging

# Create a blueprint
surveys = Blueprint('surveys', __name__)
logger = logging.getLogger(__name__)

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
        # Get the current user if authenticated
        current_user = getattr(request, 'user', None)
        user_id = current_user.id if current_user else None
        
        # If no user_id from authentication, try to find user by email
        if not user_id and email:
            for user in User.query.all():
                if user.email == email:
                    user_id = user.id
                    break
        
        # Check if user already has a completed survey of this type
        existing_survey = None
        if user_id:
            existing_survey = Survey.query.filter_by(
                user_id=user_id,
                survey_type=survey_type,
                completed=True
            ).first()
        
        if existing_survey:
            return jsonify({
                "success": True, 
                "message": "Survey already completed",
                "survey_id": existing_survey.id,
                "completed": True
            }), 200
        
        # Check for an existing incomplete survey
        existing_incomplete = None
        if user_id:
            existing_incomplete = Survey.query.filter_by(
                user_id=user_id,
                survey_type=survey_type,
                completed=False
            ).first()
            
        if existing_incomplete:
            return jsonify({
                "success": True,
                "message": "Continuing existing survey",
                "survey_id": existing_incomplete.id,
                "completed": False
            }), 200
        
        # Create a new survey record (not completed yet)
        survey = Survey(
            email=email,
            survey_type=survey_type,
            user_id=user_id
        )
        
        db.session.add(survey)
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": "Survey started",
            "survey_id": survey.id,
            "completed": False
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting survey: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to start survey: {str(e)}"}), 500

@surveys.route('/submit-responses', methods=['POST'])
def submit_survey_responses():
    """Submit user responses to a survey and update user's survey completion status."""
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
        # Get the user
        user = None
        if user_id:
            user = User.query.get(user_id)
        
        if not user and email:
            # Find user by email if not found by ID
            for u in User.query.all():
                if u.email == email:
                    user = u
                    break
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Find existing incomplete survey or create new one
        survey = Survey.query.filter_by(
            user_id=user.id,
            survey_type=survey_type,
            completed=False
        ).order_by(Survey.started_at.desc()).first()
        
        if not survey:
            # Create a new survey response
            survey = Survey(
                email=email,
                survey_type=survey_type,
                user_id=user.id,
                responses=responses
            )
            db.session.add(survey)
        else:
            # Update existing survey
            survey.responses = responses
            survey.mark_completed()
        
        # Update the user's survey completion status
        user.has_completed_survey = True
        
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": "Survey responses recorded and user status updated",
            "survey_id": survey.id,
            "has_completed_survey": user.has_completed_survey
        }), 200
        
    except Exception as e:
        logger.error(f"Error recording survey responses: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to record survey responses: {str(e)}"}), 500

@surveys.route('/status/<int:user_id>', methods=['GET'])
def get_survey_status(user_id):
    """Get a user's survey completion status."""
    try:
        # Check if the requesting user has permission (e.g., is an admin or the user themselves)
        current_user = getattr(request, 'user', None)
        if not current_user or (current_user.id != user_id and not getattr(current_user, 'is_admin', False) and not getattr(current_user, 'is_master', False)):
            return jsonify({"error": "Unauthorized access"}), 403
        
        # Find all completed surveys for this user
        completed_surveys = Survey.query.filter_by(
            user_id=user_id,
            completed=True
        ).all()
        
        completed_survey_types = [survey.survey_type for survey in completed_surveys]
        
        # Get the user's overall survey completion status
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({
            "success": True,
            "user_id": user_id,
            "completedSurveys": completed_survey_types,
            "has_completed_survey": user.has_completed_survey
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting survey status: {str(e)}")
        return jsonify({"error": f"Failed to get survey status: {str(e)}"}), 500

@surveys.route('/get-responses/<int:user_id>/<string:survey_type>', methods=['GET'])
def get_survey_responses(user_id, survey_type):
    """Get a user's survey responses."""
    try:
        # Check if the requesting user has permission (e.g., is an admin or the user themselves)
        current_user = getattr(request, 'user', None)
        if not current_user or (current_user.id != user_id and not getattr(current_user, 'is_admin', False) and not getattr(current_user, 'is_master', False)):
            return jsonify({"error": "Unauthorized access"}), 403
        
        # Get the most recent completed survey for this user and survey type
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
        logger.error(f"Error getting survey responses: {str(e)}")
        return jsonify({"error": f"Failed to get survey responses: {str(e)}"}), 500