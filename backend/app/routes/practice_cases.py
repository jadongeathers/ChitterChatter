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

def validate_required_fields_for_publishing(data):
    """Validate that all required fields are present for publishing."""
    required_fields = [
        "title", "description", "target_language", "situation_instructions",
        "curricular_goals", "behavioral_guidelines", "proficiency_level",
        "min_time", "max_time", "accessible_on"
    ]
    missing_fields = []
    
    for field in required_fields:
        value = data.get(field)
        if not value or (isinstance(value, str) and not value.strip()):
            missing_fields.append(field)
    
    # Check time validations
    min_time = data.get('min_time', 0)
    max_time = data.get('max_time', 0)
    
    if min_time < 60:
        missing_fields.append("min_time (must be at least 60 seconds)")
    if max_time <= min_time:
        missing_fields.append("max_time (must be greater than min_time)")
    
    if missing_fields:
        return f"Missing or invalid required fields for publishing: {', '.join(missing_fields)}"
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
    - include_drafts (optional): Include draft cases (instructors only)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get optional filters
    class_id = request.args.get('class_id', type=int)
    include_drafts = request.args.get('include_drafts', 'false').lower() == 'true'
    
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
    )
    
    # Filter by draft status based on user role
    if user.is_student:
        # Students only see published cases
        practice_cases_query = practice_cases_query.filter(
            PracticeCase.published == True
        )
    elif not include_drafts and not user.is_master:
        # Instructors see published cases by default unless include_drafts is True
        practice_cases_query = practice_cases_query.filter(
            PracticeCase.published == True
        )
    
    practice_cases_query = practice_cases_query.order_by(PracticeCase.created_at.desc())
    practice_cases_list = practice_cases_query.all()

    # Build response with user-specific data
    response = []
    for case in practice_cases_list:
        # Check visibility for students
        if user.is_student:
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

    # Students can only access published cases
    if user.is_student and not case.published:
        return jsonify({"error": "Practice case not available"}), 403

    return jsonify(case.to_dict()), 200


