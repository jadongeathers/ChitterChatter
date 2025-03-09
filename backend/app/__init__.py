from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

from app.routes import register_blueprints

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config=None):
    app = Flask(__name__)
    
    # Load configuration
    if config:
        app.config.from_object(config)
    else:
        # Default configuration
        app.config.from_pyfile('config.py')
    
    # Set up CORS - place this BEFORE registering blueprints
    CORS(app, 
         origins=[
             "https://www.chitterchatter.app", 
             "https://chitterchatter.app",
             "https://chitterchatter-756h0bo5i-jadongeathers-projects.vercel.app",
             "http://localhost:3000"
         ], 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True)
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    # Initialize other extensions
    
    # Register blueprints using your existing function
    register_blueprints(app)
    
    # Add CORS testing endpoint
    @app.route('/api/test-cors', methods=['GET', 'OPTIONS'])
    def test_cors():
        from flask import request, jsonify
        return jsonify({
            'message': 'CORS is working!',
            'origin': request.headers.get('Origin', 'No origin')
        })
    
    return app