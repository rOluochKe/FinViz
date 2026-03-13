"""
Report routes with Flask-RESTX.
"""

from datetime import datetime

from flask import request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import cache
from app.services.export_service import ExportService
from app.services.report_service import ReportService
from app.utils.constants import HTTP_STATUS

# Create namespace
reports_ns = Namespace("reports", description="Financial report operations")

# ============================================================================
# Model Definitions
# ============================================================================

# Summary models
summary_model = reports_ns.model(
    "ReportSummary",
    {
        "income": fields.Float(description="Total income", example=5000.00),
        "expense": fields.Float(description="Total expense", example=3250.50),
        "savings": fields.Float(description="Net savings", example=1749.50),
        "rate": fields.Float(description="Savings rate percentage", example=34.99),
        "count": fields.Integer(description="Transaction count", example=45),
    },
)

# Category item model
category_item_model = reports_ns.model(
    "CategoryReportItem",
    {
        "name": fields.String(description="Category name", example="Groceries"),
        "amount": fields.Float(description="Amount spent", example=450.75),
        "count": fields.Integer(description="Transaction count", example=12),
        "color": fields.String(description="Category color", example="#dc3545"),
    },
)

# Daily spending model
daily_spending_model = reports_ns.model(
    "DailySpending",
    {
        "day": fields.Integer(description="Day of month", example=15),
        "amount": fields.Float(description="Amount spent", example=125.50),
    },
)

# Budget comparison model
budget_comparison_model = reports_ns.model(
    "BudgetComparison",
    {
        "category": fields.String(description="Category name", example="Groceries"),
        "budget": fields.Float(description="Budget amount", example=500.00),
        "spent": fields.Float(description="Amount spent", example=325.50),
        "remaining": fields.Float(description="Remaining amount", example=174.50),
        "percent": fields.Float(description="Percentage spent", example=65.1),
    },
)

# Monthly report model
monthly_report_model = reports_ns.model(
    "MonthlyReport",
    {
        "period": fields.String(description="Report period", example="2024-01"),
        "summary": fields.Nested(summary_model),
        "categories": fields.List(fields.Nested(category_item_model)),
        "daily": fields.List(fields.Nested(daily_spending_model)),
        "budgets": fields.List(fields.Nested(budget_comparison_model)),
    },
)

# Monthly breakdown item
monthly_breakdown_item = reports_ns.model(
    "MonthlyBreakdownItem",
    {
        "month": fields.Integer(description="Month number", example=1),
        "name": fields.String(description="Month name", example="January"),
        "income": fields.Float(description="Income amount", example=5000.00),
        "expense": fields.Float(description="Expense amount", example=3250.50),
        "savings": fields.Float(description="Savings amount", example=1749.50),
    },
)

# Top category item
top_category_item = reports_ns.model(
    "TopCategoryItem",
    {
        "name": fields.String(description="Category name", example="Groceries"),
        "color": fields.String(description="Category color", example="#dc3545"),
        "amount": fields.Float(description="Amount spent", example=5400.00),
    },
)

# Yearly report model
yearly_report_model = reports_ns.model(
    "YearlyReport",
    {
        "year": fields.Integer(description="Year", example=2024),
        "summary": fields.Nested(summary_model),
        "monthly": fields.List(fields.Nested(monthly_breakdown_item)),
        "top_categories": fields.List(fields.Nested(top_category_item)),
        "best_month": fields.Nested(monthly_breakdown_item, allow_null=True),
        "worst_month": fields.Nested(monthly_breakdown_item, allow_null=True),
    },
)

# Category report model
category_report_model = reports_ns.model(
    "CategoryReport",
    {
        "category": fields.Raw(description="Category information"),
        "period": fields.String(
            description="Analysis period", example="Last 12 months"
        ),
        "summary": fields.Raw(description="Summary statistics"),
        "monthly": fields.List(fields.Raw, description="Monthly breakdown"),
        "recent": fields.List(fields.Raw, description="Recent transactions"),
    },
)

# Comparison report model
comparison_item_model = reports_ns.model(
    "ComparisonItem",
    {
        "income": fields.Float(description="Income amount"),
        "expense": fields.Float(description="Expense amount"),
        "savings": fields.Float(description="Savings amount"),
        "rate": fields.Float(description="Savings rate"),
        "count": fields.Integer(description="Transaction count"),
    },
)

comparison_report_model = reports_ns.model(
    "ComparisonReport",
    {
        "period1": fields.Nested(monthly_report_model),
        "period2": fields.Nested(monthly_report_model),
        "differences": fields.Raw(description="Differences between periods"),
    },
)

