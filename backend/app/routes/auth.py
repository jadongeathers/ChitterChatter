from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User, db
from app.utils.user_roles import is_user_student
from datetime import datetime, timezone
import app.routes.auth
import random


auth = Blueprint('auth', __name__)


@auth.route('/register', methods=['POST'])
def register():
    """Register a new user after email verification."""
    try:
        data = request.get_json()

        # Validate required fields
        if not all(k in data for k in ["email", "password", "first_name", "last_name"]):
            return jsonify({"error": "Missing required fields"}), 400

        # Validate password security requirements
        password = data["password"]
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
        
        if not any(c.isupper() for c in password):
            return jsonify({"error": "Password must contain at least one uppercase letter"}), 400
            
        if not any(c.islower() for c in password):
            return jsonify({"error": "Password must contain at least one lowercase letter"}), 400
            
        if not any(c.isdigit() for c in password):
            return jsonify({"error": "Password must contain at least one number"}), 400

        # Check if email exists (decrypted comparison)
        existing_user = next((u for u in User.query.all() if u.email == data["email"]), None)

        if existing_user:
            if existing_user.is_registered:
                return jsonify({"error": "Email already registered"}), 409
            else:
                user = existing_user
        else:
            return jsonify({"error": "Institutional access required. Contact us to request institutional access."}), 403

        # Update user information
        user.first_name = data["first_name"]
        user.last_name = data["last_name"]
        user.password_hash = generate_password_hash(data["password"])
        user.is_registered = True
        
        # Assign random profile picture
        profile_pictures = [
            "apple.png", "blueberry.png", "lemon.png", "lychee.png", 
            "melon.png", "orange.png", "pear.png", "plum.png"
        ]
        user.profile_picture = random.choice(profile_pictures)

        db.session.commit()

        # Generate JWT token
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            "message": "User registered successfully",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_student": is_user_student(user),
                "is_master": user.is_master,
                "is_active": user.is_active,
                "profile_picture": user.profile_picture,
                "profile_picture_url": f"/images/profile-icons/{user.profile_picture}"
            }
        })

    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Registration failed"}), 500


@auth.route('/login', methods=['POST'])
def login():
    """Login an existing user."""
    try:
        data = request.get_json()

        if not all(k in data for k in ["email", "password"]):
            return jsonify({"error": "Missing email or password"}), 400

        # Fetch user by email
        user = next((u for u in User.query.all() if u.email == data["email"]), None)

        if not user or not check_password_hash(user.password_hash, data["password"]):
            return jsonify({"error": "Invalid email or password"}), 401

        # Check if account is active
        if not user.is_active:
            return jsonify({"error": "This account has been deactivated"}), 403

        # Ensure user is registered before proceeding
        if not user.is_registered:
            return jsonify({"error": "User has not completed registration"}), 403

        # Update last login time
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        # Generate JWT token
        access_token = create_access_token(identity=str(user.id))

        # Check if user has consented
        has_consented = getattr(user, 'has_consented', False)
        
        if not has_consented and not user.is_master:
            return jsonify({
                "access_token": access_token,
                "user": user.to_dict() if hasattr(user, 'to_dict') else {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_student": is_user_student(user),
                    "is_master": user.is_master,
                    "is_active": user.is_active,
                    "profile_picture": user.profile_picture,
                    "profile_picture_url": f"/images/profile-icons/{user.profile_picture}"
                },
                "needs_consent": True
            }), 200

        # Return successful login response
        response = {
            "access_token": access_token,
            "user": user.to_dict() if hasattr(user, 'to_dict') else {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_student": is_user_student(user),
                "is_master": user.is_master,
                "is_active": user.is_active,
                "profile_picture": user.profile_picture,
                "profile_picture_url": f"/images/profile-icons/{user.profile_picture}"
            },
            "needs_consent": False
        }
        
        return jsonify(response), 200

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500


@auth.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Return the current user info, including first and last names."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_student": is_user_student(user),
            "is_master": user.is_master,
            "created_at": user.created_at.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "profile_picture": user.profile_picture,
            "profile_picture_url": f"/images/profile-icons/{user.profile_picture}"
        })

    except Exception as e:
        current_app.logger.error(f"Error getting user info: {str(e)}")
        return jsonify({"error": "Failed to get user information"}), 500


