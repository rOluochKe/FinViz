"""
Budget routes.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import cache, db
from app.models.budget import Budget
from app.models.category import Category
from app.schemas.budget_schema import (
    BudgetCreateSchema,
    BudgetFilterSchema,
    BudgetSchema,
    BudgetUpdateSchema,
)
from app.services.budget_service import BudgetService
from app.utils.constants import HTTP_STATUS
from app.utils.decorators import paginate, validate_request

budgets_bp = Blueprint("budgets", __name__, url_prefix="/budgets")


@budgets_bp.route("", methods=["GET"])
@jwt_required()
@paginate()
@cache.cached(timeout=60, query_string=True)
def get_budgets():
    """Get user budgets."""
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

    return jsonify({"budgets": BudgetSchema(many=True).dump(budgets)}), HTTP_STATUS.OK


@budgets_bp.route("/<int:budget_id>", methods=["GET"])
@jwt_required()
def get_budget(budget_id):
    """Get single budget."""
    user_id = get_jwt_identity()

    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()

    if not budget:
        return jsonify(error="Budget not found"), HTTP_STATUS.NOT_FOUND

    return jsonify(budget=BudgetSchema().dump(budget)), HTTP_STATUS.OK


@budgets_bp.route("", methods=["POST"])
@jwt_required()
@validate_request(BudgetCreateSchema)
def create_budget():
    """Create budget."""
    user_id = get_jwt_identity()
    data = request.validated_data

    # Check category
    category = Category.query.filter_by(id=data["category_id"]).first()
    if not category:
        return jsonify(error="Category not found"), HTTP_STATUS.BAD_REQUEST

    # Check existing
    existing = Budget.query.filter_by(
        user_id=user_id,
        category_id=data["category_id"],
        period=data["period"],
        year=data["year"],
        month=data.get("month"),
    ).first()

    if existing:
        return jsonify(error="Budget already exists"), HTTP_STATUS.CONFLICT

    # Create
    budget = Budget(user_id=user_id, **data)
    db.session.add(budget)
    db.session.commit()

    return (
        jsonify(message="Budget created", budget=BudgetSchema().dump(budget)),
        HTTP_STATUS.CREATED,
    )


@budgets_bp.route("/<int:budget_id>", methods=["PUT"])
@jwt_required()
@validate_request(BudgetUpdateSchema)
def update_budget(budget_id):
    """Update budget."""
    user_id = get_jwt_identity()
    data = request.validated_data

    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()

    if not budget:
        return jsonify(error="Budget not found"), HTTP_STATUS.NOT_FOUND

    for key, value in data.items():
        setattr(budget, key, value)

    db.session.commit()

    return (
        jsonify(message="Budget updated", budget=BudgetSchema().dump(budget)),
        HTTP_STATUS.OK,
    )


@budgets_bp.route("/<int:budget_id>", methods=["DELETE"])
@jwt_required()
def delete_budget(budget_id):
    """Delete budget."""
    user_id = get_jwt_identity()

    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()

    if not budget:
        return jsonify(error="Budget not found"), HTTP_STATUS.NOT_FOUND

    db.session.delete(budget)
    db.session.commit()

    return jsonify(message="Budget deleted"), HTTP_STATUS.OK


@budgets_bp.route("/status", methods=["GET"])
@jwt_required()
def get_budget_status():
    """Get current budget status."""
    user_id = get_jwt_identity()
    year = request.args.get("year", datetime.now().year, type=int)
    month = request.args.get("month", datetime.now().month, type=int)

    status = BudgetService.get_budget_status(user_id, year, month)

    return jsonify(status), HTTP_STATUS.OK


@budgets_bp.route("/suggestions", methods=["GET"])
@jwt_required()
def get_suggestions():
    """Get budget suggestions."""
    user_id = get_jwt_identity()

    suggestions = BudgetService.suggest_budgets(user_id)

    return jsonify({"suggestions": suggestions}), HTTP_STATUS.OK


@budgets_bp.route("/<int:budget_id>/progress", methods=["GET"])
@jwt_required()
def get_budget_progress(budget_id):
    """Get detailed budget progress."""
    user_id = get_jwt_identity()

    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()

    if not budget:
        return jsonify(error="Budget not found"), HTTP_STATUS.NOT_FOUND

    projection = budget.get_projection()

    return (
        jsonify(
            {
                "budget": BudgetSchema().dump(budget),
                "spent": budget.spent,
                "remaining": budget.remaining,
                "percent": budget.spent_percentage,
                "projection": projection,
            }
        ),
        HTTP_STATUS.OK,
    )


@budgets_bp.route("/rollover", methods=["POST"])
@jwt_required()
def rollover_budgets():
    """Rollover unused budget amounts."""
    user_id = get_jwt_identity()

    today = datetime.now()
    from_month = today.month - 1 if today.month > 1 else 12
    from_year = today.year if today.month > 1 else today.year - 1
    to_month = today.month
    to_year = today.year

    count = BudgetService.rollover_budgets(
        user_id, from_month, from_year, to_month, to_year
    )

    return jsonify(message=f"Rolled over {count} budgets", count=count), HTTP_STATUS.OK