error_response = reports_ns.model(
    "ErrorResponse", {"error": fields.String(description="Error message")}
)

# ============================================================================
# API Endpoints
# ============================================================================


@reports_ns.route("/monthly/<int:year>/<int:month>")
@reports_ns.param("year", "Year", required=True)
@reports_ns.param("month", "Month (1-12)", required=True)
class MonthlyReport(Resource):
    @reports_ns.doc(
        description="Generate detailed monthly financial report",
        security="Bearer Auth",
        responses={
            200: "Monthly report generated",
            400: "Invalid year/month",
            401: "Authentication required",
        },
    )
    @reports_ns.marshal_with(monthly_report_model)
    @jwt_required()
    @cache.cached(timeout=300)
    def get(self, year, month):
        """Get monthly report"""
        if month < 1 or month > 12:
            reports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Month must be between 1 and 12")

        user_id = get_jwt_identity()
        report = ReportService.monthly_report(user_id, year, month)
        return report


@reports_ns.route("/yearly/<int:year>")
@reports_ns.param("year", "Year", required=True)
class YearlyReport(Resource):
    @reports_ns.doc(
        description="Generate yearly financial report with monthly breakdown",
        security="Bearer Auth",
        responses={
            200: "Yearly report generated",
            400: "Invalid year",
            401: "Authentication required",
        },
    )
    @reports_ns.marshal_with(yearly_report_model)
    @jwt_required()
    @cache.cached(timeout=600)
    def get(self, year):
        """Get yearly report"""
        user_id = get_jwt_identity()
        report = ReportService.yearly_report(user_id, year)

        # If there's an error in the report, it might be a string
        if isinstance(report, dict) and "error" in report:
            reports_ns.abort(HTTP_STATUS.NOT_FOUND, report["error"])

        return report


@reports_ns.route("/category/<int:category_id>")
@reports_ns.param("category_id", "Category ID", required=True)
class CategoryReport(Resource):
    @reports_ns.doc(
        description="Get detailed report for a specific category",
        security="Bearer Auth",
        responses={
            200: "Category report generated",
            400: "Invalid parameters",
            401: "Authentication required",
            404: "Category not found",
        },
    )
    @reports_ns.param(
        "months",
        "Number of months to analyze",
        type="integer",
        default=12,
        min=1,
        max=36,
    )
    @reports_ns.marshal_with(category_report_model)
    @jwt_required()
    def get(self, category_id):
        """Get category-specific report"""
        user_id = get_jwt_identity()
        months = request.args.get("months", 12, type=int)

        if months < 1 or months > 36:
            reports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Months must be between 1 and 36")

        report = ReportService.category_report(user_id, category_id, months)

        if isinstance(report, dict) and "error" in report:
            reports_ns.abort(HTTP_STATUS.NOT_FOUND, report["error"])

        return report


@reports_ns.route("/export/monthly/<int:year>/<int:month>")
@reports_ns.param("year", "Year", required=True)
@reports_ns.param("month", "Month (1-12)", required=True)
class ExportMonthlyReport(Resource):
    @reports_ns.doc(
        description="Export monthly report as PDF",
        security="Bearer Auth",
        responses={
            200: "PDF file downloaded",
            400: "Invalid parameters",
            401: "Authentication required",
        },
    )
    @jwt_required()
    def get(self, year, month):
        """Export monthly report as PDF"""
        if month < 1 or month > 12:
            reports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Month must be between 1 and 12")

        user_id = get_jwt_identity()
        report = ReportService.monthly_report(user_id, year, month)

        if isinstance(report, dict) and "error" in report:
            reports_ns.abort(HTTP_STATUS.NOT_FOUND, report["error"])

        # Convert to PDF
        pdf_data = ExportService.to_pdf([report], f"Monthly Report {year}-{month:02d}")
        filename = f"monthly_report_{year}_{month:02d}.pdf"

        return send_file(
            pdf_data,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )


@reports_ns.route("/export/yearly/<int:year>")
@reports_ns.param("year", "Year", required=True)
class ExportYearlyReport(Resource):
    @reports_ns.doc(
        description="Export yearly report as PDF",
        security="Bearer Auth",
        responses={
            200: "PDF file downloaded",
            400: "Invalid year",
            401: "Authentication required",
        },
    )
    @jwt_required()
    def get(self, year):
        """Export yearly report as PDF"""
        user_id = get_jwt_identity()
        report = ReportService.yearly_report(user_id, year)

        if isinstance(report, dict) and "error" in report:
            reports_ns.abort(HTTP_STATUS.NOT_FOUND, report["error"])

        pdf_data = ExportService.to_pdf([report], f"Yearly Report {year}")
        filename = f"yearly_report_{year}.pdf"

        return send_file(
            pdf_data,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )


