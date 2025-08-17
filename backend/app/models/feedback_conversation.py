from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.models import db

class FeedbackConversation(db.Model):
    """
    Stores metadata for dialogic feedback sessions.
    Each feedback conversation is linked to a completed practice conversation.
    """

    __tablename__ = "feedback_conversations"

    id = db.Column(db.Integer, primary_key=True, index=True)
    original_conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    start_time = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))
    end_time = db.Column(db.DateTime(timezone=True), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Feedback metadata
    summary_feedback = db.Column(db.Text, nullable=True)  # Brief summary shown before chat
    detailed_feedback = db.Column(db.Text, nullable=True)  # Full feedback for AI context
    model = db.Column(db.String(50), nullable=True)           # e.g., "gpt-4o"
    feedback_version = db.Column(db.String(50), nullable=True) 
    
    # Relationships
    original_conversation = db.relationship("Conversation", backref="feedback_conversation")
    user = db.relationship("User", back_populates="feedback_conversations")
    feedback_messages = db.relationship("FeedbackMessage", back_populates="feedback_conversation", order_by="FeedbackMessage.timestamp")

    def __repr__(self):
        return f"<FeedbackConversation {self.id} - User {self.user_id} - Original {self.original_conversation_id}>"

    def add_message(self, role: str, content: str) -> "FeedbackMessage":
        """Adds a message to the feedback conversation."""
        from .feedback_message import FeedbackMessage
        message = FeedbackMessage(
            feedback_conversation_id=self.id,
            user_id=self.user_id,
            role=role,
            content=content,
            timestamp=datetime.now(timezone.utc)  # Explicitly set timestamp
        )
        self.feedback_messages.append(message)
        return message

    def get_messages_history(self):
        """Returns a list of feedback messages in a structured format."""
        messages = []
        for msg in self.feedback_messages:
            message_data = {
                "role": msg.role, 
                "content": msg.content
            }
            # Only add timestamp if it exists
            if msg.timestamp:
                message_data["timestamp"] = msg.timestamp.isoformat()
            else:
                message_data["timestamp"] = datetime.now(timezone.utc).isoformat()
            
            messages.append(message_data)
        return messages

    def end_session(self):
        """Mark the feedback session as ended."""
        self.end_time = datetime.now(timezone.utc)
        self.is_active = False

    def calculate_duration(self):
        """Calculate session duration in seconds."""
        if self.end_time:
            return int((self.end_time - self.start_time).total_seconds())
        return None

    def to_dict(self):
        """Returns a dictionary representation of the feedback conversation."""
        return {
            "id": self.id,
            "original_conversation_id": self.original_conversation_id,
            "user_id": self.user_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "is_active": self.is_active,
            "summary_feedback": self.summary_feedback,
            "duration": self.calculate_duration(),
            "messages": self.get_messages_history(),
            "model": self.model,
            "feedback_version": self.feedback_version,
        }