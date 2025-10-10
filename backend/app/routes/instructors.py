# routes/instructors.py
import humanize

from datetime import datetime, timezone 
from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash

from app.models import db, User, Conversation, PracticeCase, Enrollment, Section, Class
from app.utils.user_roles import is_user_instructor, get_students_for_instructor, get_instructor_section


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


@instructors.route("/classes", methods=["GET"])
@jwt_required()
def get_instructor_classes():
    """Get all classes that the instructor teaches."""
    try:
        current_user_id = get_jwt_identity()
        current_app.logger.info(f"📌 JWT Identity: {current_user_id}")

        instructor = User.query.get(current_user_id)
        if not instructor:
            current_app.logger.warning("⚠️ No user found for given ID.")
        elif not is_user_instructor(instructor):
            current_app.logger.warning("⚠️ User is not an instructor.")

        if not instructor or not is_user_instructor(instructor):
            return jsonify({"error": "Unauthorized"}), 403

        instructor_enrollments = Enrollment.query.filter_by(
            user_id=current_user_id, 
            role="instructor"
        ).all()

        current_app.logger.info(f"🧾 Found {len(instructor_enrollments)} instructor enrollments.")

        classes_data = []
        for enrollment in instructor_enrollments:
            section = enrollment.section
            class_obj = section.class_
            
            student_count = Enrollment.query.filter_by(
                section_id=section.id,
                role="student"
            ).count()
            
            case_count = PracticeCase.query.filter_by(class_id=class_obj.id).count()

            current_app.logger.info(
                f"📚 Class: {class_obj.course_code} Section {section.section_code} | "
                f"Students: {student_count} | Cases: {case_count}"
            )
            
            classes_data.append({
                "class_id": class_obj.id,
                "section_id": section.id,
                "course_code": class_obj.course_code,
                "title": class_obj.title,
                "section_code": section.section_code,
                "student_count": student_count,
                "case_count": case_count,
                "institution": class_obj.institution.name if class_obj.institution else None,
                "term": {
                    "id": section.term.id,
                    "name": section.term.name,
                    "code": section.term.code
                } if section.term else None
            })

        return jsonify(classes_data), 200

    except Exception as e:
        import traceback
        current_app.logger.error(f"❌ Error fetching instructor classes: {str(e)}")
        current_app.logger.debug(traceback.format_exc())
        return jsonify({"error": "Failed to retrieve classes"}), 500



@instructors.route("/students/engagement", methods=["GET"])
@jwt_required()
def get_students_engagement():
    """Get student engagement data, optionally filtered by class."""
    current_user_id = get_jwt_identity()
    instructor = User.query.get(current_user_id)

    if not instructor or not is_user_instructor(instructor):
        return jsonify({"error": "Unauthorized"}), 403

    # Get optional class filter
    class_id = request.args.get("class_id", type=int)
    section_id = request.args.get("section_id", type=int)

    if section_id:
        # Filter by specific section
        students = User.query.join(Enrollment).filter(
            Enrollment.section_id == section_id,
            Enrollment.role == "student"
        ).all()
    elif class_id:
        # Filter by all sections of a specific class
        students = User.query.join(Enrollment).join(Section).filter(
            Section.class_id == class_id,
            Enrollment.role == "student"
        ).all()
    else:
        # All students for all classes this instructor teaches
        students = get_students_for_instructor(instructor)

    student_data = []
    for student in students:
        # If we're filtering by class, only count conversations for that class
        if class_id:
            conversation_count = Conversation.query.join(PracticeCase).filter(
                Conversation.user_id == student.id,
                Conversation.completed == True,
                PracticeCase.class_id == class_id
            ).count()
        else:
            conversation_count = Conversation.query.filter_by(
                user_id=student.id, 
                completed=True
            ).count()

        student_data.append({
            "id": student.id,
            "name": student.full_name,
            "email": student.email,
            "sessionsCompleted": conversation_count,
            "lastActive": format_last_active(student.last_login),
            "lastLoginTimestamp": student.last_login.isoformat() if student.last_login else None
        })

    return jsonify(student_data), 200


