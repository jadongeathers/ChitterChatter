from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .conversation import Conversation
from .message import Message
from .practice_case import PracticeCase
from .feedback import SystemFeedback
from .survey import Survey
from .institution import Institution
from .section import Section
from .enrollment import Enrollment
from .user import User
from .class_model import Class
from .term import Term

__all__ = [
    "User", "Institution", "Class", "Section", "Enrollment", 
    "Conversation", "Message", "PracticeCase", "SystemFeedback", "Survey", "Term"
]
