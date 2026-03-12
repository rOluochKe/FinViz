"""
Transaction routes.
"""

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import cache, db
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction_schema import (
    BulkTransactionSchema,
    TransactionCreateSchema,
    TransactionFilterSchema,
    TransactionSchema,
    TransactionUpdateSchema,
)
from app.services.export_service import ExportService
from app.services.file_service import FileService
from app.utils.constants import HTTP_STATUS
from app.utils.decorators import cache_control, paginate, validate_request

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")


@transactions_bp.route("", methods=["GET"])
@jwt_required()
@paginate()
@cache.cached(timeout=60, query_string=True)
def get_transactions():
    """Get user transactions."""
    user_id = get_jwt_identity()
    page = request.pagination["page"]
    per_page = request.pagination["per_page"]

    # Build query
    query = Transaction.query.filter_by(user_id=user_id)

    # Apply filters
    if request.args.get("start_date"):
        query = query.filter(Transaction.date >= request.args["start_date"])
    if request.args.get("end_date"):
        query = query.filter(Transaction.date <= request.args["end_date"])
    if request.args.get("category_id"):
        query = query.filter_by(category_id=request.args["category_id"])
    if request.args.get("type"):
        query = query.filter_by(type=request.args["type"])
    if request.args.get("search"):
        search = f"%{request.args['search']}%"
        query = query.filter(Transaction.description.ilike(search))

    # Sorting
    sort = request.args.get("sort", "date")
    order = request.args.get("order", "desc")

    if sort == "date":
        query = query.order_by(
            Transaction.date.desc() if order == "desc" else Transaction.date
        )
    elif sort == "amount":
        query = query.order_by(
            Transaction.amount.desc() if order == "desc" else Transaction.amount
        )
    else:
        query = query.order_by(Transaction.date.desc())

    paginated = query.paginate(page=page, per_page=per_page)

    return (
        jsonify(
            {
                "transactions": TransactionSchema(many=True).dump(paginated.items),
                "total": paginated.total,
                "page": page,
                "pages": paginated.pages,
                "per_page": per_page,
            }
        ),
        HTTP_STATUS.OK,
    )


@transactions_bp.route("/<int:tx_id>", methods=["GET"])
@jwt_required()
def get_transaction(tx_id):
    """Get single transaction."""
    user_id = get_jwt_identity()

    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()

    if not tx:
        return jsonify(error="Transaction not found"), HTTP_STATUS.NOT_FOUND

    return jsonify(transaction=TransactionSchema().dump(tx)), HTTP_STATUS.OK


@transactions_bp.route("", methods=["POST"])
@jwt_required()
@validate_request(TransactionCreateSchema)
def create_transaction():
    """Create transaction."""
    user_id = get_jwt_identity()
    data = request.validated_data

    # Verify category
    category = Category.query.filter_by(id=data["category_id"]).first()
    if not category:
        return jsonify(error="Category not found"), HTTP_STATUS.BAD_REQUEST

    # Create transaction
    tx = Transaction(user_id=user_id, **data)

    db.session.add(tx)
    db.session.commit()

    # Clear cache
    cache.delete_memoized(get_transactions)

    return (
        jsonify(
            message="Transaction created", transaction=TransactionSchema().dump(tx)
        ),
        HTTP_STATUS.CREATED,
    )


@transactions_bp.route("/<int:tx_id>", methods=["PUT"])
@jwt_required()
@validate_request(TransactionUpdateSchema)
def update_transaction(tx_id):
    """Update transaction."""
    user_id = get_jwt_identity()
    data = request.validated_data

    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()

    if not tx:
        return jsonify(error="Transaction not found"), HTTP_STATUS.NOT_FOUND

    # Update fields
    for key, value in data.items():
        setattr(tx, key, value)

    db.session.commit()

    # Clear cache
    cache.delete_memoized(get_transactions)

    return (
        jsonify(
            message="Transaction updated", transaction=TransactionSchema().dump(tx)
        ),
        HTTP_STATUS.OK,
    )


