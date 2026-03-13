"""
Authentication middleware and JWT callbacks.
"""

from functools import wraps

from flask import current_app, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request

from app.extensions import db
from app.models.user import User
from app.utils.constants import HTTP_STATUS


def setup_jwt_callbacks(app, jwt):
    """Setup JWT callback functions."""
    print(f"🔧 Inside setup_jwt_callbacks")
    print(f"   jwt manager provided: {jwt is not None}")

    @jwt.user_identity_loader
    def user_identity_lookup(user):
        """Convert user ID to JWT identity."""
        if isinstance(user, User):
            return str(user.id)
        return str(user)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """Load user from JWT identity."""
        identity = jwt_data["sub"]
        try:
            return db.session.get(User, int(identity))
        except (ValueError, TypeError):
            return None

    @jwt.additional_claims_loader
    def add_claims_to_access_token(user):
        """Add additional claims to access token."""
        if isinstance(user, User):
            return {
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_admin": user.is_admin,
                "user_id": user.id,
            }
        return {}

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        """Handle expired tokens."""
        return (
            jsonify(
                {
                    "error": "token_expired",
                    "message": "Token expired. Please refresh or login again.",
                    "status_code": HTTP_STATUS.UNAUTHORIZED,
                }
            ),
            HTTP_STATUS.UNAUTHORIZED,
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """Handle invalid tokens."""
        return (
            jsonify(
                {
                    "error": "invalid_token",
                    "message": "The provided token is invalid or malformed.",
                    "status_code": HTTP_STATUS.UNAUTHORIZED,
                }
            ),
            HTTP_STATUS.UNAUTHORIZED,
        )

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """Handle missing tokens."""
        return (
            jsonify(
                {
                    "error": "authorization_required",
                    "message": "Authorization header with Bearer token is required.",
                    "status_code": HTTP_STATUS.UNAUTHORIZED,
                }
            ),
            HTTP_STATUS.UNAUTHORIZED,
        )

    @jwt.needs_fresh_token_loader
    def fresh_token_required_callback(jwt_header, jwt_data):
        """Handle requests requiring fresh tokens."""
        return (
            jsonify(
                {
                    "error": "fresh_token_required",
                    "message": "A fresh token is required for this operation. Please login again.",
                    "status_code": HTTP_STATUS.UNAUTHORIZED,
                }
            ),
            HTTP_STATUS.UNAUTHORIZED,
        )

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_data):
        """Handle revoked tokens."""
        return (
            jsonify(
                {
                    "error": "token_revoked",
                    "message": "This token has been revoked and is no longer valid.",
                    "status_code": HTTP_STATUS.UNAUTHORIZED,
                }
            ),
            HTTP_STATUS.UNAUTHORIZED,
        )

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_data):
        """Check if token is in blocklist."""
        # Check if token is in blocklist (you can implement this with Redis)
        # For now, return False (token not revoked)
        return False

    print("✅ JWT callbacks setup complete")


def admin_required():
    """
    Decorator to require admin role for an endpoint.

    Returns:
        Decorated function that requires admin access
    """

    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()

            if not claims.get("is_admin", False):
                return (
                    jsonify(
                        {
                            "error": "admin_required",
                            "message": "This endpoint requires administrator privileges.",
                            "status_code": HTTP_STATUS.FORBIDDEN,
                        }
                    ),
                    HTTP_STATUS.FORBIDDEN,
                )

            return fn(*args, **kwargs)

        return decorator

    return wrapper


def fresh_jwt_required():
    """
    Decorator to require fresh token for an endpoint.

    Returns:
        Decorated function that requires fresh JWT
    """

    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request(fresh=True)
            return fn(*args, **kwargs)

        return decorator

    return wrapper


def get_current_user():
    """
    Get the current authenticated user from JWT.

    Returns:
        User object or None
    """

    try:
        user_id = get_jwt_identity()
        if user_id:
            return db.session.get(User, int(user_id))
    except (ValueError, TypeError):
        pass
    return None


def verify_ownership(resource_user_id):
    """
    Verify that the current user owns the resource or is admin.

    Args:
        resource_user_id: User ID of the resource owner

    Returns:
        bool: True if user owns resource or is admin
    """

    try:
        current_user_id = int(get_jwt_identity())
        claims = get_jwt()

        # Admin can access any resource
        if claims.get("is_admin", False):
            return True

        # User must own the resource
        return current_user_id == resource_user_id

    except (ValueError, TypeError):
        return False


def verify_ownership_decorator(resource_user_id_func):
    """
    Decorator to verify resource ownership.

    Args:
        resource_user_id_func: Function that returns the resource owner's user ID

    Returns:
        Decorated function that verifies ownership
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            resource_user_id = resource_user_id_func(*args, **kwargs)

            if not verify_ownership(resource_user_id):
                return (
                    jsonify(
                        {
                            "error": "access_denied",
                            "message": "You do not have permission to access this resource.",
                            "status_code": HTTP_STATUS.FORBIDDEN,
                        }
                    ),
                    HTTP_STATUS.FORBIDDEN,
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def token_required(f):
    """
    Decorator to require valid token (alternative to jwt_required).

    Args:
        f: Function to decorate

    Returns:
        Decorated function
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        return f(*args, **kwargs)

    return decorated
