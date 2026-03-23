"""
Budget routes with Flask-RESTX.
"""

# import logging
import uuid
from datetime import datetime

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import db
from app.models.budget import Budget
from app.models.category import Category
from app.schemas.budget_schema import BudgetSchema
from app.services.budget_service import BudgetService
from app.utils.constants import HTTP_STATUS, BudgetPeriod
from app.utils.decorators import safe_cache_cached

# Create namespace
budgets_ns = Namespace("budgets", description="Budget operations")

# logger = logging.getLogger(__name__)

# ============================================================================
# Model Definitions
# =============================================================================

budget_model = budgets_ns.model(
    "Budget",
    {
        "id": fields.String(
            description="Budget ID (UUID)",
            example="123e4567-e89b-12d3-a456-426614174000",
        ),
        "user_id": fields.String(
            description="User ID (UUID)", example="123e4567-e89b-12d3-a456-426614174000"
        ),
        "category_id": fields.String(
            description="Category ID (UUID)",
            example="123e4567-e89b-12d3-a456-426614174000",
        ),
        "category_name": fields.String(
            description="Category name", example="Groceries"
        ),
        "category_color": fields.String(
            description="Category color", example="#dc3545"
        ),
        "amount": fields.Float(description="Budget amount", example=500.00),
        "period": fields.String(
            description="Budget period", example="monthly", enum=BudgetPeriod.choices()
        ),
        "month": fields.Integer(description="Month (1-12)", example=1, allow_null=True),
        "year": fields.Integer(description="Year", example=2024),
        "alert_threshold": fields.Float(
            description="Alert threshold percentage", example=80.0
        ),
        "is_active": fields.Boolean(description="Is active", example=True),
        "rollover": fields.Boolean(description="Rollover unused amount", example=False),
        "notes": fields.String(description="Notes", example="Monthly grocery budget"),
        "spent": fields.Float(description="Amount spent", example=325.50),
        "remaining": fields.Float(description="Remaining amount", example=174.50),
        "spent_percentage": fields.Float(description="Percentage spent", example=65.1),
        "is_over_budget": fields.Boolean(description="Is over budget", example=False),
        "should_alert": fields.Boolean(
            description="Should trigger alert", example=False
        ),
        "projection": fields.Raw(description="Spending projection", allow_null=True),
        "created_at": fields.DateTime(description="Creation date"),
        "updated_at": fields.DateTime(description="Last update"),
    },
)

budget_create_model = budgets_ns.model(
    "BudgetCreate",
    {
        "category_id": fields.String(
            required=True,
            description="Category ID (UUID)",
            example="123e4567-e89b-12d3-a456-426614174000",
        ),
        "amount": fields.Float(
            required=True, description="Budget amount", example=500.00, min=0.01
        ),
        "period": fields.String(
            required=True,
            description="Budget period",
            example="monthly",
            enum=BudgetPeriod.choices(),
        ),
        "month": fields.Integer(description="Month (1-12)", example=1, allow_null=True),
        "year": fields.Integer(required=True, description="Year", example=2024),
        "alert_threshold": fields.Float(
            description="Alert threshold percentage",
            example=80.0,
            default=80.0,
            min=0,
            max=100,
        ),
        "is_active": fields.Boolean(
            description="Is active", example=True, default=True
        ),
        "rollover": fields.Boolean(
            description="Rollover unused amount", example=False, default=False
        ),
        "notes": fields.String(description="Notes", example="Monthly grocery budget"),
    },
)

budget_update_model = budgets_ns.model(
    "BudgetUpdate",
    {
        "amount": fields.Float(description="Budget amount", example=500.00, min=0.01),
        "alert_threshold": fields.Float(
            description="Alert threshold percentage", example=80.0, min=0, max=100
        ),
        "is_active": fields.Boolean(description="Is active", example=True),
        "rollover": fields.Boolean(description="Rollover unused amount", example=False),
        "notes": fields.String(description="Notes", example="Monthly grocery budget"),
    },
)

budget_status_model = budgets_ns.model(
    "BudgetStatus",
    {
        "budget_id": fields.String(
            description="Budget ID (UUID)",
            example="123e4567-e89b-12d3-a456-426614174000",
        ),
        "category_id": fields.String(
            description="Category ID (UUID)",
            example="123e4567-e89b-12d3-a456-426614174000",
        ),
        "category_name": fields.String(description="Category name"),
        "category_color": fields.String(description="Category color"),
        "budget_amount": fields.Float(description="Budget amount"),
        "spent": fields.Float(description="Amount spent"),
        "remaining": fields.Float(description="Remaining amount"),
        "percentage": fields.Float(description="Percentage spent"),
        "status": fields.String(
            description="Status (good/warning/over)", enum=["good", "warning", "over"]
        ),
        "days_remaining": fields.Integer(
            description="Days remaining in period", allow_null=True
        ),
    },
)

budget_status_overview_model = budgets_ns.model(
    "BudgetStatusOverview",
    {
        "period": fields.Raw(description="Period information"),
        "summary": fields.Raw(description="Summary statistics"),
        "category_status": fields.List(fields.Nested(budget_status_model)),
        "alerts": fields.Raw(description="Budget alerts"),
    },
)

