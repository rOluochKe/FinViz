"""
Report routes.
"""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import io

from app.extensions import cache
from app.utils.constants import HTTP_STATUS
from app.services.report_service import ReportService
from app.services.export_service import ExportService

reports_bp = Blueprint('reports', __name__, url_prefix='/reports')


@reports_bp.route('/monthly/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300)
def monthly_report(year, month):
    """Generate monthly report."""
    user_id = get_jwt_identity()
    
    report = ReportService.monthly_report(user_id, year, month)
    
    return jsonify(report), HTTP_STATUS.OK


@reports_bp.route('/yearly/<int:year>', methods=['GET'])
@jwt_required()
@cache.cached(timeout=600)
def yearly_report(year):
    """Generate yearly report."""
    user_id = get_jwt_identity()
    
    report = ReportService.yearly_report(user_id, year)
    
    return jsonify(report), HTTP_STATUS.OK


@reports_bp.route('/category/<int:category_id>', methods=['GET'])
@jwt_required()
def category_report(category_id):
    """Generate category report."""
    user_id = get_jwt_identity()
    months = request.args.get('months', 12, type=int)
    
    report = ReportService.category_report(user_id, category_id, months)
    
    return jsonify(report), HTTP_STATUS.OK


@reports_bp.route('/export/monthly/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
def export_monthly(year, month):
    """Export monthly report as PDF."""
    user_id = get_jwt_identity()
    
    report = ReportService.monthly_report(user_id, year, month)
    
    # Convert to PDF (simplified)
    pdf_data = ExportService.to_pdf([report], f"Monthly Report {year}-{month}")
    filename = f"monthly_report_{year}_{month}.pdf"
    
    return send_file(
        pdf_data,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )


@reports_bp.route('/export/yearly/<int:year>', methods=['GET'])
@jwt_required()
def export_yearly(year):
    """Export yearly report as PDF."""
    user_id = get_jwt_identity()
    
    report = ReportService.yearly_report(user_id, year)
    
    pdf_data = ExportService.to_pdf([report], f"Yearly Report {year}")
    filename = f"yearly_report_{year}.pdf"
    
    return send_file(
        pdf_data,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )


@reports_bp.route('/comparison', methods=['GET'])
@jwt_required()
def compare_periods():
    """Compare two periods."""
    user_id = get_jwt_identity()
    
    period1 = request.args.get('period1')
    period2 = request.args.get('period2')
    
    # Parse periods (simplified - expects YYYY-MM)
    try:
        y1, m1 = map(int, period1.split('-'))
        y2, m2 = map(int, period2.split('-'))
    except:
        return jsonify(error="Invalid period format"), HTTP_STATUS.BAD_REQUEST
    
    report1 = ReportService.monthly_report(user_id, y1, m1)
    report2 = ReportService.monthly_report(user_id, y2, m2)
    
    comparison = {
        'period1': report1,
        'period2': report2,
        'differences': {
            'income': report2['summary']['income'] - report1['summary']['income'],
            'expense': report2['summary']['expense'] - report1['summary']['expense'],
            'savings': report2['summary']['savings'] - report1['summary']['savings']
        }
    }
    
    return jsonify(comparison), HTTP_STATUS.OK