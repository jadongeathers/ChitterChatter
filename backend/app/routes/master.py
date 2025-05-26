from flask import Blueprint, jsonify, current_app, request
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.models import db, User, Conversation, PracticeCase

master = Blueprint('master', __name__)

def master_required(f):
    """Decorator to ensure only masters can access a route"""
    @wraps(f)
    @jwt_required()  # First ensure the user is authenticated with JWT
    def decorated_function(*args, **kwargs):
        # Get user from JWT identity
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_master:
            return jsonify({"error": "Unauthorized", "is_master": False}), 403
        return f(*args, **kwargs)
    return decorated_function


@master.route("/check", methods=["GET"])
@jwt_required()  # Ensure JWT authentication
def check_master():
    """Verify if the authenticated user is a master"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            current_app.logger.warning(f"check_master: User ID {user_id} not found")
            return jsonify({"is_master": False, "error": "User not found"}), 404
        
        current_app.logger.info(f"check_master: User ID {user.id}, is_master={user.is_master}")
        return jsonify({"is_master": user.is_master})
    except Exception as e:
        current_app.logger.error(f"Error in check_master: {str(e)}")
        return jsonify({"error": str(e), "is_master": False}), 500


@master.route("/test", methods=["GET"])
def test_endpoint():
    """Simple test endpoint that doesn't require authentication"""
    return jsonify({
        "message": "Master API test endpoint is working"
    })


@master.route("/classes", methods=["GET"])
@master_required
def get_classes():
    """Fetches all unique classes and sections"""
    try:
        classes = db.session.query(PracticeCase.class_name).distinct().all()
        class_list = [{"id": cls.class_name, "name": cls.class_name} for cls in classes if cls.class_name]
        
        # Add debugging for empty results
        if not class_list:
            current_app.logger.info("No classes found in database")
            return jsonify([])
            
        return jsonify(class_list)
    except Exception as e:
        current_app.logger.error(f"Error fetching classes: {e}")
        return jsonify({"error": f"Failed to fetch classes: {str(e)}"}), 500


@master.route("/students", methods=["GET"])
@master_required
def get_students():
    """
    Fetches all users (students and instructors) filtered by institution, class, and section.
    If no filters are provided, returns ALL users sorted by institution, class_name, and section.
    """
    institution = request.args.get("institution")
    class_name = request.args.get("class_name")
    section = request.args.get("section")
    include_instructors = request.args.get("include_instructors", "true").lower() == "true"

    try:
        # Start with a base query for all users or just students based on parameter
        if include_instructors:
            # Get both students and instructors
            query = User.query
            current_app.logger.info("Including both students and instructors in results")
        else:
            # Get only students
            query = User.query.filter_by(is_student=True)
            current_app.logger.info("Including only students in results")

        # Apply filters if provided
        if institution:
            query = query.filter_by(institution=institution)
            current_app.logger.info(f"Filtering by institution: {institution}")
        
        if class_name:
            query = query.filter_by(class_name=class_name)
            current_app.logger.info(f"Filtering by class_name: {class_name}")
            
        if section:
            query = query.filter_by(section=section)
            current_app.logger.info(f"Filtering by section: {section}")

        # Sort the results by institution, class_name, section, and then is_student (instructors first)
        query = query.order_by(
            User.institution.asc(),
            User.class_name.asc(),
            User.section.asc(),
            User.is_student.asc()  # Instructors (False) will come before students (True)
        )

        # Execute the query
        users = query.all()

        # Count students and instructors
        student_count = sum(1 for user in users if user.is_student)
        instructor_count = len(users) - student_count
        
        current_app.logger.info(f"Found {len(users)} users: {student_count} students and {instructor_count} instructors")
        
        if not users:
            # Return an empty array with 200 status - not finding users isn't an error
            return jsonify([])

        # Return serialized users
        return jsonify([user.to_dict() for user in users])
        
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {e}")
        return jsonify({"error": f"Failed to fetch users: {str(e)}"}), 500
    

