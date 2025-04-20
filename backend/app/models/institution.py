from app.models import db
#NEW
class Institution(db.Model):
    __tablename__ = "institutions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.Text, nullable=True)
    classes = db.relationship("Class", back_populates="institution", cascade="all, delete-orphan")