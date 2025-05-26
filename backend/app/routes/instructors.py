# routes/instructor.py
from flask import Blueprint, jsonify, current_app, request
from backend.app.models import db, User, Conversation, PracticeCase
from werkzeug.security import generate_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
import humanize
from datetime import datetime, timezone 

instructors = Blueprint("instructor", __name__)

def format_last_active(timestamp):
    """Formats the datetime object to a relative time."""
    if not timestamp:
        return "Never"
    
    # Convert to timezone-aware datetime if naive
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    
    # Calculate relative time
    return humanize.naturaltime(datetime.now(timezone.utc) - timestamp)


@instructors.route("/students/engagement", methods=["GET"])
@jwt_required()
def get_students_engagement():
    current_user_id = get_jwt_identity()
    instructor = User.query.get(current_user_id)

    if not instructor or instructor.is_student:
        return jsonify({"error": "Unauthorized"}), 403

    # Filter students by instructor's institution and class
    students = User.query.filter_by(
        institution=instructor.institution,
        class_name=instructor.class_name,
        is_student=True
    ).all()

    # Format student data for frontend with only completed conversations counted
    student_data = [
        {
            "id": student.id,
            "name": f"{student.first_name} {student.last_name}",
            "sessionsCompleted": Conversation.query.filter_by(student_id=student.id, completed=True).count(),
            "lastActive": format_last_active(student.last_login)
        }
        for student in students
    ]

    return jsonify(student_data), 200


@instructors.route("/analytics", methods=["GET"])
@jwt_required()
def get_practice_case_analytics():
    """
    Retrieve analytics data for practice cases.
    Excludes instructor conversations to avoid inflating student usage counts.
    """
    try:
        current_user_id = get_jwt_identity()
        instructor = User.query.get(current_user_id)

        if not instructor or instructor.is_student:
            return jsonify({"error": "Unauthorized"}), 403

        # Get all students (not instructors) in the instructor's class
        students = User.query.filter_by(
            institution=instructor.institution,
            class_name=instructor.class_name,
            is_student=True
        ).all()

        student_ids = {student.id for student in students}  # Set for fast lookup

        # Get all practice cases for the instructor's class
        cases = PracticeCase.query.filter_by(institution=instructor.institution, class_name=instructor.class_name).all()

        analytics_data = []
        for case in cases:
            # ✅ Filter out instructor conversations
            student_conversations = Conversation.query.filter(
                Conversation.practice_case_id == case.id,
                Conversation.completed == True,
                Conversation.student_id.in_(student_ids)  # ✅ Only count students
            ).all()

            total_students = len(set(conv.student_id for conv in student_conversations))  # Unique students
            total_time = sum(conv.duration for conv in student_conversations if conv.duration)  # Sum total time
            avg_time = total_time / total_students if total_students else 0  # Avoid division by zero

            # ✅ Compute completion rate correctly
            total_class_students = len(students)
            completion_rate = (total_students / total_class_students * 100) if total_class_students else 0

            analytics_data.append({
                "id": case.id,
                "title": case.title,
                "studentsUsed": total_students,
                "avgTimeSpent": avg_time,  # Time in seconds
                "completionRate": round(completion_rate, 2) if total_students else 0
            })

        return jsonify(analytics_data), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching practice case analytics: {str(e)}")
        return jsonify({"error": "Failed to retrieve analytics"}), 500


# Add these routes to routes/instructor.py

