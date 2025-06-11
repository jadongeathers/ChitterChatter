from datetime import datetime, timezone
from app.models import db

class SystemFeedback(db.Model):
    """
    Model for storing system feedback from users.
    """
    __tablename__ = "system_feedback"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    submitted_at = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))
    status = db.Column(db.String(20), default="pending")  # pending, reviewed, addressed
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    notes = db.Column(db.Text, nullable=True)  # Internal notes for instructors/admin

    # Relationships
    user = db.relationship("User", foreign_keys=[user_id], backref="feedback_submitted")
    reviewer = db.relationship("User", foreign_keys=[reviewed_by], backref="feedback_reviewed")

    def to_dict(self):
        """Convert feedback object to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "content": self.content,
            "submitted_at": self.submitted_at.isoformat(),
            "status": self.status,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "notes": self.notes
        }