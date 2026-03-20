"""
Category routes with Flask-RESTX.
"""

import uuid
import logging
from datetime import datetime, timedelta
from functools import wraps

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import cache, db
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.category_schema import CategorySchema
from app.schemas.transaction_schema import TransactionSchema
from app.utils.constants import DEFAULT_CATEGORIES, HTTP_STATUS, CategoryType

# Create namespace
categories_ns = Namespace("categories", description="Category operations")

logger = logging.getLogger(__name__)

# ============================================================================
# Helper Decorator for Safe Caching
# ============================================================================

def safe_cache_cached(timeout=300, query_string=False):
    """
    Decorator that safely handles cache unavailability.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                if query_string:
                    return cache.cached(timeout=timeout, query_string=True)(f)(*args, **kwargs)
                else:
                    return cache.cached(timeout=timeout)(f)(*args, **kwargs)
            except Exception as e:
                logger.debug(f"Cache unavailable, skipping cache: {str(e)}")
                return f(*args, **kwargs)
        return decorated_function
    return decorator

# ============================================================================
# Custom DateTime Field for Marshalling
# ============================================================================

class CustomDateTime(fields.DateTime):
    """
    Custom DateTime field that handles both ISO format and space-separated format.
    """
    def __init__(self, *args, **kwargs):
        kwargs['format'] = 'iso'
        super().__init__(*args, **kwargs)

    def _serialize(self, value, attr, obj, **kwargs):
        """Convert datetime to string in ISO format."""
        if value is None:
            return None
        
        if isinstance(value, datetime):
            return value.isoformat()
        
        # If it's already a string, convert space to T for ISO format
        if isinstance(value, str):
            return value.replace(' ', 'T')
        
        return str(value)

# ============================================================================
# Model Definitions
# ============================================================================

category_model = categories_ns.model(
    "Category",
    {
        "id": fields.String(
            description="Category ID (UUID)",
            example="123e4567-e89b-12d3-a456-426614174000",
        ),
        "name": fields.String(description="Category name", example="Groceries"),
        "type": fields.String(
            description="Category type", enum=CategoryType.choices(), example="expense"
        ),
        "color": fields.String(description="Hex color code", example="#dc3545"),
        "icon": fields.String(description="Icon identifier", example="basket"),
        "description": fields.String(
            description="Category description", example="Food and grocery items"
        ),
        "parent_id": fields.String(
            description="Parent category ID (UUID)", allow_null=True, example=None
        ),
        "user_id": fields.String(
            description="User ID (UUID)", example="123e4567-e89b-12d3-a456-426614174000"
        ),
        "is_system": fields.Boolean(description="Is system category", default=False),
        "is_active": fields.Boolean(description="Is active", default=True),
        "transaction_count": fields.Integer(
            description="Number of transactions", example=25
        ),
        "total_amount": fields.Float(description="Total amount spent", example=1250.50),
        "full_path": fields.String(
            description="Full category path", example="Expenses > Food > Groceries"
        ),
        "created_at": CustomDateTime(description="Creation date"),
        "updated_at": CustomDateTime(description="Last update"),
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
        "parent_id": fields.String(
            description="Parent category ID (UUID)", allow_null=True, example=None
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
        "parent_id": fields.String(
            description="Filter by parent ID (UUID)", allow_null=True, example=None
        ),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================

@categories_ns.route("/defaults")
class CategoryDefaults(Resource):
    @categories_ns.doc(
        description="Create default categories for current user",
        security="Bearer Auth",
        responses={
            HTTP_STATUS.CREATED: "Default categories created",
            HTTP_STATUS.OK: "No new categories created",
            HTTP_STATUS.BAD_REQUEST: "Invalid request",
        },
    )
    @jwt_required()
    def post(self):
        """Create default categories"""
        user_id = get_jwt_identity()
        created = []
        
        # Ensure user_id is a UUID object
        try:
            if isinstance(user_id, str):
                user_uuid = uuid.UUID(user_id)
            else:
                user_uuid = user_id
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid user ID format: {user_id}")
            categories_ns.abort(HTTP_STATUS.BAD_REQUEST, f"Invalid user ID format: {user_id}")

        # Process each default category
        for cat_data in DEFAULT_CATEGORIES:
            try:
                # Skip if category already exists
                existing = Category.query.filter_by(
                    name=cat_data["name"], 
                    user_id=user_uuid
                ).first()
                
                if existing:
                    continue
                
                # Create the category with explicit None for parent_id
                category = Category(
                    user_id=user_uuid,
                    name=cat_data["name"],
                    type=cat_data["type"],
                    color=cat_data.get("color", "#808080"),
                    icon=cat_data.get("icon"),
                    description=cat_data.get("description", ""),
                    parent_id=None,  # Explicitly set to None
                    is_system=False,
                    is_active=True,
                    meta_data={}
                )
                
                db.session.add(category)
                created.append(cat_data["name"])
                
            except Exception as e:
                logger.error(f"Error creating category {cat_data['name']}: {str(e)}")
                # Rollback this specific category if there was an error
                db.session.rollback()
                # Continue with other categories
                continue
        
        # Commit all changes at once
        if created:
            try:
                db.session.commit()
                return {
                    "message": f"Successfully created {len(created)} default categories",
                    "categories": created
                }, HTTP_STATUS.CREATED
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error committing categories: {str(e)}")
                categories_ns.abort(
                    HTTP_STATUS.INTERNAL_SERVER_ERROR,
                    f"Failed to create categories: {str(e)}"
                )
        else:
            return {
                "message": "All default categories already exist",
                "categories": []
            }, HTTP_STATUS.OK


@categories_ns.route("/hierarchy")
class CategoryHierarchy(Resource):
    @categories_ns.doc(
        description="Get category hierarchy (parent-child structure)",
        security="Bearer Auth",
        responses={HTTP_STATUS.OK: "Hierarchy retrieved"},
    )
    @jwt_required()
    @safe_cache_cached(timeout=600)
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
                "id": str(cat.id),
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
    

@categories_ns.route("/stats")
class CategoryStats(Resource):
    @categories_ns.doc(
        description="Get statistics for all categories",
        security="Bearer Auth",
        responses={HTTP_STATUS.OK: "Statistics retrieved"},
    )
    @jwt_required()
    @safe_cache_cached(timeout=600)
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
                    "category_id": str(cat.id),
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


@categories_ns.route("")
class CategoryList(Resource):
    @categories_ns.doc(
        description="Get all categories for current user",
        security="Bearer Auth",
        responses={HTTP_STATUS.OK: "List of categories retrieved", HTTP_STATUS.UNAUTHORIZED: "Authentication required"},
    )
    @categories_ns.param("type", "Filter by category type (income/expense/transfer)")
    @categories_ns.param(
        "include_system", "Include system categories", type="boolean", default=True
    )
    @categories_ns.marshal_list_with(category_model)
    @jwt_required()
    @safe_cache_cached(timeout=300, query_string=True)
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
            HTTP_STATUS.CREATED: "Category created successfully",
            HTTP_STATUS.BAD_REQUEST: "Validation error",
            HTTP_STATUS.UNAUTHORIZED: "Authentication required",
            HTTP_STATUS.CONFLICT: "Category already exists",
            HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE: "Invalid Content-Type",
        },
    )
    @categories_ns.expect(category_create_model)
    @categories_ns.marshal_with(category_model, code=HTTP_STATUS.CREATED)
    @jwt_required()
    def post(self):
        """Create a new category"""
        # Check Content-Type header
        if not request.is_json:
            categories_ns.abort(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE, "Content-Type must be application/json")
        
        user_id = get_jwt_identity()
        data = request.json

        # Validate required fields
        required_fields = ["name", "type"]
        for field in required_fields:
            if field not in data:
                categories_ns.abort(HTTP_STATUS.BAD_REQUEST, f"Missing required field: {field}")

        # Check for existing
        existing = Category.query.filter_by(user_id=user_id, name=data["name"]).first()

        if existing:
            categories_ns.abort(HTTP_STATUS.CONFLICT, "Category already exists")

        # Handle parent_id - convert to None if not provided or empty
        parent_id = data.get("parent_id")
        parent_uuid = None
        if parent_id:
            try:
                parent_uuid = uuid.UUID(parent_id)
                # Verify parent exists
                parent = Category.query.get(parent_uuid)
                if not parent:
                    categories_ns.abort(HTTP_STATUS.BAD_REQUEST, "Parent category not found")
                if parent.type != data["type"]:
                    categories_ns.abort(HTTP_STATUS.BAD_REQUEST, "Parent category type must match")
            except ValueError:
                categories_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid parent_id format")

        # Create category - handle parent_id properly
        category_data = {
            "user_id": user_id,
            "name": data["name"],
            "type": data["type"],
            "color": data.get("color", "#808080"),
            "icon": data.get("icon"),
            "description": data.get("description"),
            "parent_id": parent_uuid,
            "is_system": False,
            "is_active": True,
        }
        
        category = Category(**category_data)
        db.session.add(category)
        db.session.commit()

        return CategorySchema().dump(category), HTTP_STATUS.CREATED

@categories_ns.route("/<string:category_id>")
@categories_ns.param("category_id", "Category ID (UUID)")
class CategoryDetail(Resource):
    @categories_ns.doc(
        description="Get category by ID",
        security="Bearer Auth",
        responses={
            HTTP_STATUS.OK: "Category found",
            HTTP_STATUS.UNAUTHORIZED: "Authentication required",
            HTTP_STATUS.NOT_FOUND: "Category not found",
        },
    )
    @categories_ns.marshal_with(category_model)
    @jwt_required()
    def get(self, category_id):
        """Get a specific category"""
        user_id = get_jwt_identity()

        try:
            category_uuid = uuid.UUID(category_id)
        except ValueError:
            categories_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid category ID format")

        category = Category.query.filter(
            db.or_(
                Category.id == category_uuid,
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
            HTTP_STATUS.OK: "Category updated",
            HTTP_STATUS.BAD_REQUEST: "Validation error",
            HTTP_STATUS.UNAUTHORIZED: "Authentication required",
            HTTP_STATUS.FORBIDDEN: "Cannot modify system category",
            HTTP_STATUS.NOT_FOUND: "Category not found",
        },
    )
    @categories_ns.expect(category_update_model)
    @categories_ns.marshal_with(category_model)
    @jwt_required()
    def put(self, category_id):
        """Update a category"""
        # Check Content-Type header
        if not request.is_json:
            categories_ns.abort(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE, "Content-Type must be application/json")
        
        user_id = get_jwt_identity()
        data = request.json

        try:
            category_uuid = uuid.UUID(category_id)
        except ValueError:
            categories_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid category ID format")

        category = Category.query.filter_by(id=category_uuid, user_id=user_id).first()

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
            HTTP_STATUS.OK: "Category deleted",
            HTTP_STATUS.UNAUTHORIZED: "Authentication required",
            HTTP_STATUS.FORBIDDEN: "Cannot delete system category or category in use",
            HTTP_STATUS.NOT_FOUND: "Category not found",
        },
    )
    @jwt_required()
    def delete(self, category_id):
        """Delete a category"""
        user_id = get_jwt_identity()

        try:
            category_uuid = uuid.UUID(category_id)
        except ValueError:
            categories_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid category ID format")

        category = Category.query.filter_by(id=category_uuid, user_id=user_id).first()

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


@categories_ns.route("/<string:category_id>/transactions")
@categories_ns.param("category_id", "Category ID (UUID)")
class CategoryTransactions(Resource):
    @categories_ns.doc(
        description="Get all transactions for a category",
        security="Bearer Auth",
        responses={HTTP_STATUS.OK: "Transactions retrieved"},
    )
    @jwt_required()
    def get(self, category_id):
        """Get category transactions"""
        user_id = get_jwt_identity()

        try:
            category_uuid = uuid.UUID(category_id)
        except ValueError:
            categories_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid category ID format")

        category = Category.query.get(category_uuid)
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