@master.route("/lessons", methods=["GET"])
@master_required
def get_lessons():
    """Fetches all lessons for a given class"""
    class_name = request.args.get("class_name")
    if not class_name:
        return jsonify({"error": "Missing class_name parameter"}), 400

    try:
        lessons = PracticeCase.query.filter_by(class_name=class_name, published=True).all()
        return jsonify([lesson.to_dict() for lesson in lessons])
    except Exception as e:
        current_app.logger.error(f"Error fetching lessons: {e}")
        return jsonify({"error": f"Failed to fetch lessons: {str(e)}"}), 500


@master.route("/add_student", methods=["POST"])
@master_required
def add_student():
    """Adds a user (student or instructor) to an institution, class, and section."""
    try:
        # ✅ Log incoming request
        current_app.logger.info("Received request to add a user.")
        
        data = request.get_json()
        if not data:
            current_app.logger.warning("Request body is missing or invalid JSON.")
            return jsonify({"error": "Invalid JSON data"}), 400

        # ✅ Extract fields
        institution = data.get("institution")
        class_name = data.get("class_name")
        section = data.get("section")
        email = data.get("email")
        is_student = data.get("is_student", True)
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        access_group = data.get("access_group")

        # ✅ Log extracted fields
        current_app.logger.info(f"Extracted data - Institution: {institution}, Class: {class_name}, "
                                f"Section: {section}, Email: {email}, Is Student: {is_student}, "
                                f"First Name: {first_name}, Last Name: {last_name}, "
                                f"Access Group: {access_group}")

        if not institution or not class_name or not section or not email:
            current_app.logger.error("Missing required fields.")
            return jsonify({"error": "Missing institution, class_name, section, or email"}), 400

        # ✅ Create a temporary user instance to encrypt the data
        temp_user = User()
        encrypted_email = temp_user.encrypt_data(email)
        
        # Only encrypt names if provided
        encrypted_first_name = temp_user.encrypt_data(first_name) if first_name else None
        encrypted_last_name = temp_user.encrypt_data(last_name) if last_name else None
        
        if not encrypted_email:
            current_app.logger.error("Failed to encrypt email.")
            return jsonify({"error": "Email encryption failed, check your encryption configuration"}), 500

        # ✅ Create new user with encrypted data
        # Use a placeholder password since the column is NOT NULL
        dummy_password = "placeholder_will_need_reset"
        
        # Make sure non-students always have "All" access
        if not is_student and access_group != "All":
            access_group = "All"
            current_app.logger.info("Setting access_group to 'All' for instructor")
        
        # Make sure access_group is valid for students
        if is_student and access_group not in ["A", "B", "All", "Normal"]:
            access_group = "A"  # Default to group A if invalid
            current_app.logger.info("Invalid access_group for student, defaulting to 'A'")
        
        new_user = User(
            email_encrypted=encrypted_email,
            first_name_encrypted=encrypted_first_name,
            last_name_encrypted=encrypted_last_name,
            password_hash=generate_password_hash(dummy_password),
            institution=institution,
            class_name=class_name,
            section=section,
            access_group=access_group,
            is_student=is_student,
            is_registered=False,  # Explicitly mark as not registered
            has_consented=False,  # Explicitly set consent to false for new users
            consent_date=None
        )

        # ✅ Log user creation attempt
        current_app.logger.info(f"Creating user: ({email}) as {'Student' if is_student else 'Instructor'} with access group {access_group}.")

        # ✅ Add user to database
        db.session.add(new_user)
        db.session.commit()

        # ✅ Log successful addition
        current_app.logger.info(f"User added successfully to {institution}, {class_name}, Section {section}.")

        return jsonify({"message": "User added successfully", "user": new_user.to_dict()}), 201

    except Exception as e:
        current_app.logger.error(f"Unexpected error while adding user: {e}")
        db.session.rollback()  # Roll back transaction on error
        return jsonify({"error": f"Failed to add user: {str(e)}"}), 500
    

