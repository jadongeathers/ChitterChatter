from sqlalchemy.orm import relationship
from app.models import db

class PracticeCase(db.Model):
    __tablename__ = "practice_cases"

    id = db.Column(db.Integer, primary_key=True, index=True, autoincrement=True)
    institution = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(100), nullable=False, index=True)

    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    min_time = db.Column(db.Integer)
    max_time = db.Column(db.Integer) 
    system_prompt = db.Column(db.Text, nullable=False)
    feedback_prompt = db.Column(db.Text, nullable=True)
    
    # New fields for voice and language code
    voice = db.Column(db.String(50), default="verse")
    language_code = db.Column(db.String(10), default="en")

    published = db.Column(db.Boolean, default=False)
    date_added = db.Column(db.DateTime(timezone=True), default=db.func.now())
    accessible_on = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    conversations = db.relationship("Conversation", back_populates="practice_case")

    def __repr__(self):
        return f"<PracticeCase {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "institution": self.institution,
            "class_name": self.class_name,
            "title": self.title,
            "description": self.description,
            "min_time": self.min_time,
            "max_time": self.max_time,
            "system_prompt": self.system_prompt,
            "published": self.published,
            "accessible_on": self.accessible_on.isoformat() if self.accessible_on else None,
            "feedback_prompt": self.feedback_prompt,
            "voice": self.voice,
            "language_code": self.language_code,
        }