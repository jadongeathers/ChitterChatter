import pytest
from app.models import db, User, PracticeCase
from flask import url_for
from werkzeug.security import generate_password_hash

@pytest.fixture
def setup_test_data(client):
    """Set up three users and their corresponding practice cases."""
    hashed_password = generate_password_hash("TestPassword123")

    # Create Users
    user1 = User(email="user1@example.com", class_name="Spanish101", is_student=True, password_hash=hashed_password)
    user2 = User(email="user2@example.com", class_name="French102", is_student=True, password_hash=hashed_password)
    user3 = User(email="user3@example.com", class_name="Chinese103", is_student=True, password_hash=hashed_password)

    db.session.add_all([user1, user2, user3])
    db.session.commit()  # Commit to get user IDs

    # Create Practice Cases
    cases = [
        PracticeCase(institution="TestUniversity", class_name="Spanish101", title="Spanish Case 1", system_prompt="Hola, ¿cómo estás?"),
        PracticeCase(institution="TestUniversity", class_name="French102", title="French Case 1", system_prompt="Bonjour, comment ça va?"),
        PracticeCase(institution="TestUniversity", class_name="Chinese103", title="Chinese Case 1", system_prompt="你好，你怎么样？"),
    ]

    db.session.add_all(cases)
    db.session.commit()


def test_case_loading_for_each_user(client, setup_test_data):
    """Ensure each user only gets practice cases for their class."""
    
    # Fetch user data
    users = User.query.all()
    
    # For each user, build the URL using the practice_cases endpoint and pass the class as a query parameter.
    for user in users:
        # Create a request context for url_for
        with client.application.test_request_context():
            # Pass the user's class_name as the query parameter 'class'
            endpoint_url = url_for("practice_cases.get_practice_cases", **{"class": user.class_name})
        
        response = client.get(endpoint_url)
        assert response.status_code == 200
        
        data = response.get_json()
        assert isinstance(data, list)
        
        # Ensure all returned cases belong to the user's class
        for case in data:
            assert case["class_name"] == user.class_name, f"User {user.id} got wrong case: {case}"


def test_no_cases_for_unassigned_user(client):
    """Ensure a user with an unassigned class gets no cases."""
    hashed_password = generate_password_hash("TestPassword123")

    # Create a user with no class (we'll pass an empty string as the class query parameter)
    user = User(email="unassigned@example.com", class_name=None, is_student=True, password_hash=hashed_password)
    db.session.add(user)
    db.session.commit()

    with client.application.test_request_context():
        endpoint_url = url_for("practice_cases.get_practice_cases", **{"class": ""})
        
    response = client.get(endpoint_url)
    assert response.status_code == 200
    assert response.get_json() == [], "User with no class should get no cases!"


def test_invalid_class_request(client):
    """Ensure a request with a class that doesn't exist returns an empty list."""
    # Here we pass a non-existent class name.
    with client.application.test_request_context():
        endpoint_url = url_for("practice_cases.get_practice_cases", **{"class": "NonExistentClass"})
    
    response = client.get(endpoint_url)
    assert response.status_code == 200
    assert response.get_json() == [], "Non-existent class should yield no cases."