@master.route("/update_access_group/<int:user_id>", methods=["PUT"])
@master_required
def update_access_group(user_id):
    """Updates a user's access group"""
    try:
        data = request.get_json()
        if not data or 'access_group' not in data:
            return jsonify({"error": "Missing access_group parameter"}), 400
            
        new_access_group = data.get('access_group')
        if new_access_group not in ['A', 'B', 'All', 'Normal']:
            return jsonify({"error": "Invalid access group. Must be 'A', 'B', 'All', or 'Normal'"}), 400
            
        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Update access group
        user.access_group = new_access_group
        db.session.commit()
        
        current_app.logger.info(f"Updated access group for user {user_id} to {new_access_group}")
        
        return jsonify({
            "message": "Access group updated successfully",
            "user_id": user_id,
            "access_group": new_access_group
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating access group: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to update access group: {str(e)}"}), 500
    

# Add these routes to your master.py file

@master.route("/update_user/<int:user_id>", methods=["PUT"])
@master_required
def update_user(user_id):
    """Updates a user's information"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request data"}), 400
            
        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Update fields if they are in the request data
        allowed_fields = ["first_name", "last_name", "email", "institution", "class_name", "section", "is_student"]
        
        updated_fields = []
        
        for field in allowed_fields:
            if field in data:
                # Special handling for email, which needs encryption
                if field == "email" and data[field] != user.email:
                    # Create a temporary user to encrypt the email
                    temp_user = User()
                    encrypted_email = temp_user.encrypt_data(data[field])
                    if encrypted_email:
                        user.email_encrypted = encrypted_email
                        updated_fields.append(field)
                
                # Special handling for name fields, which need encryption
                elif field == "first_name" and data[field] != user.first_name:
                    temp_user = User()
                    encrypted_name = temp_user.encrypt_data(data[field])
                    if encrypted_name:
                        user.first_name_encrypted = encrypted_name
                        updated_fields.append(field)
                
                elif field == "last_name" and data[field] != user.last_name:
                    temp_user = User()
                    encrypted_name = temp_user.encrypt_data(data[field])
                    if encrypted_name:
                        user.last_name_encrypted = encrypted_name
                        updated_fields.append(field)
                
                # Handle regular fields
                elif hasattr(user, field) and data[field] != getattr(user, field):
                    setattr(user, field, data[field])
                    updated_fields.append(field)
        
        # If it changed from instructor to student and has no access_group, set one
        if "is_student" in data and data["is_student"] and not user.access_group:
            user.access_group = "A"  # Default to group A
            updated_fields.append("access_group")
        
        # If it changed from student to instructor, set access_group to "All"
        if "is_student" in data and not data["is_student"]:
            user.access_group = "All"
            updated_fields.append("access_group")
        
        # Commit changes if any fields were updated
        if updated_fields:
            db.session.commit()
            current_app.logger.info(f"Updated user {user_id}, fields: {', '.join(updated_fields)}")
            
            return jsonify({
                "message": "User updated successfully",
                "user_id": user_id,
                "updated_fields": updated_fields
            }), 200
        else:
            return jsonify({"message": "No changes were made", "user_id": user_id}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating user: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to update user: {str(e)}"}), 500


@master.route("/delete_user/<int:user_id>", methods=["DELETE"])
@master_required
def delete_user(user_id):
    """Deletes a user from the system"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Add any cleanup logic here if needed
        # For example, you might want to delete related data
        
        # Store user info for logging
        user_email = user.email
        
        # Delete the user
        db.session.delete(user)
        db.session.commit()
        
        current_app.logger.info(f"Deleted user {user_id} ({user_email})")
        
        return jsonify({
            "message": "User deleted successfully",
            "user_id": user_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error deleting user: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to delete user: {str(e)}"}), 500
