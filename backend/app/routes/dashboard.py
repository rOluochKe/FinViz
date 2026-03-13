"""
Dashboard routes with Flask-RESTX.
"""

from collections import defaultdict
from datetime import date, datetime, timedelta

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import cache
from app.models.transaction import Transaction
from app.services.budget_service import BudgetService
from app.services.dashboard_service import DashboardService

# Create namespace
dashboard_ns = Namespace("dashboard", description="Dashboard operations")

# ============================================================================
# Model Definitions
# ============================================================================

kpi_model = dashboard_ns.model(
    "KPI",
    {
        "current": fields.Float(description="Current value"),
        "previous": fields.Float(description="Previous period value"),
        "change": fields.Float(description="Change amount"),
        "trend": fields.Float(description="Trend percentage"),
    },
)

kpis_model = dashboard_ns.model(
    "KPIs",
    {
        "income": fields.Nested(kpi_model),
        "expense": fields.Nested(kpi_model),
        "savings": fields.Raw(description="Savings data"),
        "rate": fields.Float(description="Savings rate"),
        "count": fields.Integer(description="Transaction count"),
    },
)

recent_transaction_model = dashboard_ns.model(
    "RecentTransaction",
    {
        "id": fields.Integer(description="Transaction ID"),
        "date": fields.String(description="Date"),
        "desc": fields.String(description="Description"),
        "amount": fields.Float(description="Amount"),
        "type": fields.String(description="Type"),
        "category": fields.String(description="Category name"),
        "color": fields.String(description="Category color"),
    },
)

category_spending_model = dashboard_ns.model(
    "CategorySpending",
    {
        "category": fields.String(description="Category name"),
        "amount": fields.Float(description="Amount spent"),
        "percent": fields.Float(description="Percentage of total"),
    },
)

monthly_trend_model = dashboard_ns.model(
    "MonthlyTrend",
    {
        "month": fields.String(description="Month (YYYY-MM)"),
        "income": fields.Float(description="Income amount"),
        "expense": fields.Float(description="Expense amount"),
        "savings": fields.Float(description="Savings amount"),
    },
)

trends_model = dashboard_ns.model(
    "Trends", {"trends": fields.List(fields.Nested(monthly_trend_model))}
)

insight_model = dashboard_ns.model(
    "Insight",
    {
        "type": fields.String(
            description="Insight type", enum=["success", "warning", "info"]
        ),
        "title": fields.String(description="Insight title"),
        "msg": fields.String(description="Insight message"),
        "action": fields.String(description="Suggested action"),
    },
)

dashboard_summary_model = dashboard_ns.model(
    "DashboardSummary",
    {
        "kpis": fields.Nested(kpis_model),
        "recent": fields.List(fields.Nested(recent_transaction_model)),
        "spending_by_category": fields.List(fields.Nested(category_spending_model)),
        "trends": fields.Nested(trends_model),
        "insights": fields.List(fields.Nested(insight_model)),
        "generated": fields.String(description="Generation timestamp"),
    },
)

upcoming_transaction_model = dashboard_ns.model(
    "UpcomingTransaction",
    {
        "id": fields.Integer(description="Transaction ID"),
        "desc": fields.String(description="Description"),
        "amount": fields.Float(description="Amount"),
        "type": fields.String(description="Type"),
        "date": fields.String(description="Next date"),
        "days": fields.Integer(description="Days until"),
        "category": fields.String(description="Category name", allow_null=True),
    },
)

upcoming_response_model = dashboard_ns.model(
    "UpcomingResponse",
    {"upcoming": fields.List(fields.Nested(upcoming_transaction_model))},
)

net_worth_point_model = dashboard_ns.model(
    "NetWorthPoint",
    {
        "date": fields.String(description="Date"),
        "net_worth": fields.Float(description="Net worth"),
    },
)

