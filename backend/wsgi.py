from app import create_app

application = create_app()
app = application  # This is what Gunicorn will look for