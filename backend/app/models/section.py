from app.models import db
#NEW
class Section(db.Model):
    __tablename__ = "sections"

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"))
    term = db.Column(db.String(10), nullable=False) 
    section_code = db.Column(db.String(10), nullable=False)
    meeting_times = db.Column(db.Text, nullable=True)

    class_ = db.relationship("Class", back_populates="sections") #not strictly necessary, but will make it easier to access the class from a section
    enrollments = db.relationship("Enrollment", back_populates="section", cascade="all, delete-orphan")
    
    # Unique constraint across (class_id, section_code, term)
    __table_args__ = (
        db.UniqueConstraint('class_id', 'section_code', 'term', name='unique_section_per_term'),
    )