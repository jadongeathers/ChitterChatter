import pytest
from dotenv import load_dotenv
import os
import sqlalchemy
from sqlalchemy.orm import scoped_session, sessionmaker
from app import create_app
from app.models import db

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

@pytest.fixture(scope="session")
def app():
    """Create a Flask test app with a dedicated test database."""
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://jadongeathers:testpassword@localhost/vpp_test"

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture(scope="function", autouse=True)
def session(app):
    """
    Create a new database session for each test using a nested transaction (SAVEPOINT).
    This ensures that even if a test calls commit(), all changes are rolled back.
    """
    # Open a connection and begin an outer transaction.
    connection = db.engine.connect()
    transaction = connection.begin()

    # Create a scoped session bound to the connection.
    Session = scoped_session(sessionmaker(bind=connection))
    db.session = Session  # <-- Assign the scoped session (not an instance)
    
    # Begin a nested transaction (SAVEPOINT).
    db.session.begin_nested()

    # Automatically restart the nested transaction if it ends.
    @sqlalchemy.event.listens_for(db.session(), "after_transaction_end")
    def restart_savepoint(session, trans):
        if trans.nested and not trans._parent.nested:
            session.begin_nested()

    # Yield the session (tests can use db.session() to get the current session).
    yield db.session

    # Teardown: roll back the outer transaction and clean up.
    transaction.rollback()
    connection.close()
    db.session.remove()  # Now remove() is available on the scoped session.

@pytest.fixture
def client(app):
    """A test client for the Flask app."""
    with app.test_client() as client:
        with app.app_context():
            yield client
