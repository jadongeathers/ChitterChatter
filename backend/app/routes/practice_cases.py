from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from app.models import PracticeCase, Conversation, User, Enrollment, Section, db
from datetime import datetime, timezone

practice_cases = Blueprint('practice_cases', __name__)

# ============================================================================
# UTILITY FUNCTIONS AND DECORATORS
# ============================================================================

def get_current_user():
    """Get the current authenticated user."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return User.query.get(int(user_id))

def can_user_access_class(user, class_id):
    """Check if user has access to a specific class."""
    if user.is_master:
        return True
    
    if user.is_student:
        student_class_ids = {e.section.class_id for e in user.enrollments if e.role == "student"}
        return class_id in student_class_ids
    else:
        # Instructor
        instructor_class_ids = {e.section.class_id for e in user.enrollments if e.role == "instructor"}
        return class_id in instructor_class_ids

def can_user_modify_case(user, case):
    """Check if user can modify (update/delete) a practice case."""
    if user.is_master:
        return True
    
    # Only instructors who teach the class can modify cases
    instructor_class_ids = {e.section.class_id for e in user.enrollments if e.role == "instructor"}
    return case.class_id in instructor_class_ids

def get_user_accessible_class_ids(user):
    """Get all class IDs the user has access to."""
    if user.is_master:
        # Masters can see all classes (though this might need refinement)
        return set(pc.class_id for pc in PracticeCase.query.with_entities(PracticeCase.class_id).distinct())
    
    if user.is_student:
        return {e.section.class_id for e in user.enrollments if e.role == "student"}
    else:
        # Instructor
        return {e.section.class_id for e in user.enrollments if e.role == "instructor"}

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present in request data."""
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return f"Missing required fields: {', '.join(missing_fields)}"
    return None

def handle_db_error(operation_name):
    """Decorator for consistent database error handling."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error in {operation_name}: {str(e)}")
                return jsonify({"error": f"Failed to {operation_name}"}), 500
        return wrapper
    return decorator

# ============================================================================
# PRACTICE CASE ROUTES
# ============================================================================

@practice_cases.route('/get_cases', methods=['GET'])
@jwt_required()
@handle_db_error("fetch practice cases")
def get_practice_cases():
    """
    Retrieve practice cases visible to the authenticated user.
    
    Query Parameters:
    - class_id (optional): Filter cases for a specific class
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get optional class filter
    class_id = request.args.get('class_id', type=int)
    
    # Determine which class IDs the user can access
    accessible_class_ids = get_user_accessible_class_ids(user)
    
    # Apply class filter if provided
    if class_id:
        if class_id not in accessible_class_ids:
            return jsonify({"error": "Unauthorized to access this class"}), 403
        class_ids_to_query = {class_id}
    else:
        class_ids_to_query = accessible_class_ids

    if not class_ids_to_query:
        return jsonify([]), 200

    # Query practice cases
    practice_cases_query = PracticeCase.query.filter(
        PracticeCase.class_id.in_(class_ids_to_query)
    ).order_by(PracticeCase.created_at.desc())
    
    practice_cases_list = practice_cases_query.all()

    # Build response with user-specific data
    response = []
    for case in practice_cases_list:
        # Check visibility for students
        if user.is_student:
            if not case.published:
                continue
            accessible = case.accessible_on is None or case.accessible_on <= datetime.now(timezone.utc)
        else:
            # Instructors and masters can see all cases
            accessible = True

        case_data = case.to_dict()
        case_data["accessible"] = accessible
        
        # Check if user has completed this case
        case_data["completed"] = Conversation.query.filter_by(
            practice_case_id=case.id, 
            user_id=user.id, 
            completed=True
        ).first() is not None

        response.append(case_data)

    return jsonify(response), 200


@practice_cases.route('/get_case/<int:case_id>', methods=['GET'])
@jwt_required()
@handle_db_error("fetch practice case")
def get_practice_case(case_id):
    """Retrieve a specific practice case by its ID."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    case = PracticeCase.query.get(case_id)
    if not case:
        return jsonify({"error": "Practice case not found"}), 404

    # Check if user has access to this case's class
    if not can_user_access_class(user, case.class_id):
        return jsonify({"error": "Unauthorized to access this practice case"}), 403

    return jsonify(case.to_dict()), 200


@practice_cases.route('/add_case', methods=['POST'])
@jwt_required()
@handle_db_error("create practice case")
def add_practice_case():
    """
    Add a new practice case for a specific class.
    
    Required fields: title, description, system_prompt, class_id
    Optional fields: min_time, max_time, accessible_on, feedback_prompt, voice, language_code
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    
    # Validate required fields
    validation_error = validate_required_fields(
        data, ["title", "description", "system_prompt", "class_id"]
    )
    if validation_error:
        return jsonify({"error": validation_error}), 400

    class_id = data["class_id"]
    
    # Check if user can create cases for this class
    if not user.is_master:
        instructor_class_ids = {e.section.class_id for e in user.enrollments if e.role == "instructor"}
        if class_id not in instructor_class_ids:
            return jsonify({"error": "Unauthorized to create cases for this class"}), 403

    # Parse accessible_on date if provided
    accessible_on = None
    if data.get('accessible_on'):
        try:
            accessible_on = datetime.fromisoformat(data['accessible_on'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"error": "Invalid accessible_on date format. Use ISO format."}), 400

    # Create new practice case
    new_case = PracticeCase(
        class_id=class_id,
        title=data["title"],
        description=data["description"],
        system_prompt=data["system_prompt"],
        min_time=int(data.get('min_time', 0)),
        max_time=int(data.get('max_time', 0)),
        accessible_on=accessible_on,
        published=bool(data.get('published', False)),
        feedback_prompt=data.get("feedback_prompt", ""),
        voice=data.get("voice", "verse"),
        language_code=data.get("language_code", "en"),
        created_by=user.id
    )

    db.session.add(new_case)
    db.session.commit()
    
    current_app.logger.info(f"Practice case '{new_case.title}' created by user {user.id} for class {class_id}")
    return jsonify(new_case.to_dict()), 201


