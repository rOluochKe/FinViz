"""
Dashboard routes.
"""

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import cache
from app.services.budget_service import BudgetService
from app.services.dashboard_service import DashboardService
from app.utils.constants import HTTP_STATUS

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
@cache.cached(timeout=60)
def get_summary():
    """Get dashboard summary."""
    user_id = get_jwt_identity()
    days = request.args.get("days", 30, type=int)

    data = DashboardService.get_full_dashboard(user_id, days)

    return jsonify(data), HTTP_STATUS.OK


@dashboard_bp.route("/kpis", methods=["GET"])
@jwt_required()
@cache.cached(timeout=60)
def get_kpis():
    """Get KPIs only."""
    user_id = get_jwt_identity()
    days = request.args.get("days", 30, type=int)

    kpis = DashboardService.get_kpis(user_id, days)

    return jsonify(kpis), HTTP_STATUS.OK


@dashboard_bp.route("/recent", methods=["GET"])
@jwt_required()
def get_recent():
    """Get recent transactions."""
    user_id = get_jwt_identity()
    limit = request.args.get("limit", 10, type=int)

    recent = DashboardService.get_recent_transactions(user_id, limit)

    return jsonify({"recent": recent}), HTTP_STATUS.OK


@dashboard_bp.route("/spending-by-category", methods=["GET"])
@jwt_required()
@cache.cached(timeout=300)
def spending_by_category():
    """Get spending breakdown by category."""
    user_id = get_jwt_identity()
    days = request.args.get("days", 30, type=int)

    data = DashboardService.get_spending_by_category(user_id, days)

    return jsonify({"categories": data}), HTTP_STATUS.OK


@dashboard_bp.route("/monthly-trends", methods=["GET"])
@jwt_required()
@cache.cached(timeout=300)
def monthly_trends():
    """Get monthly trends."""
    user_id = get_jwt_identity()
    months = request.args.get("months", 6, type=int)

    data = DashboardService.get_monthly_trends(user_id, months)

    return jsonify(data), HTTP_STATUS.OK


@dashboard_bp.route("/insights", methods=["GET"])
@jwt_required()
def get_insights():
    """Get quick insights."""
    user_id = get_jwt_identity()

    insights = DashboardService.get_insights(user_id)

    return jsonify({"insights": insights}), HTTP_STATUS.OK


@dashboard_bp.route("/budget-status", methods=["GET"])
@jwt_required()
def budget_status():
    """Get budget status for dashboard."""
    user_id = get_jwt_identity()
    year = request.args.get("year", datetime.now().year, type=int)
    month = request.args.get("month", datetime.now().month, type=int)

    status = BudgetService.get_budget_status(user_id, year, month)

    return jsonify(status), HTTP_STATUS.OK


@dashboard_bp.route("/upcoming", methods=["GET"])
@jwt_required()
def get_upcoming():
    """Get upcoming recurring transactions."""
    user_id = get_jwt_identity()

    from app.models.transaction import Transaction

    recurring = Transaction.query.filter_by(user_id=user_id, is_recurring=True).all()

    today = datetime.now().date()
    upcoming = []

    for tx in recurring:
        if not tx.recurring_frequency:
            continue

        # Simple next date calculation
        if tx.recurring_frequency == "monthly":
            next_date = date(today.year, today.month, tx.date.day)
            if next_date < today:
                if today.month == 12:
                    next_date = date(today.year + 1, 1, tx.date.day)
                else:
                    next_date = date(today.year, today.month + 1, tx.date.day)
        else:
            continue

        days = (next_date - today).days
        if 0 <= days <= 30:
            upcoming.append(
                {
                    "id": tx.id,
                    "desc": tx.description,
                    "amount": float(tx.amount),
                    "type": tx.type,
                    "date": next_date.isoformat(),
                    "days": days,
                    "category": tx.category.name if tx.category else None,
                }
            )

    return (
        jsonify({"upcoming": sorted(upcoming, key=lambda x: x["days"])}),
        HTTP_STATUS.OK,
    )


@dashboard_bp.route("/net-worth", methods=["GET"])
@jwt_required()
@cache.cached(timeout=3600)
def net_worth():
    """Calculate net worth over time."""
    user_id = get_jwt_identity()

    from app.models.transaction import Transaction

    tx = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date).all()

    if not tx:
        return jsonify(net_worth=0, history=[]), HTTP_STATUS.OK

    balance = 0
    history = []

    for t in tx:
        if t.is_income:
            balance += float(t.amount)
        else:
            balance -= float(t.amount)

        history.append({"date": t.date.isoformat(), "net_worth": balance})

    return jsonify({"current": balance, "history": history}), HTTP_STATUS.OK
