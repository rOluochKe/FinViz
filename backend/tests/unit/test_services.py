"""
Unit tests for services.
"""

import io

from app.services.analytics_service import AnalyticsService
from app.services.cache_service import CacheService
from app.services.export_service import ExportService
from app.services.file_service import FileService


class TestAnalyticsService:
    """Test AnalyticsService."""

    def test_calculate_spending_patterns(
        self, db_session, test_user, test_transactions
    ):
        """Test spending pattern calculation."""
        patterns = AnalyticsService.calculate_spending_patterns(test_user.id)

        assert "period" in patterns
        assert "summary" in patterns
        assert "day_of_week" in patterns
        assert "concentration" in patterns

    def test_detect_anomalies(self, db_session, test_user, test_transactions):
        """Test anomaly detection."""
        anomalies = AnalyticsService.detect_anomalies(test_user.id)

        assert "anomalies_detected" in anomalies
        assert "anomalies" in anomalies

    def test_generate_forecast(self, db_session, test_user, test_transactions):
        """Test forecast generation."""
        forecast = AnalyticsService.generate_forecast(test_user.id)

        assert "method" in forecast
        assert "forecast_periods" in forecast
        assert "confidence" in forecast


class TestExportService:
    """Test ExportService."""

    def test_export_to_csv(self):
        """Test CSV export."""
        data = [
            {"id": 1, "name": "Test 1", "value": 100},
            {"id": 2, "name": "Test 2", "value": 200},
        ]

        result = ExportService.export_to_csv(data)

        assert isinstance(result, io.BytesIO)
        assert result.getvalue() is not None

    def test_export_to_json(self):
        """Test JSON export."""
        data = [
            {"id": 1, "name": "Test 1", "value": 100},
            {"id": 2, "name": "Test 2", "value": 200},
        ]

        result = ExportService.export_to_json(data)

        assert isinstance(result, io.BytesIO)
        content = result.getvalue().decode("utf-8")
        assert '"id": 1' in content

    def test_export_to_excel(self):
        """Test Excel export."""
        data = [
            {"id": 1, "name": "Test 1", "value": 100},
            {"id": 2, "name": "Test 2", "value": 200},
        ]

        result = ExportService.export_to_excel(data)

        assert isinstance(result, io.BytesIO)

    def test_get_filename(self):
        """Test filename generation."""
        filename = ExportService.get_filename("transactions", "csv")

        assert filename.startswith("transactions_")
        assert filename.endswith(".csv")


class TestFileService:
    """Test FileService."""

    def test_allowed_file(self, app):
        """Test file extension validation."""
        with app.app_context():
            assert FileService.allowed_file("test.jpg") is True
            assert FileService.allowed_file("test.pdf") is True
            assert FileService.allowed_file("test.exe") is False

    def test_allowed_mimetype(self, app):
        """Test mimetype validation."""
        with app.app_context():
            assert FileService.allowed_mimetype("image/jpeg") is True
            assert FileService.allowed_mimetype("application/pdf") is True
            assert FileService.allowed_mimetype("application/x-msdownload") is False


class TestCacheService:
    """Test CacheService."""

    def test_generate_key(self):
        """Test cache key generation."""
        key = CacheService.generate_key("test", "user:1", "page=1")

        assert key.startswith("test")
        assert "user:1" in key

    def test_generate_key_with_kwargs(self):
        """Test cache key generation with kwargs."""
        key = CacheService.generate_key("test", user_id=1, page=1)

        assert key.startswith("test")
        assert "user_id:1" in key
