from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.models import db

class FeedbackMessage(db.Model):
    """
    Represents a message in a dialogic feedback conversation.
    Each message is part of the interactive feedback discussion between student and AI.
    """

    __tablename__ = "feedback_messages"

    id = db.Column(db.Integer, primary_key=True, index=True)
    feedback_conversation_id = db.Column(db.Integer, db.ForeignKey("feedback_conversations.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # "user" or "feedback_assistant"
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Optional metadata for future features
    message_type = db.Column(db.String(50), default="text")  # "text", "suggestion_click", etc.
    is_suggestion = db.Column(db.Boolean, default=False)  # True if this was from a suggestion button
    
    # Relationships
    feedback_conversation = db.relationship("FeedbackConversation", back_populates="feedback_messages")
    user = db.relationship("User", back_populates="feedback_messages")

    def __repr__(self):
        return f"<FeedbackMessage {self.id} - FeedbackConv {self.feedback_conversation_id} - {self.role}>"

    def to_dict(self):
        return {
            "id": self.id,
            "feedback_conversation_id": self.feedback_conversation_id,
            "user_id": self.user_id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "message_type": self.message_type,
            "is_suggestion": self.is_suggestion,
        }