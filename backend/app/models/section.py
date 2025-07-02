from app.models import db

class Section(db.Model):
    """
    Represents a section of a class in the system.
    Each section is associated with a specific class and term.
    """
    __tablename__ = "sections"

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    section_code = db.Column(db.String(10), nullable=False)
    
    term_id = db.Column(db.Integer, db.ForeignKey("terms.id"), nullable=False)
    
    class_ = db.relationship("Class", back_populates="sections")
    term = db.relationship("Term", back_populates="sections")
    enrollments = db.relationship("Enrollment", back_populates="section", cascade="all, delete-orphan")
    
    __table_args__ = (
        db.UniqueConstraint('class_id', 'section_code', 'term_id', name='unique_section_per_term'),
    )

    def __repr__(self):
        return f"<Section {self.section_code} - {self.term.code}>"