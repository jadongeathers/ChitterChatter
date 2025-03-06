import pytest
from datetime import datetime, timezone, timedelta
import json
from unittest.mock import patch
from flask import Flask
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from app.models import User, db
from app.routes.auth import auth
from freezegun import freeze_time

# ==================== FIXTURES ====================

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    JWTManager(app)
    db.init_app(app)
    app.register_blueprint(auth, url_prefix='/api/auth')
    
    # Create application context
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def create_users(app):
    """Create test users for different access groups."""
    with app.app_context():
        # Create a Group A user
        user_a = User(
            email="student.a@example.edu",
            first_name="Student",
            last_name="A",
            password_hash="temp",  # Will be updated during registration
            is_student=True,
            is_registered=False,
            access_group="A",
            class_name="CS101",
            section="001"
        )
        
        # Create a Group B user
        user_b = User(
            email="student.b@example.edu",
            first_name="Student",
            last_name="B",
            password_hash="temp",
            is_student=True,
            is_registered=False,
            access_group="B",
            class_name="CS101",
            section="001"
        )
        
        # Create an "All" group user
        user_all = User(
            email="student.all@example.edu",
            first_name="Student",
            last_name="All",
            password_hash="temp",
            is_student=True,
            is_registered=False,
            access_group="All",
            class_name="CS101",
            section="001"
        )
        
        db.session.add_all([user_a, user_b, user_all])
        db.session.commit()
        
        return {
            "user_a": user_a,
            "user_b": user_b,
            "user_all": user_all
        }

# ==================== HELPER FUNCTIONS ====================

def register_user(client, email, password="password123", first_name="Test", last_name="User"):
    """Helper function to register a user."""
    return client.post(
        '/api/auth/register',
        data=json.dumps({
            "email": email,
            "password": password,
            "first_name": first_name,
            "last_name": last_name
        }),
        content_type='application/json'
    )

def login_user(client, email, password="password123"):
    """Helper function to login a user."""
    return client.post(
        '/api/auth/login',
        data=json.dumps({
            "email": email,
            "password": password
        }),
        content_type='application/json'
    )

def verify_email(client, email):
    """Helper function to verify email."""
    return client.post(
        '/api/auth/verify-email',
        data=json.dumps({"email": email}),
        content_type='application/json'
    )

# ==================== EMAIL VERIFICATION TESTS ====================

def test_email_verification_success(client, create_users):
    """Test successful email verification."""
    response = verify_email(client, "student.a@example.edu")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "access_group" in data
    assert data["access_group"] == "A"

def test_email_verification_invalid_email(client):
    """Test email verification with invalid email."""
    response = verify_email(client, "nonexistent@example.com")
    assert response.status_code == 403
    data = json.loads(response.data)
    assert "error" in data
    assert "Institutional access required" in data["error"]

# ==================== REGISTRATION TESTS ====================

def test_registration_success(client, create_users):
    """Test successful registration after email verification."""
    # First verify email
    verify_email(client, "student.a@example.edu")
    
    # Then register
    response = register_user(client, "student.a@example.edu")
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == "student.a@example.edu"

def test_registration_without_verification(client):
    """Test registration without prior email verification."""
    response = register_user(client, "nonexistent@example.com")
    assert response.status_code == 403
    data = json.loads(response.data)
    assert "error" in data
    assert "Institutional access required" in data["error"]

def test_registration_missing_fields(client, create_users):
    """Test registration with missing required fields."""
    # First verify email
    verify_email(client, "student.a@example.edu")
    
    # Attempt to register without password
    response = client.post(
        '/api/auth/register',
        data=json.dumps({
            "email": "student.a@example.edu",
            "first_name": "Test",
            "last_name": "User"
        }),
        content_type='application/json'
    )
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "Missing required fields" in data["error"]

# ==================== TIME-BASED LOGIN TESTS ====================

def test_login_before_allowed_group_A(client, create_users):
    """Test login for Group A before its allowed access period."""
    # For Group A, access starts on March 10, 2025
    with freeze_time("2025-03-09 23:59:00+00:00"):
        # Verify email and register user (registration sets a valid password)
        verify_email(client, "student.a@example.edu")
        reg_response = register_user(client, "student.a@example.edu")
        assert reg_response.status_code == 201

        # Attempt to login before allowed period
        login_response = login_user(client, "student.a@example.edu")
        assert login_response.status_code == 403
        data = json.loads(login_response.data)
        assert "error" in data
        assert "Access restricted" in data["error"]
        assert "Your access starts on March 10, 2025" in data["message"]


def test_login_during_allowed_group_A(client, create_users):
    """Test login for Group A during the allowed access period."""
    with freeze_time("2025-03-15 12:00:00+00:00"):
        verify_email(client, "student.a@example.edu")
        reg_response = register_user(client, "student.a@example.edu")
        assert reg_response.status_code == 201

        login_response = login_user(client, "student.a@example.edu")
        # Login should succeed during the allowed period
        assert login_response.status_code == 200
        data = json.loads(login_response.data)
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["access_group"] == "A"


def test_login_after_allowed_group_A(client, create_users):
    """Test login for Group A after its allowed access period has ended."""
    # For Group A, access ends on March 30, 2025
    with freeze_time("2025-04-01 12:00:00+00:00"):
        verify_email(client, "student.a@example.edu")
        reg_response = register_user(client, "student.a@example.edu")
        assert reg_response.status_code == 201

        login_response = login_user(client, "student.a@example.edu")
        assert login_response.status_code == 403
        data = json.loads(login_response.data)
        assert "error" in data
        assert "Access restricted" in data["error"]
        assert "Your access ended on March 30, 2025" in data["message"]


