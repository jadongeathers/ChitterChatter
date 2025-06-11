# tests/test_auth.py

import os
import pytest
import json
from datetime import datetime, timezone
from unittest.mock import patch
from flask import Flask
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from cryptography.fernet import Fernet
os.environ["ENCRYPTION_KEY"] = Fernet.generate_key().decode()

from app.models import User, db
from app.routes.auth import auth


@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = Flask(__name__)
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "JWT_SECRET_KEY": "test-jwt-secret",
    })

    JWTManager(app)
    db.init_app(app)
    app.register_blueprint(auth, url_prefix="/api/auth")

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


def register_user(client, email, password="pw123", first_name="Foo", last_name="Bar"):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "first_name": first_name, "last_name": last_name}
    )


def login_user(client, email, password="pw123"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )


def verify_email(client, email):
    return client.post(
        "/api/auth/verify-email",
        json={"email": email}
    )


@pytest.fixture
def seed_user(app):
    """Seed a user for register/login flows (unregistered initially)."""
    with app.app_context():
        u = User()
        u.email = "test@example.com"
        u.set_password("pw123")
        u.is_registered = False
        u.is_active = True
        u.has_consented = False
        u.access_group = "Normal"  # any non-null
        db.session.add(u)
        db.session.commit()
        return u.id


class TestRegister:
    def test_missing_fields(self, client):
        r = client.post("/api/auth/register", json={})
        assert r.status_code == 400
        assert "Missing required fields" in r.get_json()["error"]

    def test_no_institutional_access(self, client):
        r = register_user(client, "nouser@example.com")
        assert r.status_code == 403
        assert "Institutional access required" in r.get_json()["error"]

    def test_access_group_not_assigned(self, client, seed_user):
        # remove access_group
        from app.models import User as U
        with client.application.app_context():
            u = U.query.first()
            u.access_group = None
            db.session.commit()
        r = register_user(client, "test@example.com")
        assert r.status_code == 500
        assert "Access group was not assigned" in r.get_json()["error"]

    def test_successful_registration(self, client, seed_user):
        # verify email first
        verify_email(client, "test@example.com")
        # make profile_picture deterministic
        with patch("random.choice", return_value="melon.png"):
            r = register_user(client, "test@example.com", first_name="Alice", last_name="Smith")
        assert r.status_code == 200
        data = r.get_json()
        assert data["message"] == "User registered successfully"
        assert "access_token" in data
        user = data["user"]
        assert user["email"] == "test@example.com"
        assert user["first_name"] == "Alice"
        assert user["last_name"] == "Smith"
        assert user["profile_picture"] == "melon.png"


class TestLogin:
    @pytest.fixture(autouse=True)
    def prep_user(self, client, seed_user):
        # verify + register + consent
        verify_email(client, "test@example.com")
        register_user(client, "test@example.com")
        # consent
        client.post("/api/auth/record-consent", json={"email": "test@example.com", "has_consented": True})

    def test_missing_fields(self, client):
        r = client.post("/api/auth/login", json={"email": "test@example.com"})
        assert r.status_code == 400
        assert "Missing email or password" in r.get_json()["error"]

    def test_invalid_credentials(self, client):
        r = login_user(client, "test@example.com", password="wrongpw")
        assert r.status_code == 401
        assert "Invalid email or password" in r.get_json()["error"]

    def test_unregistered_user(self, client, seed_user):
        # create new user without registering
        with client.application.app_context():
            u2 = User()
            u2.email = "u2@example.com"
            u2.set_password("pw123")
            u2.is_registered = False
            db.session.add(u2); db.session.commit()
        r = login_user(client, "u2@example.com")
        assert r.status_code == 403
        assert "not completed registration" in r.get_json()["error"]

    def test_deactivated_user(self, client, seed_user):
        with client.application.app_context():
            u = User.query.get(seed_user)  # ✅ re-fetch user by ID
            u.is_registered = True
            u.has_consented = True
            u.is_active = False
            db.session.commit()

        r = login_user(client, "test@example.com")
        assert r.status_code == 403
        assert "deactivated" in r.get_json()["error"]

    def test_needs_consent(self, client, app):
        # Create a fresh user
        with app.app_context():
            u = User()
            u.email = "newuser@example.com"
            u.set_password("pw123")
            u.is_registered = True
            u.is_active = True
            u.has_consented = False
            u.access_group = "Normal"
            db.session.add(u)
            db.session.commit()

        # Try logging in
        r = login_user(client, "newuser@example.com", password="pw123")
        js = r.get_json()
        assert r.status_code == 200
        assert js["needs_consent"] is True

    def test_successful_login(self, client):
        r = login_user(client, "test@example.com")
        js = r.get_json()
        assert r.status_code == 200
        assert "access_token" in js
        assert js["needs_consent"] is False


