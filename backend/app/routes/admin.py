"""
Admin routes for system management with Flask-RESTX.
"""

import os
import subprocess
from datetime import datetime

import psutil
from flask import current_app, request
from flask_jwt_extended import jwt_required
from flask_restx import Namespace, Resource, fields
from sqlalchemy import text

from app.extensions import cache, db
from app.services.cache_service import CacheService
from app.services.file_service import FileService
from app.utils.constants import HTTP_STATUS
from app.utils.decorators import admin_required

# Create namespace
admin_ns = Namespace(
    "admin", description="System administration operations (admin only)"
)

# ============================================================================
# Model Definitions
# ============================================================================

system_stats_model = admin_ns.model(
    "SystemStats",
    {
        "users": fields.Integer(description="Total number of users", example=42),
        "transactions": fields.Integer(
            description="Total number of transactions", example=1234
        ),
        "categories": fields.Integer(
            description="Total number of categories", example=25
        ),
        "budgets": fields.Integer(description="Total number of budgets", example=15),
    },
)

cache_stats_model = admin_ns.model(
    "CacheStats",
    {
        "backend": fields.String(
            description="Cache backend type", example="RedisCache"
        ),
        "hits": fields.Integer(description="Cache hits", example=1500),
        "misses": fields.Integer(description="Cache misses", example=200),
        "memory": fields.String(description="Memory usage", example="2.5M"),
        "keys": fields.Integer(description="Total keys", example=350),
    },
)

disk_usage_model = admin_ns.model(
    "DiskUsage",
    {
        "total_gb": fields.Float(description="Total disk space in GB", example=100.5),
        "used_gb": fields.Float(description="Used disk space in GB", example=45.2),
        "free_gb": fields.Float(description="Free disk space in GB", example=55.3),
        "percent": fields.Float(description="Disk usage percentage", example=45.0),
    },
)

user_usage_model = admin_ns.model(
    "UserUsage",
    {
        "user_id": fields.Integer(description="User ID", example=1),
        "usage": fields.Raw(description="User storage usage details"),
    },
)

storage_stats_model = admin_ns.model(
    "StorageStats",
    {
        "disk": fields.Nested(disk_usage_model),
        "uploads": fields.Raw(description="Upload statistics"),
    },
)

cleanup_response_model = admin_ns.model(
    "CleanupResponse",
    {
        "message": fields.String(
            description="Cleanup result message", example="Cleaned up 15 temp files"
        )
    },
)

logs_response_model = admin_ns.model(
    "LogsResponse",
    {
        "logs": fields.List(fields.String, description="Log lines"),
        "total": fields.Integer(description="Total log lines", example=1000),
        "showing": fields.Integer(description="Number of lines shown", example=100),
    },
)

env_response_model = admin_ns.model(
    "EnvResponse",
    {
        "environment": fields.String(
            description="Application environment", example="development"
        ),
        "debug": fields.Boolean(description="Debug mode enabled", example=True),
        "database": fields.String(
            description="Database host", example="localhost:5432/finviz_dev"
        ),
        "cache": fields.String(description="Cache type", example="RedisCache"),
    },
)

