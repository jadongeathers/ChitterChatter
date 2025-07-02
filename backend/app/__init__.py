from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from app.config import Config
from app.routes import register_blueprints
from app.models import db
import os

# Initialize extensions
jwt = JWTManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__, static_folder="static")
    
    # Load configurations
    app.config.from_object(Config)
    Config.validate()
    
    # Initialize extensions
    db.init_app(app) 
    jwt.init_app(app)

    from app import commands
    commands.init_app(app) 
    
    CORS(app, resources={r"/api/*": {"origins": [
        "https://chitterchatter.app",
        "https://www.chitterchatter.app",
        "http://localhost:3000"
    ]}}, supports_credentials=True)
    
    migrate.init_app(app, db)

    # Register blueprints
    register_blueprints(app)

    return app