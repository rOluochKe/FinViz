"""
Category routes.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.category import Category
from app.schemas.category_schema import (
    CategoryCreateSchema,
    CategoryFilterSchema,
    CategoryHierarchySchema,
    CategorySchema,
    CategoryUpdateSchema,
)
from app.utils.constants import DEFAULT_CATEGORIES, HTTP_STATUS
from app.utils.decorators import paginate, validate_request

categories_bp = Blueprint("categories", __name__, url_prefix="/categories")


@categories_bp.route("", methods=["GET"])
@jwt_required()
@paginate()
def get_categories():
    """Get all categories for current user."""
    user_id = get_jwt_identity()

    # Parse filters
    type_filter = request.args.get("type")
    include_system = request.args.get("include_system", "true").lower() == "true"

    # Build query
    query = Category.query.filter(
        db.or_(
            Category.user_id == user_id,
            db.and_(Category.is_system == True, include_system == True),
        )
    )

    if type_filter:
        query = query.filter(Category.type == type_filter)

    categories = query.order_by(Category.type, Category.name).all()

    return (
        jsonify({"categories": CategorySchema(many=True).dump(categories)}),
        HTTP_STATUS.OK,
    )


@categories_bp.route("/hierarchy", methods=["GET"])
@jwt_required()
def get_category_hierarchy():
    """Get category hierarchy (parent-child structure)."""
    user_id = get_jwt_identity()

    # Get all categories
    categories = Category.query.filter(
        db.or_(Category.user_id == user_id, Category.is_system == True)
    ).all()

    # Build hierarchy
    by_id = {c.id: c for c in categories}
    roots = []

    for cat in categories:
        if cat.parent_id and cat.parent_id in by_id:
            continue
        roots.append(build_category_tree(cat, by_id))

    return (
        jsonify({"categories": CategoryHierarchySchema(many=True).dump(roots)}),
        HTTP_STATUS.OK,
    )


def build_category_tree(category, by_id):
    """Helper to build category tree."""
    children = [
        build_category_tree(c, by_id)
        for c in by_id.values()
        if c.parent_id == category.id
    ]
    return {
        "id": category.id,
        "name": category.name,
        "type": category.type,
        "color": category.color,
        "icon": category.icon,
        "children": sorted(children, key=lambda x: x["name"]),
    }


@categories_bp.route("/<int:category_id>", methods=["GET"])
@jwt_required()
def get_category(category_id):
    """Get category by ID."""
    user_id = get_jwt_identity()

    category = Category.query.filter(
        db.or_(
            Category.id == category_id,
            Category.user_id == user_id,
            Category.is_system == True,
        )
    ).first()

    if not category:
        return jsonify(error="Category not found"), HTTP_STATUS.NOT_FOUND

    return jsonify(category=CategorySchema().dump(category)), HTTP_STATUS.OK


@categories_bp.route("", methods=["POST"])
@jwt_required()
@validate_request(CategoryCreateSchema)
def create_category():
    """Create new category."""
    user_id = get_jwt_identity()
    data = request.validated_data

    # Check for existing
    existing = Category.query.filter_by(user_id=user_id, name=data["name"]).first()

    if existing:
        return jsonify(error="Category already exists"), HTTP_STATUS.CONFLICT

    # Create category
    category = Category(user_id=user_id, is_system=False, **data)

    db.session.add(category)
    db.session.commit()

    return (
        jsonify(message="Category created", category=CategorySchema().dump(category)),
        HTTP_STATUS.CREATED,
    )


@categories_bp.route("/<int:category_id>", methods=["PUT"])
@jwt_required()
@validate_request(CategoryUpdateSchema)
def update_category(category_id):
    """Update category."""
    user_id = get_jwt_identity()
    data = request.validated_data

    category = Category.query.filter_by(id=category_id, user_id=user_id).first()

    if not category:
        return jsonify(error="Category not found"), HTTP_STATUS.NOT_FOUND

    if category.is_system:
        return jsonify(error="Cannot modify system category"), HTTP_STATUS.FORBIDDEN

    # Update fields
    for key, value in data.items():
        setattr(category, key, value)

    db.session.commit()

    return (
        jsonify(message="Category updated", category=CategorySchema().dump(category)),
        HTTP_STATUS.OK,
    )


@categories_bp.route("/<int:category_id>", methods=["DELETE"])
@jwt_required()
def delete_category(category_id):
    """Delete category."""
    user_id = get_jwt_identity()

    category = Category.query.filter_by(id=category_id, user_id=user_id).first()

    if not category:
        return jsonify(error="Category not found"), HTTP_STATUS.NOT_FOUND

    if category.is_system:
        return jsonify(error="Cannot delete system category"), HTTP_STATUS.FORBIDDEN

    if category.transactions.count() > 0:
        return (
            jsonify(
                error="Category has transactions", count=category.transactions.count()
            ),
            HTTP_STATUS.BAD_REQUEST,
        )

    db.session.delete(category)
    db.session.commit()

    return jsonify(message="Category deleted"), HTTP_STATUS.OK


@categories_bp.route("/defaults", methods=["POST"])
@jwt_required()
def create_defaults():
    """Create default categories for user."""
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

    return (
        jsonify(message=f"Created {len(created)} categories", categories=created),
        HTTP_STATUS.CREATED,
    )
