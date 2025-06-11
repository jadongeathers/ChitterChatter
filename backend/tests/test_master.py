# tests/test_master.py (revised to fix issues)

import os
import pytest
import json
from datetime import datetime, timezone, date  # Make sure date is imported
from unittest.mock import patch
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token

from cryptography.fernet import Fernet
os.environ["ENCRYPTION_KEY"] = Fernet.generate_key().decode()

from app.models import User, Institution, Term, Class, Section, db
from app.routes.master import master

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
    app.register_blueprint(master, url_prefix="/api/master")

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


@pytest.fixture
def master_user(app):
    """Create a master user for testing protected routes."""
    with app.app_context():
        master = User()
        master.email = "master@example.com"
        master.first_name = "Master"
        master.last_name = "Admin"
        master.set_password("master123")
        master.is_master = True
        master.is_registered = True
        master.is_active = True
        db.session.add(master)
        db.session.commit()
        return master.id


@pytest.fixture
def normal_user(app):
    """Create a normal user for testing authorization."""
    with app.app_context():
        user = User()
        user.email = "user@example.com"
        user.first_name = "Normal"
        user.last_name = "User"
        user.set_password("user123")
        user.is_master = False
        user.is_registered = True
        user.is_active = True
        db.session.add(user)
        db.session.commit()
        return user.id


@pytest.fixture
def master_token(app, master_user):
    """Create a JWT token for the master user."""
    with app.app_context():
        return create_access_token(identity=str(master_user))


@pytest.fixture
def normal_token(app, normal_user):
    """Create a JWT token for a normal user."""
    with app.app_context():
        return create_access_token(identity=str(normal_user))


@pytest.fixture
def seed_institution(app):
    """Seed an institution for testing."""
    with app.app_context():
        inst = Institution(name="Test University", location="Test Location")
        db.session.add(inst)
        db.session.commit()
        return inst.id


@pytest.fixture
def seed_term(app, seed_institution):
    """Seed a term for testing."""
    with app.app_context():
        term = Term(
            name="Fall 2025",
            code="F25",
            start_date=date(2025, 9, 1),
            end_date=date(2025, 12, 15),
            institution_id=seed_institution
        )
        db.session.add(term)
        db.session.commit()
        return term.id


@pytest.fixture
def seed_class(app, seed_institution):
    """Seed a class for testing."""
    with app.app_context():
        cls = Class(
            course_code="CS101",
            title="Introduction to Computer Science",
            institution_id=seed_institution
        )
        db.session.add(cls)
        db.session.commit()
        return cls.id


@pytest.fixture
def seed_section(app, seed_class, seed_term):
    """Seed a section for testing."""
    with app.app_context():
        section = Section(
            class_id=seed_class,
            section_code="A",
            term_id=seed_term
        )
        db.session.add(section)
        db.session.commit()
        return section.id