budget_suggestion_model = budgets_ns.model(
    "BudgetSuggestion",
    {
        "category_id": fields.String(
            description="Category ID (UUID)",
            example="123e4567-e89b-12d3-a456-426614174000",
        ),
        "category_name": fields.String(description="Category name"),
        "category_color": fields.String(description="Category color"),
        "current_avg_monthly": fields.Float(description="Current monthly average"),
        "suggested_budget": fields.Float(description="Suggested budget amount"),
        "confidence": fields.String(
            description="Confidence level", enum=["high", "medium", "low"]
        ),
        "transaction_count_90d": fields.Integer(
            description="Transaction count in 90 days"
        ),
        "variability": fields.Float(description="Spending variability"),
        "is_consistent": fields.Boolean(description="Is spending consistent"),
        "notes": fields.String(description="Additional notes"),
    },
)

budget_progress_model = budgets_ns.model(
    "BudgetProgress",
    {
        "budget": fields.Nested(budget_model),
        "period": fields.Raw(description="Period information"),
        "daily_progress": fields.List(
            fields.Raw, description="Daily spending progress"
        ),
        "projections": fields.Raw(description="Spending projections"),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@budgets_ns.route("")
class BudgetList(Resource):
    @budgets_ns.doc(
        description="Get all budgets for current user",
        security="Bearer Auth",
        responses={200: "Budgets retrieved"},
    )
    @budgets_ns.param("year", "Year", type="integer", required=True)
    @budgets_ns.param("month", "Month (for monthly budgets)", type="integer")
    @budgets_ns.marshal_list_with(budget_model)
    @jwt_required()
    @safe_cache_cached(timeout=60, query_string=True)  # Safe cache with query string
    def get(self):
        """Get budgets"""
        user_id = get_jwt_identity()
        year = request.args.get("year", datetime.now().year, type=int)
        month = request.args.get("month", type=int)

        query = Budget.query.filter_by(user_id=user_id, year=year)

        if month:
            query = query.filter(
                db.or_(
                    Budget.period == "yearly",
                    db.and_(Budget.period == "monthly", Budget.month == month),
                )
            )

        budgets = query.all()

        return BudgetSchema(many=True).dump(budgets)

    @budgets_ns.doc(
        description="Create a new budget",
        security="Bearer Auth",
        responses={
            201: "Budget created",
            400: "Validation error",
            401: "Authentication required",
            409: "Budget already exists",
            415: "Invalid Content-Type",
        },
    )
    @budgets_ns.expect(budget_create_model)
    @budgets_ns.marshal_with(budget_model, code=201)
    @jwt_required()
    def post(self):
        """Create a new budget"""
        # Check Content-Type header
        if not request.is_json:
            budgets_ns.abort(
                HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
                "Content-Type must be application/json",
            )

        user_id = get_jwt_identity()
        data = request.json

        # Validate required fields
        required_fields = ["category_id", "amount", "period", "year"]
        for field in required_fields:
            if field not in data:
                budgets_ns.abort(
                    HTTP_STATUS.BAD_REQUEST, f"Missing required field: {field}"
                )

        # Validate category_id format
        try:
            category_uuid = uuid.UUID(data["category_id"])
        except ValueError:
            budgets_ns.abort(
                HTTP_STATUS.BAD_REQUEST,
                "Invalid category_id format. Must be a valid UUID.",
            )

        # Check category
        category = Category.query.get(category_uuid)
        if not category:
            budgets_ns.abort(HTTP_STATUS.BAD_REQUEST, "Category not found")

        # Check existing
        existing = Budget.query.filter_by(
            user_id=user_id,
            category_id=category_uuid,
            period=data["period"],
            year=data["year"],
            month=data.get("month"),
        ).first()

        if existing:
            budgets_ns.abort(HTTP_STATUS.CONFLICT, "Budget already exists")

        # Create budget
        budget = Budget(
            user_id=user_id,
            category_id=category_uuid,
            amount=data["amount"],
            period=data["period"],
            year=data["year"],
            month=data.get("month"),
            alert_threshold=data.get("alert_threshold", 80.0),
            is_active=data.get("is_active", True),
            rollover=data.get("rollover", False),
            notes=data.get("notes"),
        )

        db.session.add(budget)
        db.session.commit()

        return BudgetSchema().dump(budget), HTTP_STATUS.CREATED


@budgets_ns.route("/<string:budget_id>")
@budgets_ns.param("budget_id", "Budget ID (UUID)")
class BudgetDetail(Resource):
    @budgets_ns.doc(
        description="Get budget by ID",
        security="Bearer Auth",
        responses={
            200: "Budget found",
            401: "Authentication required",
            404: "Budget not found",
        },
    )
    @budgets_ns.marshal_with(budget_model)
    @jwt_required()
    def get(self, budget_id):
        """Get specific budget"""
        user_id = get_jwt_identity()

        try:
            budget_uuid = uuid.UUID(budget_id)
        except ValueError:
            budgets_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid budget ID format")

        budget = Budget.query.filter_by(id=budget_uuid, user_id=user_id).first()

        if not budget:
            budgets_ns.abort(HTTP_STATUS.NOT_FOUND, "Budget not found")

        return BudgetSchema().dump(budget)

    @budgets_ns.doc(
        description="Update a budget",
        security="Bearer Auth",
        responses={
            200: "Budget updated",
            400: "Validation error",
            401: "Authentication required",
            404: "Budget not found",
        },
    )
    @budgets_ns.expect(budget_update_model)
    @budgets_ns.marshal_with(budget_model)
    @jwt_required()
    def put(self, budget_id):
        """Update budget"""
        # Check Content-Type header
        if not request.is_json:
            budgets_ns.abort(
                HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
                "Content-Type must be application/json",
            )

        user_id = get_jwt_identity()
        data = request.json

        try:
            budget_uuid = uuid.UUID(budget_id)
        except ValueError:
            budgets_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid budget ID format")

        budget = Budget.query.filter_by(id=budget_uuid, user_id=user_id).first()

        if not budget:
            budgets_ns.abort(HTTP_STATUS.NOT_FOUND, "Budget not found")

        for key, value in data.items():
            if value is not None:
                setattr(budget, key, value)

        db.session.commit()

        return BudgetSchema().dump(budget)

    @budgets_ns.doc(
        description="Delete a budget",
        security="Bearer Auth",
        responses={
            200: "Budget deleted",
            401: "Authentication required",
            404: "Budget not found",
        },
    )
    @jwt_required()
    def delete(self, budget_id):
        """Delete budget"""
        user_id = get_jwt_identity()

        try:
            budget_uuid = uuid.UUID(budget_id)
        except ValueError:
            budgets_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid budget ID format")

        budget = Budget.query.filter_by(id=budget_uuid, user_id=user_id).first()

        if not budget:
            budgets_ns.abort(HTTP_STATUS.NOT_FOUND, "Budget not found")

        db.session.delete(budget)
        db.session.commit()

        return {"message": "Budget deleted"}


@budgets_ns.route("/status")
class BudgetStatus(Resource):
    @budgets_ns.doc(
        description="Get current budget status with alerts",
        security="Bearer Auth",
        responses={200: "Budget status retrieved"},
    )
    @budgets_ns.param("year", "Year", type="integer", default=datetime.now().year)
    @budgets_ns.param("month", "Month", type="integer", default=datetime.now().month)
    @jwt_required()
    def get(self):
        """Get budget status"""
        user_id = get_jwt_identity()
        year = request.args.get("year", datetime.now().year, type=int)
        month = request.args.get("month", datetime.now().month, type=int)

        status = BudgetService.get_budget_status(user_id, year, month)
        return status


@budgets_ns.route("/suggestions")
class BudgetSuggestions(Resource):
    @budgets_ns.doc(
        description="Get AI-powered budget suggestions",
        security="Bearer Auth",
        responses={200: "Suggestions retrieved"},
    )
    @budgets_ns.marshal_list_with(budget_suggestion_model)
    @jwt_required()
    def get(self):
        """Get budget suggestions"""
        user_id = get_jwt_identity()

        suggestions = BudgetService.suggest_budgets(user_id)
        return suggestions


@budgets_ns.route("/<string:budget_id>/progress")
@budgets_ns.param("budget_id", "Budget ID (UUID)")
class BudgetProgress(Resource):
    @budgets_ns.doc(
        description="Get detailed budget progress with projections",
        security="Bearer Auth",
        responses={200: "Progress retrieved", 404: "Budget not found"},
    )
    @budgets_ns.marshal_with(budget_progress_model)
    @jwt_required()
    def get(self, budget_id):
        """Get budget progress"""
        user_id = get_jwt_identity()

        try:
            budget_uuid = uuid.UUID(budget_id)
        except ValueError:
            budgets_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid budget ID format")

        budget = Budget.query.filter_by(id=budget_uuid, user_id=user_id).first()

        if not budget:
            budgets_ns.abort(HTTP_STATUS.NOT_FOUND, "Budget not found")

        projection = budget.get_projection()

        return {
            "budget": BudgetSchema().dump(budget),
            "period": {
                "start": f"{budget.year}-{budget.month or 1:02d}-01",
                "end": f"{budget.year}-{budget.month or 12:02d}-30",
            },
            "daily_progress": [],  # You can implement this if needed
            "projections": projection,
        }


@budgets_ns.route("/rollover")
class BudgetRollover(Resource):
    @budgets_ns.doc(
        description="Rollover unused budget amounts to next period",
        security="Bearer Auth",
        responses={200: "Rollover completed"},
    )
    @jwt_required()
    def post(self):
        """Rollover budgets"""
        user_id = get_jwt_identity()

        today = datetime.now()
        from_month = today.month - 1 if today.month > 1 else 12
        from_year = today.year if today.month > 1 else today.year - 1
        to_month = today.month
        to_year = today.year

        count = BudgetService.rollover_budgets(
            user_id, from_month, from_year, to_month, to_year
        )

        return {"message": f"Rolled over {count} budgets", "count": count}
