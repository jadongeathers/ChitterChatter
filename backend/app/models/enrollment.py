from app.models import db

class Enrollment(db.Model):
    __tablename__ = "enrollments"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    section_id = db.Column(db.Integer, db.ForeignKey("sections.id"), primary_key=True)
    role = db.Column(db.Enum("student", "instructor", "TA", name="role_enum"), nullable=False)

    #relationships optional but allow for easy access
    user = db.relationship("User", back_populates="enrollments")
    section = db.relationship("Section", back_populates="enrollments")
