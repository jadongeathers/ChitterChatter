from datetime import datetime
from flask import Blueprint, jsonify, current_app, request
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from app.models import db, User, PracticeCase, Enrollment, Section, Class, Institution, Term
from app.utils.user_roles import (
    is_user_student,
    is_user_instructor,
    filter_users
)

master = Blueprint('master', __name__)

# ============================================================================
# DECORATORS AND UTILITIES
# ============================================================================

def master_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user = db.session.get(User, get_jwt_identity())
        if not user or not user.is_master:
            return jsonify({"error": "Unauthorized", "is_master": False}), 403
        return f(*args, **kwargs)
    return decorated_function

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present in the request data."""
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 400
    return None, None

def handle_db_error(operation_name="operation"):
    """Standard error handler for database operations."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error in {operation_name}: {str(e)}")
                return jsonify({"error": f"Failed to {operation_name}: {str(e)}"}), 500
        return wrapper
    return decorator

# ============================================================================
# AUTHENTICATION AND STATUS
# ============================================================================

@master.route("/check", methods=["GET"])
@jwt_required()
def check_master_status():
    """Check if the current user has master permissions."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        
        if not user:
            return jsonify({"error": "User not found", "is_master": False}), 404
        
        if not user.is_master:
            return jsonify({"error": "Unauthorized", "is_master": False}), 403
        return jsonify({"is_master": True}), 200
    
    except Exception as e:
        current_app.logger.error(f"Error checking master status: {str(e)}")
        return jsonify({"error": "Failed to check master status", "is_master": False}), 500

# ============================================================================
# USER MANAGEMENT
# ============================================================================

@master.route("/users", methods=["GET"])
@master_required
def get_users():
    """Get all users with optional filtering."""
    try:
        # Optional filters
        email_filter = request.args.get("email", "").strip()
        role_filter = request.args.get("role", "").strip()
        institution_filter = request.args.get("institution", "").strip()
        include_unregistered = request.args.get("include_unregistered", "false").lower() == "true"
        
        # Start with base query - include all active users
        query = User.query.filter_by(is_active=True)
        
        # Only filter by registration status if specifically requested
        if not include_unregistered:
            query = query.filter_by(is_registered=True)
        
        users = query.all()
        
        # Apply filters
        filtered_users = []
        for user in users:
            # Institution filter - this is important for the add user form
            if institution_filter and user.institution != institution_filter:
                continue
                
            # Email filter (case insensitive search)
            if email_filter and email_filter.lower() not in user.email.lower():
                continue
                
            # Role filter
            if role_filter:
                if role_filter == "student" and not user.is_student:
                    continue
                elif role_filter == "instructor" and user.is_student:
                    continue
            
            filtered_users.append({
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "institution": user.institution,
                "is_student": user.is_student,
                "is_registered": user.is_registered
            })
        
        return jsonify(filtered_users)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({"error": f"Failed to fetch users: {str(e)}"}), 500

@master.route("/add_user", methods=["POST"])
@master_required
@handle_db_error("create user")
def add_user():
    """Add a new user to the system."""
    data = request.get_json() or {}
    
    # Validate required fields
    error_response, status_code = validate_required_fields(
        data, ["email", "first_name", "last_name"]
    )
    if error_response:
        return jsonify(error_response), status_code
    
    # Check if email already exists
    users = User.query.all()
    if any(u.email == data["email"] for u in users):
        return jsonify({"error": "Email already exists"}), 409
    
    # Create the user
    user = User()
    user.email = data["email"]
    user.first_name = data["first_name"]
    user.last_name = data["last_name"]
    
    # Generate temporary password
    import secrets
    temp_password = secrets.token_urlsafe(8)
    user.set_password(temp_password)
    
    # Set user properties
    user.is_registered = False
    user.is_active = True
    user.institution = data.get("institution", "")
    user.access_group = data.get("access_group", "Normal")
    
    # Assign random profile picture
    import random
    profile_pictures = [
        "apple.png", "blueberry.png", "lemon.png", "lychee.png", 
        "melon.png", "orange.png", "pear.png", "plum.png"
    ]
    user.profile_picture = random.choice(profile_pictures)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "message": "User created successfully. They will need to complete registration."
    }), 201

@master.route("/update_user/<int:user_id>", methods=["PUT"])
@master_required
@handle_db_error("update user")
def update_user(user_id):
    """Update user information."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing data"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    updated_fields = []
    temp_user = User()

    # Update encrypted fields
    for field, encrypted_attr in [
        ("first_name", "first_name_encrypted"), 
        ("last_name", "last_name_encrypted"), 
        ("email", "email_encrypted")
    ]:
        if field in data:
            encrypted_value = temp_user.encrypt_data(data[field])
            setattr(user, encrypted_attr, encrypted_value)
            updated_fields.append(field)

    # Update non-encrypted fields
    for field in ["institution", "access_group"]:
        if field in data:
            setattr(user, field, data[field])
            updated_fields.append(field)

    db.session.commit()
    return jsonify({"message": "User updated", "updated_fields": updated_fields}), 200

