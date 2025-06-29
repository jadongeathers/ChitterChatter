from sqlalchemy.orm import relationship
from app.models import db

class PracticeCase(db.Model):
    """
    Represents a practice case in the system.
    Each practice case is associated with a class and contains various attributes
    such as title, description, time limits, and prompts.
    """
    __tablename__ = "practice_cases"

    id = db.Column(db.Integer, primary_key=True, index=True, autoincrement=True)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)

    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    min_time = db.Column(db.Integer)
    max_time = db.Column(db.Integer) 

    # Break down the form components for individual saving
    target_language = db.Column(db.String(50), nullable=True)
    situation_instructions = db.Column(db.Text, nullable=True)
    curricular_goals = db.Column(db.Text, nullable=True)
    key_items = db.Column(db.Text, nullable=True)
    behavioral_guidelines = db.Column(db.Text, nullable=True)
    proficiency_level = db.Column(db.Text, nullable=True)
    instructor_notes = db.Column(db.Text, nullable=True)

    system_prompt = db.Column(db.Text, nullable=True)
    feedback_prompt = db.Column(db.Text, nullable=True)

    voice = db.Column(db.String(50), default="verse")
    language_code = db.Column(db.String(10), default="en")

    is_draft = db.Column(db.Boolean, default=True)
    published = db.Column(db.Boolean, default=False)
    accessible_on = db.Column(db.DateTime(timezone=True), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), default=db.func.now(), onupdate=db.func.now())
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True) 

    # Relationships
    conversations = db.relationship("Conversation", back_populates="practice_case")

    def generate_system_prompt(self):
        """Generate system prompt from individual components"""
        # Check if we have the minimum required fields
        if not all([self.target_language, self.situation_instructions, 
                    self.curricular_goals, self.behavioral_guidelines, 
                    self.proficiency_level]):
            return None
        
        # Build the system prompt
        prompt_parts = []
        
        # Opening instructions
        prompt_parts.append(f"Your goal is to make an environment for students to practice their {self.target_language} skills. You are a real human with the exact background, personality, and characteristics described below.")
        prompt_parts.append("")
        prompt_parts.append("You must NEVER break character. Respond exactly as the real person you're portraying would in this situation.")
        prompt_parts.append("")
        prompt_parts.append("Allow the student to lead the conversation. Your role is to respond naturally, not to guide or direct the interaction.")
        prompt_parts.append("")
        prompt_parts.append("Your responses should be concise and conversational. Avoid long, detailed explanations unless specifically asked.")
        prompt_parts.append("")
        prompt_parts.append("Your first response should never ask the student how you can help or what they need assistance with. You are a real person in a specific situation. You should always respond as your character would in a real-life version of this scenario.")
        prompt_parts.append("")
        prompt_parts.append("If the student has a beginner proficiency level, use simpler vocabulary and speak more slowly, but remain in character (e.g., speak patiently and clearly if that fits your character).")
        prompt_parts.append("If the student has an intermediate proficiency level, use moderate complexity in your speech while remaining in character.")
        prompt_parts.append("If the student has an advanced proficiency level, speak naturally as your character would.")
        prompt_parts.append("")
        prompt_parts.append("When the conversation begins, immediately assume your character role.")
        prompt_parts.append("")
        
        # 1. Situation Instructions
        prompt_parts.append("1. **Situation Instructions**:")
        prompt_parts.append(self.situation_instructions.strip())
        prompt_parts.append("")
        
        # 2. Curricular Goals
        prompt_parts.append("2. **Curricular Goals**:")
        prompt_parts.append("Your responses should align with the following curricular goals:")
        prompt_parts.append(self.curricular_goals.strip())
        prompt_parts.append("")
        
        # 3. Key Items (optional)
        if self.key_items and self.key_items.strip():
            prompt_parts.append("3. **Key Items to Use**:")
            prompt_parts.append("Incorporate the following key items into your responses:")
            prompt_parts.append(self.key_items.strip())
            prompt_parts.append("")
            behavioral_section = "4"
            proficiency_section = "4"
            notes_section = "5"
        else:
            behavioral_section = "3"
            proficiency_section = "3"
            notes_section = "4"
        
        # 4. Behavioral Guidelines
        prompt_parts.append(f"{behavioral_section}. **Behavioral Guidelines**:")
        prompt_parts.append("Respond in a manner consistent with the following behavioral guidelines:")
        prompt_parts.append(self.behavioral_guidelines.strip())
        prompt_parts.append("")
        
        # Proficiency level adjustment
        prompt_parts.append(f"Using the guidance above, adjust your speech, vocabulary, and pacing according to the student's proficiency level:")
        prompt_parts.append(self.proficiency_level.strip())
        prompt_parts.append("")
        
        # 5. Instructor Notes (optional)
        if self.instructor_notes and self.instructor_notes.strip():
            prompt_parts.append(f"{notes_section}. **Instructor Notes**:")
            prompt_parts.append(self.instructor_notes.strip())
        
        return "\n".join(prompt_parts).strip()

    def update_system_prompt(self):
        """Update the system_prompt field with generated content"""
        self.system_prompt = self.generate_system_prompt()

    def is_ready_to_publish(self):
        """Check if all required fields are filled for publishing"""
        required_fields = [
            self.title, 
            self.description, 
            self.target_language,
            self.situation_instructions, 
            self.curricular_goals,
            self.behavioral_guidelines, 
            self.proficiency_level,
            self.min_time, 
            self.max_time, 
            self.accessible_on
        ]
        
        # Check that all required fields have content
        for field in required_fields:
            if field is None or (isinstance(field, str) and not field.strip()):
                return False
        
        # Check that time values are valid
        if self.min_time < 60:  # Less than 1 minute
            return False
        if self.max_time <= self.min_time:
            return False
        
        return True

    def get_validation_errors(self):
        """Get list of validation errors preventing publication"""
        errors = []
        
        if not self.title or not self.title.strip():
            errors.append("Title is required")
        if not self.description or not self.description.strip():
            errors.append("Description is required")
        if not self.target_language or not self.target_language.strip():
            errors.append("Target language is required")
        if not self.situation_instructions or not self.situation_instructions.strip():
            errors.append("Situation instructions are required")
        if not self.curricular_goals or not self.curricular_goals.strip():
            errors.append("Curricular goals are required")
        if not self.behavioral_guidelines or not self.behavioral_guidelines.strip():
            errors.append("Behavioral guidelines are required")
        if not self.proficiency_level or not self.proficiency_level.strip():
            errors.append("Proficiency level is required")
        if not self.min_time or self.min_time < 60:
            errors.append("Minimum time must be at least 1 minute")
        if not self.max_time or self.max_time <= (self.min_time or 0):
            errors.append("Maximum time must be greater than minimum time")
        if not self.accessible_on:
            errors.append("Access date and time are required")
        
        return errors

    def can_be_published(self):
        """Returns tuple of (can_publish, validation_errors)"""
        errors = self.get_validation_errors()
        return len(errors) == 0, errors
    
    def publish(self):
        """Publish the practice case (validates and generates system prompt)"""
        can_publish, errors = self.can_be_published()
        if not can_publish:
            raise ValueError(f"Cannot publish: {', '.join(errors)}")
        
        # Generate the system prompt
        self.update_system_prompt()
        
        # Mark as published and not draft
        self.published = True
        self.is_draft = False
        
        return True

    def __repr__(self):
        return f"<PracticeCase {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "class_id": self.class_id,
            "title": self.title,
            "description": self.description,
            "min_time": self.min_time,
            "max_time": self.max_time,
            "accessible_on": self.accessible_on.isoformat() if self.accessible_on else None,
            "published": self.published,
            "is_draft": self.is_draft,  # ← Make sure this line is added
            "voice": self.voice,
            "language_code": self.language_code,
            
            # New individual fields
            "target_language": self.target_language,
            "situation_instructions": self.situation_instructions,
            "curricular_goals": self.curricular_goals,
            "key_items": self.key_items,
            "behavioral_guidelines": self.behavioral_guidelines,
            "proficiency_level": self.proficiency_level,
            "instructor_notes": self.instructor_notes,
            "feedback_prompt": self.feedback_prompt,
            
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "created_by": self.created_by
        }