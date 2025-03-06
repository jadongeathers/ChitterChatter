from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
    
    # Get database URL and fix "postgres://" prefix if needed
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///data.db")
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Set DEBUG based on environment
    DEBUG = os.getenv("FLASK_ENV", "production") != "production"
    
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    @staticmethod
    def validate():
        """Ensure all required variables are set."""
        if not os.getenv("SECRET_KEY"):
            print("Warning: Using default SECRET_KEY. This is insecure for production.")
            
        if not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in the environment variables.")