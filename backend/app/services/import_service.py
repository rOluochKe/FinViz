"""
Import service for importing data from various sources.
"""

import csv
import json
from datetime import datetime
from typing import Dict, List, Tuple

import pandas as pd

from app.extensions import db
from app.models.category import Category
from app.models.transaction import Transaction


class ImportService:
    """Service for importing data."""

    @staticmethod
    def parse_csv(file_content: str, mapping: Dict) -> List[Dict]:
        """
        Parse CSV file with column mapping.

        Args:
            file_content: CSV content
            mapping: Column mapping dict

        Returns:
            List of parsed records
        """
        reader = csv.DictReader(file_content.splitlines())
        records = []

        for row in reader:
            record = {}
            for target, source in mapping.items():
                if source in row:
                    record[target] = row[source]
            records.append(record)

        return records

    @staticmethod
    def parse_json(file_content: str) -> List[Dict]:
        """Parse JSON file."""
        return json.loads(file_content)

    @staticmethod
    def parse_excel(file_content: bytes, sheet: int = 0) -> List[Dict]:
        """Parse Excel file."""
        df = pd.read_excel(file_content, sheet_name=sheet)
        return df.to_dict("records")

    @staticmethod
    def validate_transaction(record: Dict, user_id: int) -> Tuple[bool, str]:
        """
        Validate a transaction record.

        Args:
            record: Transaction data
            user_id: User ID

        Returns:
            (is_valid, error_message)
        """
        required = ["date", "amount", "description"]
        for field in required:
            if field not in record:
                return False, f"Missing required field: {field}"

        # Validate date
        try:
            if isinstance(record["date"], str):
                datetime.strptime(record["date"], "%Y-%m-%d")
        except BaseException:
            return False, "Invalid date format (use YYYY-MM-DD)"

        # Validate amount
        try:
            amount = float(record["amount"])
            if amount <= 0:
                return False, "Amount must be positive"
        except BaseException:
            return False, "Invalid amount"

        # Validate category if provided
        if "category" in record:
            cat = Category.query.filter_by(
                name=record["category"], user_id=user_id
            ).first()
            if not cat:
                return False, f"Category not found: {record['category']}"

        return True, "OK"

    @staticmethod
    def import_transactions(
        records: List[Dict], user_id: int, dry_run: bool = False
    ) -> Dict:
        """
        Import transactions from records.

        Args:
            records: List of transaction records
            user_id: User ID
            dry_run: Validate without importing

        Returns:
            Import results
        """
        success = []
        failed = []

        for idx, rec in enumerate(records):
            # Validate
            valid, error = ImportService.validate_transaction(rec, user_id)
            if not valid:
                failed.append({"index": idx, "record": rec, "error": error})
                continue

            # Find category
            category_id = None
            if "category" in rec:
                cat = Category.query.filter_by(
                    name=rec["category"], user_id=user_id
                ).first()
                if cat:
                    category_id = cat.id

            # Determine type (default to expense)
            tx_type = rec.get("type", "expense")

            # Create transaction
            tx_data = {
                "user_id": user_id,
                "category_id": category_id,
                "amount": float(rec["amount"]),
                "description": rec["description"],
                "date": datetime.strptime(rec["date"], "%Y-%m-%d").date(),
                "type": tx_type,
                "notes": rec.get("notes", ""),
            }

            if not dry_run:
                tx = Transaction(**tx_data)
                db.session.add(tx)

            success.append({"index": idx, "data": tx_data})

        if not dry_run and success:
            db.session.commit()

        return {
            "total": len(records),
            "success": len(success),
            "successful": success,
            "failed": failed,
        }

    @staticmethod
    def detect_format(file_content: str, filename: str) -> str:
        """
        Detect file format from content and filename.

        Args:
            file_content: File content
            filename: Original filename

        Returns:
            Format: 'csv', 'json', 'excel'
        """
        if filename.endswith(".csv"):
            return "csv"
        elif filename.endswith(".json"):
            return "json"
        elif filename.endswith((".xlsx", ".xls")):
            return "excel"
        else:
            # Try to detect by content
            try:
                json.loads(file_content)
                return "json"
            except BaseException:
                if "," in file_content[:100]:
                    return "csv"
                return "unknown"
