from flask import Blueprint
from .chatbot import chatbot
from .auth import auth
from .practice_cases import practice_cases
from .conversations import conversations
from .instructors import instructors
from .students import students
from .master import master
from .system import system

def register_blueprints(app):
    app.register_blueprint(chatbot, url_prefix='/api/chatbot')
    app.register_blueprint(auth, url_prefix='/api/auth')
    app.register_blueprint(practice_cases, url_prefix='/api/practice_cases')
    app.register_blueprint(conversations, url_prefix='/api/conversations')
    app.register_blueprint(instructors, url_prefix='/api/instructors')
    app.register_blueprint(students, url_prefix='/api/students')
    app.register_blueprint(master, url_prefix='/api/master')
    app.register_blueprint(system, url_prefix='/api/system')
