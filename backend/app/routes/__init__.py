"""
Routes package initialization with Flask-RESTX.
"""

from flask import Blueprint
from flask_restx import Api

from app.routes.admin import admin_ns
from app.routes.analytics import analytics_ns

# Import namespaces
from app.routes.auth import auth_ns
from app.routes.budgets import budgets_ns
from app.routes.categories import categories_ns
from app.routes.dashboard import dashboard_ns
from app.routes.exports import exports_ns
from app.routes.imports import imports_ns
from app.routes.reports import reports_ns
from app.routes.transactions import transactions_ns
from app.routes.users import users_ns
from app.routes.webhooks import webhooks_ns

# Create API blueprint
api_bp = Blueprint("api", __name__, url_prefix="/api")

# Configure Swagger authorization
authorizations = {
    "Bearer Auth": {
        "type": "apiKey",
        "in": "header",
        "name": "Authorization",
        "description": "Enter your JWT token in the format: Bearer <token>",
    }
}

# Create API instance
api = Api(
    api_bp,
    version="1.0",
    title="FinViz Pro API",
    description="""
        # Finance Analytics Dashboard Backend API

        ## Features
        * User authentication with JWT
        * Transaction management
        * Category management
        * Budget planning
        * Financial analytics and insights
        * Data export capabilities (CSV, JSON, Excel, PDF)
        * Data import capabilities (CSV, JSON)
        * Financial reports (monthly, yearly, category, comparison)
        * Webhook integrations (Plaid, Stripe, GitHub, SendGrid)
        * System administration (admin only)

        ## Authentication
        Most endpoints require JWT authentication. 
        Use the `/auth/login` endpoint to get your token, then click the "Authorize" button above.

        ## Base URL
        `http://localhost:5000/api`

        ## Webhook Endpoints
        Webhook endpoints are available at `/webhooks/*` (public, no authentication)

        ## Response Format
        All responses are in JSON format. Successful responses return 2xx status codes,
        errors return appropriate 4xx or 5xx status codes with error details.
    """,
    doc="/docs",  # Swagger UI will be available at /api/docs
    authorizations=authorizations,
    security="Bearer Auth",
    default="Auth",
    default_label="Authentication operations",
)

# Register namespaces
api.add_namespace(auth_ns, path="/auth")
api.add_namespace(users_ns, path="/users")
api.add_namespace(categories_ns, path="/categories")
api.add_namespace(transactions_ns, path="/transactions")
api.add_namespace(budgets_ns, path="/budgets")
api.add_namespace(analytics_ns, path="/analytics")
api.add_namespace(dashboard_ns, path="/dashboard")
api.add_namespace(admin_ns, path="/admin")
api.add_namespace(exports_ns, path="/exports")
api.add_namespace(imports_ns, path="/imports")
api.add_namespace(reports_ns, path="/reports")
api.add_namespace(webhooks_ns, path="/webhooks")
