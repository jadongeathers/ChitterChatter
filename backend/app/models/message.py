from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from backend.app.models import db

class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True, index=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"))
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False) 
    role = db.Column(db.String(50))  # "user", "assistant", or "system"
    content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    conversation = db.relationship("Conversation", back_populates="messages")
    student = db.relationship("User", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "student_id": self.student_id, 
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
        }


