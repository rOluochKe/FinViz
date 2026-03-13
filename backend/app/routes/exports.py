"""
Export routes with Flask-RESTX.
"""

from datetime import datetime

from flask import request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import db
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.services.export_service import ExportService
from app.services.file_service import FileService
from app.utils.constants import HTTP_STATUS, ExportFormat

# Create namespace
exports_ns = Namespace("exports", description="Data export operations")

# ============================================================================
# Model Definitions
# ============================================================================

# Common response models
message_response = exports_ns.model(
    "MessageResponse", {"message": fields.String(description="Response message")}
)

error_response = exports_ns.model(
    "ErrorResponse", {"error": fields.String(description="Error message")}
)

# Export format enum
export_format = exports_ns.model(
    "ExportFormat",
    {
        "format": fields.String(
            description="Export format", enum=ExportFormat.choices(), example="csv"
        )
    },
)

# Export filter models
transaction_export_filter = exports_ns.model(
    "TransactionExportFilter",
    {
        "start_date": fields.String(
            description="Start date (YYYY-MM-DD)", example="2024-01-01"
        ),
        "end_date": fields.String(
            description="End date (YYYY-MM-DD)", example="2024-12-31"
        ),
        "category_id": fields.Integer(description="Category ID filter", example=5),
    },
)

custom_report_model = exports_ns.model(
    "CustomReport",
    {
        "type": fields.String(
            required=True,
            description="Report type",
            enum=["transactions"],
            default="transactions",
        ),
        "format": fields.String(
            description="Export format", enum=ExportFormat.choices(), default="csv"
        ),
        "filters": fields.Nested(
            transaction_export_filter, description="Report filters"
        ),
    },
)

# Export data models
transaction_export_item = exports_ns.model(
    "TransactionExportItem",
    {
        "date": fields.String(description="Transaction date", example="2024-01-15"),
        "description": fields.String(
            description="Transaction description", example="Grocery shopping"
        ),
        "amount": fields.Float(description="Transaction amount", example=45.67),
        "type": fields.String(description="Transaction type", example="expense"),
        "category": fields.String(description="Category name", example="Groceries"),
        "notes": fields.String(
            description="Additional notes", example="Weekly shopping"
        ),
    },
)

budget_export_item = exports_ns.model(
    "BudgetExportItem",
    {
        "category": fields.String(description="Category name", example="Groceries"),
        "amount": fields.Float(description="Budget amount", example=500.00),
        "period": fields.String(description="Budget period", example="monthly"),
        "year": fields.Integer(description="Year", example=2024),
        "month": fields.Integer(description="Month", example=1, allow_null=True),
        "spent": fields.Float(description="Amount spent", example=325.50),
        "remaining": fields.Float(description="Remaining amount", example=174.50),
    },
)

category_export_item = exports_ns.model(
    "CategoryExportItem",
    {
        "name": fields.String(description="Category name", example="Groceries"),
        "type": fields.String(description="Category type", example="expense"),
        "color": fields.String(description="Hex color code", example="#dc3545"),
        "icon": fields.String(description="Icon identifier", example="basket"),
        "is_system": fields.Boolean(description="Is system category", example=False),
    },
)

# File info models
file_info_model = exports_ns.model(
    "FileInfo",
    {
        "filename": fields.String(
            description="Filename", example="transactions_20240101_120000.csv"
        ),
        "original": fields.String(
            description="Original filename", example="transactions.csv"
        ),
        "path": fields.String(
            description="File path",
            example="exports/1/transactions_20240101_120000.csv",
        ),
        "size": fields.Integer(description="File size in bytes", example=1024),
        "url": fields.String(
            description="Download URL",
            example="/uploads/exports/1/transactions_20240101_120000.csv",
        ),
    },
)

# Storage usage models
storage_item_model = exports_ns.model(
    "StorageItem",
    {
        "count": fields.Integer(description="Number of files", example=5),
        "size": fields.Integer(description="Total size in bytes", example=10240),
        "mb": fields.Float(description="Size in megabytes", example=0.01),
    },
)