@auth.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Log out the current user."""
    # Note: With JWT, we don't actually invalidate the token here
    # A proper implementation would use a token blacklist
    # This is just a placeholder for future implementation
    return jsonify({"message": "Successfully logged out"}), 200


@auth.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user's password."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        data = request.get_json()

        if not all(k in data for k in ["current_password", "new_password"]):
            return jsonify({"error": "Missing required fields"}), 400

        if not check_password_hash(user.password_hash, data["current_password"]):
            return jsonify({"error": "Current password is incorrect"}), 401

        # Validate new password security requirements
        new_password = data["new_password"]
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
        
        if not any(c.isupper() for c in new_password):
            return jsonify({"error": "Password must contain at least one uppercase letter"}), 400
            
        if not any(c.islower() for c in new_password):
            return jsonify({"error": "Password must contain at least one lowercase letter"}), 400
            
        if not any(c.isdigit() for c in new_password):
            return jsonify({"error": "Password must contain at least one number"}), 400

        user.password_hash = generate_password_hash(data["new_password"])
        db.session.commit()

        return jsonify({
            "message": "Password changed successfully",
            "user": {
                "id": user.id,
                "email": user.email
            }
        })

    except Exception as e:
        current_app.logger.error(f"Password change error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to change password"}), 500


@auth.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify a user's email."""
    try:
        data = request.get_json()
        email = data.get("email")

        if not email:
            return jsonify({"error": "Missing email"}), 400

        # Find user by email
        user = next((u for u in User.query.all() if u.email == email), None)

        if user:
            if user.is_registered:
                return jsonify({"error": "Email already registered"}), 409

            return jsonify({
                "message": "Email verified, proceed to registration",
                "is_student": is_user_student(user),
            }), 200

        return jsonify({"error": "Institutional access required. Contact us to request institutional access."}), 403

    except Exception as e:
        current_app.logger.error(f"Email verification error: {str(e)}")
        return jsonify({"error": "Verification failed"}), 500


@auth.route('/update-profile', methods=['POST'])
@jwt_required()
def update_profile():
    """Update user's profile information."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        data = request.get_json()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Validate required fields
        if not all(k in data for k in ["first_name", "last_name"]):
            return jsonify({"error": "Missing required fields"}), 400

        # Update user profile information
        user.first_name = data["first_name"]
        user.last_name = data["last_name"]
        
        db.session.commit()

        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
        })

    except Exception as e:
        current_app.logger.error(f"Profile update error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to update profile"}), 500


@auth.route('/update-preferences', methods=['POST'])
@jwt_required()
def update_preferences():
    """Update user's preferences."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        data = request.get_json()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Update notification preferences if provided
        if "email_notifications" in data:
            user.email_notifications = data["email_notifications"]
        
        db.session.commit()

        return jsonify({
            "message": "Preferences updated successfully"
        })

    except Exception as e:
        current_app.logger.error(f"Preferences update error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to update preferences"}), 500


@auth.route('/deactivate-account', methods=['POST'])
@jwt_required()
def deactivate_account():
    """Deactivate user account but preserve data for research."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Mark user as inactive but don't delete
        user.is_active = False
        user.deactivated_at = datetime.now(timezone.utc)
        
        # Keep the account for research, but we don't need to anonymize since
        # sensitive data is already encrypted
        user.is_registered = False
        
        db.session.commit()

        return jsonify({
            "message": "Account deactivated successfully"
        })

    except Exception as e:
        current_app.logger.error(f"Account deactivation error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to deactivate account"}), 500
    

@auth.route('/update-profile-picture', methods=['POST'])
@jwt_required()
def update_profile_picture():
    """Update user's profile picture."""
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        data = request.get_json()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Validate profile picture selection
        if not data.get("profile_picture"):
            return jsonify({"error": "No profile picture selected"}), 400
            
        # List of valid profile pictures
        valid_pictures = [
            "apple.png", "blueberry.png", "lemon.png", "lychee.png", 
            "melon.png", "orange.png", "pear.png", "plum.png"
        ]
        
        # Ensure the selected picture is valid
        if data["profile_picture"] not in valid_pictures:
            return jsonify({"error": "Invalid profile picture selection"}), 400

        # Update the profile picture
        user.profile_picture = data["profile_picture"]
        db.session.commit()

        return jsonify({
            "message": "Profile picture updated successfully",
            "profile_picture": user.profile_picture,
            "profile_picture_url": user.profile_picture_url
        })

    except Exception as e:
        current_app.logger.error(f"Profile picture update error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to update profile picture"}), 500
    

@auth.route('/record-consent', methods=['POST'])
def record_consent():
    """Record user consent for research participation."""
    try:
        data = request.get_json()
        
        if not all(k in data for k in ['email', 'has_consented']):
            return jsonify({"error": "Missing required fields"}), 400
            
        # Find user by email
        user = next((u for u in User.query.all() if u.email == data["email"]), None)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Update consent information
        user.has_consented = data['has_consented']
        if user.has_consented:
            user.consent_date = datetime.now(timezone.utc)
            
        db.session.commit()
        
        return jsonify({
            "message": "Consent recorded successfully",
            "user_id": user.id,
            "has_consented": user.has_consented
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Record consent error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to record consent"}), 500