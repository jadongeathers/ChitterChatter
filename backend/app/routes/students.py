from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import PracticeCase, Conversation, User, Enrollment, Section, db
from app.utils.user_roles import is_user_student
from sqlalchemy.sql import func

students = Blueprint("students", __name__)

@students.route("/progress", methods=["GET"])
@jwt_required()
def get_student_progress():
    """
    Retrieve the student's practice progress, with optional class filtering.
    
    Query Parameters:
    - class_id (optional): Filter progress for a specific class
    - section_id (optional): Filter progress for a specific section
    """
    try:
        current_user_id = get_jwt_identity()
        student = User.query.get(current_user_id)

        if not student or not student.is_student:
            return jsonify({"error": "Unauthorized"}), 403

        # Get optional filters
        class_id = request.args.get('class_id', type=int)
        section_id = request.args.get('section_id', type=int)

        # Determine which classes to include
        if class_id and section_id:
            # Verify student is enrolled in this specific section
            enrollment = Enrollment.query.filter_by(
                user_id=current_user_id,
                section_id=section_id,
                role="student"
            ).first()
            
            if not enrollment or enrollment.section.class_id != class_id:
                return jsonify({"error": "Unauthorized to access this class"}), 403
                
            student_class_ids = {class_id}
        else:
            # Get all classes the student is enrolled in
            student_class_ids = {e.section.class_id for e in student.enrollments if e.role == "student"}

        if not student_class_ids:
            return jsonify({
                "total_conversations": 0,
                "completed_cases": 0,
                "cases": []
            })

        # Get all conversations completed by the student (with optional class filter)
        conversations_query = db.session.query(Conversation).join(PracticeCase).filter(
            Conversation.user_id == current_user_id,
            Conversation.completed == True,
            PracticeCase.class_id.in_(student_class_ids)
        )
        completed_conversations = conversations_query.count()

        # Get all unique completed practice cases (with class filter)
        unique_completed_cases = db.session.query(Conversation.practice_case_id).join(PracticeCase).filter(
            Conversation.user_id == current_user_id,
            Conversation.completed == True,
            PracticeCase.class_id.in_(student_class_ids)
        ).distinct().count()

        # Get all practice cases for the filtered classes
        all_practice_cases = PracticeCase.query.filter(
            PracticeCase.class_id.in_(student_class_ids)
        ).all()

        progress_data = []

        for case in all_practice_cases:
            # Get all conversations for this case by this student
            case_conversations = Conversation.query.filter_by(
                user_id=current_user_id,
                practice_case_id=case.id
            ).all()
            
            # Calculate metrics
            times_practiced = len(case_conversations)
            
            if times_practiced > 0:
                # Calculate average time spent
                avg_time = sum(c.duration or 0 for c in case_conversations) / times_practiced
                
                # Check if any conversation is completed
                completed = any(c.completed for c in case_conversations)
                
                # Find the most recent completed conversation
                completed_convs = [c for c in case_conversations if c.completed]
                most_recent_completed = max(completed_convs, key=lambda c: c.id) if completed_convs else None
                
                # Add to progress data
                progress_data.append({
                    "id": case.id,
                    "title": case.title,
                    "times_practiced": times_practiced,
                    "avg_time_spent": int(avg_time),  # Convert to seconds
                    "completed": completed,
                    "conversation_id": most_recent_completed.id if most_recent_completed else None,
                    "last_completed": most_recent_completed.end_time.isoformat() if most_recent_completed and most_recent_completed.end_time else None
                })
            else:
                # No conversations for this case
                progress_data.append({
                    "id": case.id,
                    "title": case.title,
                    "times_practiced": 0,
                    "avg_time_spent": 0,
                    "completed": False,
                    "conversation_id": None,
                    "last_completed": None
                })

        return jsonify({
            "total_conversations": completed_conversations,
            "completed_cases": unique_completed_cases,
            "cases": progress_data,
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    

@students.route("/conversations", methods=["GET"])
@jwt_required()
def get_student_conversations():
    """
    Retrieve student's conversations with optional class filtering.
    
    Query Parameters:
    - class_id (optional): Filter conversations for a specific class
    - section_id (optional): Filter conversations for a specific section
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get optional filters
        class_id = request.args.get('class_id', type=int)
        section_id = request.args.get('section_id', type=int)

        # Base query
        conversations_query = Conversation.query.filter_by(user_id=current_user_id)
        
        # Apply class filter if provided
        if class_id:
            conversations_query = conversations_query.join(PracticeCase).filter(
                PracticeCase.class_id == class_id
            )
        
        conversations = conversations_query.all()
        
        conversation_list = []
        for convo in conversations:
            conversation_list.append({
                "id": convo.id,
                "practice_case_id": convo.practice_case_id,
                "practice_case_title": convo.practice_case.title if convo.practice_case else "N/A",
                "start_time": convo.start_time.isoformat(),
                "end_time": convo.end_time.isoformat() if convo.end_time else None,
                "duration": convo.duration,
                "completed": convo.completed,
                "feedback": convo.feedback,
            })
            
        return jsonify(conversation_list)
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


    

@students.route("/conversations/<int:conversation_id>", methods=["GET"])
@jwt_required()
def get_conversation_detail(conversation_id):
    try:
        current_user_id = get_jwt_identity()
        # Fetch the conversation for the current student by ID
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user_id).first()
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

        # Prepare the detailed response
        conversation_detail = {
            "id": conversation.id,
            "practice_case_id": conversation.practice_case_id,
            "practice_case_title": conversation.practice_case.title if conversation.practice_case else "N/A",
            "start_time": conversation.start_time.isoformat(),
            "end_time": conversation.end_time.isoformat() if conversation.end_time else None,
            "duration": conversation.duration,
            "completed": conversation.completed,
            "feedback": conversation.feedback,
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                }
                for msg in conversation.messages
            ],
        }

        return jsonify(conversation_detail)
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@students.route("/classes", methods=["GET"])
@jwt_required()
def get_student_classes():
    """
    Retrieve all classes the current student is enrolled in.
    Returns class information including instructor and term details.
    """
    try:
        current_user_id = get_jwt_identity()
        student = User.query.get(current_user_id)

        if not student or not student.is_student:
            return jsonify({"error": "Unauthorized"}), 403

        # Get all enrollments for this student
        enrollments = Enrollment.query.filter_by(
            user_id=current_user_id, 
            role="student"
        ).all()

        classes_data = []
        for enrollment in enrollments:
            section = enrollment.section
            class_obj = section.class_
            
            # Get instructor for this class
            instructor_enrollment = Enrollment.query.filter_by(
                section_id=section.id,
                role="instructor"
            ).first()
            
            instructor_name = "Unknown"
            if instructor_enrollment and instructor_enrollment.user:
                instructor = instructor_enrollment.user
                instructor_name = f"{instructor.first_name} {instructor.last_name}".strip()

            # Get institution name from the relationship
            institution_name = "Unknown Institution"
            if class_obj.institution:
                # Assuming Institution model has a 'name' field
                institution_name = getattr(class_obj.institution, 'name', 'Unknown Institution')

            class_data = {
                "class_id": class_obj.id,
                "section_id": section.id,
                "course_code": class_obj.course_code,
                "title": class_obj.title,
                "section_code": section.section_code,
                "instructor_name": instructor_name,
                "institution": institution_name,
                "term": None
            }
            
            # Add term information if available
            if section.term:
                class_data["term"] = {
                    "id": section.term.id,
                    "name": section.term.name,
                    "code": section.term.code
                }
            
            classes_data.append(class_data)

        # Sort by term (most recent first), then by course code
        classes_data.sort(key=lambda x: (
            x["term"]["name"] if x["term"] else "ZZZ",  # Put null terms at end
            x["course_code"],
            x["section_code"]
        ), reverse=True)

        return jsonify(classes_data)

    except Exception as e:
        current_app.logger.error(f"Error in get_student_classes: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500