from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet
import os
from app.models import db

# Load encryption key from .env
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
fernet = Fernet(ENCRYPTION_KEY) if ENCRYPTION_KEY else None

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email_encrypted = db.Column(db.LargeBinary, unique=True, nullable=False)  # ✅ Store encrypted email
    first_name_encrypted = db.Column(db.LargeBinary, nullable=True)  # ✅ Store encrypted first name
    last_name_encrypted = db.Column(db.LargeBinary, nullable=True)  # ✅ Store encrypted last name
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile picture field - stores just the filename
    profile_picture = db.Column(db.String(100), default="blueberry.png")
    
    institution = db.Column(db.String(255), nullable=True)
    # class_name = db.Column(db.String(255), nullable=True) #NEW
    section = db.Column(db.String(255), nullable=True)
    access_group = db.Column(db.String(255), nullable=True)
    # is_student = db.Column(db.Boolean, default=True) #NEW
    is_master = db.Column(db.Boolean, default=False)
    is_registered = db.Column(db.Boolean, default=False)

    has_consented = db.Column(db.Boolean, default=False)
    consent_date = db.Column(db.DateTime(timezone=True), nullable=True)
    has_completed_survey = db.Column(db.Boolean, default=False)
    
    # Fields for settings page
    is_active = db.Column(db.Boolean, default=True)
    email_notifications = db.Column(db.Boolean, default=True)
    deactivated_at = db.Column(db.DateTime(timezone=True), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), default=datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    conversations = db.relationship("Conversation", back_populates="student", lazy=True)
    messages = db.relationship("Message", back_populates="student", lazy=True)
    enrollments = db.relationship("Enrollment", back_populates="user", cascade="all, delete-orphan") #NEW

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

    def to_dict(self):
        """Returns a dictionary representation of the user with decrypted fields."""
        return {
            "id": self.id,
            "email": self.email, 
            "first_name": self.first_name,
            "last_name": self.last_name, 
            "is_student": self.is_student,
            "is_registered": self.is_registered,
            "institution": self.institution,
            "class_name": self.class_name,
            "section": self.section,
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
            "has_completed_survey": self.has_completed_survey
        }

#NEW BELOW

class Student(User):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    graduation_year = db.Column(db.String(255), nullable=True)


class Instructor(User):
    __tablename__ = 'instructors'

    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    office_hours = db.Column(db.String(255), nullable=True)
