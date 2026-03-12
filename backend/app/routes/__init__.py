"""
Routes package initialization.
"""

from app.routes.admin import admin_bp
from app.routes.analytics import analytics_bp
from app.routes.auth import auth_bp
from app.routes.budgets import budgets_bp
from app.routes.categories import categories_bp
from app.routes.dashboard import dashboard_bp
from app.routes.exports import exports_bp
from app.routes.health import health_bp
from app.routes.imports import imports_bp
from app.routes.reports import reports_bp
from app.routes.transactions import transactions_bp
from app.routes.users import users_bp
from app.routes.webhooks import webhooks_bp

__all__ = [
    "auth_bp",
    "users_bp",
    "categories_bp",
    "transactions_bp",
    "budgets_bp",
    "analytics_bp",
    "dashboard_bp",
    "reports_bp",
    "imports_bp",
    "exports_bp",
    "health_bp",
    "webhooks_bp",
    "admin_bp",
]
