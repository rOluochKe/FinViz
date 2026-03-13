"""
Health check routes with Flask-RESTX.
"""

import os
import platform
from datetime import datetime

import psutil
from flask import current_app, request
from flask_restx import Namespace, Resource, fields
from sqlalchemy import func, text

from app.extensions import cache, db
from app.utils.constants import HTTP_STATUS

# Create namespace - note: this will be registered outside /api
health_ns = Namespace("health", description="Health check operations (public)")

# ============================================================================
# Model Definitions
# ============================================================================

basic_health_model = health_ns.model(
    "BasicHealth",
    {
        "status": fields.String(
            description="Health status",
            example="healthy",
            enum=["healthy", "degraded", "unhealthy"],
        ),
        "timestamp": fields.String(
            description="Current timestamp", example="2024-01-15T12:00:00Z"
        ),
        "service": fields.String(description="Service name", example="finviz-backend"),
        "database": fields.String(description="Database status", example="connected"),
    },
)

ping_model = health_ns.model(
    "PingResponse",
    {
        "ping": fields.String(description="Pong response", example="pong"),
        "timestamp": fields.String(
            description="Current timestamp", example="2024-01-15T12:00:00Z"
        ),
    },
)

version_model = health_ns.model(
    "VersionInfo",
    {
        "version": fields.String(description="API version", example="1.0.0"),
        "name": fields.String(description="API name", example="FinViz Pro API"),
        "environment": fields.String(description="Environment", example="development"),
        "python_version": fields.String(description="Python version"),
        "dependencies": fields.Raw(description="Dependency versions"),
    },
)

db_stats_model = health_ns.model(
    "DatabaseStats",
    {
        "users": fields.Integer(description="User count"),
        "transactions": fields.Integer(description="Transaction count"),
        "categories": fields.Integer(description="Category count"),
        "budgets": fields.Integer(description="Budget count"),
    },
)

db_health_model = health_ns.model(
    "DatabaseHealth",
    {
        "status": fields.String(description="Database status", example="healthy"),
        "timestamp": fields.String(description="Current timestamp"),
        "stats": fields.Nested(db_stats_model),
        "table_sizes": fields.List(fields.Raw, description="Table size information"),
    },
)

component_detail_model = health_ns.model(
    "ComponentDetail",
    {
        "status": fields.String(description="Component status"),
        "error": fields.String(description="Error message", allow_null=True),
        "free_gb": fields.Float(description="Free disk space in GB", allow_null=True),
        "total_gb": fields.Float(description="Total disk space in GB", allow_null=True),
        "percent": fields.Float(description="Usage percentage", allow_null=True),
        "available_mb": fields.Float(
            description="Available memory in MB", allow_null=True
        ),
        "total_mb": fields.Float(description="Total memory in MB", allow_null=True),
        "stats": fields.Raw(description="Component statistics", allow_null=True),
        "backend": fields.String(description="Cache backend", allow_null=True),
    },
)

cpu_model = health_ns.model(
    "CPUInfo",
    {
        "percent": fields.Float(description="CPU usage percentage"),
        "cores": fields.Integer(description="Number of CPU cores"),
        "status": fields.String(description="CPU status"),
    },
)

memory_model = health_ns.model(
    "MemoryInfo",
    {
        "total_gb": fields.Float(description="Total memory in GB"),
        "available_gb": fields.Float(description="Available memory in GB"),
        "percent": fields.Float(description="Memory usage percentage"),
        "status": fields.String(description="Memory status"),
    },
)

disk_model = health_ns.model(
    "DiskInfo",
    {
        "total_gb": fields.Float(description="Total disk space in GB"),
        "free_gb": fields.Float(description="Free disk space in GB"),
        "percent": fields.Float(description="Disk usage percentage"),
        "status": fields.String(description="Disk status"),
    },
)

process_model = health_ns.model(
    "ProcessInfo",
    {
        "pid": fields.Integer(description="Process ID"),
        "memory_mb": fields.Float(description="Memory usage in MB"),
        "cpu_percent": fields.Float(description="CPU usage percentage"),
        "threads": fields.Integer(description="Number of threads"),
    },
)

