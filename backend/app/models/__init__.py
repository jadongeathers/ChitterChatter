from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()  # ✅ Move db here

from .user import User
from .conversation import Conversation
from .message import Message
from .practice_case import PracticeCase
from .feedback import SystemFeedback

__all__ = ["User", "Conversation", "Message", "PracticeCase", "SystemFeedback"]
