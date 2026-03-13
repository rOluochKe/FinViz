"""
Analytics routes with Flask-RESTX.
"""

from collections import defaultdict
from datetime import datetime, timedelta

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import cache
from app.models.transaction import Transaction
from app.services.analytics_service import AnalyticsService
from app.services.report_service import ReportService

# Create namespace
analytics_ns = Namespace("analytics", description="Analytics operations")

# ============================================================================
# Model Definitions
# ============================================================================

time_series_point = analytics_ns.model(
    "TimeSeriesPoint",
    {
        "period": fields.String(description="Period", example="2024-01"),
        "income": fields.Float(description="Income amount", example=5000.00),
        "expense": fields.Float(description="Expense amount", example=3250.50),
        "net": fields.Float(description="Net amount", example=1749.50),
        "count": fields.Integer(description="Transaction count", example=45),
    },
)

category_insight = analytics_ns.model(
    "CategoryInsight",
    {
        "category_id": fields.Integer(description="Category ID", example=1),
        "category": fields.String(description="Category name", example="Groceries"),
        "color": fields.String(description="Category color", example="#dc3545"),
        "total": fields.Float(description="Total amount", example=1250.50),
        "avg": fields.Float(description="Average amount", example=45.67),
        "max": fields.Float(description="Maximum amount", example=250.00),
        "min": fields.Float(description="Minimum amount", example=5.99),
        "count": fields.Integer(description="Transaction count", example=25),
        "frequency": fields.String(
            description="Frequency", example="25 times in 90 days"
        ),
    },
)

forecast_period = analytics_ns.model(
    "ForecastPeriod",
    {
        "period": fields.String(description="Period", example="2024-02"),
        "income": fields.Float(description="Forecasted income", example=5200.00),
        "expense": fields.Float(description="Forecasted expense", example=3300.00),
        "net": fields.Float(description="Forecasted net", example=1900.00),
    },
)

