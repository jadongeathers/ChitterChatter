from app.models import db

class Term(db.Model):
    """
    Represents an academic term (semester, quarter, etc.)
    """
    __tablename__ = "terms"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # e.g., "Fall 2025"
    code = db.Column(db.String(20), nullable=False)  # e.g., "F25"
    
    # Dates for the entire term
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id"), nullable=False)
    
    sections = db.relationship("Section", back_populates="term")
    institution = db.relationship("Institution", back_populates="terms")
    
    __table_args__ = (
        db.UniqueConstraint('code', 'institution_id', name='unique_term_code_per_institution'),
        db.CheckConstraint('start_date <= end_date', name='check_term_dates_order'),
    )
    
    def __repr__(self):
        return f"<Term {self.name} ({self.code})>"