@practice_cases.route('/update_case/<int:case_id>', methods=['PUT'])
@jwt_required()
@handle_db_error("update practice case")
def update_practice_case(case_id):
    """Update fields for an existing practice case."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    case = PracticeCase.query.get(case_id)
    if not case:
        return jsonify({"error": "Practice case not found"}), 404

    # Check authorization
    if not can_user_modify_case(user, case):
        return jsonify({"error": "Unauthorized to modify this practice case"}), 403

    data = request.get_json() or {}

    # Update fields if provided
    if "title" in data:
        case.title = data["title"]
    if "description" in data:
        case.description = data["description"]
    if "system_prompt" in data:
        case.system_prompt = data["system_prompt"]
    if "min_time" in data:
        case.min_time = int(data["min_time"])
    if "max_time" in data:
        case.max_time = int(data["max_time"])
    if "published" in data:
        case.published = bool(data["published"])
    if "feedback_prompt" in data:
        case.feedback_prompt = data["feedback_prompt"]
    if "voice" in data:
        case.voice = data["voice"]
    if "language_code" in data:
        case.language_code = data["language_code"]
    
    # Handle accessible_on date
    if "accessible_on" in data:
        if data["accessible_on"]:
            try:
                case.accessible_on = datetime.fromisoformat(data["accessible_on"].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"error": "Invalid accessible_on date format. Use ISO format."}), 400
        else:
            case.accessible_on = None

    # Update the updated_at timestamp
    case.updated_at = datetime.now(timezone.utc)

    db.session.commit()
    
    current_app.logger.info(f"Practice case {case_id} updated by user {user.id}")
    return jsonify({"message": "Practice case updated successfully", "case": case.to_dict()}), 200


@practice_cases.route('/publish/<int:case_id>', methods=['PUT'])
@jwt_required()
@handle_db_error("update publish status")
def publish_practice_case(case_id):
    """Toggle the published status of a practice case."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    case = PracticeCase.query.get(case_id)
    if not case:
        return jsonify({"error": "Practice case not found"}), 404

    # Check authorization
    if not can_user_modify_case(user, case):
        return jsonify({"error": "Unauthorized to modify this practice case"}), 403

    data = request.get_json() or {}
    published = data.get("published")
    
    if published is None:
        return jsonify({"error": "Published status not provided"}), 400

    case.published = bool(published)
    case.updated_at = datetime.now(timezone.utc)
    
    db.session.commit()
    
    status = "published" if published else "unpublished"
    current_app.logger.info(f"Practice case {case_id} {status} by user {user.id}")
    return jsonify({"message": f"Practice case {status} successfully"}), 200


@practice_cases.route('/delete_case/<int:case_id>', methods=['DELETE'])
@jwt_required()
@handle_db_error("delete practice case")
def delete_practice_case(case_id):
    """Delete a practice case by ID."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    case = PracticeCase.query.get(case_id)
    if not case:
        return jsonify({"error": "Practice case not found"}), 404

    # Check authorization
    if not can_user_modify_case(user, case):
        return jsonify({"error": "Unauthorized to delete this practice case"}), 403

    # Check if case has any conversations
    conversation_count = Conversation.query.filter_by(practice_case_id=case_id).count()
    if conversation_count > 0:
        return jsonify({
            "error": f"Cannot delete practice case with {conversation_count} existing conversations. "
                     "Consider unpublishing instead."
        }), 400

    case_title = case.title
    db.session.delete(case)
    db.session.commit()
    
    current_app.logger.info(f"Practice case '{case_title}' (ID: {case_id}) deleted by user {user.id}")
    return jsonify({"message": "Practice case deleted successfully"}), 200


# ============================================================================
# ANALYTICS AND REPORTING ROUTES
# ============================================================================

@practice_cases.route('/analytics/<int:case_id>', methods=['GET'])
@jwt_required()
@handle_db_error("fetch case analytics")
def get_case_analytics(case_id):
    """Get analytics data for a specific practice case."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    case = PracticeCase.query.get(case_id)
    if not case:
        return jsonify({"error": "Practice case not found"}), 404

    # Check if user has access to this case's class
    if not can_user_access_class(user, case.class_id):
        return jsonify({"error": "Unauthorized to access this practice case"}), 403

    # Get conversation statistics
    conversations = Conversation.query.filter_by(practice_case_id=case_id).all()
    
    total_conversations = len(conversations)
    completed_conversations = len([c for c in conversations if c.completed])
    unique_users = len(set(c.user_id for c in conversations))
    
    # Calculate average duration for completed conversations
    completed_with_duration = [c for c in conversations if c.completed and c.duration]
    avg_duration = sum(c.duration for c in completed_with_duration) / len(completed_with_duration) if completed_with_duration else 0

    analytics_data = {
        "case_id": case_id,
        "case_title": case.title,
        "total_conversations": total_conversations,
        "completed_conversations": completed_conversations,
        "completion_rate": (completed_conversations / total_conversations * 100) if total_conversations > 0 else 0,
        "unique_users": unique_users,
        "average_duration": avg_duration
    }

    return jsonify(analytics_data), 200