anomaly_model = analytics_ns.model(
    "Anomaly",
    {
        "id": fields.Integer(description="Transaction ID", example=123),
        "date": fields.String(description="Date", example="2024-01-15"),
        "amount": fields.Float(description="Amount", example=999.99),
        "desc": fields.String(
            description="Description", example="Unusual large purchase"
        ),
        "category": fields.String(description="Category", example="Shopping"),
        "z_score": fields.Float(description="Z-score", example=2.5),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@analytics_ns.route("/spending-patterns")
class SpendingPatterns(Resource):
    @analytics_ns.doc(
        description="Analyze spending patterns and detect trends",
        security="Bearer Auth",
        responses={200: "Patterns retrieved"},
    )
    @analytics_ns.param(
        "months", "Number of months to analyze", type="integer", default=6
    )
    @jwt_required()
    @cache.cached(timeout=300, query_string=True)
    def get(self):
        """Get spending pattern analysis"""
        user_id = get_jwt_identity()
        months = request.args.get("months", 6, type=int)

        result = AnalyticsService.calculate_spending_patterns(user_id, months)
        return result


@analytics_ns.route("/anomalies")
class Anomalies(Resource):
    @analytics_ns.doc(
        description="Detect anomalous transactions using statistical methods",
        security="Bearer Auth",
        responses={200: "Anomalies detected"},
    )
    @analytics_ns.param("days", "Days to analyze", type="integer", default=30)
    @analytics_ns.param("threshold", "Z-score threshold", type="float", default=2.0)
    @analytics_ns.marshal_list_with(anomaly_model)
    @jwt_required()
    def get(self):
        """Detect transaction anomalies"""
        user_id = get_jwt_identity()
        days = request.args.get("days", 30, type=int)
        threshold = request.args.get("threshold", 2.0, type=float)

        result = AnalyticsService.detect_anomalies(user_id, days, threshold)
        return result.get("items", [])


@analytics_ns.route("/forecast")
class Forecast(Resource):
    @analytics_ns.doc(
        description="Generate financial forecast using linear regression",
        security="Bearer Auth",
        responses={200: "Forecast generated"},
    )
    @analytics_ns.param("months", "Months to forecast", type="integer", default=6)
    @analytics_ns.marshal_with(
        analytics_ns.model(
            "ForecastResponse",
            {
                "historical": fields.List(fields.String),
                "forecast": fields.List(fields.Nested(forecast_period)),
                "confidence": fields.Float(description="Confidence score", example=0.8),
            },
        )
    )
    @jwt_required()
    @cache.cached(timeout=3600)
    def get(self):
        """Get financial forecast"""
        user_id = get_jwt_identity()
        months = request.args.get("months", 6, type=int)

        result = AnalyticsService.generate_forecast(user_id, months)
        return result


@analytics_ns.route("/category-insights")
class CategoryInsights(Resource):
    @analytics_ns.doc(
        description="Get insights for each spending category",
        security="Bearer Auth",
        responses={200: "Insights retrieved"},
    )
    @analytics_ns.marshal_list_with(category_insight)
    @jwt_required()
    def get(self):
        """Get category-level insights"""
        user_id = get_jwt_identity()

        result = AnalyticsService.get_category_insights(user_id)
        return result


@analytics_ns.route("/monthly/<int:year>/<int:month>")
@analytics_ns.param("year", "Year", required=True)
@analytics_ns.param("month", "Month (1-12)", required=True)
class MonthlyReport(Resource):
    @analytics_ns.doc(
        description="Generate detailed monthly financial report",
        security="Bearer Auth",
        responses={200: "Report generated"},
    )
    @jwt_required()
    @cache.cached(timeout=300)
    def get(self, year, month):
        """Get monthly report"""
        user_id = get_jwt_identity()

        result = ReportService.monthly_report(user_id, year, month)
        return result


@analytics_ns.route("/yearly/<int:year>")
@analytics_ns.param("year", "Year", required=True)
class YearlyReport(Resource):
    @analytics_ns.doc(
        description="Generate yearly financial report with monthly breakdown",
        security="Bearer Auth",
        responses={200: "Report generated"},
    )
    @jwt_required()
    @cache.cached(timeout=600)
    def get(self, year):
        """Get yearly report"""
        user_id = get_jwt_identity()

        result = ReportService.yearly_report(user_id, year)
        return result


@analytics_ns.route("/category/<int:category_id>")
@analytics_ns.param("category_id", "Category ID", required=True)
class CategoryReport(Resource):
    @analytics_ns.doc(
        description="Get detailed report for a specific category",
        security="Bearer Auth",
        responses={200: "Report generated"},
    )
    @analytics_ns.param("months", "Months to analyze", type="integer", default=12)
    @jwt_required()
    def get(self, category_id):
        """Get category-specific report"""
        user_id = get_jwt_identity()
        months = request.args.get("months", 12, type=int)

        result = ReportService.category_report(user_id, category_id, months)
        return result


@analytics_ns.route("/trends")
class Trends(Resource):
    @analytics_ns.doc(
        description="Get spending trends over time",
        security="Bearer Auth",
        responses={200: "Trends retrieved"},
    )
    @analytics_ns.param(
        "group_by",
        "Group by (day/week/month)",
        type="string",
        default="month",
        enum=["day", "week", "month"],
    )
    @jwt_required()
    @cache.cached(timeout=300)
    def get(self):
        """Get spending trends"""
        user_id = get_jwt_identity()
        group_by = request.args.get("group_by", "month")

        end = datetime.now().date()
        if group_by == "day":
            start = end - timedelta(days=30)
        elif group_by == "week":
            start = end - timedelta(weeks=12)
        else:
            start = end - timedelta(days=365)

        transactions = Transaction.query.filter(
            Transaction.user_id == user_id, Transaction.date >= start
        ).all()

        # Group data
        data = defaultdict(lambda: {"income": 0, "expense": 0, "count": 0})

        for t in transactions:
            if group_by == "day":
                key = t.date.isoformat()
            elif group_by == "week":
                year, week, _ = t.date.isocalendar()
                key = f"{year}-W{week}"
            else:
                key = f"{t.date.year}-{t.date.month:02d}"

            if t.is_income:
                data[key]["income"] += float(t.amount)
            else:
                data[key]["expense"] += float(t.amount)
            data[key]["count"] += 1

        return {"trends": [{"period": k, **v} for k, v in sorted(data.items())]}


@analytics_ns.route("/cash-flow")
class CashFlow(Resource):
    @analytics_ns.doc(
        description="Get cash flow analysis",
        security="Bearer Auth",
        responses={200: "Cash flow data retrieved"},
    )
    @analytics_ns.param("days", "Days to analyze", type="integer", default=30)
    @jwt_required()
    def get(self):
        """Get cash flow analysis"""
        user_id = get_jwt_identity()
        days = request.args.get("days", 30, type=int)

        end = datetime.now().date()
        start = end - timedelta(days=days)

        transactions = (
            Transaction.query.filter(
                Transaction.user_id == user_id, Transaction.date >= start
            )
            .order_by(Transaction.date)
            .all()
        )

        balance = 0
        daily = {}

        for t in transactions:
            date_str = t.date.isoformat()
            if date_str not in daily:
                daily[date_str] = {"inflow": 0, "outflow": 0, "balance": balance}

            if t.is_income:
                daily[date_str]["inflow"] += float(t.amount)
                balance += float(t.amount)
            else:
                daily[date_str]["outflow"] += float(t.amount)
                balance -= float(t.amount)

            daily[date_str]["balance"] = balance

        return {
            "cash_flow": [{"date": k, **v} for k, v in sorted(daily.items())],
            "current_balance": balance,
        }
