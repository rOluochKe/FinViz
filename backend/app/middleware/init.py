"""
Middleware package initialization.
"""

from app.middleware.auth import admin_required, fresh_jwt_required, setup_jwt_callbacks
from app.middleware.error_handler import register_error_handlers
from app.middleware.rate_limiter import RATE_LIMITS, get_rate_limit_key, limiter

__all__ = [
    "setup_jwt_callbacks",
    "admin_required",
    "fresh_jwt_required",
    "register_error_handlers",
    "limiter",
    "RATE_LIMITS",
    "get_rate_limit_key",
]
