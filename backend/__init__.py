from backend.app import create_app
from backend.app import create_app
from backend.app.config import Config
from backend.app.routes import register_blueprints
from backend.app.models import db


create_app = create_app
