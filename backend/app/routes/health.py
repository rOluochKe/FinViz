"""
Health check routes.
"""
from flask import Blueprint, jsonify
from datetime import datetime
import psutil
import os

from app.extensions import db, cache
from app.utils.constants import HTTP_STATUS

health_bp = Blueprint('health', __name__, url_prefix='/health')


@health_bp.route('', methods=['GET'])
def health_check():
    """Basic health check."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'finviz-backend'
    }), HTTP_STATUS.OK


@health_bp.route('/detailed', methods=['GET'])
def detailed_health():
    """Detailed health check with component status."""
    status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'components': {}
    }
    
    # Database check
    try:
        db.session.execute('SELECT 1')
        status['components']['database'] = {'status': 'healthy'}
    except Exception as e:
        status['components']['database'] = {'status': 'unhealthy', 'error': str(e)}
        status['status'] = 'degraded'
    
    # Cache check
    try:
        cache.set('health_check', 'ok', timeout=5)
        cache.get('health_check')
        status['components']['cache'] = {'status': 'healthy'}
    except Exception as e:
        status['components']['cache'] = {'status': 'unhealthy', 'error': str(e)}
        status['status'] = 'degraded'
    
    # Disk space check
    try:
        disk = psutil.disk_usage('/')
        free_gb = disk.free / (1024**3)
        if free_gb < 1:
            status['components']['disk'] = {
                'status': 'warning',
                'free_gb': round(free_gb, 2),
                'total_gb': round(disk.total / (1024**3), 2)
            }
            status['status'] = 'degraded'
        else:
            status['components']['disk'] = {
                'status': 'healthy',
                'free_gb': round(free_gb, 2),
                'total_gb': round(disk.total / (1024**3), 2)
            }
    except:
        status['components']['disk'] = {'status': 'unknown'}
    
    # Memory check
    try:
        memory = psutil.virtual_memory()
        if memory.percent > 90:
            status['components']['memory'] = {
                'status': 'warning',
                'percent': memory.percent,
                'available_gb': round(memory.available / (1024**3), 2)
            }
            status['status'] = 'degraded'
        else:
            status['components']['memory'] = {
                'status': 'healthy',
                'percent': memory.percent,
                'available_gb': round(memory.available / (1024**3), 2)
            }
    except:
        status['components']['memory'] = {'status': 'unknown'}
    
    return jsonify(status), HTTP_STATUS.OK if status['status'] == 'healthy' else HTTP_STATUS.OK


@health_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint."""
    return '', HTTP_STATUS.OK


@health_bp.route('/version', methods=['GET'])
def version():
    """Get API version."""
    return jsonify({
        'version': '1.0.0',
        'name': 'FinViz Pro API',
        'environment': os.getenv('FLASK_ENV', 'production')
    }), HTTP_STATUS.OK