@instructors.route("/analytics", methods=["GET"])
@jwt_required()
def get_practice_case_analytics():
    """
    Retrieve analytics data for practice cases, optionally filtered by class.
    """
    try:
        current_user_id = get_jwt_identity()
        instructor = User.query.get(current_user_id)

        if not instructor or not is_user_instructor(instructor):
            return jsonify({"error": "Unauthorized"}), 403

        # Get optional class filter
        class_id = request.args.get("class_id", type=int)
        section_id = request.args.get("section_id", type=int)

        if section_id:
            # Get students from specific section
            students = User.query.join(Enrollment).filter(
                Enrollment.section_id == section_id,
                Enrollment.role == "student"
            ).all()

            # Get the class for this section
            section = Section.query.get(section_id)
            class_ids = {section.class_id} if section else set()
        elif class_id:
            # Get students from all sections of this class
            students = User.query.join(Enrollment).join(Section).filter(
                Section.class_id == class_id,
                Enrollment.role == "student"
            ).all()
            class_ids = {class_id}
        else:
            # All students and classes for this instructor
            students = get_students_for_instructor(instructor)
            class_ids = {e.section.class_id for e in instructor.enrollments if e.role == "instructor"}

        user_ids = {student.id for student in students}
        cases = PracticeCase.query.filter(PracticeCase.class_id.in_(class_ids)).all()

        analytics_data = []
        for case in cases:
            student_conversations = Conversation.query.filter(
                Conversation.practice_case_id == case.id,
                Conversation.completed == True,
                Conversation.user_id.in_(user_ids)
            ).all()

            total_students = len(set(conv.user_id for conv in student_conversations))
            total_time = sum(conv.duration for conv in student_conversations if conv.duration)
            avg_time = total_time / total_students if total_students else 0

            total_class_students = len(students)
            completion_rate = (total_students / total_class_students * 100) if total_class_students else 0

            analytics_data.append({
                "id": case.id,
                "title": case.title,
                "studentsUsed": total_students,
                "avgTimeSpent": avg_time,
                "completionRate": round(completion_rate, 2)
            })

        return jsonify(analytics_data), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching practice case analytics: {str(e)}")
        return jsonify({"error": "Failed to retrieve analytics"}), 500


