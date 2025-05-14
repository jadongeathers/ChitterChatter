from app.models import db
#NEW
class Class(db.Model):
    __tablename__ = "classes"

    id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(255), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id"), nullable=False)
    institution = db.relationship("Institution", back_populates="classes")

    sections = db.relationship("Section", back_populates="class_", cascade="all, delete-orphan")