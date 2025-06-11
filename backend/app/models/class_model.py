from app.models import db

class Class(db.Model):
    """
    Represents a class in the system.
    """
    __tablename__ = "classes"

    id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    sections = db.relationship("Section", back_populates="class_", cascade="all, delete-orphan")

    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id"), nullable=False)
    institution = db.relationship("Institution", back_populates="classes")

    __table_args__ = (
        db.UniqueConstraint('institution_id', 'course_code', name='unique_course_code_per_institution'),
    )

    def __repr__(self):
        return f"<Class {self.course_code} - {self.title}>"
