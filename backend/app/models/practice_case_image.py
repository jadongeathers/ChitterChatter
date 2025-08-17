# app/models/practice_case_image.py
from app.models import db

class PracticeCaseImage(db.Model):
    """
    Represents an image associated with a practice case.
    """
    __tablename__ = "practice_case_images"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    practice_case_id = db.Column(db.Integer, db.ForeignKey("practice_cases.id"), nullable=False)
    image_url = db.Column(db.String(255), nullable=False) # URL to the stored image
    prompt_text = db.Column(db.Text, nullable=True) # The prompt used to generate it
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

    # Relationship back to the PracticeCase
    practice_case = db.relationship("PracticeCase", back_populates="images")

    def to_dict(self):
        return {
            "id": self.id,
            "practice_case_id": self.practice_case_id,
            "image_url": self.image_url,
            "prompt_text": self.prompt_text,
            "created_at": self.created_at.isoformat()
        }