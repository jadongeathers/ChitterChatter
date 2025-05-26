from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from backend.app.models import db

class Conversation(db.Model):
    __tablename__ = "conversations"

    id = db.Column(db.Integer, primary_key=True, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    practice_case_id = db.Column(db.Integer, db.ForeignKey("practice_cases.id"))
    start_time = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))
    end_time = db.Column(db.DateTime(timezone=True), nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # in seconds
    completed = db.Column(db.Boolean, default=False)

    # Session metadata
    language = db.Column(db.String(50))
    feedback = db.Column(db.Text, nullable=True)

    # Relationships
    practice_case = db.relationship("PracticeCase", back_populates="conversations")
    student = db.relationship("User", back_populates="conversations") 
    messages = db.relationship("Message", back_populates="conversation", order_by="Message.timestamp")

    def __repr__(self):
        return f"<Conversation {self.id} - Student {self.student_id}>"

    def add_message(self, role: str, content: str) -> "Message":
        """Adds a message to the conversation."""
        from .message import Message
        message = Message(
            conversation_id=self.id,
            role=role,
            content=content
        )
        self.messages.append(message)
        return message

    def get_messages_history(self):
        """Returns a list of messages in a structured format."""
        return [{"role": msg.role, "content": msg.content} for msg in self.messages]

    def to_dict(self):
        """Returns a dictionary representation of the conversation."""
        return {
            "id": self.id,
            "student_id": self.student_id,  # ✅ Keep student_id reference
            "practice_case_id": self.practice_case_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration": self.duration,
            "completed": self.completed,
            "language": self.language,
            "feedback": self.feedback,
            "messages": self.get_messages_history(), 
        }
    
