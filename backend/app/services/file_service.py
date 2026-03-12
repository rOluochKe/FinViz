"""
File service for local file storage operations.
"""
import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, BinaryIO
from werkzeug.utils import secure_filename

from flask import current_app


class FileService:
    """Service for handling local file storage."""
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'csv', 'xlsx', 'xls', 'txt'}
    ALLOWED_MIMETYPES = {
        'image/png', 'image/jpeg', 'image/gif',
        'application/pdf', 'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    }
    
    def __init__(self):
        self.base_upload_dir = Path(current_app.config.get('UPLOAD_FOLDER', 'uploads'))
        self.max_size = current_app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)
        
        # Create subdirectories
        self.receipts_dir = self.base_upload_dir / 'receipts'
        self.exports_dir = self.base_upload_dir / 'exports'
        self.temp_dir = self.base_upload_dir / 'temp'
        
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure all required directories exist."""
        for directory in [self.receipts_dir, self.exports_dir, self.temp_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def allowed_file(filename: str) -> bool:
        """Check if file extension is allowed."""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def allowed_mimetype(mimetype: str) -> bool:
        """Check if mimetype is allowed."""
        return mimetype in FileService.ALLOWED_MIMETYPES
    
    def save_receipt(self, file: BinaryIO, original_filename: str, 
                     user_id: int) -> dict:
        """
        Save a receipt file locally.
        
        Args:
            file: File object
            original_filename: Original filename
            user_id: User ID
            
        Returns:
            Dict with file info
        """
        # Secure filename and generate unique name
        secure_name = secure_filename(original_filename)
        ext = secure_name.rsplit('.', 1)[1].lower() if '.' in secure_name else ''
        unique_name = f"{uuid.uuid4().hex}_{int(datetime.now().timestamp())}.{ext}"
        
        # Create user-specific subdirectory
        user_dir = self.receipts_dir / str(user_id)
        user_dir.mkdir(exist_ok=True)
        
        # Save file
        file_path = user_dir / unique_name
        file.save(str(file_path))
        
        return {
            'filename': unique_name,
            'original_filename': secure_name,
            'path': str(file_path.relative_to(self.base_upload_dir)),
            'size': file_path.stat().st_size,
            'mimetype': file.mimetype,
            'url': f"/uploads/{file_path.relative_to(self.base_upload_dir)}"
        }
    
    def get_receipt_path(self, filename: str, user_id: int) -> Optional[Path]:
        """Get full path to a receipt file."""
        user_dir = self.receipts_dir / str(user_id)
        file_path = user_dir / filename
        
        if file_path.exists() and file_path.is_file():
            return file_path
        
        return None
    
    def delete_receipt(self, filename: str, user_id: int) -> bool:
        """Delete a receipt file."""
        file_path = self.get_receipt_path(filename, user_id)
        
        if file_path and file_path.exists():
            file_path.unlink()
            return True
        
        return False
    
    def save_export(self, data: bytes, filename: str, user_id: int) -> dict:
        """
        Save an exported file.
        
        Args:
            data: File data
            filename: Desired filename
            user_id: User ID
            
        Returns:
            Dict with file info
        """
        secure_name = secure_filename(filename)
        
        # Create user-specific subdirectory
        user_dir = self.exports_dir / str(user_id)
        user_dir.mkdir(exist_ok=True)
        
        # Save file
        file_path = user_dir / secure_name
        with open(file_path, 'wb') as f:
            f.write(data)
        
        return {
            'filename': secure_name,
            'path': str(file_path.relative_to(self.base_upload_dir)),
            'size': file_path.stat().st_size,
            'url': f"/uploads/{file_path.relative_to(self.base_upload_dir)}"
        }
    
    def get_export_path(self, filename: str, user_id: int) -> Optional[Path]:
        """Get full path to an export file."""
        user_dir = self.exports_dir / str(user_id)
        file_path = user_dir / filename
        
        if file_path.exists() and file_path.is_file():
            return file_path
        
        return None
    
    def save_temp(self, file: BinaryIO, original_filename: str) -> dict:
        """
        Save a temporary file.
        
        Args:
            file: File object
            original_filename: Original filename
            
        Returns:
            Dict with file info
        """
        secure_name = secure_filename(original_filename)
        unique_name = f"temp_{uuid.uuid4().hex}_{secure_name}"
        
        file_path = self.temp_dir / unique_name
        file.save(str(file_path))
        
        return {
            'filename': unique_name,
            'original_filename': secure_name,
            'path': str(file_path.relative_to(self.base_upload_dir)),
            'size': file_path.stat().st_size,
            'url': f"/uploads/{file_path.relative_to(self.base_upload_dir)}"
        }
    
    def cleanup_temp(self, max_age_hours: int = 24):
        """Clean up temporary files older than max_age_hours."""
        cutoff = datetime.now().timestamp() - (max_age_hours * 3600)
        deleted = 0
        
        for file_path in self.temp_dir.glob('*'):
            if file_path.is_file() and file_path.stat().st_mtime < cutoff:
                file_path.unlink()
                deleted += 1
        
        return deleted
    
    def get_user_storage_usage(self, user_id: int) -> dict:
        """Get storage usage for a user."""
        receipts_dir = self.receipts_dir / str(user_id)
        exports_dir = self.exports_dir / str(user_id)
        
        receipts_size = 0
        receipts_count = 0
        
        if receipts_dir.exists():
            for file_path in receipts_dir.glob('*'):
                if file_path.is_file():
                    receipts_size += file_path.stat().st_size
                    receipts_count += 1
        
        exports_size = 0
        exports_count = 0
        
        if exports_dir.exists():
            for file_path in exports_dir.glob('*'):
                if file_path.is_file():
                    exports_size += file_path.stat().st_size
                    exports_count += 1
        
        return {
            'receipts': {
                'count': receipts_count,
                'size': receipts_size,
                'size_mb': round(receipts_size / (1024 * 1024), 2)
            },
            'exports': {
                'count': exports_count,
                'size': exports_size,
                'size_mb': round(exports_size / (1024 * 1024), 2)
            },
            'total': {
                'count': receipts_count + exports_count,
                'size': receipts_size + exports_size,
                'size_mb': round((receipts_size + exports_size) / (1024 * 1024), 2)
            }
        }
        