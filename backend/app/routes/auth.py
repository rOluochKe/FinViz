"""
Authentication routes with Flask-RESTX.
"""

from datetime import datetime, timedelta

from flask import request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from flask_restx import Namespace, Resource, fields
from sqlalchemy.orm.attributes import flag_modified

from app.extensions import db
from app.models.user import User
from app.schemas.user_schema import UserSchema
from app.utils.constants import HTTP_STATUS
from app.utils.validators import validate_password_strength

# Create namespace
auth_ns = Namespace("auth", description="Authentication operations")

# ============================================================================
# Model Definitions (Auto-generated in Swagger)
# ============================================================================

user_model = auth_ns.model(
    "User",
    {
        "id": fields.Integer(description="User ID", example=1),
        "username": fields.String(description="Username", example="johndoe"),
        "email": fields.String(description="Email address", example="john@example.com"),
        "first_name": fields.String(description="First name", example="John"),
        "last_name": fields.String(description="Last name", example="Doe"),
        "full_name": fields.String(description="Full name", example="John Doe"),
        "role": fields.String(
            description="User role", example="user", enum=["user", "admin"]
        ),
        "status": fields.String(
            description="Account status",
            example="active",
            enum=["active", "inactive", "suspended"],
        ),
        "email_verified": fields.Boolean(description="Email verified", example=True),
        "created_at": fields.DateTime(description="Creation date"),
        "last_login": fields.DateTime(description="Last login", allow_null=True),
    },
)

register_model = auth_ns.model(
    "Register",
    {
        "username": fields.String(
            required=True,
            description="Username (letters, numbers, underscores only)",
            min_length=3,
            max_length=50,
            pattern="^[a-zA-Z0-9_]+$",
            example="johndoe",
        ),
        "email": fields.String(
            required=True, description="Email address", example="john@example.com"
        ),
        "password": fields.String(
            required=True,
            description="Password (min 8 chars, must contain uppercase, lowercase, number, special)",
            min_length=8,
            example="Test123!@#",
        ),
        "first_name": fields.String(
            description="First name", max_length=50, example="John"
        ),
        "last_name": fields.String(
            description="Last name", max_length=50, example="Doe"
        ),
    },
)

login_model = auth_ns.model(
    "Login",
    {
        "username": fields.String(
            required=True, description="Username or email", example="johndoe"
        ),
        "password": fields.String(
            required=True, description="Password", example="Test123!@#"
        ),
    },
)

token_model = auth_ns.model(
    "TokenResponse",
    {
        "access_token": fields.String(
            description="JWT access token (expires in 1 hour)",
            example="eyJhbGciOiJIUzI1NiIs...",
        ),
        "refresh_token": fields.String(
            description="JWT refresh token (expires in 30 days)",
            example="eyJhbGciOiJIUzI1NiIs...",
        ),
        "token_type": fields.String(description="Token type", example="bearer"),
        "expires_in": fields.Integer(
            description="Token expiration time in seconds", example=3600
        ),
    },
)

password_change_model = auth_ns.model(
    "PasswordChange",
    {
        "current_password": fields.String(
            required=True, description="Current password", example="Test123!@#"
        ),
        "new_password": fields.String(
            required=True, description="New password", example="NewTest123!@#"
        ),
    },
)

password_reset_model = auth_ns.model(
    "PasswordReset",
    {
        "email": fields.String(
            required=True, description="Email address", example="john@example.com"
        )
    },
)

password_reset_confirm_model = auth_ns.model(
    "PasswordResetConfirm",
    {
        "token": fields.String(
            required=True,
            description="Password reset token",
            example="reset_token_here",
        ),
        "new_password": fields.String(
            required=True, description="New password", example="NewTest123!@#"
        ),
    },
)

