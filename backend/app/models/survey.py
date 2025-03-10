from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.models import db, User
import logging

logger = logging.getLogger(__name__)

class SurveyRedirect(db.Model):
    """Model to track when users are directed to external surveys."""
    __tablename__ = "survey_redirects"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    email_encrypted = db.Column(db.LargeBinary, nullable=False)  # Store encrypted email
    survey_type = db.Column(db.String(50), nullable=False)  # e.g., "pre", "post"
    redirected_at = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationship with User
    user = db.relationship("User", backref=db.backref("survey_redirects", lazy=True))

    def __init__(self, email, survey_type, user_id=None):
        # Find the user to get their encryption method
        user = User.query.filter_by(id=user_id).first() if user_id else None
        
        if not user and email:
            # Try to find user by email
            for u in User.query.all():
                if u.email == email:
                    user = u
                    break
        
        if user:
            self.user_id = user.id
            self.email_encrypted = user.encrypt_data(email)
        else:
            # If no user found, use a temporary placeholder 
            # This is not ideal but prevents errors
            logger.warning(f"No user found for email during survey redirect.")
            self.email_encrypted = b"placeholder"  # This should be properly encrypted in production
            
        self.survey_type = survey_type

    @property
    def email(self):
        """Decrypts and returns the email if a user is associated."""
        if self.user:
            return self.user.decrypt_data(self.email_encrypted)
        return None

    @email.setter
    def email(self, value):
        """Encrypts and sets the email if a user is associated."""
        if self.user:
            self.email_encrypted = self.user.encrypt_data(value)

    def mark_completed(self):
        """Mark the survey as completed."""
        self.completed = True
        self.completed_at = datetime.now(timezone.utc)