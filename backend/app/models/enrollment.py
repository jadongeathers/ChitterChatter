from app.models import db

class Enrollment(db.Model):
    """
    Represents the enrollment of a user in a section of a class.
    """
    __tablename__ = "enrollments"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    section_id = db.Column(db.Integer, db.ForeignKey("sections.id"), primary_key=True)
    role = db.Column(db.Enum("student", "instructor", "TA", name="role_enum"), nullable=False)

    # Relationships
    user = db.relationship("User", back_populates="enrollments")
    section = db.relationship("Section", back_populates="enrollments")

    __table_args__ = (
        db.UniqueConstraint('user_id', 'section_id', name='unique_user_section_enrollment'),
    )

    def __repr__(self):
        return f"<Enrollment user_id={self.user_id}, section_id={self.section_id}, role={self.role}>"