@master.route("/update_access_group/<int:user_id>", methods=["PUT"])
@master_required
@handle_db_error("update access group")
def update_access_group(user_id):
    """Update user access group."""
    group = request.json.get("access_group")
    if group not in ["A", "B", "All", "Normal"]:
        return jsonify({"error": "Invalid access group"}), 400
        
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    user.access_group = group
    db.session.commit()
    return jsonify({"message": "Access group updated", "access_group": group}), 200

@master.route("/delete_user/<int:user_id>", methods=["DELETE"])
@master_required
@handle_db_error("delete user")
def delete_user(user_id):
    """Delete a user."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted", "user_id": user_id}), 200

@master.route("/check-email", methods=["GET"])
@master_required
def check_email_exists():
    """Check if an email already exists."""
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Missing email parameter"}), 400
    
    users = User.query.all()
    exists = any(u.email == email for u in users)
    return jsonify({"exists": exists}), 200 if exists else 404

# ============================================================================
# INSTITUTION MANAGEMENT
# ============================================================================

@master.route("/institutions", methods=["GET", "POST"])
@master_required
def institutions():
    """Get all institutions or create a new one."""
    if request.method == "GET":
        insts = Institution.query.all()
        return jsonify([{"id": i.id, "name": i.name, "location": i.location} for i in insts])
    
    # POST: create new institution
    data = request.get_json() or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "Missing name"}), 400
        
    try:
        inst = Institution(name=name, location=data.get("location"))
        db.session.add(inst)
        db.session.commit()
        return jsonify({"id": inst.id, "name": inst.name, "location": inst.location}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ============================================================================
# TERM MANAGEMENT
# ============================================================================

@master.route("/terms", methods=["GET", "POST"])
@master_required
def terms():
    """Get terms for an institution or create a new term."""
    if request.method == "GET":
        institution_id = request.args.get("institution_id", type=int)
        q = Term.query
        if institution_id:
            q = q.filter_by(institution_id=institution_id)
        terms = q.all()
        return jsonify([{
            "id": t.id, 
            "name": t.name, 
            "code": t.code,
            "start_date": t.start_date.isoformat(),
            "end_date": t.end_date.isoformat(),
            "institution_id": t.institution_id
        } for t in terms])
    
    # POST: create new term
    data = request.get_json() or {}
    required_fields = ["name", "code", "start_date", "end_date", "institution_id"]
    
    error_response, status_code = validate_required_fields(data, required_fields)
    if error_response:
        return jsonify(error_response), status_code
    
    # Convert string dates to Date objects
    try:
        start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    
    try:
        term = Term(
            name=data["name"],
            code=data["code"],
            start_date=start_date,
            end_date=end_date,
            institution_id=data["institution_id"]
        )
        
        db.session.add(term)
        db.session.commit()
        
        return jsonify({
            "id": term.id,
            "name": term.name,
            "code": term.code,
            "start_date": term.start_date.isoformat(),
            "end_date": term.end_date.isoformat(),
            "institution_id": term.institution_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ============================================================================
# CLASS MANAGEMENT
# ============================================================================

@master.route("/classes", methods=["GET", "POST"])
@master_required
def classes():
    """Get classes for an institution or create a new class."""
    if request.method == "GET":
        inst_id = request.args.get("institution_id", type=int)
        q = Class.query
        if inst_id:
            q = q.filter_by(institution_id=inst_id)
        classes = q.all()
        return jsonify([{
            "id": c.id, 
            "course_code": c.course_code, 
            "title": c.title,
            "institution_id": c.institution_id
        } for c in classes])
    
    # POST: create new class
    data = request.get_json() or {}
    error_response, status_code = validate_required_fields(
        data, ["course_code", "title", "institution_id"]
    )
    if error_response:
        return jsonify(error_response), status_code
    
    try:
        cls = Class(
            course_code=data["course_code"],
            title=data["title"],
            institution_id=data["institution_id"]
        )
        db.session.add(cls)
        db.session.commit()
        return jsonify({
            "id": cls.id, 
            "course_code": cls.course_code, 
            "title": cls.title,
            "institution_id": cls.institution_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ============================================================================
# SECTION MANAGEMENT
# ============================================================================

@master.route("/sections", methods=["GET", "POST"])
@master_required
def sections():
    """Get sections for a class or create a new section."""
    if request.method == "GET":
        class_id = request.args.get("class_id", type=int)
        term_id = request.args.get("term_id", type=int)
        
        q = Section.query
        if class_id:
            q = q.filter_by(class_id=class_id)
        if term_id:
            q = q.filter_by(term_id=term_id)
            
        secs = q.all()
        return jsonify([{
            "id": s.id, 
            "section_code": s.section_code, 
            "class_id": s.class_id,
            "term_id": s.term_id
        } for s in secs])

    # POST: create new section
    data = request.get_json() or {}
    error_response, status_code = validate_required_fields(
        data, ["class_id", "section_code", "term_id"]
    )
    if error_response:
        return jsonify(error_response), status_code
    
    try:
        sec = Section(
            class_id=data["class_id"],
            section_code=data["section_code"],
            term_id=data["term_id"]
        )
        db.session.add(sec)
        db.session.commit()
        return jsonify({
            "id": sec.id, 
            "section_code": sec.section_code,
            "class_id": sec.class_id,
            "term_id": sec.term_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@master.route("/sections/<int:section_id>", methods=["PUT", "DELETE"])
@master_required
def manage_section(section_id):
    """Update or delete a section."""
    section = Section.query.get_or_404(section_id)
    
    if request.method == "DELETE":
        try:
            # Delete all enrollments for this section first
            Enrollment.query.filter_by(section_id=section_id).delete()
            db.session.delete(section)
            db.session.commit()
            return jsonify({"message": "Section deleted successfully"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400
    
    # PUT: update section
    data = request.get_json() or {}
    
    if "section_code" in data:
        # Check for duplicate section codes
        if data["section_code"] != section.section_code:
            existing = Section.query.filter_by(
                class_id=section.class_id,
                section_code=data["section_code"],
                term_id=section.term_id
            ).first()
            
            if existing:
                return jsonify({
                    "error": f"Section code '{data['section_code']}' already exists for this class and term"
                }), 400
        
        section.section_code = data["section_code"]
    
    try:
        db.session.commit()
        return jsonify({
            "id": section.id,
            "section_code": section.section_code,
            "class_id": section.class_id,
            "term_id": section.term_id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ============================================================================
# ENROLLMENT MANAGEMENT
# ============================================================================

@master.route("/section-enrollments", methods=["GET"])
@master_required
def get_section_enrollments():
    """Get all users enrolled in a section."""
    section_id = request.args.get("section_id", type=int)
    if not section_id:
        return jsonify({"error": "Missing section_id parameter"}), 400
    
    # Check if section exists
    section = Section.query.get_or_404(section_id)
    
    # Get all enrollments for this section
    enrollments = Enrollment.query.filter_by(section_id=section_id).all()
    
    # Build result with user info
    result = []
    for enrollment in enrollments:
        user = User.query.get(enrollment.user_id)
        if user:
            result.append({
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture_url": user.profile_picture_url,
                "is_student": user.is_student,
                "role": enrollment.role
            })
    
    return jsonify(result)

@master.route("/enrollments", methods=["POST"])
@master_required
@handle_db_error("create enrollment")
def create_enrollment():
    """Add a user to a section."""
    data = request.get_json() or {}
    
    # Validate required fields
    error_response, status_code = validate_required_fields(
        data, ["user_id", "section_id", "role"]
    )
    if error_response:
        return jsonify(error_response), status_code
    
    # Validate role
    valid_roles = ["student", "instructor", "ta"]
    if data["role"] not in valid_roles:
        return jsonify({
            "error": f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        }), 400
    
    # Check if user and section exist
    user = User.query.get(data["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    section = Section.query.get(data["section_id"])
    if not section:
        return jsonify({"error": "Section not found"}), 404
    
    # Check if enrollment already exists
    existing = Enrollment.query.filter_by(
        user_id=data["user_id"],
        section_id=data["section_id"]
    ).first()
    
    if existing:
        return jsonify({"error": "User is already enrolled in this section"}), 409
    
    # Create the enrollment
    enrollment = Enrollment(
        user_id=data["user_id"],
        section_id=data["section_id"],
        role=data["role"]
    )
    
    db.session.add(enrollment)
    db.session.commit()
    
    return jsonify({
        "user_id": enrollment.user_id,
        "section_id": enrollment.section_id,
        "role": enrollment.role,
        "message": "Enrollment created successfully"
    }), 201

@master.route("/enrollments/<int:user_id>/<int:section_id>", methods=["DELETE"])
@master_required
@handle_db_error("delete enrollment")
def delete_enrollment(user_id, section_id):
    """Remove a user from a section."""
    enrollment = Enrollment.query.filter_by(
        user_id=user_id,
        section_id=section_id
    ).first_or_404()
    
    db.session.delete(enrollment)
    db.session.commit()
    
    return jsonify({"message": "Enrollment deleted successfully"})

# ============================================================================
# LEGACY ROUTES (for backward compatibility)
# ============================================================================

@master.route("/students", methods=["GET"])
@master_required
def get_students():
    """Legacy route for getting students with filters."""
    institution = request.args.get("institution")
    class_name = request.args.get("class_name")
    section = request.args.get("section")
    include_instructors = request.args.get("include_instructors", "true").lower() == "true"

    try:
        if include_instructors:
            users = filter_users(institution, class_name, section)
        else:
            users = filter_users(institution, class_name, section, role="student")

        return jsonify([u.to_dict() for u in users])

    except Exception as e:
        current_app.logger.error(f"Error fetching users: {e}")
        return jsonify({"error": f"Failed to fetch users: {str(e)}"}), 500

@master.route("/lessons", methods=["GET"])
@master_required
def get_lessons():
    """Legacy route for getting lessons."""
    class_id = request.args.get("class_id")
    if not class_id:
        return jsonify({"error": "Missing class_id parameter"}), 400

    try:
        lessons = PracticeCase.query.filter_by(class_id=class_id, published=True).all()
        return jsonify([lesson.to_dict() for lesson in lessons])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@master.route("/add_student", methods=["POST"])
@master_required
@handle_db_error("add student")
def add_student():
    """Legacy route for adding students."""
    data = request.get_json()
    error_response, status_code = validate_required_fields(
        data, ["email", "first_name", "last_name", "section_id"]
    )
    if error_response:
        return jsonify(error_response), status_code

    email = data["email"]
    section_id = data["section_id"]
    first_name = data["first_name"]
    last_name = data["last_name"]

    section = db.session.get(Section, section_id)
    if not section:
        return jsonify({"error": "Section not found"}), 404

    temp_user = User()
    encrypted_email = temp_user.encrypt_data(email)
    encrypted_first = temp_user.encrypt_data(first_name)
    encrypted_last = temp_user.encrypt_data(last_name)

    user = User.query.filter_by(email_encrypted=encrypted_email).first()

    if user:
        existing_enroll = Enrollment.query.filter_by(
            user_id=user.id, section_id=section_id, role="student"
        ).first()
        if existing_enroll:
            return jsonify({"error": "User is already enrolled in this section"}), 400
        db.session.add(Enrollment(user=user, section=section, role="student"))
        db.session.commit()
        return jsonify({"message": "Student reactivated", "user": user.to_dict()}), 200

    new_user = User(
        email_encrypted=encrypted_email,
        first_name_encrypted=encrypted_first,
        last_name_encrypted=encrypted_last,
        password_hash=generate_password_hash("placeholder_will_need_reset"),
        institution=section.class_.institution.name,
        is_registered=False,
        access_group="A"
    )
    db.session.add(new_user)
    db.session.flush()
    db.session.add(Enrollment(user=new_user, section=section, role="student"))
    db.session.commit()

    return jsonify({"message": "Student added", "user": new_user.to_dict()}), 201