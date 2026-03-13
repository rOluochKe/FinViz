"""
Export service for generating exports in various formats.
"""

import csv
import io
import json
from datetime import datetime
from typing import Dict, List

import pandas as pd

from app.utils.constants import ExportFormat


class ExportService:
    """Service for data export operations."""

    @staticmethod
    def export_to_csv(data: List[Dict], filename: str = None) -> io.BytesIO:
        """
        Export data to CSV.

        Args:
            data: List of dicts to export
            filename: Optional filename

        Returns:
            BytesIO with CSV data
        """
        if not data:
            return io.BytesIO()

        output = io.StringIO()
        headers = data[0].keys()

        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data)

        output.seek(0)
        return io.BytesIO(output.getvalue().encode("utf-8"))

    @staticmethod
    def export_to_json(data: List[Dict], pretty: bool = True) -> io.BytesIO:
        """
        Export data to JSON.

        Args:
            data: Data to export
            pretty: Pretty print

        Returns:
            BytesIO with JSON data
        """
        indent = 2 if pretty else None
        json_str = json.dumps(data, indent=indent, default=str)
        return io.BytesIO(json_str.encode("utf-8"))

    @staticmethod
    def export_to_excel(data: List[Dict], sheet: str = "Sheet1") -> io.BytesIO:
        """
        Export data to Excel.

        Args:
            data: Data to export
            sheet: Sheet name

        Returns:
            BytesIO with Excel file
        """
        if not data:
            return io.BytesIO()

        df = pd.DataFrame(data)
        output = io.BytesIO()

        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name=sheet, index=False)

        output.seek(0)
        return output

    @staticmethod
    def to_pdf(data: List[Dict], title: str = "Report") -> io.BytesIO:
        """
        Simple PDF export.

        Args:
            data: Data to export
            title: Report title

        Returns:
            BytesIO with PDF
        """
        # Simplified - in production, use reportlab or weasyprint
        content = json.dumps(
            {
                "title": title,
                "date": datetime.now().isoformat(),
                "count": len(data),
                "data": data[:10],  # Limit for demo
            },
            indent=2,
        )

        return io.BytesIO(content.encode("utf-8"))

    @staticmethod
    def export_transactions(transactions: List[Dict], format: str) -> io.BytesIO:
        """
        Export transactions in specified format.

        Args:
            transactions: List of transactions
            format: Export format

        Returns:
            BytesIO with exported file
        """

        if format == ExportFormat.CSV:
            return ExportService.export_to_csv(transactions)
        elif format == ExportFormat.JSON:
            return ExportService.export_to_json(transactions)
        elif format == ExportFormat.EXCEL:
            return ExportService.export_to_excel(transactions)
        elif format == ExportFormat.PDF:
            return ExportService.to_pdf(transactions)
        else:
            raise ValueError(f"Unsupported format: {format}")

    @staticmethod
    def get_filename(prefix: str, format: str) -> str:
        """
        Generate filename for export.

        Args:
            prefix: Filename prefix
            format: File format

        Returns:
            Filename with timestamp
        """
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}_{ts}.{format}"
