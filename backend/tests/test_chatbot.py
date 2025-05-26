import pytest
from backend.app.models import User, db
from backend.app.models.practice_case import PracticeCase
from werkzeug.security import generate_password_hash

def test_create_session(client):
    """
    Test creating a session without using language or proficiency level.
    """
    pass

def test_start_conversation(client):
    """
    Test starting a conversation without language or proficiency level.
    """
    pass
