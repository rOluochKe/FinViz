"""
File service for local file storage operations.
"""

import uuid
from datetime import datetime
from pathlib import Path
from typing import BinaryIO, Dict, Optional

from flask import current_app
from werkzeug.utils import secure_filename


class FileService:
    """Service for local file operations."""

    ALLOWED_EXT = {"png", "jpg", "jpeg", "gif", "pdf", "csv", "xlsx", "txt"}
    ALLOWED_MIMETYPES = {
        "image/png",
        "image/jpeg",
        "image/gif",
        "application/pdf",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
    }

    def __init__(self):
        self.base = Path(current_app.config.get("UPLOAD_FOLDER", "uploads"))
        self.receipts = self.base / "receipts"
        self.exports = self.base / "exports"
        self.temp = self.base / "temp"
        self._ensure_dirs()

    def _ensure_dirs(self):
        """Create required directories."""
        for d in [self.receipts, self.exports, self.temp]:
            d.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def allowed_file(filename: str) -> bool:
        """Check if file extension is allowed."""
        return (
            "." in filename
            and filename.rsplit(".", 1)[1].lower() in FileService.ALLOWED_EXT
        )

    @staticmethod
    def allowed_mimetype(mimetype: str) -> bool:
        """Check if mimetype is allowed."""
        return mimetype in FileService.ALLOWED_MIMETYPES

    def save_receipt(self, file: BinaryIO, filename: str, user_id: int) -> Dict:
        """
        Save receipt file locally.

        Args:
            file: File object
            filename: Original filename
            user_id: User ID

        Returns:
            Dict with file info
        """
        secure = secure_filename(filename)
        ext = secure.rsplit(".", 1)[1].lower() if "." in secure else ""
        unique = f"{uuid.uuid4().hex}.{ext}"

        user_dir = self.receipts / str(user_id)
        user_dir.mkdir(exist_ok=True)

        path = user_dir / unique
        file.save(str(path))

        return {
            "filename": unique,
            "original": secure,
            "path": str(path.relative_to(self.base)),
            "size": path.stat().st_size,
            "url": f"/uploads/{path.relative_to(self.base)}",
        }

    def get_receipt(self, filename: str, user_id: int) -> Optional[Path]:
        """Get receipt file path."""
        path = self.receipts / str(user_id) / filename
        return path if path.exists() and path.is_file() else None

    def delete_receipt(self, filename: str, user_id: int) -> bool:
        """Delete receipt file."""
        path = self.get_receipt(filename, user_id)
        if path:
            path.unlink()
            return True
        return False

    def save_export(self, data: bytes, filename: str, user_id: int) -> Dict:
        """
        Save export file.

        Args:
            data: File data
            filename: Desired filename
            user_id: User ID

        Returns:
            Dict with file info
        """
        secure = secure_filename(filename)
        user_dir = self.exports / str(user_id)
        user_dir.mkdir(exist_ok=True)

        path = user_dir / secure
        with open(path, "wb") as f:
            f.write(data)

        return {
            "filename": secure,
            "path": str(path.relative_to(self.base)),
            "size": path.stat().st_size,
            "url": f"/uploads/{path.relative_to(self.base)}",
        }

    def get_export_path(self, filename, user_id):
        """
        Returns the full path to the export file for the given user and filename.
        """
        export_dir = Path("exports") / str(user_id)
        file_path = export_dir / filename
        if file_path.exists():
            return file_path
        return None

    def save_temp(self, file: BinaryIO, filename: str) -> Dict:
        """Save temporary file."""
        secure = secure_filename(filename)
        unique = f"temp_{uuid.uuid4().hex}_{secure}"

        path = self.temp / unique
        file.save(str(path))

        return {
            "filename": unique,
            "original": secure,
            "path": str(path.relative_to(self.base)),
            "size": path.stat().st_size,
        }

    def cleanup_temp(self, hours: int = 24) -> int:
        """Delete temp files older than hours."""
        cutoff = datetime.now().timestamp() - (hours * 3600)
        deleted = 0

        for p in self.temp.glob("*"):
            if p.is_file() and p.stat().st_mtime < cutoff:
                p.unlink()
                deleted += 1

        return deleted

    def get_user_usage(self, user_id: int) -> Dict:
        """Get storage usage for user."""
        receipts = self.receipts / str(user_id)
        exports = self.exports / str(user_id)

        r_size = (
            sum(f.stat().st_size for f in receipts.glob("*") if f.is_file())
            if receipts.exists()
            else 0
        )
        r_count = len(list(receipts.glob("*"))) if receipts.exists() else 0

        e_size = (
            sum(f.stat().st_size for f in exports.glob("*") if f.is_file())
            if exports.exists()
            else 0
        )
        e_count = len(list(exports.glob("*"))) if exports.exists() else 0

        return {
            "receipts": {
                "count": r_count,
                "size": r_size,
                "mb": round(r_size / (1024 * 1024), 2),
            },
            "exports": {
                "count": e_count,
                "size": e_size,
                "mb": round(e_size / (1024 * 1024), 2),
            },
            "total": {
                "count": r_count + e_count,
                "size": r_size + e_size,
                "mb": round((r_size + e_size) / (1024 * 1024), 2),
            },
        }
