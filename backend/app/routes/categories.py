"""
Category routes with Flask-RESTX.
"""

from datetime import datetime, timedelta

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import db
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.category_schema import CategorySchema
from app.schemas.transaction_schema import TransactionSchema
from app.utils.constants import DEFAULT_CATEGORIES, HTTP_STATUS, CategoryType

# Create namespace
categories_ns = Namespace("categories", description="Category operations")

# ============================================================================
# Model Definitions
# ============================================================================

category_model = categories_ns.model(
    "Category",
    {
        "id": fields.Integer(description="Category ID", example=1),
        "name": fields.String(description="Category name", example="Groceries"),
        "type": fields.String(
            description="Category type", enum=CategoryType.choices(), example="expense"
        ),
        "color": fields.String(description="Hex color code", example="#dc3545"),
        "icon": fields.String(description="Icon identifier", example="basket"),
        "description": fields.String(
            description="Category description", example="Food and grocery items"
        ),
        "parent_id": fields.Integer(description="Parent category ID", allow_null=True),
        "user_id": fields.Integer(description="User ID (null for system categories)"),
        "is_system": fields.Boolean(description="Is system category", default=False),
        "is_active": fields.Boolean(description="Is active", default=True),
        "transaction_count": fields.Integer(
            description="Number of transactions", example=25
        ),
        "total_amount": fields.Float(description="Total amount spent", example=1250.50),
        "full_path": fields.String(
            description="Full category path", example="Expenses > Food > Groceries"
        ),
        "created_at": fields.DateTime(description="Creation date"),
        "updated_at": fields.DateTime(description="Last update"),
    },
)

category_create_model = categories_ns.model(
    "CategoryCreate",
    {
        "name": fields.String(
            required=True,
            description="Category name",
            min_length=1,
            max_length=50,
            example="Groceries",
        ),
        "type": fields.String(
            required=True,
            description="Category type",
            enum=CategoryType.choices(),
            example="expense",
        ),
        "color": fields.String(
            description="Hex color code", example="#dc3545", default="#808080"
        ),
        "icon": fields.String(description="Icon identifier", example="basket"),
        "description": fields.String(
            description="Category description", example="Food and grocery items"
        ),
        "parent_id": fields.Integer(
            description="Parent category ID", allow_null=True, example=None
        ),
    },
)

category_update_model = categories_ns.model(
    "CategoryUpdate",
    {
        "name": fields.String(description="Category name", min_length=1, max_length=50),
        "color": fields.String(
            description="Hex color code", pattern="^#[0-9A-Fa-f]{6}$"
        ),
        "icon": fields.String(description="Icon identifier"),
        "description": fields.String(description="Category description"),
        "is_active": fields.Boolean(description="Is active"),
    },
)