class TestProtected:
    @pytest.fixture(autouse=True)
    def token(self, client, seed_user):
        verify_email(client, "test@example.com")
        register_user(client, "test@example.com")
        client.post("/api/auth/record-consent", json={"email": "test@example.com", "has_consented": True})
        return login_user(client, "test@example.com").get_json()["access_token"]

    def test_get_current_user(self, client, token):
        r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        js = r.get_json()
        assert js["email"] == "test@example.com"
        assert "first_name" in js

    def test_logout(self, client, token):
        r = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.get_json()["message"] == "Successfully logged out"

    def test_change_password(self, client, token):
        r = client.post(
            "/api/auth/change-password",
            headers={"Authorization": f"Bearer {token}"},
            json={"current_password": "pw123", "new_password": "newpw"}
        )
        assert r.status_code == 200
        assert "Password changed successfully" in r.get_json()["message"]
        # login with new password
        r2 = login_user(client, "test@example.com", password="newpw")
        assert r2.status_code == 200

    def test_verify_email_missing(self, client):
        r = client.post("/api/auth/verify-email", json={})
        assert r.status_code == 400
        assert "Missing email" in r.get_json()["error"]

    def test_verify_email_success(self, client):
        # seed another user
        with client.application.app_context():
            u = User()
            u.email = "new@example.com"
            u.set_password("pw123")
            u.is_registered = False
            u.access_group = "Normal"
            u.is_active = True
            db.session.add(u); db.session.commit()
        r = verify_email(client, "new@example.com")
        assert r.status_code == 200
        d = r.get_json()
        assert "access_group" in d

    def test_update_profile(self, client, token):
        r = client.post(
            "/api/auth/update-profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"first_name": "New", "last_name": "Name"}
        )
        assert r.status_code == 200
        assert r.get_json()["user"]["first_name"] == "New"

    def test_update_preferences(self, client, token):
        r = client.post(
            "/api/auth/update-preferences",
            headers={"Authorization": f"Bearer {token}"},
            json={"email_notifications": False}
        )
        assert r.status_code == 200
        assert r.get_json()["message"] == "Preferences updated successfully"

    def test_deactivate_account(self, client, token, seed_user, app):
        r = client.post("/api/auth/deactivate-account", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        with app.app_context():
            u = User.query.get(seed_user)
            assert u.is_active is False

    def test_update_profile_picture(self, client, token):
        # missing selection
        r1 = client.post("/api/auth/update-profile-picture",
                         headers={"Authorization": f"Bearer {token}"}, json={})
        assert r1.status_code == 400

        # invalid choice
        r2 = client.post("/api/auth/update-profile-picture",
                         headers={"Authorization": f"Bearer {token}"},
                         json={"profile_picture": "nope.png"})
        assert r2.status_code == 400

        # valid choice
        r3 = client.post("/api/auth/update-profile-picture",
                         headers={"Authorization": f"Bearer {token}"},
                         json={"profile_picture": "pear.png"})
        assert r3.status_code == 200
        assert r3.get_json()["profile_picture"] == "pear.png"

    def test_record_consent(self, client):
        # missing fields
        r1 = client.post("/api/auth/record-consent", json={})
        assert r1.status_code == 400

        # no user
        r2 = client.post("/api/auth/record-consent",
                         json={"email": "absent@example.com", "has_consented": True})
        assert r2.status_code == 404

        # success
        verify_email(client, "test@example.com")
        r3 = client.post("/api/auth/record-consent",
                         json={"email": "test@example.com", "has_consented": True})
        assert r3.status_code == 200
        assert r3.get_json()["has_consented"] is True
