"""
Helper utility functions.
"""

import calendar
import hashlib
import html
import re
import secrets
import uuid
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from app.utils.constants import CURRENCY_SYMBOLS, DATE_FORMATS


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


def generate_token(length: int = 32) -> str:
    """
    Generate a secure random token.

    Args:
        length: Token length in bytes (result will be hex string of double length)

    Returns:
        Secure random token as hex string
    """
    return secrets.token_hex(length)


def hash_string(text: str, algorithm: str = "sha256") -> str:
    """
    Hash a string using specified algorithm.

    Args:
        text: Text to hash
        algorithm: Hashing algorithm (sha256, md5, etc.)

    Returns:
        Hashed string
    """
    if algorithm == "sha256":
        return hashlib.sha256(text.encode()).hexdigest()
    elif algorithm == "md5":
        return hashlib.md5(text.encode()).hexdigest()
    elif algorithm == "sha1":
        return hashlib.sha1(text.encode()).hexdigest()
    else:
        raise ValueError(f"Unsupported hash algorithm: {algorithm}")


def validate_email(email: str) -> bool:
    """
    Validate email format (simple validation).

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    if not email or not isinstance(email, str):
        return False

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def format_currency(
    amount: float, currency: str = "USD", include_symbol: bool = True
) -> str:
    """
    Format amount as currency.

    Args:
        amount: Amount to format
        currency: Currency code
        include_symbol: Whether to include currency symbol

    Returns:
        Formatted currency string
    """
    symbol = CURRENCY_SYMBOLS.get(currency, "$") if include_symbol else ""

    if amount >= 0:
        formatted = f"{symbol}{amount:,.2f}"
    else:
        formatted = f"-{symbol}{abs(amount):,.2f}"

    return formatted


def parse_date(date_str: str, formats: List[str] = None) -> Optional[date]:
    """
    Parse date string with multiple formats.

    Args:
        date_str: Date string to parse
        formats: List of date formats to try

    Returns:
        Parsed date or None
    """
    if not date_str:
        return None

    if formats is None:
        formats = DATE_FORMATS

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except (ValueError, TypeError):
            continue

    return None


def format_date(date_obj, format="%Y-%m-%d"):
    """
    Format a date object to string.

    Args:
        date_obj: Date object or string
        format: Output format

    Returns:
        Formatted date string or None
    """
    if not date_obj:
        return None

    if isinstance(date_obj, str):
        date_obj = parse_date(date_obj)
        if not date_obj:
            return None

    if isinstance(date_obj, (date, datetime)):
        return date_obj.strftime(format)

    return None


def get_date_range(
    range_type: str, reference_date: date = None
) -> Dict[str, Optional[date]]:
    """
    Get start and end dates for common date ranges.

    Args:
        range_type: Type of date range (from DateRange enum)
        reference_date: Reference date (default: today)

    Returns:
        Dict with start and end dates
    """
    if reference_date is None:
        reference_date = date.today()

    ranges = {
        "today": {"start": reference_date, "end": reference_date},
        "yesterday": {
            "start": reference_date - timedelta(days=1),
            "end": reference_date - timedelta(days=1),
        },
        "this_week": {
            "start": reference_date - timedelta(days=reference_date.weekday()),
            "end": reference_date + timedelta(days=6 - reference_date.weekday()),
        },
        "last_week": {
            "start": reference_date - timedelta(days=reference_date.weekday() + 7),
            "end": reference_date - timedelta(days=reference_date.weekday() + 1),
        },
        "this_month": {
            "start": date(reference_date.year, reference_date.month, 1),
            "end": date(
                reference_date.year,
                reference_date.month,
                calendar.monthrange(reference_date.year, reference_date.month)[1],
            ),
        },
        "last_month": {
            "start": (
                date(reference_date.year, reference_date.month - 1, 1)
                if reference_date.month > 1
                else date(reference_date.year - 1, 12, 1)
            ),
            "end": date(reference_date.year, reference_date.month, 1)
            - timedelta(days=1),
        },
        "this_quarter": {
            "start": date(
                reference_date.year, ((reference_date.month - 1) // 3) * 3 + 1, 1
            ),
            "end": date(
                reference_date.year,
                ((reference_date.month - 1) // 3 + 1) * 3,
                calendar.monthrange(
                    reference_date.year, ((reference_date.month - 1) // 3 + 1) * 3
                )[1],
            ),
        },
        "last_quarter": {
            "start": (
                date(reference_date.year, ((reference_date.month - 1) // 3) * 3 - 2, 1)
                if reference_date.month > 3
                else date(reference_date.year - 1, 10, 1)
            ),
            "end": date(
                reference_date.year, ((reference_date.month - 1) // 3) * 3 + 1, 1
            )
            - timedelta(days=1),
        },
        "this_year": {
            "start": date(reference_date.year, 1, 1),
            "end": date(reference_date.year, 12, 31),
        },
        "last_year": {
            "start": date(reference_date.year - 1, 1, 1),
            "end": date(reference_date.year - 1, 12, 31),
        },
        "last_30_days": {
            "start": reference_date - timedelta(days=30),
            "end": reference_date,
        },
        "last_90_days": {
            "start": reference_date - timedelta(days=90),
            "end": reference_date,
        },
        "last_12_months": {
            "start": date(reference_date.year - 1, reference_date.month, 1),
            "end": reference_date,
        },
        "custom": {"start": None, "end": None},
    }

    return ranges.get(range_type, {"start": None, "end": None})


def paginate_query(query, page: int = 1, per_page: int = 20):
    """
    Paginate a SQLAlchemy query.

    Args:
        query: SQLAlchemy query object
        page: Page number
        per_page: Items per page

    Returns:
        Dict with paginated results and metadata
    """
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "items": paginated.items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": paginated.total,
            "pages": paginated.pages,
            "has_next": paginated.has_next,
            "has_prev": paginated.has_prev,
            "next_page": page + 1 if paginated.has_next else None,
            "prev_page": page - 1 if paginated.has_prev else None,
        },
    }


def dict_to_camel_case(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert dictionary keys from snake_case to camelCase.

    Args:
        data: Dictionary with snake_case keys

    Returns:
        Dictionary with camelCase keys
    """

    def to_camel(snake_str):
        components = snake_str.split("_")
        return components[0] + "".join(x.title() for x in components[1:])

    return {to_camel(k): v for k, v in data.items()}


