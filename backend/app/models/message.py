from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.models import db

class Message(db.Model):
    """
    Represents a message in a conversation.
    Each message is associated with a conversation and a user.
    """

    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True, index=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False) 
    role = db.Column(db.String(50))  # "user", "assistant", or "system"
    content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    conversation = db.relationship("Conversation", back_populates="messages")
    user = db.relationship("User", back_populates="messages")

    def __repr__(self):
        return f"<Message {self.id} - Conversation {self.conversation_id} - User {self.user_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "user_id": self.user_id, 
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
        }


