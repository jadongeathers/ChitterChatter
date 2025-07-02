from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, SystemFeedback, db
from datetime import datetime, timezone

system = Blueprint('system', __name__)

@system.route('/feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    """Submit system feedback from a user."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        data = request.get_json()

        if not user:
            return jsonify({"error": "User not found"}), 404

        if 'feedback' not in data or not data['feedback'].strip():
            return jsonify({"error": "Feedback content is required"}), 400

        new_feedback = SystemFeedback(
            user_id=user.id,
            content=data['feedback'].strip(),
            submitted_at=datetime.now(timezone.utc)
        )

        db.session.add(new_feedback)
        db.session.commit()

        current_app.logger.info(f"Feedback submitted by user {user_id}: {data['feedback'][:50]}...")

        return jsonify({
            "message": "Feedback submitted successfully",
            "feedback_id": new_feedback.id
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error submitting feedback: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to submit feedback"}), 500


@system.route('/feedback', methods=['GET'])
@jwt_required()
def get_feedback():
    """Get all feedback (admin only)."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        if not user.is_master and user.is_student:
            return jsonify({"error": "Unauthorized access"}), 403

        feedback_entries = (
            db.session.query(SystemFeedback, User)
            .join(User, SystemFeedback.user_id == User.id)
            .order_by(SystemFeedback.submitted_at.desc())
            .all()
        )

        feedback_list = []
        for feedback, submitter in feedback_entries:
            feedback_list.append({
                "id": feedback.id,
                "content": feedback.content,
                "submitted_at": feedback.submitted_at.isoformat(),
                "user": {
                    "id": submitter.id,
                    "email": submitter.email,
                    "name": f"{submitter.first_name} {submitter.last_name}",
                    "is_student": submitter.is_student
                }
            })

        return jsonify(feedback_list)

    except Exception as e:
        current_app.logger.error(f"Error fetching feedback: {str(e)}")
        return jsonify({"error": "Failed to fetch feedback"}), 500