@reports_ns.route("/comparison")
class ComparePeriods(Resource):
    @reports_ns.doc(
        description="Compare two monthly periods",
        security="Bearer Auth",
        responses={
            200: "Comparison generated",
            400: "Invalid period format",
            401: "Authentication required",
        },
    )
    @reports_ns.param(
        "period1", "First period (YYYY-MM)", required=True, example="2024-01"
    )
    @reports_ns.param(
        "period2", "Second period (YYYY-MM)", required=True, example="2024-02"
    )
    @reports_ns.marshal_with(comparison_report_model)
    @jwt_required()
    def get(self):
        """Compare two periods"""
        user_id = get_jwt_identity()

        period1 = request.args.get("period1")
        period2 = request.args.get("period2")

        if not period1 or not period2:
            reports_ns.abort(
                HTTP_STATUS.BAD_REQUEST, "Both period1 and period2 are required"
            )

        # Parse periods (expects YYYY-MM)
        try:
            y1, m1 = map(int, period1.split("-"))
            y2, m2 = map(int, period2.split("-"))
        except (ValueError, AttributeError):
            reports_ns.abort(
                HTTP_STATUS.BAD_REQUEST,
                "Invalid period format. Use YYYY-MM (e.g., 2024-01)",
            )

        # Validate months
        if not (1 <= m1 <= 12 and 1 <= m2 <= 12):
            reports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Month must be between 1 and 12")

        report1 = ReportService.monthly_report(user_id, y1, m1)
        report2 = ReportService.monthly_report(user_id, y2, m2)

        # Check for errors
        if isinstance(report1, dict) and "error" in report1:
            reports_ns.abort(
                HTTP_STATUS.NOT_FOUND, f"Period1 error: {report1['error']}"
            )
        if isinstance(report2, dict) and "error" in report2:
            reports_ns.abort(
                HTTP_STATUS.NOT_FOUND, f"Period2 error: {report2['error']}"
            )

        comparison = {
            "period1": report1,
            "period2": report2,
            "differences": {
                "income": report2["summary"]["income"] - report1["summary"]["income"],
                "expense": report2["summary"]["expense"]
                - report1["summary"]["expense"],
                "savings": report2["summary"]["savings"]
                - report1["summary"]["savings"],
                "rate": report2["summary"]["rate"] - report1["summary"]["rate"],
                "count": report2["summary"]["count"] - report1["summary"]["count"],
            },
        }

        return comparison


@reports_ns.route("/available")
class AvailableReports(Resource):
    @reports_ns.doc(
        description="Get available report types and formats",
        security="Bearer Auth",
        responses={200: "Available reports retrieved"},
    )
    @jwt_required()
    def get(self):
        """Get available report types"""
        return {
            "reports": [
                {
                    "type": "monthly",
                    "description": "Monthly financial report with category breakdown",
                    "endpoint": "/reports/monthly/{year}/{month}",
                    "export": "/reports/export/monthly/{year}/{month}",
                    "parameters": ["year", "month"],
                },
                {
                    "type": "yearly",
                    "description": "Yearly financial report with monthly breakdown",
                    "endpoint": "/reports/yearly/{year}",
                    "export": "/reports/export/yearly/{year}",
                    "parameters": ["year"],
                },
                {
                    "type": "category",
                    "description": "Category-specific spending report",
                    "endpoint": "/reports/category/{category_id}",
                    "parameters": ["category_id", "months (optional)"],
                },
                {
                    "type": "comparison",
                    "description": "Compare two monthly periods",
                    "endpoint": "/reports/comparison",
                    "parameters": ["period1", "period2"],
                },
            ],
            "export_formats": ["pdf"],
        }


@reports_ns.route("/summary/<int:year>")
@reports_ns.param("year", "Year", required=True)
class YearSummary(Resource):
    @reports_ns.doc(
        description="Get quick summary for a year",
        security="Bearer Auth",
        responses={200: "Summary retrieved"},
    )
    @jwt_required()
    @cache.cached(timeout=300)
    def get(self, year):
        """Get year summary"""
        user_id = get_jwt_identity()
        report = ReportService.yearly_report(user_id, year)

        if isinstance(report, dict) and "error" in report:
            return {"summary": None, "message": report["error"]}

        return {
            "summary": report["summary"],
            "best_month": report.get("best_month"),
            "worst_month": report.get("worst_month"),
        }