system_info_model = health_ns.model(
    "SystemInfo",
    {
        "cpu": fields.Nested(cpu_model),
        "memory": fields.Nested(memory_model),
        "disk": fields.Nested(disk_model),
        "process": fields.Nested(process_model),
    },
)

application_info_model = health_ns.model(
    "ApplicationInfo",
    {
        "name": fields.String(description="Application name"),
        "version": fields.String(description="Application version"),
        "environment": fields.String(description="Environment"),
        "debug": fields.Boolean(description="Debug mode"),
        "uptime_seconds": fields.Integer(
            description="Uptime in seconds", allow_null=True
        ),
    },
)

detailed_health_model = health_ns.model(
    "DetailedHealth",
    {
        "status": fields.String(
            description="Overall health status",
            example="healthy",
            enum=["healthy", "degraded", "unhealthy"],
        ),
        "timestamp": fields.String(
            description="Current timestamp", example="2024-01-15T12:00:00Z"
        ),
        "service": fields.String(description="Service name", example="finviz-backend"),
        "components": fields.Raw(description="Component status details"),
        "system": fields.Nested(system_info_model, description="System information"),
        "application": fields.Nested(
            application_info_model, description="Application information"
        ),
    },
)

error_response_model = health_ns.model(
    "ErrorResponse",
    {
        "status": fields.String(description="Error status", example="unhealthy"),
        "timestamp": fields.String(description="Current timestamp"),
        "error": fields.String(description="Error message"),
    },
)

# Store app start time for uptime calculation (will be set when app starts)
app_start_time = datetime.utcnow()

# ============================================================================
# API Endpoints
# ============================================================================


@health_ns.route("")
class BasicHealth(Resource):
    @health_ns.doc(
        description="Basic health check endpoint with database verification",
        responses={200: "Service is healthy", 503: "Service is unhealthy"},
    )
    @health_ns.marshal_with(basic_health_model, code=200)
    @health_ns.response(503, "Service unhealthy", basic_health_model)
    def get(self):
        """Basic health check with database verification"""
        try:
            # Quick database check
            db.session.execute(text("SELECT 1")).scalar()

            response = {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "service": "finviz-backend",
                "database": "connected",
            }
            return response, HTTP_STATUS.OK

        except Exception as e:
            response = {
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "service": "finviz-backend",
                "database": "disconnected",
            }
            # You can include the error in the response if needed
            # response["error"] = str(e)
            return response, HTTP_STATUS.SERVICE_UNAVAILABLE


@health_ns.route("/detailed")
class DetailedHealth(Resource):
    @health_ns.doc(
        description="Comprehensive health check with all component status and system information",
        responses={
            200: "Health information retrieved (even if degraded)",
            503: "Service is completely unavailable",
        },
    )
    @health_ns.marshal_with(detailed_health_model)
    def get(self):
        """Comprehensive health check"""
        status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "finviz-backend",
            "components": {},
            "system": {},
            "application": {},
        }

        # Database check
        try:
            db.session.execute(text("SELECT 1"))

            # Get database stats
            result = db.session.execute(text("""
                SELECT 
                    (SELECT count(*) FROM users) as users,
                    (SELECT count(*) FROM transactions) as transactions,
                    (SELECT count(*) FROM categories) as categories,
                    (SELECT count(*) FROM budgets) as budgets
            """)).first()

            status["components"]["database"] = {
                "status": "healthy",
                "stats": {
                    "users": result[0] if result else 0,
                    "transactions": result[1] if result else 0,
                    "categories": result[2] if result else 0,
                    "budgets": result[3] if result else 0,
                },
            }
        except Exception as e:
            status["components"]["database"] = {"status": "unhealthy", "error": str(e)}
            status["status"] = "degraded"

        # Cache check
        try:
            cache.set("health_check", "ok", timeout=5)
            cache.get("health_check")
            status["components"]["cache"] = {"status": "healthy", "backend": "redis"}
        except Exception as e:
            status["components"]["cache"] = {"status": "unhealthy", "error": str(e)}
            status["status"] = "degraded"

        # System information
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=0.1)

            # Memory usage
            memory = psutil.virtual_memory()

            # Disk usage
            disk = psutil.disk_usage("/")

            # Process info
            process = psutil.Process()

            status["system"] = {
                "cpu": {
                    "percent": cpu_percent,
                    "cores": psutil.cpu_count(),
                    "status": "healthy" if cpu_percent < 80 else "warning",
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "percent": memory.percent,
                    "status": "healthy" if memory.percent < 90 else "warning",
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent": disk.percent,
                    "status": "healthy" if disk.percent < 90 else "warning",
                },
                "process": {
                    "pid": process.pid,
                    "memory_mb": round(process.memory_info().rss / (1024 * 1024), 2),
                    "cpu_percent": process.cpu_percent(interval=0.1),
                    "threads": process.num_threads(),
                },
            }

            # Check if any system components are in warning state
            for component in ["cpu", "memory", "disk"]:
                if status["system"][component]["status"] == "warning":
                    status["status"] = "degraded"

        except Exception as e:
            status["system"]["error"] = str(e)

        # Application info
        uptime = (
            (datetime.utcnow() - app_start_time).seconds
            if "app_start_time" in globals()
            else None
        )

        status["application"] = {
            "name": "FinViz Pro API",
            "version": "1.0.0",
            "environment": os.getenv("FLASK_ENV", "production"),
            "debug": current_app.debug,
            "uptime_seconds": uptime,
        }

        return status


