"""
Import routes.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from app.extensions import db
from app.utils.constants import HTTP_STATUS
from app.services.import_service import ImportService
from app.services.file_service import FileService
from app.models.transaction import Transaction

imports_bp = Blueprint('imports', __name__, url_prefix='/imports')


@imports_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Upload file for import."""
    user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify(error="No file uploaded"), HTTP_STATUS.BAD_REQUEST
    
    file = request.files['file']
    if file.filename == '':
        return jsonify(error="Empty filename"), HTTP_STATUS.BAD_REQUEST
    
    # Check file type
    if not FileService.allowed_file(file.filename):
        return jsonify(error="File type not allowed"), HTTP_STATUS.BAD_REQUEST
    
    # Save temp file
    file_info = FileService().save_temp(file, file.filename)
    
    return jsonify({
        'message': "File uploaded",
        'file': file_info
    }), HTTP_STATUS.OK


@imports_bp.route('/preview', methods=['POST'])
@jwt_required()
def preview_import():
    """Preview import without saving."""
    user_id = get_jwt_identity()
    
    data = request.get_json()
    filename = data.get('filename')
    mapping = data.get('mapping', {})
    
    # Get file
    file_service = FileService()
    file_path = file_service.temp / filename
    
    if not file_path.exists():
        return jsonify(error="File not found"), HTTP_STATUS.NOT_FOUND
    
    # Read file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Parse based on extension
    if filename.endswith('.csv'):
        records = ImportService.parse_csv(content, mapping)
    elif filename.endswith('.json'):
        records = ImportService.parse_json(content)
    else:
        return jsonify(error="Unsupported file type"), HTTP_STATUS.BAD_REQUEST
    
    # Validate
    results = ImportService.import_transactions(records, user_id, dry_run=True)
    
    return jsonify(results), HTTP_STATUS.OK


@imports_bp.route('/execute', methods=['POST'])
@jwt_required()
def execute_import():
    """Execute import and save transactions."""
    user_id = get_jwt_identity()
    
    data = request.get_json()
    filename = data.get('filename')
    mapping = data.get('mapping', {})
    
    # Get file
    file_service = FileService()
    file_path = file_service.temp / filename
    
    if not file_path.exists():
        return jsonify(error="File not found"), HTTP_STATUS.NOT_FOUND
    
    # Read file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Parse
    if filename.endswith('.csv'):
        records = ImportService.parse_csv(content, mapping)
    elif filename.endswith('.json'):
        records = ImportService.parse_json(content)
    else:
        return jsonify(error="Unsupported file type"), HTTP_STATUS.BAD_REQUEST
    
    # Import
    results = ImportService.import_transactions(records, user_id, dry_run=False)
    
    # Clean up temp file
    file_path.unlink()
    
    return jsonify({
        'message': f"Imported {results['success']} transactions",
        'results': results
    }), HTTP_STATUS.OK


@imports_bp.route('/template', methods=['GET'])
def get_template():
    """Get import template."""
    format = request.args.get('format', 'csv')
    
    template = [
        {
            'date': '2024-01-15',
            'description': 'Grocery store',
            'amount': '45.67',
            'category': 'Groceries',
            'type': 'expense',
            'notes': 'Weekly shopping'
        }
    ]
    
    if format == 'csv':
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=template[0].keys())
        writer.writeheader()
        writer.writerows(template)
        
        output.seek(0)
        return jsonify({
            'template': output.getvalue(),
            'format': 'csv'
        })
    else:
        return jsonify({
            'template': template,
            'format': 'json'
        })