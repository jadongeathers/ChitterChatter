import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")

    basedir = os.path.abspath(os.path.dirname(__file__))
    instance_path = os.path.abspath(os.path.join(basedir, "..", "instance"))
    os.makedirs(instance_path, exist_ok=True)

    db_path = os.path.join(instance_path, "data_dev.db")
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"  # <-- ABSOLUTE path

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = os.getenv("FLASK_ENV", "production") != "production"
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    @staticmethod
    def validate():
        if not os.getenv("SECRET_KEY"):
            print("Warning: Using default SECRET_KEY. This is insecure for production.")
        if not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in the environment variables.")