storage_usage_model = exports_ns.model(
    "StorageUsage",
    {
        "receipts": fields.Nested(storage_item_model),
        "exports": fields.Nested(storage_item_model),
        "total": fields.Nested(storage_item_model),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@exports_ns.route("/transactions")
class ExportTransactions(Resource):
    @exports_ns.doc(
        description="Export transactions to file (CSV, JSON, Excel)",
        security="Bearer Auth",
        responses={
            200: "File downloaded successfully",
            400: "Invalid format",
            401: "Authentication required",
        },
    )
    @exports_ns.param(
        "format",
        "Export format",
        type="string",
        default="csv",
        enum=ExportFormat.choices(),
    )
    @exports_ns.param("start_date", "Start date filter (YYYY-MM-DD)", type="string")
    @exports_ns.param("end_date", "End date filter (YYYY-MM-DD)", type="string")
    @jwt_required()
    def get(self):
        """Export transactions to file"""
        user_id = get_jwt_identity()
        export_format = request.args.get("format", "csv")

        if export_format not in ExportFormat.choices():
            exports_ns.abort(
                HTTP_STATUS.BAD_REQUEST,
                f"Invalid format. Must be one of: {', '.join(ExportFormat.choices())}",
            )

        # Get filters
        start = request.args.get("start_date")
        end = request.args.get("end_date")

        # Build query
        query = Transaction.query.filter_by(user_id=user_id)

        if start:
            query = query.filter(Transaction.date >= start)
        if end:
            query = query.filter(Transaction.date <= end)

        transactions = query.order_by(Transaction.date.desc()).all()

        # Convert to dict
        data = []
        for t in transactions:
            data.append(
                {
                    "date": t.date.isoformat(),
                    "description": t.description,
                    "amount": float(t.amount),
                    "type": t.type,
                    "category": t.category.name if t.category else "",
                    "notes": t.notes or "",
                }
            )

        # Export
        file_data = ExportService.export_transactions(data, export_format)
        filename = ExportService.get_filename("transactions", export_format)

        # Save for later download
        file_service = FileService()
        file_service.save_export(file_data.getvalue(), filename, user_id)

        return send_file(
            file_data,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=filename,
        )


@exports_ns.route("/budgets")
class ExportBudgets(Resource):
    @exports_ns.doc(
        description="Export budgets to file (CSV, JSON, Excel)",
        security="Bearer Auth",
        responses={
            200: "File downloaded successfully",
            400: "Invalid format",
            401: "Authentication required",
        },
    )
    @exports_ns.param(
        "format",
        "Export format",
        type="string",
        default="csv",
        enum=ExportFormat.choices(),
    )
    @jwt_required()
    def get(self):
        """Export budgets to file"""
        user_id = get_jwt_identity()
        export_format = request.args.get("format", "csv")

        if export_format not in ExportFormat.choices():
            exports_ns.abort(
                HTTP_STATUS.BAD_REQUEST,
                f"Invalid format. Must be one of: {', '.join(ExportFormat.choices())}",
            )

        budgets = Budget.query.filter_by(user_id=user_id).all()

        data = []
        for b in budgets:
            data.append(
                {
                    "category": b.category.name if b.category else "",
                    "amount": float(b.amount),
                    "period": b.period,
                    "year": b.year,
                    "month": b.month,
                    "spent": b.spent,
                    "remaining": b.remaining,
                }
            )

        file_data = ExportService.export_transactions(data, export_format)
        filename = ExportService.get_filename("budgets", export_format)

        return send_file(
            file_data,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=filename,
        )


@exports_ns.route("/categories")
class ExportCategories(Resource):
    @exports_ns.doc(
        description="Export categories to file (CSV, JSON, Excel)",
        security="Bearer Auth",
        responses={
            200: "File downloaded successfully",
            400: "Invalid format",
            401: "Authentication required",
        },
    )
    @exports_ns.param(
        "format",
        "Export format",
        type="string",
        default="csv",
        enum=ExportFormat.choices(),
    )
    @jwt_required()
    def get(self):
        """Export categories to file"""
        user_id = get_jwt_identity()
        export_format = request.args.get("format", "csv")

        if export_format not in ExportFormat.choices():
            exports_ns.abort(
                HTTP_STATUS.BAD_REQUEST,
                f"Invalid format. Must be one of: {', '.join(ExportFormat.choices())}",
            )

        categories = Category.query.filter(
            db.or_(Category.user_id == user_id, Category.is_system == True)
        ).all()

        data = [
            {
                "name": c.name,
                "type": c.type,
                "color": c.color,
                "icon": c.icon,
                "is_system": c.is_system,
            }
            for c in categories
        ]

        file_data = ExportService.export_transactions(data, export_format)
        filename = ExportService.get_filename("categories", export_format)

        return send_file(
            file_data,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=filename,
        )


@exports_ns.route("/report")
class ExportCustomReport(Resource):
    @exports_ns.doc(
        description="Generate and export custom report",
        security="Bearer Auth",
        responses={
            200: "Report downloaded successfully",
            400: "Invalid request",
            401: "Authentication required",
        },
    )
    @exports_ns.expect(custom_report_model)
    @jwt_required()
    def post(self):
        """Export custom report"""
        user_id = get_jwt_identity()
        data = request.json or {}

        report_type = data.get("type", "transactions")
        export_format = data.get("format", "csv")
        filters = data.get("filters", {})

        if export_format not in ExportFormat.choices():
            exports_ns.abort(
                HTTP_STATUS.BAD_REQUEST,
                f"Invalid format. Must be one of: {', '.join(ExportFormat.choices())}",
            )

        # Build data based on report type
        if report_type == "transactions":
            query = Transaction.query.filter_by(user_id=user_id)

            if filters.get("start_date"):
                query = query.filter(Transaction.date >= filters["start_date"])
            if filters.get("end_date"):
                query = query.filter(Transaction.date <= filters["end_date"])
            if filters.get("category_id"):
                query = query.filter_by(category_id=filters["category_id"])

            items = query.all()
            export_data = [
                {
                    "date": t.date.isoformat(),
                    "description": t.description,
                    "amount": float(t.amount),
                    "type": t.type,
                    "category": t.category.name if t.category else "",
                }
                for t in items
            ]
        else:
            return exports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid report type")

        file_data = ExportService.export_transactions(export_data, export_format)
        filename = ExportService.get_filename(f"report_{report_type}", export_format)

        return send_file(
            file_data,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=filename,
        )


@exports_ns.route("/download/<string:filename>")
@exports_ns.param("filename", "Filename to download")
class DownloadFile(Resource):
    @exports_ns.doc(
        description="Download a previously exported file",
        security="Bearer Auth",
        responses={
            200: "File downloaded successfully",
            401: "Authentication required",
            404: "File not found",
        },
    )
    @jwt_required()
    def get(self, filename):
        """Download exported file"""
        user_id = get_jwt_identity()

        file_service = FileService()
        file_path = file_service.get_export_path(filename, user_id)

        if not file_path:
            exports_ns.abort(HTTP_STATUS.NOT_FOUND, "File not found")

        return send_file(str(file_path), as_attachment=True, download_name=filename)


@exports_ns.route("/files")
class ListExports(Resource):
    @exports_ns.doc(
        description="List user's exported files and storage usage",
        security="Bearer Auth",
        responses={200: "Storage usage retrieved", 401: "Authentication required"},
    )
    @exports_ns.marshal_with(storage_usage_model)
    @jwt_required()
    def get(self):
        """List exported files and storage usage"""
        user_id = get_jwt_identity()

        file_service = FileService()
        usage = file_service.get_user_usage(user_id)

        return usage


@exports_ns.route("/formats")
class ListFormats(Resource):
    @exports_ns.doc(
        description="List available export formats",
        security="Bearer Auth",
        responses={200: "Formats retrieved"},
    )
    @jwt_required()
    def get(self):
        """Get available export formats"""
        return {
            "formats": ExportFormat.choices(),
            "default": "csv",
            "description": "Supported export formats: CSV, JSON, Excel, PDF",
        }
