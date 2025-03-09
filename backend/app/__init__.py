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
    
    # Configure CORS based on environment
    cors_origins = [
        "*.jadongeathers-projects.vercel.app",
        "https://chitterchatter.app",  # Without www
        "https://www.chitterchatter.app",  # Production 
        "http://localhost:3000",       # Local development
    ]

    # In production, add your Vercel frontend URL
    if os.environ.get("FLASK_ENV") == "production":
        production_frontend = os.environ.get("FRONTEND_URL", "https://chitterchatter.app")
        cors_origins.append(production_frontend)
    
    CORS(app, resources={r"/*": {"origins": cors_origins}})
    
    migrate.init_app(app, db)

    # Register blueprints
    register_blueprints(app)

    return app