migration_response_model = admin_ns.model(
    "MigrationResponse",
    {
        "message": fields.String(
            description="Migration status", example="Migrations completed"
        ),
        "output": fields.String(
            description="Migration output",
            example="INFO  [alembic.runtime.migration] Running upgrade...",
        ),
        "error": fields.String(description="Error message if any", allow_null=True),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@admin_ns.route("/stats")
class SystemStats(Resource):
    @admin_ns.doc(
        description="Get system statistics (users, transactions, categories, budgets)",
        security="Bearer Auth",
        responses={
            200: "Statistics retrieved",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @admin_ns.marshal_with(system_stats_model)
    @jwt_required()
    @admin_required
    def get(self):
        """Get system statistics"""

        stats = {
            "users": db.session.execute(text("SELECT COUNT(*) FROM users")).scalar()
            or 0,
            "transactions": db.session.execute(
                text("SELECT COUNT(*) FROM transactions")
            ).scalar()
            or 0,
            "categories": db.session.execute(
                text("SELECT COUNT(*) FROM categories")
            ).scalar()
            or 0,
            "budgets": db.session.execute(text("SELECT COUNT(*) FROM budgets")).scalar()
            or 0,
        }

        return stats


@admin_ns.route("/cache")
class CacheStats(Resource):
    @admin_ns.doc(
        description="Get cache statistics",
        security="Bearer Auth",
        responses={
            200: "Cache statistics retrieved",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @admin_ns.marshal_with(cache_stats_model)
    @jwt_required()
    @admin_required
    def get(self):
        """Get cache statistics"""
        stats = CacheService.get_stats()
        return stats

    @admin_ns.doc(
        description="Clear all cache",
        security="Bearer Auth",
        responses={
            200: "Cache cleared",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @admin_ns.marshal_with(
        admin_ns.model(
            "ClearCacheResponse",
            {
                "message": fields.String(
                    description="Result message", example="Cache cleared"
                )
            },
        )
    )
    @jwt_required()
    @admin_required
    def delete(self):
        """Clear all cache"""
        cache.clear()
        return {"message": "Cache cleared"}


@admin_ns.route("/storage")
class StorageStats(Resource):
    @admin_ns.doc(
        description="Get storage statistics (disk usage and user uploads)",
        security="Bearer Auth",
        responses={
            200: "Storage statistics retrieved",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @admin_ns.marshal_with(storage_stats_model)
    @jwt_required()
    @admin_required
    def get(self):
        """Get storage statistics"""
        file_service = FileService()

        # Get disk usage
        disk = psutil.disk_usage("/")

        # Get all users' storage
        users = db.session.execute(text("SELECT id FROM users")).fetchall()
        total_users = len(users)

        user_storage = []
        total_size = 0

        for user in users:
            usage = file_service.get_user_usage(user[0])
            user_storage.append({"user_id": user[0], "usage": usage})
            total_size += usage["total"]["size"]

        return {
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


@admin_ns.route("/cleanup")
class Cleanup(Resource):
    @admin_ns.doc(
        description="Clean up temporary files older than 24 hours",
        security="Bearer Auth",
        responses={
            200: "Cleanup completed",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @admin_ns.marshal_with(cleanup_response_model)
    @jwt_required()
    @admin_required
    def post(self):
        """Clean up temporary files"""
        file_service = FileService()
        deleted = file_service.cleanup_temp(hours=24)

        return {"message": f"Cleaned up {deleted} temp files"}


@admin_ns.route("/logs")
class Logs(Resource):
    @admin_ns.doc(
        description="Get application logs",
        security="Bearer Auth",
        responses={
            200: "Logs retrieved",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @admin_ns.param(
        "lines",
        "Number of log lines to retrieve",
        type="integer",
        default=100,
        max=1000,
    )
    @admin_ns.marshal_with(logs_response_model)
    @jwt_required()
    @admin_required
    def get(self):
        """Get application logs"""
        lines = request.args.get("lines", 100, type=int)
        lines = min(lines, 1000)  # Cap at 1000 lines
        log_file = current_app.config.get("LOG_FILE", "logs/app.log")

        if not os.path.exists(log_file):
            return {"logs": [], "total": 0, "showing": 0}

        with open(log_file, "r") as f:
            all_lines = f.readlines()
            last_lines = all_lines[-lines:]

        return {"logs": last_lines, "total": len(all_lines), "showing": len(last_lines)}


@admin_ns.route("/env")
class Environment(Resource):
    @admin_ns.doc(
        description="Get environment information (safe only)",
        security="Bearer Auth",
        responses={
            200: "Environment info retrieved",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @admin_ns.marshal_with(env_response_model)
    @jwt_required()
    @admin_required
    def get(self):
        """Get environment information"""
        db_uri = current_app.config["SQLALCHEMY_DATABASE_URI"]
        # Mask password in database URI
        if "@" in db_uri:
            db_display = db_uri.split("@")[-1]
        else:
            db_display = db_uri

        return {
            "environment": current_app.config["FLASK_ENV"],
            "debug": current_app.config["DEBUG"],
            "database": db_display,
            "cache": current_app.config.get("CACHE_TYPE", "none"),
        }


@admin_ns.route("/migrate")
class RunMigrations(Resource):
    @admin_ns.doc(
        description="Run database migrations (use with caution)",
        security="Bearer Auth",
        responses={
            200: "Migrations completed",
            401: "Authentication required",
            403: "Admin access required",
            500: "Migration failed",
        },
    )
    @admin_ns.marshal_with(migration_response_model)
    @jwt_required()
    @admin_required
    def post(self):
        """Run database migrations"""
        try:
            result = subprocess.run(
                ["flask", "db", "upgrade"], capture_output=True, text=True, check=False
            )

            if result.returncode == 0:
                return {
                    "message": "Migrations completed",
                    "output": result.stdout,
                    "error": None,
                }
            else:
                return {
                    "message": "Migration failed",
                    "output": result.stdout,
                    "error": result.stderr,
                }, HTTP_STATUS.INTERNAL_SERVER_ERROR

        except Exception as e:
            return {
                "message": "Migration failed",
                "output": "",
                "error": str(e),
            }, HTTP_STATUS.INTERNAL_SERVER_ERROR


@admin_ns.route("/health/system")
class SystemHealth(Resource):
    @admin_ns.doc(
        description="Get detailed system health information",
        security="Bearer Auth",
        responses={
            200: "Health information retrieved",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @jwt_required()
    @admin_required
    def get(self):
        """Get detailed system health"""
        from sqlalchemy import text

        status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {},
        }

        # Database check
        try:
            db.session.execute(text("SELECT 1"))
            status["components"]["database"] = {"status": "healthy"}
        except Exception as e:
            status["components"]["database"] = {"status": "unhealthy", "error": str(e)}
            status["status"] = "degraded"

        # Cache check
        try:
            cache.set("health_check", "ok", timeout=5)
            cache.get("health_check")
            status["components"]["cache"] = {"status": "healthy"}
        except Exception as e:
            status["components"]["cache"] = {"status": "unhealthy", "error": str(e)}
            status["status"] = "degraded"

        # Disk space check
        try:
            disk = psutil.disk_usage("/")
            free_gb = disk.free / (1024**3)
            status["components"]["disk"] = {
                "status": "healthy" if free_gb > 1 else "warning",
                "free_gb": round(free_gb, 2),
                "total_gb": round(disk.total / (1024**3), 2),
            }
        except Exception as e:
            status["components"]["disk"] = {"status": "unknown", "error": str(e)}

        # Memory check
        try:
            memory = psutil.virtual_memory()
            status["components"]["memory"] = {
                "status": "healthy" if memory.percent < 90 else "warning",
                "percent": memory.percent,
                "available_gb": round(memory.available / (1024**3), 2),
                "total_gb": round(memory.total / (1024**3), 2),
            }
        except Exception as e:
            status["components"]["memory"] = {"status": "unknown", "error": str(e)}

        return status