net_worth_model = dashboard_ns.model(
    "NetWorth",
    {
        "current": fields.Float(description="Current net worth"),
        "history": fields.List(fields.Nested(net_worth_point_model)),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@dashboard_ns.route("/summary")
class DashboardSummary(Resource):
    @dashboard_ns.doc(
        description="Get complete dashboard summary with KPIs and visualizations",
        security="Bearer Auth",
        responses={200: "Dashboard data retrieved"},
    )
    @dashboard_ns.param("days", "Days to analyze", type="integer", default=30)
    @dashboard_ns.marshal_with(dashboard_summary_model)
    @jwt_required()
    @cache.cached(timeout=60)
    def get(self):
        """Get full dashboard data"""
        user_id = get_jwt_identity()
        days = request.args.get("days", 30, type=int)

        data = DashboardService.get_full_dashboard(user_id, days)
        return data


@dashboard_ns.route("/kpis")
class DashboardKPIs(Resource):
    @dashboard_ns.doc(
        description="Get key performance indicators",
        security="Bearer Auth",
        responses={200: "KPIs retrieved"},
    )
    @dashboard_ns.param("days", "Days to analyze", type="integer", default=30)
    @dashboard_ns.marshal_with(kpis_model)
    @jwt_required()
    @cache.cached(timeout=60)
    def get(self):
        """Get KPIs only"""
        user_id = get_jwt_identity()
        days = request.args.get("days", 30, type=int)

        kpis = DashboardService.get_kpis(user_id, days)
        return kpis


@dashboard_ns.route("/recent")
class DashboardRecent(Resource):
    @dashboard_ns.doc(
        description="Get recent transactions",
        security="Bearer Auth",
        responses={200: "Recent transactions retrieved"},
    )
    @dashboard_ns.param("limit", "Number of transactions", type="integer", default=10)
    @dashboard_ns.marshal_list_with(recent_transaction_model)
    @jwt_required()
    def get(self):
        """Get recent transactions"""
        user_id = get_jwt_identity()
        limit = request.args.get("limit", 10, type=int)

        recent = DashboardService.get_recent_transactions(user_id, limit)
        return recent


@dashboard_ns.route("/spending-by-category")
class SpendingByCategory(Resource):
    @dashboard_ns.doc(
        description="Get spending breakdown by category",
        security="Bearer Auth",
        responses={200: "Category breakdown retrieved"},
    )
    @dashboard_ns.param("days", "Days to analyze", type="integer", default=30)
    @dashboard_ns.marshal_list_with(category_spending_model)
    @jwt_required()
    @cache.cached(timeout=300)
    def get(self):
        """Get spending by category"""
        user_id = get_jwt_identity()
        days = request.args.get("days", 30, type=int)

        data = DashboardService.get_spending_by_category(user_id, days)
        return data


@dashboard_ns.route("/monthly-trends")
class MonthlyTrends(Resource):
    @dashboard_ns.doc(
        description="Get monthly income/expense trends",
        security="Bearer Auth",
        responses={200: "Trends retrieved"},
    )
    @dashboard_ns.param("months", "Number of months", type="integer", default=6)
    @dashboard_ns.marshal_with(trends_model)
    @jwt_required()
    @cache.cached(timeout=300)
    def get(self):
        """Get monthly trends"""
        user_id = get_jwt_identity()
        months = request.args.get("months", 6, type=int)

        data = DashboardService.get_monthly_trends(user_id, months)
        return data


@dashboard_ns.route("/insights")
class DashboardInsights(Resource):
    @dashboard_ns.doc(
        description="Get quick AI-generated insights",
        security="Bearer Auth",
        responses={200: "Insights retrieved"},
    )
    @dashboard_ns.marshal_list_with(insight_model)
    @jwt_required()
    def get(self):
        """Get insights"""
        user_id = get_jwt_identity()

        insights = DashboardService.get_insights(user_id)
        return insights


@dashboard_ns.route("/budget-status")
class DashboardBudgetStatus(Resource):
    @dashboard_ns.doc(
        description="Get budget status for dashboard",
        security="Bearer Auth",
        responses={200: "Budget status retrieved"},
    )
    @dashboard_ns.param("year", "Year", type="integer", default=datetime.now().year)
    @dashboard_ns.param("month", "Month", type="integer", default=datetime.now().month)
    @jwt_required()
    def get(self):
        """Get budget status"""
        user_id = get_jwt_identity()
        year = request.args.get("year", datetime.now().year, type=int)
        month = request.args.get("month", datetime.now().month, type=int)

        status = BudgetService.get_budget_status(user_id, year, month)
        return status


@dashboard_ns.route("/upcoming")
class UpcomingTransactions(Resource):
    @dashboard_ns.doc(
        description="Get upcoming recurring transactions",
        security="Bearer Auth",
        responses={200: "Upcoming transactions retrieved"},
    )
    @dashboard_ns.marshal_with(upcoming_response_model)
    @jwt_required()
    def get(self):
        """Get upcoming transactions"""
        user_id = get_jwt_identity()

        recurring = Transaction.query.filter_by(
            user_id=user_id, is_recurring=True
        ).all()

        today = datetime.now().date()
        upcoming = []

        for tx in recurring:
            if not tx.recurring_frequency:
                continue

            # Simple next date calculation
            if tx.recurring_frequency == "monthly":
                try:
                    next_date = date(today.year, today.month, tx.date.day)
                    if next_date < today:
                        if today.month == 12:
                            next_date = date(today.year + 1, 1, tx.date.day)
                        else:
                            next_date = date(today.year, today.month + 1, tx.date.day)
                except ValueError:
                    continue
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

        return {"upcoming": sorted(upcoming, key=lambda x: x["days"])}


@dashboard_ns.route("/net-worth")
class NetWorth(Resource):
    @dashboard_ns.doc(
        description="Calculate net worth over time",
        security="Bearer Auth",
        responses={200: "Net worth data retrieved"},
    )
    @dashboard_ns.marshal_with(net_worth_model)
    @jwt_required()
    @cache.cached(timeout=3600)
    def get(self):
        """Get net worth history"""
        user_id = get_jwt_identity()

        transactions = (
            Transaction.query.filter_by(user_id=user_id)
            .order_by(Transaction.date)
            .all()
        )

        if not transactions:
            return {"current": 0, "history": []}

        balance = 0
        history = []

        for t in transactions:
            if t.is_income:
                balance += float(t.amount)
            else:
                balance -= float(t.amount)

            history.append({"date": t.date.isoformat(), "net_worth": balance})

        return {"current": balance, "history": history}
