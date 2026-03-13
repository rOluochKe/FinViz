"""
Application factory module.
"""

import logging
import os
import platform
from datetime import datetime

import psutil
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_restx import Api
from sqlalchemy import text

from app.routes import api_bp
from app.routes.health import health_ns
from app.routes.webhooks import webhooks_bp

# Load .env file at the VERY beginning
load_dotenv()

from flask_jwt_extended import JWTManager

from app.extensions import cache, db, limiter, migrate
from app.middleware.auth import setup_jwt_callbacks
from app.middleware.error_handler import register_error_handlers
from app.utils.constants import HTTP_STATUS
from config import config

# Store app start time for uptime calculation
app_start_time = datetime.utcnow()


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
    db.init_app(app)
    migrate.init_app(app, db)

    # Initialize JWT
    jwt = JWTManager(app)
    app.jwt_manager = jwt

    cache.init_app(app)
    limiter.init_app(app)

    # Setup JWT callbacks
    setup_jwt_callbacks(app, jwt)

    # Setup logging
    setup_logging(app)

    # Setup error handlers
    register_error_handlers(app)

    # Create upload directories
    create_upload_directories(app)

    # Add root endpoint FIRST (before any blueprints)
    add_root_endpoint(app)

    # Register blueprints and namespaces
    register_blueprints(app)
    register_health_namespace(app)

    # Setup CORS
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    app.logger.info(f"Application started in {app.config['FLASK_ENV']} mode")

    return app


def setup_logging(app):
    """Configure logging for the application."""
    log_level = getattr(logging, app.config.get("LOG_LEVEL", "INFO"))

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
    # Register the main API blueprint with Flask-RESTX
    app.register_blueprint(api_bp)

    # Register webhooks blueprint (outside /api)
    app.register_blueprint(webhooks_bp)


def register_health_namespace(app):
    """Register health check namespace using Flask-RESTX."""

    # Create a separate API for health endpoints
    health_api = Api(
        app,
        version="1.0",
        title="FinViz Pro Health API",
        description="Health check endpoints (public)",
        doc=False,  # Disable Swagger for health endpoints to avoid conflicts
    )
    health_api.add_namespace(health_ns, path="/health")


def add_root_endpoint(app):
    """Add root endpoint with API information."""
    global app_start_time

    @app.route("/")
    def index():
        """Root endpoint - API information."""
        uptime = (datetime.utcnow() - app_start_time).seconds

        # Get basic system info
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
        except Exception as e:
            app.logger.debug(f"Could not get system info: {e}")
            cpu_percent = None
            memory = None

        return (
            jsonify(
                {
                    "name": "FinViz Pro API",
                    "version": "1.0.0",
                    "description": "Finance Analytics Dashboard Backend API",
                    "environment": app.config["FLASK_ENV"],
                    "debug": app.debug,
                    "server_time": datetime.utcnow().isoformat(),
                    "uptime_seconds": uptime,
                    "system_info": {
                        "python_version": platform.python_version(),
                        "platform": platform.platform(),
                        "hostname": platform.node(),
                        "cpu_percent": cpu_percent,
                        "memory_percent": memory.percent if memory else None,
                    },
                    "endpoints": {
                        "health": {
                            "basic": "/health",
                            "detailed": "/health/detailed",
                            "ping": "/health/ping",
                            "version": "/health/version",
                            "db": "/health/db",
                            "cache": "/health/cache",
                            "system": "/health/system",
                            "ready": "/health/ready",
                            "live": "/health/live",
                            "metrics": "/health/metrics",
                        },
                        "api": {
                            "docs": "/api/docs",
                            "auth": "/api/auth/*",
                            "users": "/api/users/*",
                            "categories": "/api/categories/*",
                            "transactions": "/api/transactions/*",
                            "budgets": "/api/budgets/*",
                            "analytics": "/api/analytics/*",
                            "dashboard": "/api/dashboard/*",
                            "reports": "/api/reports/*",
                            "exports": "/api/exports/*",
                            "imports": "/api/imports/*",
                            "admin": "/api/admin/*",
                        },
                        "webhooks": {
                            "plaid": "/webhooks/plaid",
                            "stripe": "/webhooks/stripe",
                            "github": "/webhooks/github",
                            "sendgrid": "/webhooks/sendgrid",
                            "generic": "/webhooks/generic",
                        },
                    },
                    "links": {
                        "documentation": "/api/docs",
                        "health_check": "/health",
                        "detailed_health": "/health/detailed",
                    },
                }
            ),
            HTTP_STATUS.OK,
        )
