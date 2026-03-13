"""
Transaction routes with Flask-RESTX.
"""

from collections import defaultdict
from datetime import datetime, timedelta

from flask import request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import cache, db
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction_schema import TransactionSchema
from app.services.export_service import ExportService
from app.services.file_service import FileService
from app.utils.constants import HTTP_STATUS, TransactionType

# Create namespace
transactions_ns = Namespace("transactions", description="Transaction operations")

# ============================================================================
# Model Definitions
# ============================================================================

category_info = transactions_ns.model(
    "CategoryInfo",
    {
        "id": fields.Integer(description="Category ID"),
        "name": fields.String(description="Category name"),
        "color": fields.String(description="Category color"),
    },
)

transaction_model = transactions_ns.model(
    "Transaction",
    {
        "id": fields.Integer(description="Transaction ID", example=1),
        "user_id": fields.Integer(description="User ID", example=1),
        "category_id": fields.Integer(description="Category ID", example=5),
        "category_name": fields.String(
            description="Category name", example="Groceries"
        ),
        "category_color": fields.String(
            description="Category color", example="#dc3545"
        ),
        "amount": fields.Float(description="Transaction amount", example=45.67),
        "description": fields.String(
            description="Transaction description", example="Weekly grocery shopping"
        ),
        "date": fields.Date(description="Transaction date", example="2024-01-15"),
        "type": fields.String(
            description="Transaction type",
            example="expense",
            enum=TransactionType.choices(),
        ),
        "notes": fields.String(
            description="Additional notes", example="Bought vegetables and fruits"
        ),
        "receipt_path": fields.String(description="Receipt file path", allow_null=True),
        "tags": fields.List(
            fields.String, description="Tags", example=["food", "essentials"]
        ),
        "is_recurring": fields.Boolean(
            description="Is recurring transaction", example=False
        ),
        "recurring_frequency": fields.String(
            description="Recurring frequency",
            example=None,
            enum=["daily", "weekly", "monthly", "yearly", None],
        ),
        "recurring_end_date": fields.Date(
            description="Recurring end date", allow_null=True
        ),
        "formatted_amount": fields.String(
            description="Formatted amount with sign", example="-$45.67"
        ),
        "created_at": fields.DateTime(description="Creation timestamp"),
        "updated_at": fields.DateTime(description="Last update timestamp"),
    },
)

transaction_create_model = transactions_ns.model(
    "TransactionCreate",
    {
        "category_id": fields.Integer(
            required=True, description="Category ID", example=5, min=1
        ),
        "amount": fields.Float(
            required=True, description="Transaction amount", example=45.67, min=0.01
        ),
        "description": fields.String(
            required=True,
            description="Transaction description",
            example="Weekly grocery shopping",
            min_length=1,
            max_length=200,
        ),
        "date": fields.Date(
            required=True, description="Transaction date", example="2024-01-15"
        ),
        "type": fields.String(
            required=True,
            description="Transaction type",
            example="expense",
            enum=TransactionType.choices(),
        ),
        "notes": fields.String(
            description="Additional notes", example="Bought vegetables and fruits"
        ),
        "tags": fields.List(
            fields.String,
            description="Tags",
            example=["food", "essentials"],
            default=[],
        ),
        "is_recurring": fields.Boolean(
            description="Is recurring transaction", example=False, default=False
        ),
        "recurring_frequency": fields.String(
            description="Recurring frequency",
            example=None,
            enum=["daily", "weekly", "monthly", "yearly", None],
        ),
        "recurring_end_date": fields.Date(
            description="Recurring end date", example=None, allow_null=True
        ),
    },
)

