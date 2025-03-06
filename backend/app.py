from app import create_app  # ✅ Import create_app from app/__init__.py
import os

app = create_app()  # ✅ Create the app using the factory function

if __name__ == "__main__":
    print("\n✅ Flask is starting...")  # Debugging output
    print("\n✅ Registered Routes:\n\n", app.url_map)  # Debugging output
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=False)