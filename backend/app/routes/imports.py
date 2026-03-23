"""
Import routes with Flask-RESTX.
"""

import csv
import io
import os
import uuid

from flask import request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields

from app.services.file_service import FileService
from app.services.import_service import ImportService
from app.utils.constants import HTTP_STATUS
from app.utils.decorators import safe_cache_cached

# Create namespace
imports_ns = Namespace("imports", description="Data import operations")


def get_user_uuid():
    """Get user UUID from JWT identity."""
    user_id = get_jwt_identity()
    if isinstance(user_id, str):
        try:
            return uuid.UUID(user_id)
        except ValueError:
            return None
    return user_id


# ============================================================================
# Model Definitions
# ============================================================================

# File upload models
file_upload_response = imports_ns.model(
    "FileUploadResponse",
    {
        "message": fields.String(
            description="Response message", example="File uploaded"
        ),
        "file": fields.Raw(description="File information"),
    },
)

# Import mapping models
mapping_model = imports_ns.model(
    "ColumnMapping",
    {
        "date": fields.String(
            description="Date column name", example="transaction_date"
        ),
        "amount": fields.String(description="Amount column name", example="amount"),
        "description": fields.String(
            description="Description column name", example="description"
        ),
        "category": fields.String(
            description="Category column name", example="category", required=False
        ),
        "type": fields.String(
            description="Type column name", example="type", required=False
        ),
        "notes": fields.String(
            description="Notes column name", example="notes", required=False
        ),
    },
)

import_preview_request = imports_ns.model(
    "ImportPreviewRequest",
    {
        "filename": fields.String(
            required=True,
            description="Filename to preview",
            example="transactions_2024-01-15.csv",
        ),
        "mapping": fields.Nested(
            mapping_model, description="Column mapping for CSV import"
        ),
    },
)

import_execute_request = imports_ns.model(
    "ImportExecuteRequest",
    {
        "filename": fields.String(
            required=True,
            description="Filename to import",
            example="transactions_2024-01-15.csv",
        ),
        "mapping": fields.Nested(
            mapping_model, description="Column mapping for CSV import"
        ),
    },
)

# Import result models
import_result_item = imports_ns.model(
    "ImportResultItem",
    {
        "index": fields.Integer(description="Record index", example=0),
        "data": fields.Raw(description="Imported data"),
        "error": fields.String(description="Error message if failed", allow_null=True),
    },
)

import_results = imports_ns.model(
    "ImportResults",
    {
        "total": fields.Integer(description="Total records processed", example=10),
        "success": fields.Integer(
            description="Successfully imported records", example=8
        ),
        "failed": fields.Integer(description="Failed records", example=2),
        "successful": fields.List(
            fields.Nested(import_result_item), description="Successful imports"
        ),
        "failed": fields.List(
            fields.Nested(import_result_item), description="Failed imports"
        ),
    },
)

import_response = imports_ns.model(
    "ImportResponse",
    {
        "message": fields.String(
            description="Response message", example="Imported 8 transactions"
        ),
        "results": fields.Nested(import_results),
    },
)

# Template models
template_item = imports_ns.model(
    "TemplateItem",
    {
        "date": fields.String(description="Date", example="2024-01-15"),
        "description": fields.String(
            description="Description", example="Grocery store"
        ),
        "amount": fields.String(description="Amount", example="45.67"),
        "category": fields.String(description="Category", example="Groceries"),
        "type": fields.String(description="Type", example="expense"),
        "notes": fields.String(description="Notes", example="Weekly shopping"),
    },
)

template_response = imports_ns.model(
    "TemplateResponse",
    {
        "template": fields.Raw(description="Template content"),
        "format": fields.String(
            description="Template format", example="csv", enum=["csv", "json"]
        ),
    },
)

# Error models
error_response = imports_ns.model(
    "ErrorResponse", {"error": fields.String(description="Error message")}
)

# ============================================================================
# API Endpoints
# ============================================================================


