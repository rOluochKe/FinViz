"""
Admin routes for system management.
"""

import os

import psutil
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.extensions import cache, db
from app.services.cache_service import CacheService
from app.services.file_service import FileService
from app.utils.constants import HTTP_STATUS
from app.utils.decorators import admin_required  # This is a direct decorator

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required  # No parentheses - direct decorator
def system_stats():
    """Get system statistics."""
    stats = {
        "users": db.session.execute("SELECT COUNT(*) FROM users").scalar(),
        "transactions": db.session.execute(
            "SELECT COUNT(*) FROM transactions"
        ).scalar(),
        "categories": db.session.execute("SELECT COUNT(*) FROM categories").scalar(),
        "budgets": db.session.execute("SELECT COUNT(*) FROM budgets").scalar(),
    }

    return jsonify(stats), HTTP_STATUS.OK


@admin_bp.route("/cache", methods=["GET"])
@jwt_required()
@admin_required
def cache_stats():
    """Get cache statistics."""
    stats = CacheService.get_stats()
    return jsonify(stats), HTTP_STATUS.OK


@admin_bp.route("/cache", methods=["DELETE"])
@jwt_required()
@admin_required
def clear_cache():
    """Clear all cache."""
    cache.clear()
    return jsonify(message="Cache cleared"), HTTP_STATUS.OK


@admin_bp.route("/storage", methods=["GET"])
@jwt_required()
@admin_required
def storage_stats():
    """Get storage statistics."""
    file_service = FileService()

    # Get disk usage
    disk = psutil.disk_usage("/")

    # Get all users' storage
    users = db.session.execute("SELECT id FROM users").fetchall()
    total_users = len(users)

    user_storage = []
    total_size = 0

    for user in users:
        usage = file_service.get_user_usage(user[0])
        user_storage.append({"user_id": user[0], "usage": usage})
        total_size += usage["total"]["size"]

    return (
        jsonify(
            {
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent": disk.percent,
                },
                "uploads": {
                    "total_size_mb": round(total_size / (1024 * 1024), 2),
                    "total_users": total_users,
                    "users": user_storage,
                },
            }
        ),
        HTTP_STATUS.OK,
    )


@admin_bp.route("/cleanup", methods=["POST"])
@jwt_required()
@admin_required
def cleanup():
    """Clean up temporary files."""
    file_service = FileService()

    # Clean temp files older than 24 hours
    deleted = file_service.cleanup_temp(hours=24)

    return jsonify({"message": f"Cleaned up {deleted} temp files"}), HTTP_STATUS.OK


@admin_bp.route("/logs", methods=["GET"])
@jwt_required()
@admin_required
def get_logs():
    """Get application logs."""
    lines = request.args.get("lines", 100, type=int)
    log_file = current_app.config.get("LOG_FILE", "logs/app.log")

    if not os.path.exists(log_file):
        return jsonify(logs=[]), HTTP_STATUS.OK

    with open(log_file, "r") as f:
        # Get last N lines
        all_lines = f.readlines()
        last_lines = all_lines[-lines:]

    return (
        jsonify(
            {"logs": last_lines, "total": len(all_lines), "showing": len(last_lines)}
        ),
        HTTP_STATUS.OK,
    )


@admin_bp.route("/env", methods=["GET"])
@jwt_required()
@admin_required
def get_env():
    """Get environment information (safe only)."""
    return (
        jsonify(
            {
                "environment": current_app.config["FLASK_ENV"],
                "debug": current_app.config["DEBUG"],
                "database": str(current_app.config["SQLALCHEMY_DATABASE_URI"]).split(
                    "@"
                )[-1],
                "cache": current_app.config.get("CACHE_TYPE", "none"),
            }
        ),
        HTTP_STATUS.OK,
    )


@admin_bp.route("/migrate", methods=["POST"])
@jwt_required()
@admin_required
def run_migrations():
    """Run database migrations."""
    import subprocess

    try:
        result = subprocess.run(
            ["flask", "db", "upgrade"], capture_output=True, text=True
        )

        return (
            jsonify(
                {
                    "message": "Migrations completed",
                    "output": result.stdout,
                    "error": result.stderr if result.stderr else None,
                }
            ),
            HTTP_STATUS.OK,
        )
    except Exception as e:
        return jsonify(error=str(e)), HTTP_STATUS.INTERNAL_SERVER_ERROR