@health_ns.route("/ping")
class Ping(Resource):
    @health_ns.doc(
        description="Simple ping endpoint for load balancers and connectivity tests",
        responses={200: "Pong response"},
    )
    @health_ns.marshal_with(ping_model)
    def get(self):
        """Ping endpoint - returns pong"""
        return {"ping": "pong", "timestamp": datetime.utcnow().isoformat()}


@health_ns.route("/version")
class Version(Resource):
    @health_ns.doc(
        description="Get detailed API version information",
        responses={200: "Version information"},
    )
    @health_ns.marshal_with(version_model)
    def get(self):
        """Get API version information"""
        return {
            "version": "1.0.0",
            "name": "FinViz Pro API",
            "environment": os.getenv("FLASK_ENV", "production"),
            "python_version": platform.python_version(),
            "dependencies": {
                "flask": "3.0.0",
                "flask_restx": "1.3.0",
                "sqlalchemy": "2.0.0",
                "postgresql": "15.0",
                "redis": "7.0",
            },
        }


@health_ns.route("/db")
class DatabaseHealth(Resource):
    @health_ns.doc(
        description="Detailed database health check with statistics and table sizes",
        responses={
            200: "Database is healthy with statistics",
            503: "Database is unhealthy",
        },
    )
    @health_ns.marshal_with(db_health_model)
    @health_ns.response(503, "Database unhealthy", error_response_model)
    def get(self):
        """Check database health with detailed statistics"""
        try:
            # Test basic connection
            db.session.execute(text("SELECT 1")).scalar()

            # Get database stats
            result = db.session.execute(text("""
                SELECT 
                    (SELECT count(*) FROM users) as users,
                    (SELECT count(*) FROM transactions) as transactions,
                    (SELECT count(*) FROM categories) as categories,
                    (SELECT count(*) FROM budgets) as budgets,
                    (SELECT count(*) FROM pg_stat_user_tables) as tables
            """)).first()

            # Get table sizes
            table_sizes = db.session.execute(text("""
                SELECT 
                    relname as table_name,
                    pg_size_pretty(pg_total_relation_size(relid)) as size,
                    pg_total_relation_size(relid) as size_bytes
                FROM pg_stat_user_tables
                ORDER BY pg_total_relation_size(relid) DESC
            """)).fetchall()

            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "stats": {
                    "users": result[0] if result else 0,
                    "transactions": result[1] if result else 0,
                    "categories": result[2] if result else 0,
                    "budgets": result[3] if result else 0,
                },
                "table_sizes": [
                    {"table": row[0], "size": row[1], "size_bytes": row[2]}
                    for row in table_sizes
                ],
            }

        except Exception as e:
            health_ns.abort(
                HTTP_STATUS.SERVICE_UNAVAILABLE, f"Database error: {str(e)}"
            )