category_filter_model = categories_ns.model(
    "CategoryFilter",
    {
        "type": fields.String(
            description="Filter by type", enum=CategoryType.choices()
        ),
        "include_system": fields.Boolean(
            description="Include system categories", default=True
        ),
        "include_inactive": fields.Boolean(
            description="Include inactive categories", default=False
        ),
        "parent_id": fields.Integer(description="Filter by parent ID", allow_null=True),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@categories_ns.route("")
class CategoryList(Resource):
    @categories_ns.doc(
        description="Get all categories for current user",
        security="Bearer Auth",
        responses={200: "List of categories retrieved", 401: "Authentication required"},
    )
    @categories_ns.param("type", "Filter by category type (income/expense/transfer)")
    @categories_ns.param(
        "include_system", "Include system categories", type="boolean", default=True
    )
    @categories_ns.marshal_list_with(category_model)
    @jwt_required()
    def get(self):
        """Get all categories"""
        user_id = get_jwt_identity()

        type_filter = request.args.get("type")
        include_system = request.args.get("include_system", "true").lower() == "true"

        query = Category.query.filter(
            db.or_(
                Category.user_id == user_id,
                db.and_(Category.is_system == True, include_system == True),
            )
        )

        if type_filter:
            query = query.filter(Category.type == type_filter)

        categories = query.order_by(Category.type, Category.name).all()

        return CategorySchema(many=True).dump(categories)

    @categories_ns.doc(
        description="Create a new custom category",
        security="Bearer Auth",
        responses={
            201: "Category created successfully",
            400: "Validation error",
            401: "Authentication required",
            409: "Category already exists",
        },
    )
    @categories_ns.expect(category_create_model)
    @categories_ns.marshal_with(category_model, code=201)
    @jwt_required()
    def post(self):
        """Create a new category"""
        user_id = get_jwt_identity()
        data = request.json

        # Check for existing
        existing = Category.query.filter_by(user_id=user_id, name=data["name"]).first()

        if existing:
            categories_ns.abort(HTTP_STATUS.CONFLICT, "Category already exists")

        # Create category
        category = Category(user_id=user_id, is_system=False, **data)

        db.session.add(category)
        db.session.commit()

        return CategorySchema().dump(category), HTTP_STATUS.CREATED


@categories_ns.route("/hierarchy")
class CategoryHierarchy(Resource):
    @categories_ns.doc(
        description="Get category hierarchy (parent-child structure)",
        security="Bearer Auth",
        responses={200: "Hierarchy retrieved"},
    )
    @jwt_required()
    def get(self):
        """Get category tree structure"""
        user_id = get_jwt_identity()

        categories = Category.query.filter(
            db.or_(Category.user_id == user_id, Category.is_system == True)
        ).all()

        # Build hierarchy
        by_id = {c.id: c for c in categories}
        roots = []

        def build_tree(cat):
            children = [build_tree(c) for c in by_id.values() if c.parent_id == cat.id]
            return {
                "id": cat.id,
                "name": cat.name,
                "type": cat.type,
                "color": cat.color,
                "icon": cat.icon,
                "children": sorted(children, key=lambda x: x["name"]),
            }

        for cat in categories:
            if not cat.parent_id or cat.parent_id not in by_id:
                roots.append(build_tree(cat))

        return {"categories": roots}


@categories_ns.route("/<int:category_id>")
@categories_ns.param("category_id", "Category ID")
class CategoryDetail(Resource):
    @categories_ns.doc(
        description="Get category by ID",
        security="Bearer Auth",
        responses={
            200: "Category found",
            401: "Authentication required",
            404: "Category not found",
        },
    )
    @categories_ns.marshal_with(category_model)
    @jwt_required()
    def get(self, category_id):
        """Get a specific category"""
        user_id = get_jwt_identity()

        category = Category.query.filter(
            db.or_(
                Category.id == category_id,
                Category.user_id == user_id,
                Category.is_system == True,
            )
        ).first()

        if not category:
            categories_ns.abort(HTTP_STATUS.NOT_FOUND, "Category not found")

        return CategorySchema().dump(category)

    @categories_ns.doc(
        description="Update a category",
        security="Bearer Auth",
        responses={
            200: "Category updated",
            400: "Validation error",
            401: "Authentication required",
            403: "Cannot modify system category",
            404: "Category not found",
        },
    )
    @categories_ns.expect(category_update_model)
    @categories_ns.marshal_with(category_model)
    @jwt_required()
    def put(self, category_id):
        """Update a category"""
        user_id = get_jwt_identity()
        data = request.json

        category = Category.query.filter_by(id=category_id, user_id=user_id).first()

        if not category:
            categories_ns.abort(HTTP_STATUS.NOT_FOUND, "Category not found")

        if category.is_system:
            categories_ns.abort(HTTP_STATUS.FORBIDDEN, "Cannot modify system category")

        for key, value in data.items():
            if value is not None:
                setattr(category, key, value)

        db.session.commit()

        return CategorySchema().dump(category)

    @categories_ns.doc(
        description="Delete a category",
        security="Bearer Auth",
        responses={
            200: "Category deleted",
            401: "Authentication required",
            403: "Cannot delete system category or category in use",
            404: "Category not found",
        },
    )
    @jwt_required()
    def delete(self, category_id):
        """Delete a category"""
        user_id = get_jwt_identity()

        category = Category.query.filter_by(id=category_id, user_id=user_id).first()

        if not category:
            categories_ns.abort(HTTP_STATUS.NOT_FOUND, "Category not found")

        if category.is_system:
            categories_ns.abort(HTTP_STATUS.FORBIDDEN, "Cannot delete system category")

        if category.transactions.count() > 0:
            categories_ns.abort(
                HTTP_STATUS.FORBIDDEN,
                f"Category has {category.transactions.count()} transactions",
            )

        db.session.delete(category)
        db.session.commit()

        return {"message": "Category deleted"}


@categories_ns.route("/<int:category_id>/transactions")
@categories_ns.param("category_id", "Category ID")
class CategoryTransactions(Resource):
    @categories_ns.doc(
        description="Get all transactions for a category",
        security="Bearer Auth",
        responses={200: "Transactions retrieved"},
    )
    @jwt_required()
    def get(self, category_id):
        """Get category transactions"""
        user_id = get_jwt_identity()

        category = Category.query.get(category_id)
        if not category:
            categories_ns.abort(HTTP_STATUS.NOT_FOUND, "Category not found")

        transactions = (
            category.transactions.filter_by(user_id=user_id)
            .order_by(Transaction.date.desc())
            .all()
        )

        return {
            "category": CategorySchema().dump(category),
            "transactions": TransactionSchema(many=True).dump(transactions),
            "total": len(transactions),
        }


@categories_ns.route("/defaults")
class CategoryDefaults(Resource):
    @categories_ns.doc(
        description="Create default categories for current user",
        security="Bearer Auth",
        responses={201: "Default categories created"},
    )
    @jwt_required()
    def post(self):
        """Create default categories"""
        user_id = get_jwt_identity()
        created = []

        for cat_data in DEFAULT_CATEGORIES:
            existing = Category.query.filter_by(
                name=cat_data["name"], user_id=user_id
            ).first()

            if not existing:
                category = Category(**cat_data, user_id=user_id, is_system=False)
                db.session.add(category)
                created.append(cat_data["name"])

        db.session.commit()

        return {
            "message": f"Created {len(created)} categories",
            "categories": created,
        }, HTTP_STATUS.CREATED


@categories_ns.route("/stats")
class CategoryStats(Resource):
    @categories_ns.doc(
        description="Get statistics for all categories",
        security="Bearer Auth",
        responses={200: "Statistics retrieved"},
    )
    @jwt_required()
    def get(self):
        """Get category statistics"""
        user_id = get_jwt_identity()

        categories = Category.get_user_categories(user_id)
        year_ago = datetime.now().date() - timedelta(days=365)

        stats = []
        for cat in categories:
            transactions = Transaction.query.filter(
                Transaction.user_id == user_id,
                Transaction.category_id == cat.id,
                Transaction.date >= year_ago,
            ).all()

            total = sum(t.amount for t in transactions)
            count = len(transactions)
            months = set((t.date.year, t.date.month) for t in transactions)
            monthly_avg = total / len(months) if months else 0

            stats.append(
                {
                    "category_id": cat.id,
                    "category_name": cat.name,
                    "category_type": cat.type,
                    "color": cat.color,
                    "transaction_count_12m": count,
                    "total_amount_12m": float(total),
                    "monthly_average": float(monthly_avg),
                    "is_system": cat.is_system,
                }
            )

        return {"stats": stats}
