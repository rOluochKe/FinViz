"""
Application factory module.
"""

import logging
import os
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS

from app.extensions import api, cache, db, jwt, limiter, migrate
from app.middleware.auth import setup_jwt_callbacks
from app.middleware.error_handler import register_error_handlers
from app.routes.analytics import analytics_bp
from app.routes.auth import auth_bp
from app.routes.budgets import budgets_bp
from app.routes.categories import categories_bp
from app.routes.dashboard import dashboard_bp
from app.routes.transactions import transactions_bp
from app.utils.constants import HTTP_STATUS
from config import config


def create_app(config_name=None):
    """
    Application factory function.

    Args:
        config_name: Configuration environment name

    Returns:
        Configured Flask application instance
    """
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    initialize_extensions(app)

    # Setup logging
    setup_logging(app)

    # Setup error handlers
    register_error_handlers(app)

    # Setup JWT callbacks
    setup_jwt_callbacks(app)

    # Register blueprints
    register_blueprints(app)

    # Create upload directories
    create_upload_directories(app)

    # Add health check
    add_health_check(app)

    # Setup CORS
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    app.logger.info(f"Application started in {app.config['FLASK_ENV']} mode")

    return app


def initialize_extensions(app):
    """Initialize Flask extensions with the app."""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cache.init_app(app)
    limiter.init_app(app)
    api.init_app(app)


def setup_logging(app):
    """Configure logging for the application."""
    log_level = getattr(logging, app.config.get("LOG_LEVEL", "INFO"))

    # Create logs directory
    log_file = app.config.get("LOG_FILE", "logs/app.log")
    os.makedirs(os.path.dirname(log_file), exist_ok=True)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.FileHandler(log_file), logging.StreamHandler()],
    )


def create_upload_directories(app):
    """Create upload directories if they don't exist."""
    upload_dir = app.config.get("UPLOAD_FOLDER", "uploads")

    directories = [
        upload_dir,
        os.path.join(upload_dir, "receipts"),
        os.path.join(upload_dir, "exports"),
        os.path.join(upload_dir, "temp"),
    ]

    for directory in directories:
        os.makedirs(directory, exist_ok=True)


def register_blueprints(app):
    """Register all API blueprints."""

    blueprints = [
        (auth_bp, "/api/auth"),
        (transactions_bp, "/api/transactions"),
        (categories_bp, "/api/categories"),
        (analytics_bp, "/api/analytics"),
        (budgets_bp, "/api/budgets"),
        (dashboard_bp, "/api/dashboard"),
    ]

    for blueprint, prefix in blueprints:
        app.register_blueprint(blueprint, url_prefix=prefix)
        app.logger.debug(f"Registered blueprint: {blueprint.name}")


def add_health_check(app):
    """Add health check endpoint."""

    @app.route("/health")
    def health_check():
        """Health check endpoint."""
        try:
            # Check database
            db.session.execute("SELECT 1")

            # Check cache
            if cache.cache:
                cache.get("health_check")

            return (
                jsonify(
                    {
                        "status": "healthy",
                        "environment": app.config["FLASK_ENV"],
                        "database": "connected",
                        "cache": "connected" if cache.cache else "disabled",
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                ),
                HTTP_STATUS.OK,
            )

        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}")
            return (
                jsonify(
                    {
                        "status": "unhealthy",
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                ),
                HTTP_STATUS.SERVICE_UNAVAILABLE,
            )