def dict_to_snake_case(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert dictionary keys from camelCase to snake_case.

    Args:
        data: Dictionary with camelCase keys

    Returns:
        Dictionary with snake_case keys
    """

    def to_snake(camel_str):
        return re.sub(r"(?<!^)(?=[A-Z])", "_", camel_str).lower()

    if isinstance(data, dict):
        return {to_snake(k): v for k, v in data.items()}
    return data


def safe_divide(numerator: float, denominator: float, default: float = 0) -> float:
    """
    Safely divide two numbers, handling division by zero.

    Args:
        numerator: Numerator
        denominator: Denominator
        default: Default value if denominator is zero

    Returns:
        Division result or default
    """
    if denominator == 0:
        return default
    return numerator / denominator


def truncate_string(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate a string to maximum length.

    Args:
        text: String to truncate
        max_length: Maximum length
        suffix: Suffix to add when truncated

    Returns:
        Truncated string
    """
    if not text:
        return text

    if len(text) <= max_length:
        return text

    return text[: max_length - len(suffix)] + suffix


def sanitize_html(html_string: str) -> str:
    """
    Sanitize HTML string to prevent XSS.

    Args:
        html_string: HTML string to sanitize

    Returns:
        Sanitized HTML
    """
    if not html_string:
        return html_string

    return html.escape(html_string)


def extract_domain(url):
    """
    Extract domain from URL.

    Args:
        url: Full URL

    Returns:
        Domain name or None
    """
    try:
        from urllib.parse import urlparse

        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        return domain.replace("www.", "")
    except Exception:
        return None


def group_by(items, key_func):
    """
    Group a list of items by a key function.

    Args:
        items: List of items
        key_func: Function to extract key from item

    Returns:
        Dictionary with keys and grouped items
    """
    result = {}
    for item in items:
        key = key_func(item)
        if key not in result:
            result[key] = []
        result[key].append(item)
    return result


def chunks(lst, chunk_size):
    """
    Split a list into chunks of specified size.

    Args:
        lst: List to split
        chunk_size: Size of each chunk

    Returns:
        List of chunks
    """
    return [lst[i: i + chunk_size] for i in range(0, len(lst), chunk_size)]


def deep_get(dictionary, path, default=None):
    """
    Safely get a nested dictionary value using dot notation.

    Args:
        dictionary: Nested dictionary
        path: Dot-separated path (e.g., 'user.profile.name')
        default: Default value if path doesn't exist

    Returns:
        Value at path or default
    """
    keys = path.split(".")
    value = dictionary

    for key in keys:
        if isinstance(value, dict):
            value = value.get(key)
            if value is None:
                return default
        else:
            return default

    return value
