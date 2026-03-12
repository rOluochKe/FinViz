"""
User management routes (admin only).
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.schemas.user_schema import UserSchema, UserUpdateSchema
from app.utils.decorators import admin_required, validate_request, paginate
from app.utils.constants import HTTP_STATUS

users_bp = Blueprint('users', __name__, url_prefix='/users')


@users_bp.route('', methods=['GET'])
@jwt_required()
@admin_required()
@paginate()
def get_users():
    """Get all users (admin only)."""
    page = request.pagination['page']
    per_page = request.pagination['per_page']
    
    query = User.query.order_by(User.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'users': UserSchema(many=True).dump(paginated.items),
        'total': paginated.total,
        'pages': paginated.pages,
        'page': page
    }), HTTP_STATUS.OK


@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required()
def get_user(user_id):
    """Get user by ID (admin only)."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify(error="User not found"), HTTP_STATUS.NOT_FOUND
    
    return jsonify(user=UserSchema().dump(user)), HTTP_STATUS.OK


@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required()
@validate_request(UserUpdateSchema)
def update_user(user_id):
    """Update user (admin only)."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify(error="User not found"), HTTP_STATUS.NOT_FOUND
    
    data = request.validated_data
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'role' in data:
        user.role = data['role']
    if 'status' in data:
        user.status = data['status']
    if 'preferences' in data:
        user.preferences.update(data['preferences'])
    
    db.session.commit()
    
    return jsonify(
        message="User updated",
        user=UserSchema().dump(user)
    ), HTTP_STATUS.OK


@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required()
def delete_user(user_id):
    """Delete user (admin only)."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify(error="User not found"), HTTP_STATUS.NOT_FOUND
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify(message="User deleted"), HTTP_STATUS.OK


@users_bp.route('/<int:user_id>/activate', methods=['POST'])
@jwt_required()
@admin_required()
def activate_user(user_id):
    """Activate user account."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify(error="User not found"), HTTP_STATUS.NOT_FOUND
    
    user.status = 'active'
    db.session.commit()
    
    return jsonify(message="User activated"), HTTP_STATUS.OK


@users_bp.route('/<int:user_id>/deactivate', methods=['POST'])
@jwt_required()
@admin_required()
def deactivate_user(user_id):
    """Deactivate user account."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify(error="User not found"), HTTP_STATUS.NOT_FOUND
    
    user.status = 'inactive'
    db.session.commit()
    
    return jsonify(message="User deactivated"), HTTP_STATUS.OK