@health_ns.route("/cache")
class CacheHealth(Resource):
    @health_ns.doc(
        description="Check cache health and get cache statistics",
        responses={200: "Cache is healthy", 503: "Cache is unhealthy"},
    )
    def get(self):
        """Check cache health"""
        try:
            # Test cache operations
            cache.set("health_test", "ok", timeout=5)
            value = cache.get("health_test")

            # Get cache stats if available
            stats = {}
            if hasattr(cache, "get_stats"):
                stats = cache.get_stats()

            return {
                "status": "healthy" if value == "ok" else "degraded",
                "timestamp": datetime.utcnow().isoformat(),
                "backend": "redis",
                "stats": stats,
            }
        except Exception as e:
            health_ns.abort(HTTP_STATUS.SERVICE_UNAVAILABLE, f"Cache error: {str(e)}")


@health_ns.route("/system")
class SystemHealth(Resource):
    @health_ns.doc(
        description="Get system resource usage information",
        responses={200: "System information retrieved"},
    )
    @health_ns.marshal_with(system_info_model)
    def get(self):
        """Get system resource information"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=0.5)

            # Memory usage
            memory = psutil.virtual_memory()

            # Disk usage
            disk = psutil.disk_usage("/")

            # Process info
            process = psutil.Process()

            return {
                "cpu": {
                    "percent": cpu_percent,
                    "cores": psutil.cpu_count(),
                    "status": "healthy" if cpu_percent < 80 else "warning",
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "percent": memory.percent,
                    "status": "healthy" if memory.percent < 90 else "warning",
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent": disk.percent,
                    "status": "healthy" if disk.percent < 90 else "warning",
                },
                "process": {
                    "pid": process.pid,
                    "memory_mb": round(process.memory_info().rss / (1024 * 1024), 2),
                    "cpu_percent": process.cpu_percent(interval=0.1),
                    "threads": process.num_threads(),
                },
            }
        except Exception as e:
            health_ns.abort(
                HTTP_STATUS.INTERNAL_SERVER_ERROR, f"System info error: {str(e)}"
            )


@health_ns.route("/ready")
class ReadinessCheck(Resource):
    @health_ns.doc(
        description="Readiness probe for Kubernetes/container orchestration",
        responses={200: "Application is ready to serve traffic"},
    )
    def get(self):
        """Readiness check - indicates if app is ready to serve traffic"""
        try:
            # Check if app can handle requests
            # This should be a quick check of critical dependencies
            db.session.execute(text("SELECT 1")).scalar()
            cache.set("readiness_test", "ok", timeout=2)

            return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
        except Exception:
            # If any critical dependency fails, return 503
            health_ns.abort(HTTP_STATUS.SERVICE_UNAVAILABLE, "Application not ready")


@health_ns.route("/live")
class LivenessCheck(Resource):
    @health_ns.doc(
        description="Liveness probe for Kubernetes/container orchestration",
        responses={200: "Application is alive"},
    )
    def get(self):
        """Liveness check - indicates if app is running"""
        # This should be a very simple check that always passes if app is running
        return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@health_ns.route("/metrics")
class MetricsEndpoint(Resource):
    @health_ns.doc(
        description="Get basic application metrics",
        responses={200: "Metrics retrieved"},
    )
    def get(self):
        """Get basic application metrics"""
        try:
            # Get counts from database
            user_count = (
                db.session.execute(text("SELECT count(*) FROM users")).scalar() or 0
            )
            tx_count = (
                db.session.execute(text("SELECT count(*) FROM transactions")).scalar()
                or 0
            )

            # Process info
            process = psutil.Process()

            return {
                "timestamp": datetime.utcnow().isoformat(),
                "metrics": {
                    "users": {"total": user_count},
                    "transactions": {"total": tx_count},
                    "system": {
                        "cpu_percent": process.cpu_percent(interval=0.1),
                        "memory_mb": round(
                            process.memory_info().rss / (1024 * 1024), 2
                        ),
                        "threads": process.num_threads(),
                    },
                },
            }
        except Exception as e:
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
            }, HTTP_STATUS.INTERNAL_SERVER_ERROR