class TestAuthorization:
    """Test authorization for master routes."""

    def test_unauthorized_access(self, client):
        """Test that non-authenticated users can't access master routes."""
        r = client.get("/api/master/institutions")
        assert r.status_code == 401

    def test_non_master_access(self, client, normal_token):
        """Test that non-master users can't access master routes."""
        r = client.get(
            "/api/master/institutions",
            headers={"Authorization": f"Bearer {normal_token}"}
        )
        assert r.status_code == 403
        assert r.get_json()["error"] == "Unauthorized"

    def test_master_check(self, client, master_token, normal_token):
        """Test the master status check endpoint."""
        r1 = client.get(
            "/api/master/check",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r1.status_code == 200
        assert r1.get_json()["is_master"] is True 

        # Normal user should get False
        r2 = client.get(
            "/api/master/check",
            headers={"Authorization": f"Bearer {normal_token}"}
        )
        assert r2.status_code == 403
        assert r2.get_json()["is_master"] is False


class TestInstitutions:
    """Test institution management routes."""

    def test_get_institutions_empty(self, client, master_token):
        """Test getting institutions when none exist."""
        r = client.get(
            "/api/master/institutions",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r.status_code == 200
        assert r.get_json() == []

    def test_get_institutions(self, client, master_token, seed_institution, app):
        """Test getting all institutions."""
        r = client.get(
            "/api/master/institutions",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r.status_code == 200
        institutions = r.get_json()
        assert len(institutions) == 1
        assert institutions[0]["name"] == "Test University"
        assert institutions[0]["id"] == seed_institution

    def test_create_institution_missing_fields(self, client, master_token):
        """Test creating an institution with missing fields."""
        r = client.post(
            "/api/master/institutions",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={}
        )
        assert r.status_code == 400
        assert "Missing name" in r.get_json()["error"]

    def test_create_institution_success(self, client, master_token):
        """Test successful institution creation."""
        r = client.post(
            "/api/master/institutions",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={"name": "New University", "location": "New Location"}
        )
        assert r.status_code == 201
        institution = r.get_json()
        assert institution["name"] == "New University"
        assert "id" in institution


class TestTerms:
    """Test term management routes."""

    def test_get_terms_empty(self, client, master_token, seed_institution):
        """Test getting terms when none exist."""
        # First remove the seeded term from seed_term fixture
        with client.application.app_context():
            Term.query.delete()
            db.session.commit()
            
        r = client.get(
            f"/api/master/terms?institution_id={seed_institution}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r.status_code == 200
        assert r.get_json() == []

    def test_get_terms(self, client, master_token, seed_institution, seed_term):
        """Test getting terms for an institution."""
        r = client.get(
            f"/api/master/terms?institution_id={seed_institution}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r.status_code == 200
        terms = r.get_json()
        assert len(terms) == 1
        assert terms[0]["name"] == "Fall 2025"
        assert terms[0]["code"] == "F25"
        assert terms[0]["id"] == seed_term

    def test_get_terms_filtered(self, client, master_token, app, seed_institution):
        """Test getting terms filtered by institution."""
        # Create another institution and term
        with client.application.app_context():
            # First clear all terms to avoid conflicts
            Term.query.delete()
            db.session.commit()
            
            # Create a term for the seed institution
            term1 = Term(
                name="Fall 2025",
                code="F25",
                start_date=date(2025, 9, 1),
                end_date=date(2025, 12, 15),
                institution_id=seed_institution
            )
            db.session.add(term1)
            
            # Create another institution
            inst2 = Institution(name="Second University")
            db.session.add(inst2)
            db.session.commit()
            
            # Create a term for the second institution
            term2 = Term(
                name="Spring 2026",
                code="S26",
                start_date=date(2026, 1, 15),
                end_date=date(2026, 5, 15),
                institution_id=inst2.id
            )
            db.session.add(term2)
            db.session.commit()
        
        # Get terms for first institution
        r = client.get(
            f"/api/master/terms?institution_id={seed_institution}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        terms = r.get_json()
        assert len(terms) == 1  # Fixed: expect 1 term instead of 0
        assert terms[0]["name"] == "Fall 2025"

    def test_create_term_missing_fields(self, client, master_token):
        """Test creating a term with missing fields."""
        r = client.post(
            "/api/master/terms",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={"name": "Winter 2025"}
        )
        assert r.status_code == 400
        assert "Missing" in r.get_json()["error"]

    def test_create_term_invalid_dates(self, client, master_token, seed_institution):
        """Test creating a term with invalid date order."""
        r = client.post(
            "/api/master/terms",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "name": "Winter 2025",
                "code": "W25",
                "start_date": "2025-12-31",
                "end_date": "2025-01-01",  # End before start
                "institution_id": seed_institution
            }
        )
        assert r.status_code == 400
        assert "date" in r.get_json()["error"].lower()  # More generic check

    def test_create_term_success(self, client, master_token, seed_institution):
        """Test successful term creation."""
        r = client.post(
            "/api/master/terms",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "name": "Winter 2025",
                "code": "W25",
                "start_date": "2025-01-01",
                "end_date": "2025-03-31",
                "institution_id": seed_institution
            }
        )
        assert r.status_code == 201
        term = r.get_json()
        assert term["name"] == "Winter 2025"
        assert term["code"] == "W25"
        assert "id" in term


class TestClasses:
    """Test class management routes."""

    def test_get_classes_empty(self, client, master_token, seed_institution):
        """Test getting classes when none exist."""
        # First remove the seeded class from seed_class fixture
        with client.application.app_context():
            Class.query.delete()
            db.session.commit()
            
        r = client.get(
            f"/api/master/classes?institution_id={seed_institution}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r.status_code == 200
        assert r.get_json() == []

    def test_get_classes(self, client, master_token, seed_institution, seed_class):
        """Test getting classes for an institution."""
        r = client.get(
            f"/api/master/classes?institution_id={seed_institution}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r.status_code == 200
        classes = r.get_json()
        assert len(classes) == 1
        # Fix key names to match what your API returns
        assert classes[0]["course_code"] == "CS101"  # Changed from "code" to "course_code"
        assert classes[0]["title"] == "Introduction to Computer Science"
        assert classes[0]["id"] == seed_class

    def test_create_class_missing_fields(self, client, master_token):
        """Test creating a class with missing fields."""
        r = client.post(
            "/api/master/classes",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={"course_code": "CS102"}
        )
        assert r.status_code == 400
        assert "Missing" in r.get_json()["error"]

    def test_create_class_success(self, client, master_token, seed_institution):
        """Test successful class creation."""
        r = client.post(
            "/api/master/classes",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "course_code": "CS102",
                "title": "Data Structures",
                "institution_id": seed_institution
            }
        )
        assert r.status_code == 201
        cls = r.get_json()
        # Fix key names to match what your API returns
        assert cls["course_code"] == "CS102"  # Changed from "code" to "course_code"
        assert cls["title"] == "Data Structures"
        assert "id" in cls

    def test_duplicate_course_code(self, client, master_token, seed_institution, seed_class):
        """Test that duplicate course codes are rejected."""
        r = client.post(
            "/api/master/classes",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "course_code": "CS101",  # Same as seeded class
                "title": "Duplicate Code",
                "institution_id": seed_institution
            }
        )
        assert r.status_code == 400
        assert "unique" in r.get_json()["error"].lower() or "duplicate" in r.get_json()["error"].lower()


class TestSections:
    """Test section management routes."""

    def test_get_sections_empty(self, client, master_token, seed_class):
        """Test getting sections when none exist."""
        # First remove the seeded section from seed_section fixture
        with client.application.app_context():
            Section.query.delete()
            db.session.commit()
            
        r = client.get(
            f"/api/master/sections?class_id={seed_class}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r.status_code == 200
        assert r.get_json() == []

    def test_get_sections(self, client, master_token, seed_class, seed_section, seed_term):
        """Test getting sections for a class."""
        r = client.get(
            f"/api/master/sections?class_id={seed_class}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert r.status_code == 200
        sections = r.get_json()
        assert len(sections) == 1
        # Fix key names to match what your API returns
        assert sections[0]["section_code"] == "A"  # Changed from "code" to "section_code"
        assert sections[0]["term_id"] == seed_term
        assert sections[0]["id"] == seed_section

    def test_create_section_missing_fields(self, client, master_token):
        """Test creating a section with missing fields."""
        r = client.post(
            "/api/master/sections",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={"section_code": "B"}
        )
        assert r.status_code == 400
        assert "Missing" in r.get_json()["error"]

    def test_create_section_success(self, client, master_token, seed_class, seed_term):
        """Test successful section creation."""
        r = client.post(
            "/api/master/sections",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "class_id": seed_class,
                "section_code": "B",
                "term_id": seed_term
            }
        )
        assert r.status_code == 201
        section = r.get_json()
        # Fix key names to match what your API returns
        assert section["section_code"] == "B"  # Changed from "code" to "section_code"
        assert "id" in section

    def test_duplicate_section_code(self, client, master_token, seed_class, seed_term, seed_section):
        """Test that duplicate section codes are rejected."""
        r = client.post(
            "/api/master/sections",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "class_id": seed_class,
                "section_code": "A",  # Same as seeded section
                "term_id": seed_term
            }
        )
        assert r.status_code == 400
        assert "unique" in r.get_json()["error"].lower() or "duplicate" in r.get_json()["error"].lower()

    def test_create_section_different_term(self, client, master_token, seed_class, app):
        """Test creating a section with a different term."""
        # Create a new term first
        with client.application.app_context():
            term2 = Term(
                name="Spring 2026",
                code="S26",
                start_date=date(2026, 1, 15),
                end_date=date(2026, 5, 15),
                institution_id=Institution.query.first().id
            )
            db.session.add(term2)
            db.session.commit()
            term2_id = term2.id

        # Now create a section with the same section code but different term
        r = client.post(
            "/api/master/sections",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "class_id": seed_class,
                "section_code": "A",  # Same as seeded section but different term
                "term_id": term2_id
            }
        )
        assert r.status_code == 201
        section = r.get_json()
        # Fix key names to match what your API returns
        assert section["section_code"] == "A"  # Changed from "code" to "section_code"
        assert "id" in section


class TestCompleteFlow:
    """Test the complete flow of institution -> term -> class -> section creation."""

    def test_complete_flow(self, client, master_token):
        """Test creating a complete institution -> term -> class -> section flow."""
        # 1. Create an institution
        r1 = client.post(
            "/api/master/institutions",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={"name": "Flow University", "location": "Flow City"}
        )
        assert r1.status_code == 201
        institution = r1.get_json()
        institution_id = institution["id"]

        # 2. Create a term for the institution
        r2 = client.post(
            "/api/master/terms",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "name": "Summer 2025",
                "code": "SU25",
                "start_date": "2025-06-01",
                "end_date": "2025-08-31",
                "institution_id": institution_id
            }
        )
        assert r2.status_code == 201
        term = r2.get_json()
        term_id = term["id"]

        # 3. Create a class for the institution
        r3 = client.post(
            "/api/master/classes",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "course_code": "FLOW101",
                "title": "Introduction to Flow",
                "institution_id": institution_id
            }
        )
        assert r3.status_code == 201
        cls = r3.get_json()
        class_id = cls["id"]

        # 4. Create a section for the class and term
        r4 = client.post(
            "/api/master/sections",
            headers={
                "Authorization": f"Bearer {master_token}",
                "Content-Type": "application/json"
            },
            json={
                "class_id": class_id,
                "section_code": "X",
                "term_id": term_id
            }
        )
        assert r4.status_code == 201
        section = r4.get_json()
        section_id = section["id"]

        # 5. Verify we can retrieve everything
        # Get the institution
        r5 = client.get(
            "/api/master/institutions",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        institutions = r5.get_json()
        assert any(i["id"] == institution_id for i in institutions)

        # Get the term
        r6 = client.get(
            f"/api/master/terms?institution_id={institution_id}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        terms = r6.get_json()
        assert any(t["id"] == term_id for t in terms)

        # Get the class
        r7 = client.get(
            f"/api/master/classes?institution_id={institution_id}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        classes = r7.get_json()
        assert any(c["id"] == class_id for c in classes)

        # Get the section
        r8 = client.get(
            f"/api/master/sections?class_id={class_id}",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        sections = r8.get_json()
        assert any(s["id"] == section_id for s in sections)