@transactions_bp.route("/<int:tx_id>", methods=["DELETE"])
@jwt_required()
def delete_transaction(tx_id):
    """Delete transaction."""
    user_id = get_jwt_identity()

    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()

    if not tx:
        return jsonify(error="Transaction not found"), HTTP_STATUS.NOT_FOUND

    # Delete receipt if exists
    if tx.receipt_path:
        FileService().delete_receipt(tx.receipt_path.split("/")[-1], user_id)

    db.session.delete(tx)
    db.session.commit()

    # Clear cache
    cache.delete_memoized(get_transactions)

    return jsonify(message="Transaction deleted"), HTTP_STATUS.OK


@transactions_bp.route("/bulk", methods=["POST"])
@jwt_required()
@validate_request(BulkTransactionSchema)
def bulk_create():
    """Create multiple transactions."""
    user_id = get_jwt_identity()
    data = request.validated_data

    transactions = []
    errors = []

    for idx, tx_data in enumerate(data["transactions"]):
        # Verify category
        category = Category.query.get(tx_data["category_id"])
        if not category:
            errors.append({"index": idx, "error": "Category not found"})
            continue

        tx = Transaction(user_id=user_id, **tx_data)
        transactions.append(tx)

    if transactions:
        db.session.add_all(transactions)
        db.session.commit()

    return (
        jsonify(
            {
                "message": f"Created {len(transactions)} transactions",
                "created": len(transactions),
                "failed": len(errors),
                "errors": errors,
            }
        ),
        HTTP_STATUS.CREATED,
    )


@transactions_bp.route("/summary", methods=["GET"])
@jwt_required()
@cache.cached(timeout=300)
def get_summary():
    """Get transaction summary."""
    user_id = get_jwt_identity()
    period = request.args.get("period", "month")

    end = datetime.now().date()

    if period == "week":
        start = end - timedelta(days=7)
    elif period == "month":
        start = end - timedelta(days=30)
    elif period == "year":
        start = end - timedelta(days=365)
    else:
        start = end - timedelta(days=30)

    # Get transactions
    tx = Transaction.query.filter(
        Transaction.user_id == user_id, Transaction.date >= start
    ).all()

    income = sum(t.amount for t in tx if t.is_income)
    expense = sum(t.amount for t in tx if t.is_expense)

    # Category breakdown
    cats = {}
    for t in tx:
        if t.is_expense and t.category:
            name = t.category.name
            if name not in cats:
                cats[name] = {"amount": 0, "color": t.category.color}
            cats[name]["amount"] += float(t.amount)

    return (
        jsonify(
            {
                "period": period,
                "income": float(income),
                "expense": float(expense),
                "savings": float(income - expense),
                "rate": (income - expense) / income * 100 if income > 0 else 0,
                "count": len(tx),
                "categories": [
                    {"name": k, "amount": v["amount"], "color": v["color"]}
                    for k, v in sorted(
                        cats.items(), key=lambda x: x[1]["amount"], reverse=True
                    )
                ],
            }
        ),
        HTTP_STATUS.OK,
    )


@transactions_bp.route("/recurring", methods=["GET"])
@jwt_required()
def get_recurring():
    """Get recurring transactions."""
    user_id = get_jwt_identity()

    tx = Transaction.query.filter_by(user_id=user_id, is_recurring=True).all()

    return (
        jsonify({"transactions": TransactionSchema(many=True).dump(tx)}),
        HTTP_STATUS.OK,
    )


@transactions_bp.route("/export", methods=["GET"])
@jwt_required()
def export_transactions():
    """Export transactions to file."""
    user_id = get_jwt_identity()
    format = request.args.get("format", "csv")

    # Get transactions
    tx = (
        Transaction.query.filter_by(user_id=user_id)
        .order_by(Transaction.date.desc())
        .all()
    )

    # Convert to dict
    data = []
    for t in tx:
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

    return send_file(
        file_data,
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name=filename,
    )
