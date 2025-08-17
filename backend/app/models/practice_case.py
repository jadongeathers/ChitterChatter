from sqlalchemy.orm import relationship
from app.models import db
import json
from datetime import datetime

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
    cultural_context = db.Column(db.Text, nullable=True)
    curricular_goals = db.Column(db.Text, nullable=True)
    key_items = db.Column(db.Text, nullable=True)
    behavioral_guidelines = db.Column(db.Text, nullable=True)
    proficiency_level = db.Column(db.Text, nullable=True)
    instructor_notes = db.Column(db.Text, nullable=True)
    notes_for_students = db.Column(db.Text, nullable=True)
    speaking_speed = db.Column(db.String(10), nullable=True)

    system_prompt = db.Column(db.Text, nullable=True)
    feedback_prompt = db.Column(db.Text, nullable=True)
    feedback_config = db.Column(db.JSON, nullable=True)

    voice = db.Column(db.String(50), default="verse")
    language_code = db.Column(db.String(10), default="en")

    is_draft = db.Column(db.Boolean, default=True)
    published = db.Column(db.Boolean, default=False)
    accessible_on = db.Column(db.DateTime(timezone=True), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), default=db.func.now(), onupdate=db.func.now())
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True) 

    # Global library fields
    submitted_to_library = db.Column(db.Boolean, default=False)
    library_approved = db.Column(db.Boolean, default=False)  
    library_submitted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    library_approved_at = db.Column(db.DateTime(timezone=True), nullable=True)
    library_approved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    # Metadata for library display
    author_name = db.Column(db.String(255), nullable=True)  # Display name for library
    author_institution = db.Column(db.String(255), nullable=True)  # Optional institution
    library_tags = db.Column(db.Text, nullable=True)  # JSON array of tags like ["beginner", "restaurant", "formal"]
    library_downloads = db.Column(db.Integer, default=0)
    library_rating = db.Column(db.Float, nullable=True)  # Average rating
    library_rating_count = db.Column(db.Integer, default=0)

    # Relationships
    conversations = db.relationship("Conversation", back_populates="practice_case")
    images = db.relationship("PracticeCaseImage", back_populates="practice_case", cascade="all, delete-orphan")

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
        
        # Dynamic section numbering
        section_num = 1
        
        # 1. Situation Instructions
        prompt_parts.append(f"{section_num}. **Situation Instructions**:")
        prompt_parts.append(self.situation_instructions.strip())
        prompt_parts.append("")
        section_num += 1
        
        # 2. Cultural Context (if provided)
        if self.cultural_context and self.cultural_context.strip():
            prompt_parts.append(f"{section_num}. **Cultural Context**:")
            prompt_parts.append("Be aware of and respect the following cultural context. Your behavior, responses, and mannerisms should authentically reflect this cultural background:")
            prompt_parts.append(self.cultural_context.strip())
            prompt_parts.append("")
            section_num += 1
        
        # 3. Curricular Goals
        prompt_parts.append(f"{section_num}. **Curricular Goals**:")
        prompt_parts.append("Your responses should align with the following curricular goals:")
        prompt_parts.append(self.curricular_goals.strip())
        prompt_parts.append("")
        section_num += 1
        
        # 4. Key Items (optional)
        if self.key_items and self.key_items.strip():
            prompt_parts.append(f"{section_num}. **Key Items to Use**:")
            prompt_parts.append("Incorporate the following key items into your responses:")
            prompt_parts.append(self.key_items.strip())
            prompt_parts.append("")
            section_num += 1
        
        # 5. Behavioral Guidelines
        prompt_parts.append(f"{section_num}. **Behavioral Guidelines**:")
        prompt_parts.append("Respond in a manner consistent with the following behavioral guidelines:")
        prompt_parts.append(self.behavioral_guidelines.strip())
        prompt_parts.append("")
        
        # Proficiency level adjustment
        prompt_parts.append(f"Using the guidance above, adjust your speech, vocabulary, and pacing according to the student's proficiency level:")
        prompt_parts.append(self.proficiency_level.strip())
        prompt_parts.append("")
        section_num += 1
        
        # 6. Instructor Notes (optional)
        if self.instructor_notes and self.instructor_notes.strip():
            prompt_parts.append(f"{section_num}. **Instructor Notes**:")
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
    
    def submit_to_library(self, author_name, author_institution=None, tags=None):
        """Submit this case to the global library (automatically approved)"""
        if not self.can_be_published()[0]:
            raise ValueError("Case must be ready for publication before submitting to library")
        
        self.submitted_to_library = True
        self.library_approved = True  # Auto-approve
        self.library_submitted_at = db.func.now()
        self.library_approved_at = db.func.now()  # Set approval time immediately
        self.author_name = author_name
        self.author_institution = author_institution
        if tags:
            self.library_tags = json.dumps(tags)
        
        return True

    def approve_for_library(self, approved_by_user_id):
        """Admin function to approve case for library"""
        if not self.submitted_to_library:
            raise ValueError("Case must be submitted before it can be approved")
        
        self.library_approved = True
        self.library_approved_at = db.func.now()
        self.library_approved_by = approved_by_user_id
        
        return True

    def create_copy_from_library(self, new_class_id, new_user_id):
        """Create a copy of this library case for a user's class"""
        if not self.library_approved:
            raise ValueError("Only approved library cases can be copied")
        
        # Create new instance with copied data
        new_case = PracticeCase(
            class_id=new_class_id,
            title=f"Copy of {self.title}",
            description=self.description,
            min_time=self.min_time,
            max_time=self.max_time,
            target_language=self.target_language,
            situation_instructions=self.situation_instructions,
            cultural_context=self.cultural_context,
            curricular_goals=self.curricular_goals,
            key_items=self.key_items,
            behavioral_guidelines=self.behavioral_guidelines,
            proficiency_level=self.proficiency_level,
            instructor_notes=self.instructor_notes,
            notes_for_students=self.notes_for_students,
            voice=self.voice,
            language_code=self.language_code,
            created_by=new_user_id,
            is_draft=True,  # Always start as draft so instructor can customize
            published=False,
            submitted_to_library=False,  # Reset library fields
            library_approved=False
        )
        
        # Increment download counter
        self.library_downloads += 1
        
        return new_case

    def to_library_dict(self):
        """Convert to dict for library display"""
        if not self.library_approved:
            return None
            
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "target_language": self.target_language,
            "situation_instructions": self.situation_instructions,
            "cultural_context": self.cultural_context,
            "curricular_goals": self.curricular_goals,
            "proficiency_level": self.proficiency_level,
            "min_time": self.min_time,
            "max_time": self.max_time,
            "author_name": self.author_name,
            "author_institution": self.author_institution,
            "library_tags": json.loads(self.library_tags) if self.library_tags else [],
            "library_downloads": self.library_downloads,
            "library_rating": self.library_rating,
            "library_rating_count": self.library_rating_count,
            "library_submitted_at": self.library_submitted_at.isoformat() if self.library_submitted_at else None,
            "library_approved_at": self.library_approved_at.isoformat() if self.library_approved_at else None
        }

    def to_dict(self):
        # sort images newest-first (handle nulls defensively)
        images_sorted = sorted(
            self.images or [],
            key=lambda i: i.created_at or datetime.min,
            reverse=True
        )

        return {
            "id": self.id,
            "class_id": self.class_id,
            "title": self.title,
            "description": self.description,
            "min_time": self.min_time,
            "max_time": self.max_time,
            "accessible_on": self.accessible_on.isoformat() if self.accessible_on else None,
            "published": self.published,
            "is_draft": self.is_draft,
            "voice": self.voice,
            "language_code": self.language_code,

            # 👇 convenient flat field for the latest image
            "image_url": images_sorted[0].image_url if images_sorted else None,

            # keep full list too (now sorted)
            "images": [img.to_dict() for img in images_sorted],

            # New individual fields
            "target_language": self.target_language,
            "situation_instructions": self.situation_instructions,
            "cultural_context": self.cultural_context,
            "curricular_goals": self.curricular_goals,
            "key_items": self.key_items,
            "behavioral_guidelines": self.behavioral_guidelines,
            "proficiency_level": self.proficiency_level,
            "instructor_notes": self.instructor_notes,
            "notes_for_students": self.notes_for_students,
            "feedback_prompt": self.feedback_prompt,
            "feedback_config": self.feedback_config,
            "speaking_speed": self.speaking_speed,

            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "created_by": self.created_by,

            "submitted_to_library": self.submitted_to_library,
            "library_approved": self.library_approved,
            "library_submitted_at": self.library_submitted_at.isoformat() if self.library_submitted_at else None,
            "library_approved_at": self.library_approved_at.isoformat() if self.library_approved_at else None,
            "author_name": self.author_name,
            "author_institution": self.author_institution,
            "library_tags": json.loads(self.library_tags) if self.library_tags else [],
            "library_downloads": self.library_downloads,
            "library_rating": self.library_rating,
            "library_rating_count": self.library_rating_count
        }