@practice_cases.route('/add_case', methods=['POST'])
@jwt_required()
@handle_db_error("create practice case")
def add_practice_case():
    """
    Add a new practice case for a specific class.
    Can be created as a draft or published directly.
    
    Required fields for draft: class_id
    Required fields for publishing: all validation fields
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    
    # Validate class_id is always required
    if not data.get("class_id"):
        return jsonify({"error": "class_id is required"}), 400

    class_id = data["class_id"]
    
    # Check if user can create cases for this class
    if not user.is_master:
        instructor_class_ids = {e.section.class_id for e in user.enrollments if e.role == "instructor"}
        if class_id not in instructor_class_ids:
            return jsonify({"error": "Unauthorized to create cases for this class"}), 403

    # Check if this is being published directly
    is_draft = data.get('is_draft', True)
    published = data.get('published', False)
    
    # If trying to publish, validate all required fields
    if published or not is_draft:
        validation_error = validate_required_fields_for_publishing(data)
        if validation_error:
            return jsonify({"error": validation_error}), 400

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
        title=data.get("title", ""),
        description=data.get("description", ""),
        min_time=int(data.get('min_time', 0)),
        max_time=int(data.get('max_time', 0)),
        accessible_on=accessible_on,
        voice=data.get("voice", "verse"),
        language_code=data.get("language_code", "en"),
        
        # New individual fields
        target_language=data.get("target_language", ""),
        situation_instructions=data.get("situation_instructions", ""),
        curricular_goals=data.get("curricular_goals", ""),
        key_items=data.get("key_items", ""),
        behavioral_guidelines=data.get("behavioral_guidelines", ""),
        proficiency_level=data.get("proficiency_level", ""),
        instructor_notes=data.get("instructor_notes", ""),
        feedback_prompt=data.get("feedback_prompt", ""),
        
        # Draft and publish status
        is_draft=is_draft,
        published=published,
        created_by=user.id
    )

    # Generate system prompt if publishing
    if published and not is_draft:
        new_case.update_system_prompt()

    db.session.add(new_case)
    db.session.commit()
    
    status = "published" if published else "draft"
    current_app.logger.info(f"Practice case '{new_case.title}' created as {status} by user {user.id} for class {class_id}")
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

    # Update basic fields if provided
    updateable_fields = [
        "title", "description", "min_time", "max_time", "voice", "language_code",
        "target_language", "situation_instructions", "curricular_goals", 
        "key_items", "behavioral_guidelines", "proficiency_level", "instructor_notes", "feedback_prompt"
    ]
    
    for field in updateable_fields:
        if field in data:
            if field in ["min_time", "max_time"]:
                setattr(case, field, int(data[field]))
            else:
                setattr(case, field, data[field])

    # Handle draft and published status
    if "is_draft" in data:
        case.is_draft = bool(data["is_draft"])
    
    if "published" in data:
        case.published = bool(data["published"])
    
    # Handle accessible_on date
    if "accessible_on" in data:
        if data["accessible_on"]:
            try:
                case.accessible_on = datetime.fromisoformat(data["accessible_on"].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"error": "Invalid accessible_on date format. Use ISO format."}), 400
        else:
            case.accessible_on = None

    # If trying to publish, validate required fields
    if case.published and not case.is_draft:
        # Create a dict with current case data for validation
        case_data = {
            "title": case.title,
            "description": case.description,
            "target_language": case.target_language,
            "situation_instructions": case.situation_instructions,
            "curricular_goals": case.curricular_goals,
            "behavioral_guidelines": case.behavioral_guidelines,
            "proficiency_level": case.proficiency_level,
            "min_time": case.min_time,
            "max_time": case.max_time,
            "accessible_on": case.accessible_on.isoformat() if case.accessible_on else None
        }
        
        validation_error = validate_required_fields_for_publishing(case_data)
        if validation_error:
            return jsonify({"error": validation_error}), 400
        
        # Generate system prompt for published cases
        case.update_system_prompt()

    # Update the updated_at timestamp
    case.updated_at = datetime.now(timezone.utc)

    db.session.commit()
    
    current_app.logger.info(f"Practice case {case_id} updated by user {user.id}")
    return jsonify({"message": "Practice case updated successfully", "case": case.to_dict()}), 200


@practice_cases.route('/publish_case/<int:case_id>', methods=['PUT'])
@jwt_required()
@handle_db_error("publish practice case")
def publish_practice_case(case_id):
    """Publish a practice case after validation."""
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

    # Update fields first if provided
    updateable_fields = [
        "title", "description", "min_time", "max_time", "accessible_on", 
        "voice", "language_code", "target_language", "situation_instructions",
        "curricular_goals", "key_items", "behavioral_guidelines", 
        "proficiency_level", "instructor_notes"
    ]
    
    for field in updateable_fields:
        if field in data:
            if field == "accessible_on" and data[field]:
                try:
                    setattr(case, field, datetime.fromisoformat(data[field].replace('Z', '+00:00')))
                except ValueError:
                    return jsonify({"error": "Invalid accessible_on date format. Use ISO format."}), 400
            elif field in ["min_time", "max_time"]:
                setattr(case, field, int(data[field]))
            else:
                setattr(case, field, data[field])

    # Validate before publishing using the model's method
    can_publish, errors = case.can_be_published()
    if not can_publish:
        return jsonify({"error": f"Cannot publish: {', '.join(errors)}"}), 400

    # Publish the case using the model's method
    try:
        case.publish()
        case.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        current_app.logger.info(f"Practice case {case_id} published by user {user.id}")
        return jsonify({"message": "Practice case published successfully", "case": case.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@practice_cases.route('/publish/<int:case_id>', methods=['PUT'])
@jwt_required()
@handle_db_error("update publish status")
def toggle_publish_practice_case(case_id):
    """Toggle the published status of a practice case (legacy endpoint)."""
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

    if published:
        # Validate before publishing
        can_publish, errors = case.can_be_published()
        if not can_publish:
            return jsonify({"error": f"Cannot publish: {', '.join(errors)}"}), 400
        
        # Publish using the model's method
        case.publish()
    else:
        # Unpublish
        case.published = False
        case.is_draft = True

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
        "average_duration": avg_duration,
        "is_draft": case.is_draft,
        "published": case.published
    }

    return jsonify(analytics_data), 200