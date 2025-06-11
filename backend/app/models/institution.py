from app.models import db

class Institution(db.Model):
    """
    Represents an educational institution.
    """ 
    __tablename__ = "institutions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.Text, nullable=True)
    classes = db.relationship("Class", back_populates="institution", cascade="all, delete-orphan")
    terms = db.relationship("Term", back_populates="institution", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Institution - {self.name}>"