@imports_ns.route("/upload")
class UploadFile(Resource):
    @imports_ns.doc(
        description="Upload a file for import (CSV, JSON, Excel)",
        security="Bearer Auth",
        responses={
            200: "File uploaded successfully",
            400: "Invalid file or no file",
            401: "Authentication required",
        },
    )
    @imports_ns.marshal_with(file_upload_response)
    @jwt_required()
    def post(self):
        """Upload file for import"""
        try:
            user_uuid = get_user_uuid()
            if not user_uuid:
                imports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid user ID")

            if "file" not in request.files:
                imports_ns.abort(HTTP_STATUS.BAD_REQUEST, "No file uploaded")

            file = request.files["file"]
            if file.filename == "":
                imports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Empty filename")

            # Check file type - allow more extensions for import
            allowed_extensions = {".csv", ".json", ".xls", ".xlsx"}
            file_ext = os.path.splitext(file.filename)[1].lower()

            if file_ext not in allowed_extensions:
                imports_ns.abort(
                    HTTP_STATUS.BAD_REQUEST,
                    f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}",
                )

            # Check file size
            file.seek(0, 2)  # Seek to end of file
            file_size = file.tell()
            file.seek(0)  # Seek back to beginning

            if file_size > 16 * 1024 * 1024:  # 16MB
                imports_ns.abort(
                    HTTP_STATUS.BAD_REQUEST, "File size exceeds 16MB limit"
                )

            # Save temp file
            file_service = FileService()
            file_info = file_service.save_temp(file, file.filename)

            return {
                "message": "File uploaded",
                "file": {
                    "filename": file_info["filename"],
                    "original": file_info["original"],
                    "size": file_info["size"],
                },
            }

        except Exception as e:
            imports_ns.abort(
                HTTP_STATUS.INTERNAL_SERVER_ERROR, f"Upload failed: {str(e)}"
            )


@imports_ns.route("/preview")
class PreviewImport(Resource):
    @imports_ns.doc(
        description="Preview import results without saving to database",
        security="Bearer Auth",
        responses={
            200: "Preview generated",
            400: "Invalid request",
            401: "Authentication required",
            404: "File not found",
        },
    )
    @imports_ns.expect(import_preview_request)
    @imports_ns.marshal_with(import_results)
    @jwt_required()
    def post(self):
        """Preview import"""
        try:
            user_uuid = get_user_uuid()
            if not user_uuid:
                imports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid user ID")

            data = request.json or {}

            filename = data.get("filename")
            if not filename:
                imports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Filename required")

            mapping = data.get("mapping", {})

            # Get file
            file_service = FileService()
            file_path = file_service.get_temp_path(filename)

            if not file_path:
                imports_ns.abort(HTTP_STATUS.NOT_FOUND, "File not found")

            # Read file
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except UnicodeDecodeError:
                try:
                    with open(file_path, "r", encoding="latin-1") as f:
                        content = f.read()
                except Exception as e:
                    imports_ns.abort(
                        HTTP_STATUS.BAD_REQUEST, f"Could not read file: {str(e)}"
                    )

            # Parse based on extension
            records = None
            if filename.endswith(".csv"):
                records = ImportService.parse_csv(content, mapping)
            elif filename.endswith(".json"):
                records = ImportService.parse_json(content)
            else:
                imports_ns.abort(
                    HTTP_STATUS.BAD_REQUEST, "Unsupported file type. Use .csv or .json"
                )

            if records is None:
                imports_ns.abort(
                    HTTP_STATUS.BAD_REQUEST, "Failed to parse records from file"
                )

            # Validate
            results = ImportService.import_transactions(
                records, user_uuid, dry_run=True
            )

            return results

        except Exception as e:
            imports_ns.abort(
                HTTP_STATUS.INTERNAL_SERVER_ERROR, f"Preview failed: {str(e)}"
            )


@imports_ns.route("/execute")
class ExecuteImport(Resource):
    @imports_ns.doc(
        description="Execute import and save transactions to database",
        security="Bearer Auth",
        responses={
            200: "Import completed",
            400: "Invalid request",
            401: "Authentication required",
            404: "File not found",
        },
    )
    @imports_ns.expect(import_execute_request)
    @imports_ns.marshal_with(import_response)
    @jwt_required()
    def post(self):
        """Execute import"""
        try:
            user_uuid = get_user_uuid()
            if not user_uuid:
                imports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Invalid user ID")

            data = request.json or {}

            filename = data.get("filename")
            if not filename:
                imports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Filename required")

            mapping = data.get("mapping", {})

            # Get file
            file_service = FileService()
            file_path = file_service.get_temp_path(filename)

            if not file_path:
                imports_ns.abort(HTTP_STATUS.NOT_FOUND, "File not found")

            # Read file
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except UnicodeDecodeError:
                try:
                    with open(file_path, "r", encoding="latin-1") as f:
                        content = f.read()
                except Exception as e:
                    imports_ns.abort(
                        HTTP_STATUS.BAD_REQUEST, f"Could not read file: {str(e)}"
                    )

            # Parse
            records = None
            if filename.endswith(".csv"):
                records = ImportService.parse_csv(content, mapping)
            elif filename.endswith(".json"):
                records = ImportService.parse_json(content)
            else:
                imports_ns.abort(
                    HTTP_STATUS.BAD_REQUEST, "Unsupported file type. Use .csv or .json"
                )

            if records is None:
                imports_ns.abort(
                    HTTP_STATUS.BAD_REQUEST, "Failed to parse records from file"
                )

            # Import
            results = ImportService.import_transactions(
                records, user_uuid, dry_run=False
            )

            # Clean up temp file
            file_service.delete_temp(filename)

            return {
                "message": f"Imported {results['success']} transactions",
                "results": results,
            }

        except Exception as e:
            imports_ns.abort(
                HTTP_STATUS.INTERNAL_SERVER_ERROR, f"Import failed: {str(e)}"
            )


