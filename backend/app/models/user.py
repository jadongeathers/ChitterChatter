import os
from cryptography.fernet import Fernet
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import db


# Load encryption key from .env
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise RuntimeError("ENCRYPTION_KEY environment variable is not set")
fernet = Fernet(ENCRYPTION_KEY)


class User(db.Model):
    """
    User model representing a user in the system.
    """
    __tablename__ = "users"

    # Primary user information
    id = db.Column(db.Integer, primary_key=True)
    first_name_encrypted = db.Column(db.LargeBinary, nullable=True)
    last_name_encrypted = db.Column(db.LargeBinary, nullable=True)
    email_encrypted = db.Column(db.LargeBinary, unique=True, nullable=False) 
    password_hash = db.Column(db.String(255), nullable=False)
    institution = db.Column(db.String(255), nullable=True)
    
    # Permissions information 
    is_master = db.Column(db.Boolean, default=False)
    is_registered = db.Column(db.Boolean, default=False)
    access_group = db.Column(db.String(255), nullable=True)

    # Experiment information
    has_consented = db.Column(db.Boolean, default=False)
    consent_date = db.Column(db.DateTime(timezone=True), nullable=True)
    has_completed_survey = db.Column(db.Boolean, default=False)
    
    # Fields for settings page
    profile_picture = db.Column(db.String(100), default="blueberry.png")
    email_notifications = db.Column(db.Boolean, default=True)
    is_active = db.Column(db.Boolean, default=True)
    deactivated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    conversations = db.relationship("Conversation", back_populates="user", lazy=True)
    messages = db.relationship("Message", back_populates="user", lazy=True)
    enrollments = db.relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password):
        """Hashes and stores the password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifies the hashed password."""
        return check_password_hash(self.password_hash, password)
    
    def encrypt_data(self, value):
        """Encrypts a given value using Fernet."""
        if value and fernet:
            return fernet.encrypt(value.encode())
        return None
    
    def decrypt_data(self, encrypted_value):
        """Decrypts an encrypted value using Fernet."""
        if encrypted_value and fernet:
            return fernet.decrypt(encrypted_value).decode()
        return None

    @property
    def email(self):
        """Decrypts and returns the email."""
        return self.decrypt_data(self.email_encrypted)

    @email.setter
    def email(self, value):
        """Encrypts and sets the email."""
        self.email_encrypted = self.encrypt_data(value)

    @property
    def first_name(self):
        """Decrypts and returns the first name."""
        return self.decrypt_data(self.first_name_encrypted)

    @first_name.setter
    def first_name(self, value):
        """Encrypts and sets the first name."""
        self.first_name_encrypted = self.encrypt_data(value)

    @property
    def last_name(self):
        """Decrypts and returns the last name."""
        return self.decrypt_data(self.last_name_encrypted)

    @last_name.setter
    def last_name(self, value):
        """Encrypts and sets the last name."""
        self.last_name_encrypted = self.encrypt_data(value)
    
    @property
    def profile_picture_url(self):
        """Returns the full URL for the profile picture."""
        return f"/images/profile-icons/{self.profile_picture}"
    
    @property
    def is_student(self):
        return any(e.role == "student" for e in self.enrollments)
    
    @property
    def full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip()
    
    def __repr__(self):
        return f"<User {self.id} - {self.email}>"

    def to_dict(self):
        """Returns a dictionary representation of the user with decrypted fields."""
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "is_registered": self.is_registered,
            "institution": self.institution,
            "access_group": self.access_group,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "is_master": self.is_master,
            "is_active": self.is_active,
            "email_notifications": self.email_notifications,
            "profile_picture": self.profile_picture,
            "profile_picture_url": self.profile_picture_url,
            "has_consented": self.has_consented,
            "consent_date": self.consent_date.isoformat() if self.consent_date else None,
            "has_completed_survey": self.has_completed_survey,
            "is_student": self.is_student,
            "full_name": self.full_name,
        }