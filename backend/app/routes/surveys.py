from flask import Blueprint, request, jsonify, redirect
from datetime import datetime, timezone
from app.models import db, User, SurveyRedirect
import logging

# Create a blueprint
surveys = Blueprint('surveys', __name__)
logger = logging.getLogger(__name__)

@surveys.route('/record-redirect', methods=['POST'])
def record_survey_redirect():
    """Record when a user is redirected to a survey."""
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
        
        # Create a new survey redirect record
        survey_redirect = SurveyRedirect(
            email=email,
            survey_type=survey_type,
            user_id=user_id
        )
        
        db.session.add(survey_redirect)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Survey redirect recorded"}), 200
        
    except Exception as e:
        logger.error(f"Error recording survey redirect: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to record survey redirect"}), 500

@surveys.route('/mark-completed', methods=['POST'])
def mark_survey_completed():
    """Mark a survey as completed for a user."""
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
        
        # Find the user by email if not authenticated
        if not current_user:
            # Find user by email - this is a bit inefficient but works with encrypted emails
            for user in User.query.all():
                if user.email == email:
                    current_user = user
                    break
        
        if not current_user:
            return jsonify({"error": "User not found"}), 404
            
        # Find the most recent survey redirect for this user and survey type
        survey_redirect = SurveyRedirect.query.filter_by(
            user_id=current_user.id,
            survey_type=survey_type,
            completed=False
        ).order_by(SurveyRedirect.redirected_at.desc()).first()
        
        if not survey_redirect:
            # Create a new record if none exists
            survey_redirect = SurveyRedirect(
                email=email,
                survey_type=survey_type,
                user_id=current_user.id
            )
            db.session.add(survey_redirect)
        
        # Mark as completed
        survey_redirect.mark_completed()
        db.session.commit()
        
        return jsonify({"success": True, "message": "Survey marked as completed"}), 200
        
    except Exception as e:
        logger.error(f"Error marking survey as completed: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to mark survey as completed"}), 500

@surveys.route('/webhook', methods=['GET', 'POST'])
def survey_webhook():
    """Webhook endpoint for receiving survey completion notifications from Qualtrics."""
    # Accept both GET parameters (from URL redirect) and POST data (from webhook)
    data = request.args if request.method == 'GET' else request.get_json() or {}
    
    email = data.get('email')
    survey_type = data.get('survey_type', 'pre')  # Default to 'pre' if not specified
    status = data.get('status')
    
    if not email:
        logger.warning("Survey webhook called without email parameter")
        return jsonify({"error": "Missing email parameter"}), 400
    
    if status != 'complete':
        logger.info(f"Survey webhook called with status: {status}")
        return jsonify({"message": "Received non-complete status"}), 200
    
    try:
        # Find the user by email
        user = None
        for u in User.query.all():
            if u.email == email:
                user = u
                break
        
        if not user:
            logger.warning(f"User not found for email in survey webhook")
            return jsonify({"error": "User not found"}), 404
        
        # Find existing survey redirect record or create new one
        survey_redirect = SurveyRedirect.query.filter_by(
            user_id=user.id,
            survey_type=survey_type,
            completed=False
        ).order_by(SurveyRedirect.redirected_at.desc()).first()
        
        if not survey_redirect:
            # Create a new record if none exists
            survey_redirect = SurveyRedirect(
                email=email,
                survey_type=survey_type,
                user_id=user.id
            )
            db.session.add(survey_redirect)
        
        # Mark as completed
        survey_redirect.mark_completed()
        
        # Also update user's profile to indicate survey completion if desired
        if survey_type == 'pre':
            # You could add a field to the User model for this
            # user.has_completed_pre_survey = True
            pass
        elif survey_type == 'post':
            # user.has_completed_post_survey = True
            pass
        
        db.session.commit()
        
        # If this is a GET request (redirect from Qualtrics), redirect to the app
        if request.method == 'GET':
            # Redirect to a thank you page or back to the app
            return redirect('/survey-completed')
        
        # For POST requests (webhooks), return a success response
        return jsonify({"success": True, "message": "Survey completion recorded"}), 200
        
    except Exception as e:
        logger.error(f"Error processing survey webhook: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to process survey completion"}), 500

# Add a route for the survey completion page
@surveys.route('/survey-completed', methods=['GET'])
def survey_completed_page():
    """Page shown after completing a survey via redirect."""
    return """
    <html>
    <head>
        <title>Survey Completed</title>
        <style>
            body {
                font-family: sans-serif;
                text-align: center;
                margin-top: 50px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #eee;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #4f46e5;
            }
            .message {
                margin: 20px 0;
                font-size: 16px;
            }
            .button {
                background-color: #4f46e5;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                text-decoration: none;
                display: inline-block;
                margin-top: 20px;
            }
            .button:hover {
                background-color: #4338ca;
            }
        </style>
        <script>
            // Try to notify the opener window and close this one
            window.onload = function() {
                try {
                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage('survey_completed', '*');
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }
                } catch (e) {
                    console.error("Error communicating with opener window:", e);
                }
            };
        </script>
    </head>
    <body>
        <div class="container">
            <h1>Thank You!</h1>
            <p class="message">Your survey has been successfully completed.</p>
            <p>You can now return to ChitterChatter.</p>
            <a href="/" class="button">Return to ChitterChatter</a>
        </div>
    </body>
    </html>
    """