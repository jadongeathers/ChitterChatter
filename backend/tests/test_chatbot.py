# TODO

import pytest
from unittest.mock import patch
from datetime import date, datetime, timezone
from app.models import db, User, Institution, Class, Term, Section, Enrollment, PracticeCase

@pytest.fixture
def setup_user_and_case(app):
    """
    Create a user enrolled in a section and a corresponding practice case.
    Returns the user_id and practice_case_id.
    """
    with app.app_context():
        # 1. Create Institution
        institution = Institution(
            name="Test University",
            location="Testville"
        )
        db.session.add(institution)
        db.session.commit()

        # 2. Create Term
        term = Term(
            name="Spring 2025",
            code="SP25",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 1),
            institution_id=institution.id
        )
        db.session.add(term)
        db.session.commit()

        # 3. Create Class
        klass = Class(
            course_code="SPAN101",
            title="Medical Spanish",
            institution_id=institution.id
        )
        db.session.add(klass)
        db.session.commit()

        # 4. Create Section tied to Class and Term
        section = Section(
            class_id=klass.id,
            section_code="001",
            term_id=term.id
        )
        db.session.add(section)
        db.session.commit()

        # 5. Create User and enroll as student
        user = User()
        user.email = "student@example.com"
        user.set_password("pw123")
        user.is_registered = True
        user.is_active = True
        db.session.add(user)
        db.session.commit()

        enrollment = Enrollment(
            user_id=user.id,
            section_id=section.id,
            role="student"
        )
        db.session.add(enrollment)
        db.session.commit()

        # 6. Create PracticeCase tied to the same class
        practice_case = PracticeCase(
            class_id=klass.id,
            title="Simulated Intake Interview",
            system_prompt="You are a standardized patient responding in Spanish.",
            max_time=300
        )
        db.session.add(practice_case)
        db.session.commit()

        return user.id, practice_case.id


def test_create_session_missing_user(client):
    response = client.post("/api/chatbot/session", json={"practice_case_id": 1})
    assert response.status_code == 400
    assert "Missing user_id" in response.get_json()["error"]


def test_create_session_invalid_user(client, setup_user_and_case):
    _, case_id = setup_user_and_case
    response = client.post(
        "/api/chatbot/session", json={"user_id": 999, "practice_case_id": case_id}
    )
    assert response.status_code == 404
    assert "User not found" in response.get_json()["error"]


def test_create_session_invalid_case(client, setup_user_and_case):
    user_id, _ = setup_user_and_case
    response = client.post(
        "/api/chatbot/session", json={"user_id": user_id, "practice_case_id": 999}
    )
    assert response.status_code == 404
    assert "Practice case not found" in response.get_json()["error"]


def test_create_session_unauthorized(client, setup_user_and_case):
    user_id, _ = setup_user_and_case

    # Create another class and case not tied to the user's section
    with client.application.app_context():
        institution = Institution(name="Test Institution")
        db.session.add(institution)
        db.session.commit()

        other_class = Class(
            course_code="OTHER101",
            title="Other Class",
            institution_id=institution.id
        )
        db.session.add(other_class)
        db.session.commit()

        other_case = PracticeCase(
            class_id=other_class.id,
            title="Unauthorized Case",
            system_prompt="Prompt",
            max_time=100
        )
        db.session.add(other_case)
        db.session.commit()
        other_case_id = other_case.id

    response = client.post(
        "/api/chatbot/session",
        json={"user_id": user_id, "practice_case_id": other_case_id}
    )
    assert response.status_code == 403
    assert "Not authorized for this practice case" in response.get_json()["error"]


def test_create_session_success(client, setup_user_and_case):
    user_id, case_id = setup_user_and_case
    with patch("app.routes.chatbot.voice_service.VoiceService.create_session", return_value={"session_id": "abc123"}):
        response = client.post(
            "/api/chatbot/session",
            json={"user_id": user_id, "practice_case_id": case_id}
        )
    assert response.status_code == 200
    data = response.get_json()
    assert data["session_id"] == "abc123"


def test_start_conversation_missing_fields(client):
    response = client.post("/api/chatbot/conversation/start", json={})
    assert response.status_code == 400
    assert "Missing required fields" in response.get_json()["error"]


def test_start_conversation_invalid_user(client, setup_user_and_case):
    _, case_id = setup_user_and_case
    response = client.post(
        "/api/chatbot/conversation/start",
        json={"user_id": 999, "practice_case_id": case_id}
    )
    assert response.status_code == 404
    assert "User not found" in response.get_json()["error"]


def test_start_conversation_invalid_case(client, setup_user_and_case):
    user_id, _ = setup_user_and_case
    response = client.post(
        "/api/chatbot/conversation/start",
        json={"user_id": user_id, "practice_case_id": 999}
    )
    assert response.status_code == 404
    assert "Practice case not found" in response.get_json()["error"]


def test_start_conversation_unauthorized(client, setup_user_and_case):
    user_id, case_id = setup_user_and_case
    # Remove all enrollments to simulate unauthorized
    with client.application.app_context():
        Enrollment.query.filter_by(user_id=user_id).delete()
        db.session.commit()

    response = client.post(
        "/api/chatbot/conversation/start",
        json={"user_id": user_id, "practice_case_id": case_id}
    )
    assert response.status_code == 403
    assert "Not authorized for this practice case" in response.get_json()["error"]


def test_start_conversation_success(client, setup_user_and_case):
    user_id, case_id = setup_user_and_case
    response = client.post(
        "/api/chatbot/conversation/start",
        json={"user_id": user_id, "practice_case_id": case_id}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "conversation_id" in data
    assert "start_time" in data
    assert data["max_time"] == 300


def test_proxy_openai_realtime(client):
    response = client.post("/api/chatbot/realtime")
    assert response.status_code == 400
    assert "not intended for direct SDP exchange" in response.get_json()["error"]