@instructors.route("/analytics/<int:case_id>/details", methods=["GET"])
@jwt_required()
def get_case_analytics_details(case_id):
    """
    Retrieve detailed analytics for a specific practice case.
    Returns student-level data including completion status, time spent, and message count.
    """
    try:
        current_user_id = get_jwt_identity()
        instructor = User.query.get(current_user_id)

        if not instructor or not is_user_instructor(instructor):
            return jsonify({"error": "Unauthorized"}), 403

        # Get optional class filter
        class_id = request.args.get("class_id", type=int)
        section_id = request.args.get("section_id", type=int)

        # Verify the practice case exists and belongs to instructor's class
        case = PracticeCase.query.get(case_id)
        if not case:
            return jsonify({"error": "Practice case not found"}), 404

        # Get students based on filter
        if section_id:
            students = User.query.join(Enrollment).filter(
                Enrollment.section_id == section_id,
                Enrollment.role == "student"
            ).all()
        elif class_id:
            students = User.query.join(Enrollment).join(Section).filter(
                Section.class_id == class_id,
                Enrollment.role == "student"
            ).all()
        else:
            students = get_students_for_instructor(instructor)

        # Build detailed student data
        student_details = []
        for student in students:
            conversations = Conversation.query.filter(
                Conversation.practice_case_id == case_id,
                Conversation.user_id == student.id
            ).order_by(Conversation.start_time.desc()).all()

            attempt_history = []
            total_time = 0
            total_messages = 0
            completed_attempts = 0
            last_attempt_dt = None

            for conv in conversations:
                message_count = len(conv.messages)
                total_messages += message_count
                total_time += conv.duration or 0

                if conv.completed:
                    completed_attempts += 1

                attempt_timestamp = conv.end_time or conv.start_time
                if attempt_timestamp and (not last_attempt_dt or attempt_timestamp > last_attempt_dt):
                    last_attempt_dt = attempt_timestamp

                attempt_history.append({
                    "id": conv.id,
                    "startTime": conv.start_time.isoformat() if conv.start_time else None,
                    "endTime": conv.end_time.isoformat() if conv.end_time else None,
                    "duration": conv.duration or 0,
                    "completed": bool(conv.completed),
                    "messageCount": message_count
                })

            student_details.append({
                "id": student.id,
                "name": student.full_name,
                "email": student.email,
                "completed": completed_attempts > 0,
                "timeSpent": total_time,
                "messageCount": total_messages,
                "attempts": len(conversations),
                "completedAttempts": completed_attempts,
                "lastAttempt": last_attempt_dt.isoformat() if last_attempt_dt else None,
                "attemptHistory": attempt_history
            })

        return jsonify({
            "caseId": case_id,
            "caseTitle": case.title,
            "students": student_details
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching case analytics details: {str(e)}")
        return jsonify({"error": "Failed to retrieve case details"}), 500


@instructors.route("/practice-cases", methods=["GET"])
@jwt_required()
def get_practice_cases():
    """Get practice cases for the instructor's classes, optionally filtered by class."""
    try:
        current_user_id = get_jwt_identity()
        instructor = User.query.get(current_user_id)

        if not instructor or not is_user_instructor(instructor):
            return jsonify({"error": "Unauthorized"}), 403

        # Get optional class filter
        class_id = request.args.get("class_id", type=int)
        
        if class_id:
            # Verify instructor teaches this class
            instructor_enrollment = Enrollment.query.join(Section).filter(
                Enrollment.user_id == current_user_id,
                Enrollment.role == "instructor",
                Section.class_id == class_id
            ).first()
            
            if not instructor_enrollment:
                return jsonify({"error": "Unauthorized to view this class"}), 403
                
            cases = PracticeCase.query.filter_by(class_id=class_id).all()
        else:
            # All classes the instructor teaches
            class_ids = {e.section.class_id for e in instructor.enrollments if e.role == "instructor"}
            cases = PracticeCase.query.filter(PracticeCase.class_id.in_(class_ids)).all()

        cases_data = []
        for case in cases:
            cases_data.append({
                "id": case.id,
                "title": case.title,
                "description": case.description,
                "class_id": case.class_id,
                "published": case.published,
                "created_at": case.created_at.isoformat() if case.created_at else None
            })

        return jsonify(cases_data), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching practice cases: {str(e)}")
        return jsonify({"error": "Failed to retrieve practice cases"}), 500


# Keep existing routes but add class filtering support
@instructors.route("/students/add", methods=["POST"])
@jwt_required()
def add_student():
    """Allows instructors to add a student to their section."""
    try:
        current_user_id = get_jwt_identity()
        instructor = db.session.get(User, current_user_id)

        if not instructor or not is_user_instructor(instructor):
            return jsonify({"error": "Unauthorized"}), 403

        # Get section_id from request, or use instructor's primary section
        data = request.get_json()
        section_id = data.get("section_id")
        
        if section_id:
            # Verify instructor teaches this section
            section = Section.query.get(section_id)
            instructor_enrollment = Enrollment.query.filter_by(
                user_id=current_user_id,
                section_id=section_id,
                role="instructor"
            ).first()
            
            if not instructor_enrollment:
                return jsonify({"error": "Unauthorized to add students to this section"}), 403
        else:
            # Use instructor's primary section (backward compatibility)
            section = get_instructor_section(instructor)
            
        if not section:
            return jsonify({"error": "Section not found"}), 404

        email = data.get("email")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")

        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Rest of the existing add_student logic...
        temp_user = User()
        encrypted_email = temp_user.encrypt_data(email)
        if not encrypted_email:
            return jsonify({"error": "Email encryption failed"}), 500

        existing_user = User.query.filter_by(email_encrypted=encrypted_email).first()

        if not existing_user:
            new_student = User(
                email_encrypted=encrypted_email,
                first_name_encrypted=temp_user.encrypt_data(first_name),
                last_name_encrypted=temp_user.encrypt_data(last_name),
                password_hash=generate_password_hash("placeholder_will_need_reset"),
                is_registered=False,
                institution=section.class_.institution.name
            )
            db.session.add(new_student)
            db.session.flush()

            db.session.add(Enrollment(user=new_student, section=section, role="student"))
            db.session.commit()

            return jsonify({
                "message": "Student added successfully",
                "student": {
                    "id": new_student.id,
                    "name": new_student.full_name or "Unregistered",
                    "email": email,
                    "sessionsCompleted": 0,
                    "lastActive": "Never"
                },
                "reactivated": False
            }), 201

        existing_enrollment = Enrollment.query.filter_by(
            user_id=existing_user.id,
            section_id=section.id,
            role="student"
        ).first()

        if existing_enrollment:
            return jsonify({"error": f"Student {email} is already in your class"}), 400

        if first_name and not existing_user.first_name:
            existing_user.first_name_encrypted = temp_user.encrypt_data(first_name)
        if last_name and not existing_user.last_name:
            existing_user.last_name_encrypted = temp_user.encrypt_data(last_name)

        db.session.add(Enrollment(user=existing_user, section=section, role="student"))
        db.session.commit()

        return jsonify({
            "message": "Student reactivated successfully",
            "student": {
                "id": existing_user.id,
                "name": existing_user.full_name or "Unregistered",
                "email": email,
                "sessionsCompleted": Conversation.query.filter_by(user_id=existing_user.id, completed=True).count(),
                "lastActive": format_last_active(existing_user.last_login)
            },
            "reactivated": True
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error adding student: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to add student: {str(e)}"}), 500


@instructors.route("/students/remove/<int:user_id>", methods=["DELETE"])
@jwt_required()
def remove_student(user_id):
    """Remove a student from the instructor's section without deleting the user."""
    try:
        current_user_id = get_jwt_identity()
        instructor = db.session.get(User, current_user_id)

        if not instructor or not is_user_instructor(instructor):
            return jsonify({"error": "Unauthorized"}), 403

        # Get section_id from query params if provided
        section_id = request.args.get("section_id", type=int)
        
        if section_id:
            # Verify instructor teaches this section
            instructor_enrollment = Enrollment.query.filter_by(
                user_id=current_user_id,
                section_id=section_id,
                role="instructor"
            ).first()
            
            if not instructor_enrollment:
                return jsonify({"error": "Unauthorized"}), 403
                
            section = Section.query.get(section_id)
        else:
            section = get_instructor_section(instructor)
            
        if not section:
            return jsonify({"error": "Section not found"}), 404

        enrollment = Enrollment.query.filter_by(
            user_id=user_id, 
            section_id=section.id, 
            role="student"
        ).first()
        
        if not enrollment:
            return jsonify({"error": "Student not found in your section"}), 404

        student = db.session.get(User, user_id)
        name = student.full_name

        db.session.delete(enrollment)
        db.session.commit()

        return jsonify({
            "message": f"Student {name} removed from section",
            "user_id": user_id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error removing student: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to remove student: {str(e)}"}), 500
