from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import PracticeCase, Conversation, User, db
from sqlalchemy.sql import func

students = Blueprint("students", __name__)

@students.route("/progress", methods=["GET"])
@jwt_required()
def get_student_progress():
    """
    Retrieve the student's practice progress, including:
    - Total completed conversations
    - Number of unique practice cases completed
    - Breakdown of each practice case: times practiced, avg time, completion status
    """
    try:
        current_user_id = get_jwt_identity()
        student = User.query.get(current_user_id)

        if not student or not student.is_student:
            return jsonify({"error": "Unauthorized"}), 403

        # Get all conversations completed by the student
        completed_conversations = Conversation.query.filter_by(
            student_id=current_user_id, completed=True
        ).count()

        # Get all unique completed practice cases
        unique_completed_cases = (
            db.session.query(Conversation.practice_case_id)
            .filter(Conversation.student_id == current_user_id, Conversation.completed == True)
            .distinct()
            .count()
        )

        # Get all practice cases
        all_practice_cases = PracticeCase.query.all()
        progress_data = []

        for case in all_practice_cases:
            # Get all conversations for this case by this student
            case_conversations = Conversation.query.filter_by(
                student_id=current_user_id,
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

        return jsonify(
            {
                "total_conversations": completed_conversations,
                "completed_cases": unique_completed_cases,
                "cases": progress_data,
            }
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@students.route("/conversations", methods=["GET"])
@jwt_required()
def get_student_conversations():
    try:
        current_user_id = get_jwt_identity()
        conversations = Conversation.query.filter_by(student_id=current_user_id).all()
        
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
        conversation = Conversation.query.filter_by(id=conversation_id, student_id=current_user_id).first()
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