email_verify_model = auth_ns.model(
    "EmailVerification",
    {
        "token": fields.String(
            required=True,
            description="Email verification token",
            example="verify_token_here",
        )
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@auth_ns.route("/register")
class Register(Resource):
    @auth_ns.doc(
        description="Register a new user account",
        responses={
            201: "User created successfully",
            400: "Validation error",
            409: "Username or email already exists",
        },
    )
    @auth_ns.expect(register_model)
    # Remove marshal_with to return custom structure
    def post(self):
        """Create a new user account"""
        data = request.json

        # Validate password strength
        password_issues = validate_password_strength(data["password"])
        if password_issues:
            return {
                "error": "Validation error",
                "details": {"password": password_issues},
            }, HTTP_STATUS.BAD_REQUEST

        # Check existing user
        if User.query.filter_by(username=data["username"]).first():
            return {"error": "Username already exists"}, HTTP_STATUS.CONFLICT

        if User.query.filter_by(email=data["email"]).first():
            return {"error": "Email already exists"}, HTTP_STATUS.CONFLICT

        # Create user
        user = User(
            username=data["username"],
            email=data["email"],
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
        )
        user.set_password(data["password"])

        db.session.add(user)
        db.session.commit()

        # Generate tokens
        tokens = user.generate_auth_tokens()

        return {
            "message": "User created successfully",
            "user": UserSchema().dump(user),
            "tokens": tokens,
        }, HTTP_STATUS.CREATED


@auth_ns.route("/login")
class Login(Resource):
    @auth_ns.doc(
        description="Authenticate user and get access tokens",
        responses={
            200: "Login successful",
            401: "Invalid credentials",
            403: "Account deactivated",
        },
    )
    @auth_ns.expect(login_model)
    # Remove the marshal_with decorator since we're returning a custom structure
    def post(self):
        """Login and receive JWT tokens"""
        data = request.json

        user = User.query.filter(
            db.or_(User.username == data["username"], User.email == data["username"])
        ).first()

        if not user or not user.check_password(data["password"]):
            return {"error": "Invalid username or password"}, HTTP_STATUS.UNAUTHORIZED

        if not user.is_active:
            return {"error": "Account deactivated"}, HTTP_STATUS.FORBIDDEN

        user.last_login = datetime.utcnow()
        db.session.commit()

        tokens = user.generate_auth_tokens()
        return {"tokens": tokens}, HTTP_STATUS.OK


@auth_ns.route("/refresh")
class Refresh(Resource):
    @auth_ns.doc(
        description="Get a new access token using a refresh token",
        security="Bearer Auth",
        responses={
            200: "Token refreshed successfully",
            401: "Invalid or expired refresh token",
        },
    )
    @jwt_required(refresh=True)
    def post(self):
        """Refresh access token"""
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user or not user.is_active:
            auth_ns.abort(HTTP_STATUS.UNAUTHORIZED, "User not found or inactive")

        # Create new access token
        access_token = create_access_token(
            identity=current_user_id,
            additional_claims={
                "username": user.username,
                "role": user.role,
                "is_admin": user.is_admin,
            },
        )

        return {"access_token": access_token}, HTTP_STATUS.OK


@auth_ns.route("/logout")
class Logout(Resource):
    @auth_ns.doc(
        description="Logout user (client-side token discard)",
        security="Bearer Auth",
        responses={200: "Logout successful"},
    )
    @jwt_required()
    def post(self):
        """Logout (client-side only)"""
        return {"message": "Logged out"}, HTTP_STATUS.OK


@auth_ns.route("/me")
class Me(Resource):
    @auth_ns.doc(
        description="Get current authenticated user information",
        security="Bearer Auth",
        responses={
            200: "User information retrieved",
            401: "Authentication required",
            404: "User not found",
        },
    )
    @jwt_required()
    def get(self):
        """Get current user profile"""
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)

        if not user:
            return {"error": "User not found"}, HTTP_STATUS.NOT_FOUND

        return {"user": UserSchema().dump(user)}, HTTP_STATUS.OK

    @auth_ns.doc(
        description="Update current user information",
        security="Bearer Auth",
        responses={
            200: "User updated successfully",
            401: "Authentication required",
            404: "User not found",
        },
    )
    @jwt_required()
    def put(self):
        """Update current user"""
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)

        if not user:
            return {"error": "User not found"}, HTTP_STATUS.NOT_FOUND

        data = request.json or {}

        print(f"Received update data: {data}")

        if "first_name" in data:
            user.first_name = data["first_name"]
            print(f"Updated first_name to: {user.first_name}")

        if "last_name" in data:
            user.last_name = data["last_name"]
            print(f"Updated last_name to: {user.last_name}")

        # Handle preferences update - FIXED VERSION with flag_modified
        if "preferences" in data and data["preferences"] is not None:
            print(f"Preferences update requested: {data['preferences']}")

            if isinstance(data["preferences"], dict):
                # Get current preferences or initialize empty dict
                current_prefs = dict(user.preferences) if user.preferences else {}

                # Update with new preferences
                current_prefs.update(data["preferences"])

                # Assign the updated dict
                user.preferences = current_prefs

                # CRITICAL: Mark the field as modified so SQLAlchemy knows to persist it
                flag_modified(user, "preferences")

                print(f"Updated preferences to: {user.preferences}")
                print("Marked preferences as modified")

        # Commit the changes
        db.session.commit()
        print("Changes committed to database")

        # Force a refresh from the database
        db.session.refresh(user)
        print(f"After refresh - preferences: {user.preferences}")

        # Serialize and return
        schema = UserSchema()
        serialized_user = schema.dump(user)
        print(f"Returning user with preferences: {serialized_user.get('preferences')}")

        return {"user": serialized_user}, HTTP_STATUS.OK