@imports_ns.route("/template")
class GetTemplate(Resource):
    @imports_ns.doc(
        description="Get import template in CSV or JSON format",
        responses={200: "Template generated", 400: "Invalid format"},
    )
    @imports_ns.param(
        "format", "Template format", type="string", default="csv", enum=["csv", "json"]
    )
    @imports_ns.marshal_with(template_response)
    def get(self):
        """Get import template"""
        try:
            format = request.args.get("format", "csv")

            template = [
                {
                    "date": "2024-01-15",
                    "description": "Grocery store",
                    "amount": "45.67",
                    "category": "Groceries",
                    "type": "expense",
                    "notes": "Weekly shopping",
                }
            ]

            if format == "csv":
                output = io.StringIO()
                writer = csv.DictWriter(output, fieldnames=template[0].keys())
                writer.writeheader()
                writer.writerows(template)
                output.seek(0)
                return {"template": output.getvalue(), "format": "csv"}
            else:
                return {"template": template, "format": "json"}

        except Exception as e:
            imports_ns.abort(
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                f"Template generation failed: {str(e)}",
            )


@imports_ns.route("/supported-formats")
class SupportedFormats(Resource):
    @imports_ns.doc(
        description="Get supported import formats", responses={200: "Formats retrieved"}
    )
    @safe_cache_cached(timeout=3600)  # Cache for 1 hour, handles Redis failure
    def get(self):
        """Get supported formats"""
        return {
            "formats": ["csv", "json"],
            "extensions": {"csv": [".csv"], "json": [".json"]},
            "max_file_size_mb": 16,
            "required_fields": ["date", "amount", "description"],
            "optional_fields": ["category", "type", "notes"],
        }


@imports_ns.route("/validate")
class ValidateFile(Resource):
    @imports_ns.doc(
        description="Validate file format and structure without processing",
        security="Bearer Auth",
        responses={
            200: "Validation results",
            400: "Invalid file",
            401: "Authentication required",
            404: "File not found",
        },
    )
    @imports_ns.expect(
        imports_ns.model(
            "ValidateRequest",
            {
                "filename": fields.String(
                    required=True, description="Filename to validate"
                )
            },
        )
    )
    @jwt_required()
    def post(self):
        """Validate import file"""
        try:
            data = request.json or {}
            filename = data.get("filename")

            if not filename:
                imports_ns.abort(HTTP_STATUS.BAD_REQUEST, "Filename required")

            file_service = FileService()
            file_path = file_service.temp / filename

            if not file_path.exists():
                imports_ns.abort(HTTP_STATUS.NOT_FOUND, "File not found")

            # Check file size
            file_size = file_path.stat().st_size
            max_size = 16 * 1024 * 1024  # 16MB
            if file_size > max_size:
                return {
                    "valid": False,
                    "error": f"File too large. Maximum size is {max_size // (1024*1024)}MB",
                    "size_mb": round(file_size / (1024 * 1024), 2),
                }

            # Check extension
            if not filename.endswith((".csv", ".json")):
                return {
                    "valid": False,
                    "error": "Unsupported file type. Use .csv or .json",
                    "extension": filename.split(".")[-1] if "." in filename else "none",
                }

            return {
                "valid": True,
                "size_mb": round(file_size / (1024 * 1024), 2),
                "extension": filename.split(".")[-1] if "." in filename else "",
                "message": "File format is valid",
            }

        except Exception as e:
            imports_ns.abort(
                HTTP_STATUS.INTERNAL_SERVER_ERROR, f"Validation failed: {str(e)}"
            )


@imports_ns.route("/clear-temp")
class ClearTemp(Resource):
    @imports_ns.doc(
        description="Clear temporary uploaded files",
        security="Bearer Auth",
        responses={200: "Temp files cleared", 401: "Authentication required"},
    )
    @jwt_required()
    def delete(self):
        """Clear all temporary files"""
        try:
            file_service = FileService()
            deleted = file_service.cleanup_temp(hours=0)  # Clear all temp files

            return {"message": f"Cleared {deleted} temporary files", "count": deleted}

        except Exception as e:
            imports_ns.abort(
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                f"Failed to clear temp files: {str(e)}",
            )
