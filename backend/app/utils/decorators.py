"""
Custom decorators for the application.
"""

import time
from functools import wraps
from typing import Callable

from flask import current_app, jsonify, request
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from marshmallow import ValidationError

from app.extensions import limiter
from app.utils.constants import HTTP_STATUS


def admin_required(f: Callable) -> Callable:
    """
    Decorator to require admin role.

    Args:
        f: Function to wrap

    Returns:
        Wrapped function that requires admin access
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if not claims.get("is_admin", False):
            return (
                jsonify(
                    {
                        "error": "Admin access required",
                        "message": "This endpoint requires administrator privileges",
                    }
                ),
                HTTP_STATUS.FORBIDDEN,
            )
        return f(*args, **kwargs)

    return decorated_function


def validate_request(schema_class):
    """
    Decorator to validate request data against a Marshmallow schema.

    Args:
        schema_class: Marshmallow schema class

    Returns:
        Decorated function with validated data in request.validated_data
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            schema = schema_class()

            # Get request data based on content type
            if request.is_json:
                data = request.get_json() or {}
            elif request.form:
                data = request.form.to_dict()
            else:
                data = request.args.to_dict()

            # Handle file uploads
            if request.files:
                data["files"] = request.files

            try:
                # Validate data
                validated_data = schema.load(data)
                request.validated_data = validated_data
            except ValidationError as e:
                return (
                    jsonify(
                        {
                            "error": "Validation error",
                            "message": "The request data failed validation",
                            "details": e.messages,
                        }
                    ),
                    HTTP_STATUS.BAD_REQUEST,
                )

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def paginate(default_page=1, default_per_page=20, max_per_page=100):
    """
    Decorator to handle pagination parameters.

    Args:
        default_page: Default page number
        default_per_page: Default items per page
        max_per_page: Maximum items per page

    Returns:
        Decorated function with pagination context
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get pagination parameters
            try:
                page = int(request.args.get("page", default_page))
                if page < 1:
                    page = default_page
            except (TypeError, ValueError):
                page = default_page

            try:
                per_page = int(request.args.get("per_page", default_per_page))
                per_page = min(per_page, max_per_page)
                if per_page < 1:
                    per_page = default_per_page
            except (TypeError, ValueError):
                per_page = default_per_page

            # Add to request context
            request.pagination = {"page": page, "per_page": per_page}

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def timing(f: Callable) -> Callable:
    """
    Decorator to measure function execution time.

    Args:
        f: Function to measure

    Returns:
        Wrapped function that logs execution time
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        start = time.time()
        result = f(*args, **kwargs)
        end = time.time()

        current_app.logger.debug(
            f"{f.__name__} took {(end - start) * 1000:.2f}ms to execute"
        )

        return result

    return decorated


def cache_control(max_age=300, public=True):
    """
    Decorator to set cache control headers.

    Args:
        max_age: Maximum age in seconds
        public: Whether response is public

    Returns:
        Decorated function with cache headers
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            response = f(*args, **kwargs)

            if isinstance(response, tuple):
                response_obj, status_code = response
            else:
                response_obj, status_code = response, 200

            cache_control = f"{'public' if public else 'private'}, max-age={max_age}"

            if hasattr(response_obj, "headers"):
                response_obj.headers["Cache-Control"] = cache_control
                response_obj.headers["Expires"] = time.strftime(
                    "%a, %d %b %Y %H:%M:%S GMT", time.gmtime(time.time() + max_age)
                )

            return response_obj, status_code

        return decorated_function

    return decorator


def rate_limit(limit_string: str):
    """
    Decorator to apply rate limiting.

    Args:
        limit_string: Rate limit string (e.g., "10 per minute")

    Returns:
        Decorated function with rate limiting
    """

    def decorator(f):
        @wraps(f)
        @limiter.limit(limit_string)
        def decorated_function(*args, **kwargs):
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def handle_errors(f: Callable) -> Callable:
    """
    Decorator to handle common exceptions.

    Args:
        f: Function to wrap

    Returns:
        Wrapped function with error handling
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValidationError as e:
            return (
                jsonify(
                    {
                        "error": "Validation error",
                        "message": str(e),
                        "details": e.messages if hasattr(e, "messages") else None,
                    }
                ),
                HTTP_STATUS.BAD_REQUEST,
            )
        except PermissionError as e:
            return (
                jsonify({"error": "Permission denied", "message": str(e)}),
                HTTP_STATUS.FORBIDDEN,
            )
        except ValueError as e:
            return (
                jsonify({"error": "Invalid value", "message": str(e)}),
                HTTP_STATUS.BAD_REQUEST,
            )
        except KeyError as e:
            return (
                jsonify(
                    {
                        "error": "Missing field",
                        "message": f"Required field '{e}' is missing",
                    }
                ),
                HTTP_STATUS.BAD_REQUEST,
            )
        except Exception as e:
            current_app.logger.error(
                f"Unexpected error in {f.__name__}: {str(e)}", exc_info=True
            )
            return (
                jsonify(
                    {
                        "error": "Internal server error",
                        "message": "An unexpected error occurred. Our team has been notified.",
                    }
                ),
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
            )

    return decorated_function


def fresh_jwt_required(f: Callable) -> Callable:
    """
    Decorator to require fresh token.

    Args:
        f: Function to wrap

    Returns:
        Wrapped function that requires fresh JWT
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request(fresh=True)
        return f(*args, **kwargs)

    return decorated_function


def deprecated(version=None, alternative=None):
    """
    Decorator to mark a function as deprecated.

    Args:
        version: Version when it was deprecated
        alternative: Alternative function/method to use

    Returns:
        Decorated function that logs deprecation warning
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            message = f"WARNING: {f.__name__} is deprecated"
            if version:
                message += f" since version {version}"
            if alternative:
                message += f". Use {alternative} instead"

            current_app.logger.warning(message)
            print(message)  # Also print to console for visibility

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def retry(max_attempts=3, delay=1, backoff=2, exceptions=(Exception,)):
    """
    Decorator to retry a function on failure.

    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay between retries (seconds)
        backoff: Backoff multiplier
        exceptions: Tuple of exceptions to catch

    Returns:
        Decorated function with retry logic
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            attempt = 1
            current_delay = delay

            while attempt <= max_attempts:
                try:
                    return f(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts:
                        raise

                    current_app.logger.warning(
                        f"Attempt {attempt} failed for {f.__name__}: {str(e)}. "
                        f"Retrying in {current_delay}s..."
                    )

                    time.sleep(current_delay)
                    current_delay *= backoff
                    attempt += 1

            return None  # Should never reach here

        return decorated_function

    return decorator