@auth_ns.route("/change-password")
class ChangePassword(Resource):
    @auth_ns.doc(
        description="Change password for authenticated user",
        security="Bearer Auth",
        responses={
            200: "Password changed successfully",
            400: "Validation error",
            401: "Current password incorrect",
        },
    )
    @auth_ns.expect(password_change_model)
    @jwt_required()
    def post(self):
        """Change password"""
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        data = request.json

        if not user.check_password(data["current_password"]):
            return {"error": "Current password incorrect"}, HTTP_STATUS.UNAUTHORIZED

        user.set_password(data["new_password"])
        db.session.commit()

        return {"message": "Password changed successfully"}, HTTP_STATUS.OK


@auth_ns.route("/forgot-password")
class ForgotPassword(Resource):
    @auth_ns.doc(
        description="Request password reset email",
        responses={200: "If email exists, reset link sent"},
    )
    @auth_ns.expect(password_reset_model)
    def post(self):
        """Request password reset"""
        data = request.json
        user = User.query.filter_by(email=data["email"]).first()

        if user:
            # Generate reset token
            token = user.generate_reset_token()
            db.session.commit()
            # TODO: Send email with token

        return {"message": "If email exists, reset link sent"}, HTTP_STATUS.OK


@auth_ns.route("/reset-password")
class ResetPassword(Resource):
    @auth_ns.doc(
        description="Reset password with token",
        responses={200: "Password reset successful", 400: "Invalid or expired token"},
    )
    @auth_ns.expect(password_reset_confirm_model)
    def post(self):
        """Reset password"""
        data = request.json

        # Find user by token
        user = User.query.filter_by(reset_token=data["token"]).first()

        if not user:
            auth_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid token")

        if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
            auth_ns.abort(HTTP_STATUS.BAD_REQUEST, "Token expired")

        user.set_password(data["new_password"])
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()

        return {"message": "Password reset successful"}, HTTP_STATUS.OK


@auth_ns.route("/verify-email")
class VerifyEmail(Resource):
    @auth_ns.doc(
        description="Verify email address with token",
        responses={200: "Email verified successfully", 400: "Invalid or expired token"},
    )
    @auth_ns.expect(email_verify_model)
    def post(self):
        """Verify email"""
        data = request.json

        user = User.query.filter_by(verification_token=data["token"]).first()

        if not user:
            auth_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid token")

        if (
            user.verification_token_expires
            and user.verification_token_expires < datetime.utcnow()
        ):
            auth_ns.abort(HTTP_STATUS.BAD_REQUEST, "Token expired")

        user.email_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        db.session.commit()

        return {"message": "Email verified"}, HTTP_STATUS.OK


@auth_ns.route("/deactivate")
class Deactivate(Resource):
    @auth_ns.doc(
        description="Deactivate current user account",
        security="Bearer Auth",
        responses={200: "Account deactivated"},
    )
    @jwt_required()
    def post(self):
        """Deactivate account"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        user.status = "inactive"
        db.session.commit()

        return {"message": "Account deactivated"}, HTTP_STATUS.OK