@instructors.route("/students/add", methods=["POST"])
@jwt_required()
def add_student():
    """
    Allows instructors to add a student to their class.
    If the student already exists but has no class, reactivates them.
    """
    try:
        current_user_id = get_jwt_identity()
        instructor = User.query.get(current_user_id)

        if not instructor or instructor.is_student:
            return jsonify({"error": "Unauthorized"}), 403

        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        email = data.get("email")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Create a temporary user instance to encrypt the data for searching
        temp_user = User()
        encrypted_email = temp_user.encrypt_data(email)
        
        if not encrypted_email:
            current_app.logger.error("Failed to encrypt email for search.")
            return jsonify({"error": "Email encryption failed"}), 500

        # First, check if a user with this email already exists
        existing_user = None
        
        # Try to find by encrypted email
        if encrypted_email:
            existing_user = User.query.filter_by(email_encrypted=encrypted_email).first()
        
        # If no exact match, try decrypting all emails (less efficient but more thorough)
        if not existing_user:
            for user in User.query.all():
                if user.email == email:  # This uses the property getter which decrypts
                    existing_user = user
                    break
        
        # If the user exists
        if existing_user:
            # Check if they're already in a class
            if existing_user.class_name:
                # If they're in the same class as the instructor is trying to add them to
                if existing_user.institution == instructor.institution and existing_user.class_name == instructor.class_name:
                    return jsonify({"error": f"Student {email} is already in your class"}), 400
                else:
                    return jsonify({"error": f"Student {email} already exists in another class"}), 400
            
            # User exists but has no class (was removed or never assigned) - reactivate them
            current_app.logger.info(f"Reactivating existing student: {email} in class {instructor.class_name}")
            
            # Update their information
            if first_name and first_name != existing_user.first_name:
                encrypted_first_name = temp_user.encrypt_data(first_name)
                existing_user.first_name_encrypted = encrypted_first_name
                
            if last_name and last_name != existing_user.last_name:
                encrypted_last_name = temp_user.encrypt_data(last_name)
                existing_user.last_name_encrypted = encrypted_last_name
            
            # Assign to instructor's class
            existing_user.institution = instructor.institution
            existing_user.class_name = instructor.class_name
            existing_user.section = instructor.section
            
            db.session.commit()
            
            # Send response with reactivated user
            return jsonify({
                "message": "Student reactivated successfully",
                "student": {
                    "id": existing_user.id,
                    "name": f"{existing_user.first_name or first_name} {existing_user.last_name or last_name}".strip() or "Unregistered",
                    "email": email,
                    "sessionsCompleted": Conversation.query.filter_by(student_id=existing_user.id, completed=True).count(),
                    "lastActive": format_last_active(existing_user.last_login)
                },
                "reactivated": True
            }), 200

        # If user doesn't exist, create a new one
        # Only encrypt names if provided
        encrypted_first_name = temp_user.encrypt_data(first_name) if first_name else None
        encrypted_last_name = temp_user.encrypt_data(last_name) if last_name else None
        
        # Create new user with encrypted data
        # Use a placeholder password since the column is NOT NULL
        dummy_password = "placeholder_will_need_reset"
        
        new_student = User(
            email_encrypted=encrypted_email,
            first_name_encrypted=encrypted_first_name,
            last_name_encrypted=encrypted_last_name,
            password_hash=generate_password_hash(dummy_password),
            institution=instructor.institution,
            class_name=instructor.class_name,
            section=instructor.section,
            is_student=True,
            is_registered=False
        )

        # Log student creation attempt
        current_app.logger.info(f"Instructor {instructor.id} adding new student: {email}")

        # Add user to database
        db.session.add(new_student)
        db.session.commit()

        return jsonify({
            "message": "Student added successfully",
            "student": {
                "id": new_student.id,
                "name": f"{first_name} {last_name}".strip() or "Unregistered",
                "email": email,
                "sessionsCompleted": 0,
                "lastActive": "Never"
            },
            "reactivated": False
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error adding student: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to add student: {str(e)}"}), 500


@instructors.route("/students/remove/<int:student_id>", methods=["DELETE"])
@jwt_required()
def remove_student(student_id):
    """
    Allows instructors to remove a student from their class
    This doesn't delete the student record, just nullifies the class assignment
    """
    try:
        current_user_id = get_jwt_identity()
        instructor = User.query.get(current_user_id)

        if not instructor or instructor.is_student:
            return jsonify({"error": "Unauthorized"}), 403

        # Find the student
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404

        # Verify the student belongs to this instructor's class
        if (student.institution != instructor.institution or 
            student.class_name != instructor.class_name):
            return jsonify({"error": "This student is not in your class"}), 403

        # Store student info for the response
        student_name = f"{student.first_name} {student.last_name}"
        
        # Remove class assignment but keep the student record
        student.class_name = None
        student.section = None
        
        # Log the removal
        current_app.logger.info(f"Instructor {instructor.id} removing student {student_id} from class")
        
        db.session.commit()
        
        return jsonify({
            "message": f"Student {student_name} removed from class",
            "student_id": student_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error removing student: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to remove student: {str(e)}"}), 500
