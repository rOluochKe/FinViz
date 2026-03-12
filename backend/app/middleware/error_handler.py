"""
Global error handling middleware.
"""

import traceback

from flask import jsonify
from jwt.exceptions import PyJWTError
from marshmallow import ValidationError
from sqlalchemy.exc import DataError, IntegrityError, SQLAlchemyError
from werkzeug.exceptions import HTTPException

from app.extensions import db
from app.utils.constants import HTTP_STATUS


def register_error_handlers(app):
    """Register error handlers for the application."""

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        """Handle Marshmallow validation errors."""
        app.logger.warning(f"Validation error: {error}")

        return (
            jsonify(
                {
                    "error": "validation_error",
                    "message": "The request data failed validation.",
                    "details": (
                        error.messages if hasattr(error, "messages") else str(error)
                    ),
                    "status_code": HTTP_STATUS.BAD_REQUEST,
                }
            ),
            HTTP_STATUS.BAD_REQUEST,
        )

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        """Handle database integrity errors."""
        db.session.rollback()
        app.logger.error(f"Database integrity error: {str(error)}")

        # Check for specific constraint violations
        error_str = str(error).lower()

        if "unique constraint" in error_str or "duplicate key" in error_str:
            return (
                jsonify(
                    {
                        "error": "duplicate_entry",
                        "message": "A record with this information already exists.",
                        "details": "Duplicate entry violates unique constraint.",
                        "status_code": HTTP_STATUS.CONFLICT,
                    }
                ),
                HTTP_STATUS.CONFLICT,
            )

        if "foreign key constraint" in error_str:
            return (
                jsonify(
                    {
                        "error": "reference_error",
                        "message": "This operation references a record that does not exist.",
                        "details": "Foreign key constraint violation.",
                        "status_code": HTTP_STATUS.BAD_REQUEST,
                    }
                ),
                HTTP_STATUS.BAD_REQUEST,
            )

        if "not null" in error_str:
            return (
                jsonify(
                    {
                        "error": "missing_required",
                        "message": "A required field cannot be null.",
                        "details": "Not null constraint violation.",
                        "status_code": HTTP_STATUS.BAD_REQUEST,
                    }
                ),
                HTTP_STATUS.BAD_REQUEST,
            )

        return (
            jsonify(
                {
                    "error": "database_error",
                    "message": "A database integrity error occurred.",
                    "details": str(error) if app.debug else None,
                    "status_code": HTTP_STATUS.BAD_REQUEST,
                }
            ),
            HTTP_STATUS.BAD_REQUEST,
        )

    @app.errorhandler(DataError)
    def handle_data_error(error):
        """Handle database data errors (invalid data types, etc.)."""
        db.session.rollback()
        app.logger.error(f"Database data error: {str(error)}")

        return (
            jsonify(
                {
                    "error": "data_error",
                    "message": "Invalid data format or type.",
                    "details": str(error) if app.debug else None,
                    "status_code": HTTP_STATUS.BAD_REQUEST,
                }
            ),
            HTTP_STATUS.BAD_REQUEST,
        )

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error):
        """Handle general database errors."""
        db.session.rollback()
        app.logger.error(f"Database error: {str(error)}", exc_info=True)

        return (
            jsonify(
                {
                    "error": "database_error",
                    "message": "An error occurred while processing your request.",
                    "details": str(error) if app.debug else None,
                    "status_code": HTTP_STATUS.INTERNAL_SERVER_ERROR,
                }
            ),
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
        )

    @app.errorhandler(PyJWTError)
    def handle_jwt_error(error):
        """Handle JWT errors."""
        app.logger.warning(f"JWT error: {str(error)}")

        return (
            jsonify(
                {
                    "error": "authentication_error",
                    "message": "Invalid authentication token.",
                    "details": str(error) if app.debug else None,
                    "status_code": HTTP_STATUS.UNAUTHORIZED,
                }
            ),
            HTTP_STATUS.UNAUTHORIZED,
        )

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        """Handle HTTP exceptions."""
        response = jsonify(
            {
                "error": error.name.lower().replace(" ", "_"),
                "message": error.description,
                "status_code": error.code,
            }
        )
        response.status_code = error.code
        return response

    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 errors."""
        return (
            jsonify(
                {
                    "error": "not_found",
                    "message": "The requested resource was not found.",
                    "status_code": HTTP_STATUS.NOT_FOUND,
                }
            ),
            HTTP_STATUS.NOT_FOUND,
        )

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 errors."""
        return (
            jsonify(
                {
                    "error": "method_not_allowed",
                    "message": "The HTTP method is not allowed for this endpoint.",
                    "status_code": HTTP_STATUS.METHOD_NOT_ALLOWED,
                }
            ),
            HTTP_STATUS.METHOD_NOT_ALLOWED,
        )

    @app.errorhandler(429)
    def handle_rate_limit(error):
        """Handle rate limit errors."""
        return (
            jsonify(
                {
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": getattr(error, "retry_after", None),
                    "status_code": HTTP_STATUS.TOO_MANY_REQUESTS,
                }
            ),
            HTTP_STATUS.TOO_MANY_REQUESTS,
        )

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Handle all other unhandled exceptions."""
        # Log full traceback
        app.logger.error(f"Unhandled error: {traceback.format_exc()}")

        # In production, don't expose internal details
        if app.debug:
            message = str(error)
            details = traceback.format_exc()
        else:
            message = "An unexpected error occurred. Our team has been notified."
            details = None

        return (
            jsonify(
                {
                    "error": "internal_server_error",
                    "message": message,
                    "details": details,
                    "status_code": HTTP_STATUS.INTERNAL_SERVER_ERROR,
                }
            ),
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
        )


class APIError(Exception):
    """
    Custom API error class.

    Attributes:
        message: Error message
        status_code: HTTP status code
        error_code: Internal error code
        details: Additional error details
    """

    def __init__(
        self,
        message,
        status_code=HTTP_STATUS.BAD_REQUEST,
        error_code="api_error",
        details=None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        super().__init__(message)


def handle_api_error(error):
    """
    Handler for APIError exceptions.

    Args:
        error: APIError instance

    Returns:
        JSON response with error details
    """
    response = jsonify(
        {
            "error": error.error_code,
            "message": error.message,
            "details": error.details,
            "status_code": error.status_code,
        }
    )
    response.status_code = error.status_code
    return response


def not_found_error(entity="Resource"):
    """
    Create a not found error response.

    Args:
        entity: Type of resource not found

    Returns:
        APIError instance
    """
    return APIError(
        message=f"{entity} not found.",
        status_code=HTTP_STATUS.NOT_FOUND,
        error_code="not_found",
    )


def unauthorized_error(message="Authentication required."):
    """
    Create an unauthorized error response.

    Args:
        message: Error message

    Returns:
        APIError instance
    """
    return APIError(
        message=message, status_code=HTTP_STATUS.UNAUTHORIZED, error_code="unauthorized"
    )


def forbidden_error(message="You do not have permission to perform this action."):
    """
    Create a forbidden error response.

    Args:
        message: Error message

    Returns:
        APIError instance
    """
    return APIError(
        message=message, status_code=HTTP_STATUS.FORBIDDEN, error_code="forbidden"
    )


def validation_error(details=None):
    """
    Create a validation error response.

    Args:
        details: Validation error details

    Returns:
        APIError instance
    """
    return APIError(
        message="Validation error.",
        status_code=HTTP_STATUS.BAD_REQUEST,
        error_code="validation_error",
        details=details,
    )


def conflict_error(message="Resource already exists."):
    """
    Create a conflict error response.

    Args:
        message: Error message

    Returns:
        APIError instance
    """
    return APIError(
        message=message, status_code=HTTP_STATUS.CONFLICT, error_code="conflict"
    )
