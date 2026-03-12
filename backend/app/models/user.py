"""
User model for authentication and user management.
"""

from datetime import datetime

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import CheckConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


class User(db.Model):
    """
    User model representing application users.

    Attributes:
        id: Primary key
        username: Unique username
        email: Unique email address
        password_hash: Hashed password
        first_name: User's first name
        last_name: User's last name
        role: User role (admin, user)
        status: Account status (active, inactive, suspended)
        preferences: JSONB field for user preferences
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
        last_login: Timestamp of last login
        email_verified: Whether email is verified
        verification_token: Email verification token
        reset_token: Password reset token
        reset_token_expires: Reset token expiration
    """

    __tablename__ = "users"

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Authentication fields
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Personal information
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))

    # Account management
    role = db.Column(db.String(20), default="user", nullable=False)
    status = db.Column(db.String(20), default="active", nullable=False)

    # Preferences (JSONB for flexibility)
    preferences = db.Column(
        JSONB,
        default={
            "currency": "USD",
            "theme": "light",
            "language": "en",
            "notifications": {"email": True, "budget_alerts": True},
            "dashboard": {
                "default_view": "monthly",
                "chart_type": "line",
                "show_recent": 10,
            },
        },
    )

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_login = db.Column(db.DateTime)

    # Email verification
    email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), unique=True)
    verification_token_expires = db.Column(db.DateTime)

    # Password reset
    reset_token = db.Column(db.String(100), unique=True)
    reset_token_expires = db.Column(db.DateTime)

    # Relationships
    transactions = db.relationship(
        "Transaction", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    budgets = db.relationship(
        "Budget", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    monthly_stats = db.relationship(
        "MonthlyStat", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_user_status", "status"),
        Index("idx_user_role", "role"),
        Index("idx_user_created", "created_at"),
        CheckConstraint("role IN ('admin', 'user')", name="check_valid_role"),
        CheckConstraint(
            "status IN ('active', 'inactive', 'suspended')", name="check_valid_status"
        ),
    )

    @property
    def full_name(self):
        """Return user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    @property
    def is_active(self):
        """Check if user account is active."""
        return self.status == "active"

    @property
    def is_admin(self):
        """Check if user has admin role."""
        return self.role == "admin"

    def set_password(self, password):
        """
        Set password hash.

        Args:
            password: Plain text password
        """
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        """
        Verify password.

        Args:
            password: Plain text password to verify

        Returns:
            bool: True if password matches
        """
        return check_password_hash(self.password_hash, password)

    def generate_auth_tokens(self):
        """
        Generate JWT access and refresh tokens.

        Returns:
            dict: Access and refresh tokens
        """
        access_token = create_access_token(
            identity=str(self.id),
            additional_claims={
                "username": self.username,
                "email": self.email,
                "role": self.role,
                "is_admin": self.is_admin,
            },
            fresh=True,
        )

        refresh_token = create_refresh_token(
            identity=str(self.id), additional_claims={"type": "refresh"}
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": current_app.config[
                "JWT_ACCESS_TOKEN_EXPIRES"
            ].total_seconds(),
        }

    def generate_verification_token(self):
        """
        Generate email verification token.

        Returns:
            str: Verification token
        """
        serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
        return serializer.dumps(self.email, salt="email-verification")

    def verify_email(self, token, expiration=86400):
        """
        Verify email with token.

        Args:
            token: Verification token
            expiration: Token expiration in seconds

        Returns:
            bool: True if verified successfully
        """

        serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
        try:
            email = serializer.loads(
                token, salt="email-verification", max_age=expiration
            )
            if email != self.email:
                return False

            self.email_verified = True
            self.verification_token = None
            self.verification_token_expires = None
            return True

        except (SignatureExpired, BadSignature):
            return False

    def generate_reset_token(self):
        """
        Generate password reset token.

        Returns:
            str: Reset token
        """
        serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
        return serializer.dumps(self.email, salt="password-reset")

    def verify_reset_token(self, token, new_password, expiration=3600):
        """
        Verify reset token and set new password.

        Args:
            token: Reset token
            new_password: New password
            expiration: Token expiration in seconds

        Returns:
            bool: True if reset successful
        """
        serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
        try:
            email = serializer.loads(token, salt="password-reset", max_age=expiration)
            if email != self.email:
                return False

            self.set_password(new_password)
            self.reset_token = None
            self.reset_token_expires = None
            return True

        except (SignatureExpired, BadSignature):
            return False

    def update_last_login(self):
        """Update last login timestamp."""
        self.last_login = datetime.utcnow()
        db.session.commit()

    def to_dict(self, include_sensitive=False):
        """
        Convert user to dictionary.

        Args:
            include_sensitive: Include sensitive fields

        Returns:
            dict: User data
        """
        data = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role": self.role,
            "status": self.status,
            "preferences": self.preferences,
            "email_verified": self.email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

        if include_sensitive:
            data.update(
                {
                    "password_hash": self.password_hash,
                    "verification_token": self.verification_token,
                    "reset_token": self.reset_token,
                }
            )

        return data

    def __repr__(self):
        return f"<User {self.username}>"