def test_login_during_allowed_group_B(client, create_users):
    """Test login for Group B during its allowed access period."""
    # For Group B, access is allowed between April 7 and April 27, 2025.
    with freeze_time("2025-04-15 12:00:00+00:00"):
        verify_email(client, "student.b@example.edu")
        reg_response = register_user(client, "student.b@example.edu")
        assert reg_response.status_code == 201

        login_response = login_user(client, "student.b@example.edu")
        # Login should succeed during the allowed period
        assert login_response.status_code == 200
        data = json.loads(login_response.data)
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["access_group"] == "B"


def test_login_all_group_anytime(client, create_users):
    """Test that Group 'All' can login regardless of the current time."""
    # For Group 'All', no time restrictions apply.
    with freeze_time("2023-01-01 12:00:00+00:00"):
        verify_email(client, "student.all@example.edu")
        reg_response = register_user(client, "student.all@example.edu")
        assert reg_response.status_code == 201

        login_response = login_user(client, "student.all@example.edu")
        # Login should succeed regardless of the time
        assert login_response.status_code == 200
        data = json.loads(login_response.data)
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["access_group"] == "All"

# ==================== OTHER AUTH ROUTE TESTS ====================

def test_get_current_user(client, create_users):
    """Test retrieving current user information with JWT token."""
    user_email = "student.all@example.edu"
    
    # First verify and register the user
    verify_email(client, user_email)
    register_response = register_user(client, user_email)
    access_token = json.loads(register_response.data)["access_token"]
    
    # Get current user with token
    response = client.get(
        '/api/auth/me',
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["email"] == user_email
    assert "first_name" in data
    assert "last_name" in data

def test_change_password(client, create_users):
    """Test changing user password."""
    user_email = "student.all@example.edu"
    
    # First verify and register the user
    verify_email(client, user_email)
    register_response = register_user(client, user_email)
    access_token = json.loads(register_response.data)["access_token"]
    
    # Change password
    response = client.post(
        '/api/auth/change-password',
        headers={"Authorization": f"Bearer {access_token}"},
        data=json.dumps({
            "current_password": "password123",
            "new_password": "newpassword456"
        }),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "message" in data
    assert "Password changed successfully" in data["message"]
    
    # Try logging in with new password
    login_response = login_user(client, user_email, "newpassword456")
    assert login_response.status_code == 200

def test_logout(client, create_users):
    """Test user logout (placeholder since JWT doesn't actually invalidate tokens)."""
    user_email = "student.all@example.edu"
    
    # First verify and register the user
    verify_email(client, user_email)
    register_response = register_user(client, user_email)
    access_token = json.loads(register_response.data)["access_token"]
    
    # Logout
    response = client.post(
        '/api/auth/logout',
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "message" in data
    assert "Successfully logged out" in data["message"]

# ==================== EDGE CASES AND ERROR HANDLING ====================

def test_login_with_incorrect_password(client, create_users):
    """Test login with incorrect password."""
    user_email = "student.all@example.edu"
    
    # First verify and register the user
    verify_email(client, user_email)
    register_user(client, user_email)
    
    # Try to login with wrong password
    response = login_user(client, user_email, "wrongpassword")
    assert response.status_code == 401
    data = json.loads(response.data)
    assert "error" in data
    assert "Invalid email or password" in data["error"]

def test_login_unregistered_user(client, create_users):
    """Test login with verified but unregistered user."""
    user_email = "student.b@example.edu"
    
    # Verify email but don't complete registration
    verify_email(client, user_email)
    
    # Try to login without completing registration
    response = login_user(client, user_email)
    assert response.status_code == 401  # Will fail because no password set

def test_registered_user_with_missing_password(client, create_users):
    """Test a scenario where a user is marked as registered but has no password."""
    with client.application.app_context():
        # Get user B and manually mark as registered without setting password
        user = next(u for u in User.query.all() if u.email == "student.b@example.edu")
        user.is_registered = True
        db.session.commit()
        
        # Try to login
        response = login_user(client, "student.b@example.edu")
        assert response.status_code == 401
        data = json.loads(response.data)
        assert "error" in data

def test_verify_email_even_distribution(client):
    """Test that 18 students in the same section are evenly distributed between groups A and B."""
    # Create 18 users with no pre-assigned access group in a new class section
    emails = [f"student{i}@example.edu" for i in range(1, 19)]
    class_name = "CS102"
    section = "002"
    
    with client.application.app_context():
        for email in emails:
            user = User(
                email=email,
                first_name="Test",
                last_name="Student",
                password_hash="temp",  # temporary value
                is_student=True,
                is_registered=False,
                access_group=None,  # Ensure no group is assigned initially
                class_name=class_name,
                section=section
            )
            db.session.add(user)
        db.session.commit()

    # Verify email for each student so that the access group is assigned dynamically
    for email in emails:
        response = verify_email(client, email)
        # Each verification should succeed with a 200 status
        assert response.status_code == 200, f"Verification failed for {email}"

    # Query all students from this class section to count group assignments
    with client.application.app_context():
        students = User.query.filter_by(class_name=class_name, section=section).all()
        group_a_count = sum(1 for s in students if s.access_group == "A")
        group_b_count = sum(1 for s in students if s.access_group == "B")
    
    # Expect an even split: 9 in Group A and 9 in Group B.
    assert group_a_count == 9, f"Expected 9 students in Group A but got {group_a_count}"
    assert group_b_count == 9, f"Expected 9 students in Group B but got {group_b_count}"
