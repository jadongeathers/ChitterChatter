from sqlalchemy.orm import relationship
from backend.app.models import db

class PracticeCase(db.Model):
    __tablename__ = "practice_cases"

    id = db.Column(db.Integer, primary_key=True, index=True, autoincrement=True)

    # Language and proficiency 
    language = db.Column(db.String(20), default="English")
    language_code = db.Column(db.String(10), default="en")
    proficiency_level = db.Column(db.String(50), nullable=True)

    # Learning goals 
    learning_objectives = db.Column(db.Text, nullable=True)

    # Key phrases 
    key_items = db.Column(db.Text, nullable=True)

    # Scenario 
    situation = db.Column(db.Text, nullable=True)

    # Virtual partner behavior 
    system_prompt = db.Column(db.Text, nullable=False)

    # Voice 
    voice = db.Column(db.String(50), default="verse")

    # Title 
    title = db.Column(db.String(255))

    # Description 
    description = db.Column(db.Text)
    
    # Time range 
    min_time = db.Column(db.Integer)
    max_time = db.Column(db.Integer)

    # Access control 
    accessible_on = db.Column(db.DateTime(timezone=True), nullable=True)

    # Support Fields
    institution = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(100), nullable=False, index=True)

    # AI Prompts & Suggestions
    system_prompt_goals = db.Column(db.Text, nullable=True)
    system_prompt_review = db.Column(db.Text, nullable=True)
    chatbot_suggestions = db.Column(db.Text, nullable=True)
    feedback_prompt = db.Column(db.Text, nullable=True)

    # Publishing + Metadata
    published = db.Column(db.Boolean, default=False)
    date_added = db.Column(db.DateTime(timezone=True), default=db.func.now())

    # Relationships
    conversations = db.relationship("Conversation", back_populates="practice_case")

    def __repr__(self):
        return f"<PracticeCase {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "language": self.language,
            "language_code": self.language_code,
            "proficiency_level": self.proficiency_level,
            "learning_objectives": self.learning_objectives,
            "key_items": self.key_items,
            "situation": self.situation,
            "system_prompt": self.system_prompt,
            "voice": self.voice,
            "title": self.title,
            "description": self.description,
            "min_time": self.min_time,
            "max_time": self.max_time,
            "accessible_on": self.accessible_on.isoformat() if self.accessible_on else None,
            "institution": self.institution,
            "class_name": self.class_name,
            "system_prompt_goals": self.system_prompt_goals,
            "system_prompt_review": self.system_prompt_review,
            "chatbot_suggestions": self.chatbot_suggestions,
            "feedback_prompt": self.feedback_prompt,
            "published": self.published,
            "date_added": self.date_added.isoformat() if self.date_added else None
        }





    