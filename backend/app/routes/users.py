"""
User management routes with Flask-RESTX.
"""

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.extensions import db
from app.models.user import User
from app.schemas.user_schema import UserSchema
from app.utils.constants import HTTP_STATUS
from app.utils.decorators import admin_required, paginate

# Create namespace
users_ns = Namespace("users", description="User management operations (admin only)")

# ============================================================================
# Model Definitions
# ============================================================================

user_model = users_ns.model(
    "User",
    {
        "id": fields.Integer(description="User ID", example=1),
        "username": fields.String(description="Username", example="johndoe"),
        "email": fields.String(description="Email address", example="john@example.com"),
        "first_name": fields.String(description="First name", example="John"),
        "last_name": fields.String(description="Last name", example="Doe"),
        "full_name": fields.String(description="Full name", example="John Doe"),
        "role": fields.String(
            description="User role", example="user", enum=["user", "admin"]
        ),
        "status": fields.String(
            description="Account status",
            example="active",
            enum=["active", "inactive", "suspended"],
        ),
        "preferences": fields.Raw(description="User preferences"),
        "email_verified": fields.Boolean(description="Email verified", example=True),
        "created_at": fields.DateTime(description="Creation date"),
        "last_login": fields.DateTime(description="Last login", allow_null=True),
    },
)

user_update_model = users_ns.model(
    "UserUpdate",
    {
        "first_name": fields.String(description="First name"),
        "last_name": fields.String(description="Last name"),
        "role": fields.String(description="User role", enum=["user", "admin"]),
        "status": fields.String(
            description="Account status", enum=["active", "inactive", "suspended"]
        ),
        "preferences": fields.Raw(description="User preferences"),
    },
)

pagination_model = users_ns.model(
    "Pagination",
    {
        "page": fields.Integer(description="Current page"),
        "per_page": fields.Integer(description="Items per page"),
        "total": fields.Integer(description="Total items"),
        "pages": fields.Integer(description="Total pages"),
    },
)

users_response_model = users_ns.model(
    "UsersResponse",
    {
        "users": fields.List(fields.Nested(user_model)),
        "total": fields.Integer(description="Total users"),
        "pages": fields.Integer(description="Total pages"),
        "page": fields.Integer(description="Current page"),
    },
)

# ============================================================================
# API Endpoints
# ============================================================================


@users_ns.route("")
class UserList(Resource):
    @users_ns.doc(
        description="Get all users (admin only)",
        security="Bearer Auth",
        responses={
            200: "Users retrieved",
            401: "Authentication required",
            403: "Admin access required",
        },
    )
    @users_ns.param("page", "Page number", type="integer", default=1)
    @users_ns.param("per_page", "Items per page", type="integer", default=20)
    @users_ns.marshal_with(users_response_model)
    @jwt_required()
    @admin_required
    def get(self):
        """Get paginated list of all users"""
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)

        query = User.query.order_by(User.created_at.desc())
        paginated = query.paginate(page=page, per_page=per_page)

        return {
            "users": UserSchema(many=True).dump(paginated.items),
            "total": paginated.total,
            "pages": paginated.pages,
            "page": page,
        }


@users_ns.route("/<int:user_id>")
@users_ns.param("user_id", "User ID")
class UserDetail(Resource):
    @users_ns.doc(
        description="Get user by ID (admin only)",
        security="Bearer Auth",
        responses={
            200: "User found",
            401: "Authentication required",
            403: "Admin access required",
            404: "User not found",
        },
    )
    @users_ns.marshal_with(user_model)
    @jwt_required()
    @admin_required
    def get(self, user_id):
        """Get specific user"""
        user = User.query.get(user_id)

        if not user:
            users_ns.abort(HTTP_STATUS.NOT_FOUND, "User not found")

        return UserSchema().dump(user)

    @users_ns.doc(
        description="Update user (admin only)",
        security="Bearer Auth",
        responses={
            200: "User updated",
            401: "Authentication required",
            403: "Admin access required",
            404: "User not found",
        },
    )
    @users_ns.expect(user_update_model)
    @users_ns.marshal_with(user_model)
    @jwt_required()
    @admin_required
    def put(self, user_id):
        """Update user"""
        user = User.query.get(user_id)

        if not user:
            users_ns.abort(HTTP_STATUS.NOT_FOUND, "User not found")

        data = request.json or {}

        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        if "role" in data:
            user.role = data["role"]
        if "status" in data:
            user.status = data["status"]
        if "preferences" in data:
            user.preferences.update(data["preferences"])

        db.session.commit()

        return UserSchema().dump(user)

    @users_ns.doc(
        description="Delete user (admin only)",
        security="Bearer Auth",
        responses={
            200: "User deleted",
            401: "Authentication required",
            403: "Admin access required",
            404: "User not found",
        },
    )
    @jwt_required()
    @admin_required
    def delete(self, user_id):
        """Delete user"""
        user = User.query.get(user_id)

        if not user:
            users_ns.abort(HTTP_STATUS.NOT_FOUND, "User not found")

        db.session.delete(user)
        db.session.commit()

        return {"message": "User deleted"}


@users_ns.route("/<int:user_id>/activate")
@users_ns.param("user_id", "User ID")
class UserActivate(Resource):
    @users_ns.doc(
        description="Activate user account (admin only)",
        security="Bearer Auth",
        responses={
            200: "User activated",
            401: "Authentication required",
            403: "Admin access required",
            404: "User not found",
        },
    )
    @jwt_required()
    @admin_required
    def post(self, user_id):
        """Activate user"""
        user = User.query.get(user_id)

        if not user:
            users_ns.abort(HTTP_STATUS.NOT_FOUND, "User not found")

        user.status = "active"
        db.session.commit()

        return {"message": "User activated"}


@users_ns.route("/<int:user_id>/deactivate")
@users_ns.param("user_id", "User ID")
class UserDeactivate(Resource):
    @users_ns.doc(
        description="Deactivate user account (admin only)",
        security="Bearer Auth",
        responses={
            200: "User deactivated",
            401: "Authentication required",
            403: "Admin access required",
            404: "User not found",
        },
    )
    @jwt_required()
    @admin_required
    def post(self, user_id):
        """Deactivate user"""
        user = User.query.get(user_id)

        if not user:
            users_ns.abort(HTTP_STATUS.NOT_FOUND, "User not found")

        user.status = "inactive"
        db.session.commit()

        return {"message": "User deactivated"}
