"""
Analytics routes.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from app.extensions import cache
from app.utils.constants import HTTP_STATUS
from app.services.analytics_service import AnalyticsService
from app.services.report_service import ReportService

analytics_bp = Blueprint('analytics', __name__, url_prefix='/analytics')


@analytics_bp.route('/spending-patterns', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300, query_string=True)
def spending_patterns():
    """Get spending pattern analysis."""
    user_id = get_jwt_identity()
    months = request.args.get('months', 6, type=int)
    
    result = AnalyticsService.calculate_spending_patterns(user_id, months)
    
    return jsonify(result), HTTP_STATUS.OK


@analytics_bp.route('/anomalies', methods=['GET'])
@jwt_required()
def detect_anomalies():
    """Detect anomalous transactions."""
    user_id = get_jwt_identity()
    days = request.args.get('days', 30, type=int)
    threshold = request.args.get('threshold', 2.0, type=float)
    
    result = AnalyticsService.detect_anomalies(user_id, days, threshold)
    
    return jsonify(result), HTTP_STATUS.OK


@analytics_bp.route('/forecast', methods=['GET'])
@jwt_required()
@cache.cached(timeout=3600)
def forecast():
    """Generate financial forecast."""
    user_id = get_jwt_identity()
    months = request.args.get('months', 6, type=int)
    
    result = AnalyticsService.generate_forecast(user_id, months)
    
    return jsonify(result), HTTP_STATUS.OK


@analytics_bp.route('/category-insights', methods=['GET'])
@jwt_required()
def category_insights():
    """Get insights by category."""
    user_id = get_jwt_identity()
    
    result = AnalyticsService.get_category_insights(user_id)
    
    return jsonify({
        'insights': result
    }), HTTP_STATUS.OK


@analytics_bp.route('/monthly/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
def monthly_report(year, month):
    """Get monthly report."""
    user_id = get_jwt_identity()
    
    result = ReportService.monthly_report(user_id, year, month)
    
    return jsonify(result), HTTP_STATUS.OK


@analytics_bp.route('/yearly/<int:year>', methods=['GET'])
@jwt_required()
def yearly_report(year):
    """Get yearly report."""
    user_id = get_jwt_identity()
    
    result = ReportService.yearly_report(user_id, year)
    
    return jsonify(result), HTTP_STATUS.OK


@analytics_bp.route('/category/<int:category_id>', methods=['GET'])
@jwt_required()
def category_report(category_id):
    """Get category report."""
    user_id = get_jwt_identity()
    months = request.args.get('months', 12, type=int)
    
    result = ReportService.category_report(user_id, category_id, months)
    
    return jsonify(result), HTTP_STATUS.OK


@analytics_bp.route('/trends', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300)
def get_trends():
    """Get spending trends."""
    user_id = get_jwt_identity()
    group_by = request.args.get('group_by', 'month')
    
    end = datetime.now().date()
    
    if group_by == 'day':
        start = end - timedelta(days=30)
    elif group_by == 'week':
        start = end - timedelta(weeks=12)
    else:
        start = end - timedelta(days=365)
    
    from app.models.transaction import Transaction
    
    tx = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start
    ).all()
    
    # Group data
    data = {}
    for t in tx:
        if group_by == 'day':
            key = t.date.isoformat()
        elif group_by == 'week':
            year, week, _ = t.date.isocalendar()
            key = f"{year}-W{week}"
        else:
            key = f"{t.date.year}-{t.date.month:02d}"
        
        if key not in data:
            data[key] = {'income': 0, 'expense': 0, 'count': 0}
        
        if t.is_income:
            data[key]['income'] += float(t.amount)
        else:
            data[key]['expense'] += float(t.amount)
        data[key]['count'] += 1
    
    return jsonify({
        'trends': [
            {'period': k, **v}
            for k, v in sorted(data.items())
        ]
    }), HTTP_STATUS.OK


@analytics_bp.route('/cash-flow', methods=['GET'])
@jwt_required()
def cash_flow():
    """Get cash flow analysis."""
    user_id = get_jwt_identity()
    days = request.args.get('days', 30, type=int)
    
    from app.services.dashboard_service import DashboardService
    
    # This would be implemented in DashboardService
    # Simplified version here
    end = datetime.now().date()
    start = end - timedelta(days=days)
    
    from app.models.transaction import Transaction
    
    tx = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start
    ).order_by(Transaction.date).all()
    
    balance = 0
    daily = {}
    
    for t in tx:
        date_str = t.date.isoformat()
        if date_str not in daily:
            daily[date_str] = {'inflow': 0, 'outflow': 0, 'balance': balance}
        
        if t.is_income:
            daily[date_str]['inflow'] += float(t.amount)
            balance += float(t.amount)
        else:
            daily[date_str]['outflow'] += float(t.amount)
            balance -= float(t.amount)
        
        daily[date_str]['balance'] = balance
    
    return jsonify({
        'cash_flow': [
            {'date': k, **v}
            for k, v in sorted(daily.items())
        ],
        'current_balance': balance
    }), HTTP_STATUS.OK