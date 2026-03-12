"""
User schemas for serialization and validation.
"""

from marshmallow import Schema, ValidationError, fields, post_load, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from app.models.user import User
from app.utils.validators import validate_password_strength


class PasswordField(fields.Field):
    """Custom password field with validation."""

    def _deserialize(self, value, attr, data, **kwargs):
        if not value:
            raise ValidationError("Password is required")

        issues = validate_password_strength(value)
        if issues:
            raise ValidationError(
                f"Password must meet requirements: {', '.join(issues)}"
            )

        return value


class UserSchema(SQLAlchemyAutoSchema):
    """Schema for user serialization."""

    class Meta:
        model = User
        load_instance = True
        include_fk = True
        exclude = ("password_hash", "verification_token", "reset_token")

    id = fields.Integer(dump_only=True)
    username = fields.String(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    first_name = fields.String(allow_none=True, validate=validate.Length(max=50))
    last_name = fields.String(allow_none=True, validate=validate.Length(max=50))
    role = fields.String(dump_only=True)
    status = fields.String(dump_only=True)
    preferences = fields.Dict(dump_only=True)
    email_verified = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")
    last_login = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")

    # Computed fields
    full_name = fields.String(dump_only=True)
    is_active = fields.Boolean(dump_only=True)
    is_admin = fields.Boolean(dump_only=True)


class UserCreateSchema(Schema):
    """Schema for user creation."""

    username = fields.String(
        required=True,
        validate=[
            validate.Length(min=3, max=50),
            validate.Regexp(
                r"^[a-zA-Z0-9_]+$",
                error="Username can only contain letters, numbers, and underscores",
            ),
        ],
    )
    email = fields.Email(required=True)
    password = PasswordField(required=True)
    first_name = fields.String(allow_none=True, validate=validate.Length(max=50))
    last_name = fields.String(allow_none=True, validate=validate.Length(max=50))

    @post_load
    def validate_unique(self, data, **kwargs):
        """Validate that username and email are unique."""
        if User.query.filter_by(username=data["username"]).first():
            raise ValidationError("Username already exists", "username")

        if User.query.filter_by(email=data["email"]).first():
            raise ValidationError("Email already exists", "email")

        return data


class UserUpdateSchema(Schema):
    """Schema for user updates."""

    first_name = fields.String(allow_none=True, validate=validate.Length(max=50))
    last_name = fields.String(allow_none=True, validate=validate.Length(max=50))
    preferences = fields.Dict(allow_none=True)

    @post_load
    def validate_preferences(self, data, **kwargs):
        """Validate preferences structure."""
        if "preferences" in data:
            prefs = data["preferences"]
            valid_keys = {"currency", "theme", "language", "notifications", "dashboard"}

            for key in prefs.keys():
                if key not in valid_keys:
                    raise ValidationError(f"Invalid preference key: {key}")

        return data

    @post_load
    def validate_at_least_one(self, data, **kwargs):
        """Ensure at least one field is provided."""
        if not data:
            raise ValidationError("At least one field must be provided")
        return data


class UserLoginSchema(Schema):
    """Schema for user login."""

    username = fields.String(required=True, description="Username or email")
    password = fields.String(required=True, load_only=True)


class PasswordChangeSchema(Schema):
    """Schema for password change."""

    current_password = fields.String(required=True, load_only=True)
    new_password = PasswordField(required=True)

    @post_load
    def validate_different(self, data, **kwargs):
        """Validate that new password is different from current."""
        if data["current_password"] == data["new_password"]:
            raise ValidationError(
                "New password must be different from current password"
            )
        return data


class PasswordResetSchema(Schema):
    """Schema for password reset request."""

    email = fields.Email(required=True)


class PasswordResetConfirmSchema(Schema):
    """Schema for password reset confirmation."""

    token = fields.String(required=True)
    new_password = PasswordField(required=True)


class EmailVerificationSchema(Schema):
    """Schema for email verification."""

    token = fields.String(required=True)


class TokenResponseSchema(Schema):
    """Schema for token response."""

    access_token = fields.String(required=True)
    refresh_token = fields.String(required=True)
    token_type = fields.String(required=True)
    expires_in = fields.Integer(required=True)
