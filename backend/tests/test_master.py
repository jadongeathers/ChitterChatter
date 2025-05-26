import json
from backend.app.models import db, User, PracticeCase

def test_get_classes(client):
    """Test fetching all available classes"""
    # Add mock class to database
    class1 = PracticeCase(class_name="Spanish101", institution="Test University", system_prompt="Test Prompt")
    class2 = PracticeCase(class_name="Mandarin201", institution="Test University", system_prompt="Test Prompt")
    
    db.session.add(class1)
    db.session.add(class2)
    db.session.commit()

    response = client.get("/api/master/classes")
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)
    assert {"id": "Spanish101", "name": "Spanish101"} in data
    assert {"id": "Mandarin201", "name": "Mandarin201"} in data


def test_get_students(client):
    """Test fetching students for a class"""
    student = User(email="student@example.com", class_name="Spanish101", is_student=True)
    
    db.session.add(student)
    db.session.commit()

    response = client.get("/api/master/students?class_name=Spanish101")
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)
    assert any(s["email"] == "student@example.com" for s in data)


def test_get_lessons(client):
    """Test fetching lessons for a class"""
    lesson = PracticeCase(class_name="Spanish101", title="Basic Greetings", published=True)
    
    db.session.add(lesson)
    db.session.commit()

    response = client.get("/api/master/lessons?class_name=Spanish101")
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)
    assert any(lesson["title"] == "Basic Greetings" for lesson in data)


def test_add_student(client):
    """Test adding a student to a class"""
    student = User(email="newstudent@example.com", is_student=True)
    db.session.add(student)
    db.session.commit()

    payload = {"class_name": "Spanish101", "email": "newstudent@example.com"}
    response = client.post("/api/master/add_student", data=json.dumps(payload), content_type="application/json")

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Student added successfully"

    # Verify in DB
    updated_student = User.query.filter_by(email="newstudent@example.com").first()
    assert updated_student.class_name == "Spanish101"