transaction_update_model = transactions_ns.model(
    "TransactionUpdate",
    {
        "category_id": fields.Integer(description="Category ID", example=5),
        "amount": fields.Float(
            description="Transaction amount", example=45.67, min=0.01
        ),
        "description": fields.String(
            description="Transaction description",
            example="Weekly grocery shopping",
            min_length=1,
            max_length=200,
        ),
        "date": fields.Date(description="Transaction date", example="2024-01-15"),
        "notes": fields.String(
            description="Additional notes", example="Bought vegetables and fruits"
        ),
        "tags": fields.List(
            fields.String, description="Tags", example=["food", "essentials"]
        ),
    },
)

transaction_filter_model = transactions_ns.model(
    "TransactionFilter",
    {
        "start_date": fields.Date(
            description="Start date filter", example="2024-01-01"
        ),
        "end_date": fields.Date(description="End date filter", example="2024-01-31"),
        "category_id": fields.Integer(description="Category ID filter", example=5),
        "type": fields.String(
            description="Transaction type filter",
            example="expense",
            enum=TransactionType.choices(),
        ),
        "search": fields.String(description="Search in description", example="grocery"),
        "min_amount": fields.Float(description="Minimum amount", example=10),
        "max_amount": fields.Float(description="Maximum amount", example=100),
    },
)

pagination_model = transactions_ns.model(
    "Pagination",
    {
        "page": fields.Integer(description="Current page"),
        "per_page": fields.Integer(description="Items per page"),
        "total": fields.Integer(description="Total items"),
        "pages": fields.Integer(description="Total pages"),
    },
)

transaction_list_response = transactions_ns.model(
    "TransactionListResponse",
    {
        "transactions": fields.List(fields.Nested(transaction_model)),
        "total": fields.Integer(description="Total transactions"),
        "page": fields.Integer(description="Current page"),
        "pages": fields.Integer(description="Total pages"),
        "per_page": fields.Integer(description="Items per page"),
    },
)

summary_response = transactions_ns.model(
    "SummaryResponse",
    {
        "period": fields.String(description="Period analyzed"),
        "income": fields.Float(description="Total income"),
        "expense": fields.Float(description="Total expense"),
        "savings": fields.Float(description="Net savings"),
        "rate": fields.Float(description="Savings rate"),
        "count": fields.Integer(description="Transaction count"),
        "categories": fields.List(fields.Raw, description="Category breakdown"),
    },
)

bulk_create_model = transactions_ns.model(
    "BulkCreate",
    {
        "transactions": fields.List(
            fields.Nested(transaction_create_model),
            required=True,
            min_items=1,
            max_items=100,
        )
    },
)

