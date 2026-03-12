"""
Rate limiting configuration and utilities.
"""

import time
from functools import wraps

from flask import current_app, jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import get_jwt_identity, get_jwt, get_jwt_identity

from app.utils.constants import HTTP_STATUS


def get_rate_limit_key():
    """
    Get rate limit key based on user if authenticated.

    Returns:
        Rate limit key string
    """

    # Try to get authenticated user
    try:
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except BaseException:
        pass

    # Fall back to IP address
    return get_remote_address()


def get_user_rate_limit():
    """
    Get rate limit for authenticated users vs anonymous.

    Returns:
        Rate limit string
    """

    try:
        user_id = get_jwt_identity()
        if user_id:
            return RATE_LIMITS["user"]["default"]
    except BaseException:
        pass

    return RATE_LIMITS["anonymous"]["default"]


# Rate limit configurations
RATE_LIMITS = {
    "auth": {
        "login": "10 per minute",
        "register": "5 per hour",
        "forgot_password": "3 per hour",
        "verify_email": "10 per hour",
        "refresh": "20 per minute",
    },
    "api": {
        "default": "100 per minute",
        "analytics": "30 per minute",
        "export": "10 per hour",
        "bulk_operations": "20 per hour",
        "dashboard": "60 per minute",
    },
    "user": {"default": "200 per minute", "admin": "500 per minute"},
    "anonymous": {"default": "50 per minute", "strict": "10 per minute"},
    "admin": {"default": "500 per minute", "sensitive": "50 per minute"},
}


# Initialize limiter
limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=[RATE_LIMITS["anonymous"]["default"]],
    storage_uri="redis://localhost:6379/0",  # Will be overridden by config
    strategy="fixed-window",  # fixed-window, moving-window, or redis
    headers_enabled=True,
    retry_after="http-date",
    default_limits_exempt_when=lambda: request.path == "/health",
)


def rate_limit_decorator(limit_string, scope=None):
    """
    Custom rate limit decorator with error handling.

    Args:
        limit_string: Rate limit string (e.g., "10 per minute")
        scope: Optional scope for the rate limit

    Returns:
        Decorated function
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Apply rate limiting
            limited_func = limiter.limit(limit_string)(f)

            try:
                return limited_func(*args, **kwargs)
            except Exception as e:
                # Handle rate limit exceeded gracefully
                if "ratelimit" in str(e).lower():
                    return (
                        jsonify(
                            {
                                "error": "rate_limit_exceeded",
                                "message": "Too many requests. Please try again later.",
                                "limit": limit_string,
                                "status_code": HTTP_STATUS.TOO_MANY_REQUESTS,
                            }
                        ),
                        HTTP_STATUS.TOO_MANY_REQUESTS,
                    )
                raise e

        return decorated_function

    return decorator


def dynamic_rate_limit():
    """
    Dynamic rate limit based on user role and endpoint.

    Returns:
        Rate limit string
    """

    # Check if user is authenticated
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return RATE_LIMITS["anonymous"]["default"]

        # Check if user is admin
        claims = get_jwt()
        if claims.get("is_admin", False):
            return RATE_LIMITS["admin"]["default"]

        # Check endpoint type
        endpoint = request.endpoint or ""
        if "analytics" in endpoint:
            return RATE_LIMITS["api"]["analytics"]
        elif "export" in endpoint:
            return RATE_LIMITS["api"]["export"]
        elif "bulk" in endpoint:
            return RATE_LIMITS["api"]["bulk_operations"]
        elif "dashboard" in endpoint:
            return RATE_LIMITS["api"]["dashboard"]

        return RATE_LIMITS["user"]["default"]

    except BaseException:
        return RATE_LIMITS["anonymous"]["default"]


class RateLimitExceeded(Exception):
    """Custom exception for rate limit exceeded."""


def rate_limit_headers(response, limit, remaining, reset):
    """
    Add rate limit headers to response.

    Args:
        response: Flask response object
        limit: Rate limit value
        remaining: Remaining requests
        reset: Reset time

    Returns:
        Response with headers
    """
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset)
    return response


def setup_rate_limiting(app):
    """
    Configure rate limiting for the application.

    Args:
        app: Flask application instance
    """
    # Configure limiter with app settings
    limiter.enabled = app.config.get("RATELIMIT_ENABLED", True)
    limiter.storage_uri = app.config.get(
        "RATELIMIT_STORAGE_URL", "redis://localhost:6379/0"
    )
    limiter.strategy = app.config.get("RATELIMIT_STRATEGY", "fixed-window")

    # Initialize with app
    limiter.init_app(app)

    app.logger.info(f"Rate limiting initialized with storage: {limiter.storage_uri}")


# Pre-defined rate limiters for common use cases

# Authentication rate limiters
login_limiter = limiter.limit(RATE_LIMITS["auth"]["login"])
register_limiter = limiter.limit(RATE_LIMITS["auth"]["register"])
forgot_password_limiter = limiter.limit(RATE_LIMITS["auth"]["forgot_password"])
verify_email_limiter = limiter.limit(RATE_LIMITS["auth"]["verify_email"])
refresh_limiter = limiter.limit(RATE_LIMITS["auth"]["refresh"])

# API rate limiters
api_limiter = limiter.limit(RATE_LIMITS["api"]["default"])
analytics_limiter = limiter.limit(RATE_LIMITS["api"]["analytics"])
export_limiter = limiter.limit(RATE_LIMITS["api"]["export"])
bulk_limiter = limiter.limit(RATE_LIMITS["api"]["bulk_operations"])
dashboard_limiter = limiter.limit(RATE_LIMITS["api"]["dashboard"])

# Admin rate limiters
admin_limiter = limiter.limit(RATE_LIMITS["admin"]["default"])
admin_sensitive_limiter = limiter.limit(RATE_LIMITS["admin"]["sensitive"])


def track_rate_limit_metrics(f):
    """
    Decorator to track rate limit metrics.

    Args:
        f: Function to decorate

    Returns:
        Decorated function with metrics
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()

        try:
            response = f(*args, **kwargs)

            # Log rate limit metrics (if you have a metrics system)
            duration = time.time() - start_time

            current_app.logger.debug(
                f"Rate limit check: {request.endpoint} " f"took {duration*1000:.2f}ms"
            )

            return response

        except Exception as e:
            current_app.logger.error(f"Rate limit error: {str(e)}")
            raise e

    return decorated_function
