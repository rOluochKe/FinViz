"""
Authentication routes.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from datetime import datetime, timedelta

from app.extensions import db, limiter
from app.models.user import User
from app.schemas.user_schema import (
    UserCreateSchema, UserLoginSchema, UserSchema,
    PasswordChangeSchema, PasswordResetSchema,
    PasswordResetConfirmSchema, EmailVerificationSchema
)
from app.utils.decorators import validate_request, rate_limit
from app.utils.constants import HTTP_STATUS

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per hour")
@validate_request(UserCreateSchema)
def register():
    """Register new user."""
    data = request.validated_data
    
    # Check existing
    if User.query.filter_by(username=data['username']).first():
        return jsonify(error="Username already exists"), HTTP_STATUS.CONFLICT
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify(error="Email already exists"), HTTP_STATUS.CONFLICT
    
    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Generate token
    token = user.generate_auth_tokens()
    
    return jsonify(
        message="User created",
        user=UserSchema().dump(user),
        tokens=token
    ), HTTP_STATUS.CREATED


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
@validate_request(UserLoginSchema)
def login():
    """Login user."""
    data = request.validated_data
    
    # Find user
    user = User.query.filter(
        db.or_(
            User.username == data['username'],
            User.email == data['username']
        )
    ).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify(error="Invalid credentials"), HTTP_STATUS.UNAUTHORIZED
    
    if not user.is_active:
        return jsonify(error="Account deactivated"), HTTP_STATUS.FORBIDDEN
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate tokens
    tokens = user.generate_auth_tokens()
    
    return jsonify(
        message="Login successful",
        user=UserSchema().dump(user),
        tokens=tokens
    ), HTTP_STATUS.OK


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_active:
        return jsonify(error="User not found"), HTTP_STATUS.UNAUTHORIZED
    
    token = create_access_token(
        identity=user_id,
        additional_claims={
            'username': user.username,
            'role': user.role,
            'is_admin': user.is_admin
        }
    )
    
    return jsonify(access_token=token), HTTP_STATUS.OK


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side only)."""
    return jsonify(message="Logged out"), HTTP_STATUS.OK


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify(error="User not found"), HTTP_STATUS.NOT_FOUND
    
    return jsonify(user=UserSchema().dump(user)), HTTP_STATUS.OK


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify(error="User not found"), HTTP_STATUS.NOT_FOUND
    
    data = request.get_json() or {}
    
    # Update fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'preferences' in data:
        user.preferences.update(data['preferences'])
    
    db.session.commit()
    
    return jsonify(
        message="Updated",
        user=UserSchema().dump(user)
    ), HTTP_STATUS.OK


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
@validate_request(PasswordChangeSchema)
def change_password():
    """Change password."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.validated_data
    
    if not user.check_password(data['current_password']):
        return jsonify(error="Current password incorrect"), HTTP_STATUS.UNAUTHORIZED
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify(message="Password changed"), HTTP_STATUS.OK


@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per hour")
@validate_request(PasswordResetSchema)
def forgot_password():
    """Request password reset."""
    data = request.validated_data
    user = User.query.filter_by(email=data['email']).first()
    
    if user:
        token = user.generate_reset_token()
        db.session.commit()
        # TODO: Send email with token
        current_app.logger.info(f"Reset token for {user.email}: {token}")
    
    # Always return success to prevent email enumeration
    return jsonify(message="If email exists, reset link sent"), HTTP_STATUS.OK


@auth_bp.route('/reset-password', methods=['POST'])
@validate_request(PasswordResetConfirmSchema)
def reset_password():
    """Reset password with token."""
    data = request.validated_data
    
    # Find user by token (simplified)
    user = User.query.filter_by(reset_token=data['token']).first()
    
    if not user:
        return jsonify(error="Invalid token"), HTTP_STATUS.BAD_REQUEST
    
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        return jsonify(error="Token expired"), HTTP_STATUS.BAD_REQUEST
    
    user.set_password(data['new_password'])
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()
    
    return jsonify(message="Password reset successful"), HTTP_STATUS.OK


@auth_bp.route('/verify-email', methods=['POST'])
@validate_request(EmailVerificationSchema)
def verify_email():
    """Verify email with token."""
    data = request.validated_data
    
    user = User.query.filter_by(verification_token=data['token']).first()
    
    if not user:
        return jsonify(error="Invalid token"), HTTP_STATUS.BAD_REQUEST
    
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        return jsonify(error="Token expired"), HTTP_STATUS.BAD_REQUEST
    
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.session.commit()
    
    return jsonify(message="Email verified"), HTTP_STATUS.OK


@auth_bp.route('/deactivate', methods=['POST'])
@jwt_required()
def deactivate_account():
    """Deactivate user account."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    user.status = 'inactive'
    db.session.commit()
    
    return jsonify(message="Account deactivated"), HTTP_STATUS.OK