bulk_response = transactions_ns.model(
    "BulkResponse",
    {
        "message": fields.String(description="Response message"),
        "created": fields.Integer(description="Number created"),
        "failed": fields.Integer(description="Number failed"),
        "errors": fields.List(fields.Raw, description="Error details"),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@transactions_ns.route("")
class TransactionList(Resource):
    @transactions_ns.doc(
        description="Get transactions with pagination and filters",
        security="Bearer Auth",
        responses={200: "Transactions retrieved"},
    )
    @transactions_ns.param("page", "Page number", type="integer", default=1)
    @transactions_ns.param(
        "per_page", "Items per page", type="integer", default=20, max=100
    )
    @transactions_ns.param("start_date", "Start date (YYYY-MM-DD)")
    @transactions_ns.param("end_date", "End date (YYYY-MM-DD)")
    @transactions_ns.param("category_id", "Category ID filter", type="integer")
    @transactions_ns.param(
        "type", "Transaction type filter", enum=TransactionType.choices()
    )
    @transactions_ns.param("search", "Search in description")
    @transactions_ns.marshal_with(transaction_list_response)
    @jwt_required()
    @cache.cached(timeout=60, query_string=True)
    def get(self):
        """Get paginated list of transactions"""
        user_id = get_jwt_identity()
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)

        query = Transaction.query.filter_by(user_id=user_id)

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

        query = query.order_by(Transaction.date.desc())
        paginated = query.paginate(page=page, per_page=per_page)

        return {
            "transactions": TransactionSchema(many=True).dump(paginated.items),
            "total": paginated.total,
            "page": page,
            "pages": paginated.pages,
            "per_page": per_page,
        }

    @transactions_ns.doc(
        description="Create a new transaction",
        security="Bearer Auth",
        responses={
            201: "Transaction created",
            400: "Validation error",
            401: "Authentication required",
        },
    )
    @transactions_ns.expect(transaction_create_model)
    @transactions_ns.marshal_with(transaction_model, code=201)
    @jwt_required()
    def post(self):
        """Create a new transaction"""
        user_id = get_jwt_identity()
        data = request.json

        # Use db.session.get() instead of query.get()
        category = db.session.get(Category, data["category_id"])
        if not category:
            transactions_ns.abort(HTTP_STATUS.BAD_REQUEST, "Category not found")

        transaction = Transaction(user_id=user_id, **data)

        db.session.add(transaction)
        db.session.commit()

        # Clear cache
        cache.delete_memoized(TransactionList.get)

        return TransactionSchema().dump(transaction), HTTP_STATUS.CREATED


@transactions_ns.route("/<int:transaction_id>")
@transactions_ns.param("transaction_id", "Transaction ID")
class TransactionDetail(Resource):
    @transactions_ns.doc(
        description="Get transaction by ID",
        security="Bearer Auth",
        responses={
            200: "Transaction found",
            401: "Authentication required",
            404: "Transaction not found",
        },
    )
    @transactions_ns.marshal_with(transaction_model)
    @jwt_required()
    def get(self, transaction_id):
        """Get specific transaction"""
        user_id = get_jwt_identity()

        transaction = Transaction.query.filter_by(
            id=transaction_id, user_id=user_id
        ).first()

        if not transaction:
            transactions_ns.abort(HTTP_STATUS.NOT_FOUND, "Transaction not found")

        return TransactionSchema().dump(transaction)

    @transactions_ns.doc(
        description="Update a transaction",
        security="Bearer Auth",
        responses={
            200: "Transaction updated",
            400: "Validation error",
            401: "Authentication required",
            404: "Transaction not found",
        },
    )
    @transactions_ns.expect(transaction_update_model)
    @transactions_ns.marshal_with(transaction_model)
    @jwt_required()
    def put(self, transaction_id):
        """Update transaction"""
        user_id = get_jwt_identity()
        data = request.json

        transaction = Transaction.query.filter_by(
            id=transaction_id, user_id=user_id
        ).first()

        if not transaction:
            transactions_ns.abort(HTTP_STATUS.NOT_FOUND, "Transaction not found")

        for key, value in data.items():
            if value is not None:
                setattr(transaction, key, value)

        db.session.commit()

        # Clear cache
        cache.delete_memoized(TransactionList.get)

        return TransactionSchema().dump(transaction)

    @transactions_ns.doc(
        description="Delete a transaction",
        security="Bearer Auth",
        responses={
            200: "Transaction deleted",
            401: "Authentication required",
            404: "Transaction not found",
        },
    )
    @jwt_required()
    def delete(self, transaction_id):
        """Delete transaction"""
        user_id = get_jwt_identity()

        transaction = Transaction.query.filter_by(
            id=transaction_id, user_id=user_id
        ).first()

        if not transaction:
            transactions_ns.abort(HTTP_STATUS.NOT_FOUND, "Transaction not found")

        # Delete receipt if exists
        if transaction.receipt_path:
            FileService().delete_receipt(
                transaction.receipt_path.split("/")[-1], user_id
            )

        db.session.delete(transaction)
        db.session.commit()

        # Clear cache
        cache.delete_memoized(TransactionList.get)

        return {"message": "Transaction deleted"}


@transactions_ns.route("/bulk")
class BulkCreate(Resource):
    @transactions_ns.doc(
        description="Create multiple transactions at once",
        security="Bearer Auth",
        responses={
            201: "Transactions created",
            400: "Validation error",
            401: "Authentication required",
        },
    )
    @transactions_ns.expect(bulk_create_model)
    @transactions_ns.marshal_with(bulk_response, code=201)
    @jwt_required()
    def post(self):
        """Create multiple transactions"""
        user_id = get_jwt_identity()
        data = request.json

        transactions = []
        errors = []

        for idx, tx_data in enumerate(data["transactions"]):
            # Use db.session.get() instead of query.get() for SQLAlchemy 2.0
            category = db.session.get(Category, tx_data["category_id"])
            if not category:
                errors.append({"index": idx, "error": "Category not found"})
                continue

            transaction = Transaction(user_id=user_id, **tx_data)
            transactions.append(transaction)

        if transactions:
            db.session.add_all(transactions)
            db.session.commit()

        # Clear cache
        cache.delete_memoized(TransactionList.get)

        return {
            "message": f"Created {len(transactions)} transactions",
            "created": len(transactions),
            "failed": len(errors),
            "errors": errors,
        }, HTTP_STATUS.CREATED


@transactions_ns.route("/summary")
class TransactionSummary(Resource):
    @transactions_ns.doc(
        description="Get transaction summary statistics",
        security="Bearer Auth",
        responses={200: "Summary retrieved"},
    )
    @transactions_ns.param(
        "period",
        "Period (week/month/year)",
        type="string",
        default="month",
        enum=["week", "month", "year"],
    )
    @transactions_ns.marshal_with(summary_response)
    @jwt_required()
    @cache.cached(timeout=300)
    def get(self):
        """Get transaction summary"""
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

        transactions = Transaction.query.filter(
            Transaction.user_id == user_id, Transaction.date >= start
        ).all()

        income = sum(t.amount for t in transactions if t.is_income)
        expense = sum(t.amount for t in transactions if t.is_expense)

        # Category breakdown
        cats = defaultdict(lambda: {"amount": 0, "count": 0})
        for t in transactions:
            if t.is_expense and t.category:
                name = t.category.name
                cats[name]["amount"] += float(t.amount)
                cats[name]["count"] += 1
                if not cats[name].get("color"):
                    cats[name]["color"] = t.category.color

        return {
            "period": period,
            "income": float(income),
            "expense": float(expense),
            "savings": float(income - expense),
            "rate": (income - expense) / income * 100 if income > 0 else 0,
            "count": len(transactions),
            "categories": [
                {"name": k, **v}
                for k, v in sorted(
                    cats.items(), key=lambda x: x[1]["amount"], reverse=True
                )
            ],
        }


@transactions_ns.route("/recurring")
class RecurringTransactions(Resource):
    @transactions_ns.doc(
        description="Get recurring transactions",
        security="Bearer Auth",
        responses={200: "Recurring transactions retrieved"},
    )
    @transactions_ns.marshal_list_with(transaction_model)
    @jwt_required()
    def get(self):
        """Get recurring transactions"""
        user_id = get_jwt_identity()

        transactions = Transaction.query.filter_by(
            user_id=user_id, is_recurring=True
        ).all()

        return TransactionSchema(many=True).dump(transactions)


@transactions_ns.route("/export")
class ExportTransactions(Resource):
    @transactions_ns.doc(
        description="Export transactions to file",
        security="Bearer Auth",
        responses={200: "File downloaded"},
    )
    @transactions_ns.param(
        "format",
        "Export format",
        type="string",
        default="csv",
        enum=["csv", "json", "excel"],
    )
    @jwt_required()
    def get(self):
        """Export transactions to file"""
        user_id = get_jwt_identity()
        format = request.args.get("format", "csv")

        transactions = (
            Transaction.query.filter_by(user_id=user_id)
            .order_by(Transaction.date.desc())
            .all()
        )

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

        file_data = ExportService.export_transactions(data, format)
        filename = ExportService.get_filename("transactions", format)

        return send_file(
            file_data,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=filename,
        )
