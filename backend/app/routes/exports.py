"""
Export routes.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.transaction import Transaction
from app.services.export_service import ExportService
from app.services.file_service import FileService
from app.utils.constants import HTTP_STATUS

exports_bp = Blueprint("exports", __name__, url_prefix="/exports")


@exports_bp.route("/transactions", methods=["GET"])
@jwt_required()
def export_transactions():
    """Export transactions."""
    user_id = get_jwt_identity()
    format = request.args.get("format", "csv")

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
    file_data = ExportService.export_transactions(data, format)
    filename = ExportService.get_filename("transactions", format)

    # Save for later download (optional)
    file_service = FileService()
    file_info = file_service.save_export(file_data.getvalue(), filename, user_id)

    return send_file(
        file_data,
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name=filename,
    )


@exports_bp.route("/budgets", methods=["GET"])
@jwt_required()
def export_budgets():
    """Export budgets."""
    user_id = get_jwt_identity()
    format = request.args.get("format", "csv")

    from app.models.budget import Budget

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

    file_data = ExportService.export_transactions(data, format)
    filename = ExportService.get_filename("budgets", format)

    return send_file(
        file_data,
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name=filename,
    )


@exports_bp.route("/categories", methods=["GET"])
@jwt_required()
def export_categories():
    """Export categories."""
    user_id = get_jwt_identity()
    format = request.args.get("format", "csv")

    from app.models.category import Category

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

    file_data = ExportService.export_transactions(data, format)
    filename = ExportService.get_filename("categories", format)

    return send_file(
        file_data,
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name=filename,
    )


@exports_bp.route("/report", methods=["POST"])
@jwt_required()
def export_custom_report():
    """Export custom report."""
    user_id = get_jwt_identity()
    data = request.get_json()

    report_type = data.get("type", "transactions")
    format = data.get("format", "csv")
    filters = data.get("filters", {})

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
        return jsonify(error="Invalid report type"), HTTP_STATUS.BAD_REQUEST

    file_data = ExportService.export_transactions(export_data, format)
    filename = ExportService.get_filename(f"report_{report_type}", format)

    return send_file(
        file_data,
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name=filename,
    )


@exports_bp.route("/download/<filename>", methods=["GET"])
@jwt_required()
def download_file(filename):
    """Download previously exported file."""
    user_id = get_jwt_identity()

    file_service = FileService()
    file_path = file_service.get_export_path(filename, user_id)

    if not file_path:
        return jsonify(error="File not found"), HTTP_STATUS.NOT_FOUND

    return send_file(str(file_path), as_attachment=True, download_name=filename)


@exports_bp.route("/exports", methods=["GET"])
@jwt_required()
def list_exports():
    """List user's exported files."""
    user_id = get_jwt_identity()

    file_service = FileService()
    usage = file_service.get_user_usage(user_id)

    return jsonify(usage), HTTP_STATUS.OK
