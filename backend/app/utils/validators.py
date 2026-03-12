"""
Custom validators for request data and business logic validation.
"""

import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import phonenumbers
from email_validator import EmailNotValidError
from email_validator import validate_email as validate_email_lib

from app.utils.constants import (
    ALLOWED_EXTENSIONS,
    DATE_FORMATS,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
)


def validate_required(value: Any, field_name: str) -> Optional[str]:
    """
    Validate that a required field is present and not empty.

    Args:
        value: Field value
        field_name: Name of the field

    Returns:
        Error message if invalid, None if valid
    """
    if value is None:
        return f"{field_name} is required"

    if isinstance(value, str) and not value.strip():
        return f"{field_name} cannot be empty"

    if isinstance(value, (list, dict)) and len(value) == 0:
        return f"{field_name} cannot be empty"

    return None


def validate_string_length(
    value: str, field_name: str, min_len: int = None, max_len: int = None
) -> Optional[str]:
    """
    Validate string length.

    Args:
        value: String to validate
        field_name: Name of the field
        min_len: Minimum length
        max_len: Maximum length

    Returns:
        Error message if invalid, None if valid
    """
    if value is None:
        return None

    if not isinstance(value, str):
        return f"{field_name} must be a string"

    if min_len is not None and len(value) < min_len:
        return f"{field_name} must be at least {min_len} characters"

    if max_len is not None and len(value) > max_len:
        return f"{field_name} must be at most {max_len} characters"

    return None


def validate_numeric_range(
    value: Union[int, float],
    field_name: str,
    min_val: Union[int, float] = None,
    max_val: Union[int, float] = None,
) -> Optional[str]:
    """
    Validate numeric range.

    Args:
        value: Number to validate
        field_name: Name of the field
        min_val: Minimum value
        max_val: Maximum value

    Returns:
        Error message if invalid, None if valid
    """
    if value is None:
        return None

    if not isinstance(value, (int, float)):
        return f"{field_name} must be a number"

    if min_val is not None and value < min_val:
        return f"{field_name} must be at least {min_val}"

    if max_val is not None and value > max_val:
        return f"{field_name} must be at most {max_val}"

    return None


def validate_email_format(email: str) -> Optional[str]:
    """
    Validate email format using email-validator library.

    Args:
        email: Email to validate

    Returns:
        Error message if invalid, None if valid
    """
    if not email:
        return None

    try:
        validate_email_lib(email)
        return None
    except EmailNotValidError as e:
        return str(e)


def validate_date_format(date_str: str, formats: List[str] = None) -> Optional[str]:
    """
    Validate date string format.

    Args:
        date_str: Date string to validate
        formats: List of acceptable formats

    Returns:
        Error message if invalid, None if valid
    """
    if not date_str:
        return None

    if formats is None:
        formats = DATE_FORMATS

    for fmt in formats:
        try:
            datetime.strptime(date_str, fmt)
            return None
        except ValueError:
            continue

    return f"Invalid date format. Expected one of: {', '.join(formats)}"


def validate_enum_value(
    value: str, allowed_values: List[str], field_name: str
) -> Optional[str]:
    """
    Validate enum value.

    Args:
        value: Value to validate
        allowed_values: List of allowed values
        field_name: Name of the field

    Returns:
        Error message if invalid, None if valid
    """
    if value is None:
        return None

    if value not in allowed_values:
        return f"{field_name} must be one of: {', '.join(allowed_values)}"

    return None


def validate_uuid(uuid_str: str) -> Optional[str]:
    """
    Validate UUID format.

    Args:
        uuid_str: UUID string to validate

    Returns:
        Error message if invalid, None if valid
    """
    if not uuid_str:
        return None

    pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    if not re.match(pattern, uuid_str.lower()):
        return "Invalid UUID format"

    return None


def validate_hex_color(color: str) -> Optional[str]:
    """
    Validate hex color code.

    Args:
        color: Hex color code (e.g., #FF0000)

    Returns:
        Error message if invalid, None if valid
    """
    if not color:
        return None

    pattern = r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
    if not re.match(pattern, color):
        return "Invalid hex color format. Expected format: #RRGGBB or #RGB"

    return None


def validate_phone_number(phone: str, country: str = "US") -> Optional[str]:
    """
    Validate phone number using phonenumbers library.

    Args:
        phone: Phone number to validate
        country: Country code

    Returns:
        Error message if invalid, None if valid
    """
    if not phone:
        return None

    try:
        parsed = phonenumbers.parse(phone, country)
        if not phonenumbers.is_valid_number(parsed):
            return "Invalid phone number"
        return None
    except phonenumbers.NumberParseException as e:
        return str(e)


def validate_password_strength(password: str) -> List[str]:
    """
    Validate password strength and return list of issues.

    Args:
        password: Password to validate

    Returns:
        List of validation issues (empty if strong)
    """
    issues = []

    if not password:
        issues.append("Password is required")
        return issues

    if len(password) < PASSWORD_MIN_LENGTH:
        issues.append(f"At least {PASSWORD_MIN_LENGTH} characters long")

    if not re.search(r"[A-Z]", password):
        issues.append("Contains uppercase letter")

    if not re.search(r"[a-z]", password):
        issues.append("Contains lowercase letter")

    if not re.search(r"\d", password):
        issues.append("Contains number")

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Contains special character")

    return issues


def validate_username(username):
    """
    Validate username format.

    Args:
        username: Username to validate

    Returns:
        List of validation issues (empty if valid)
    """
    issues = []

    if not username:
        issues.append("Username is required")
        return issues

    if len(username) < USERNAME_MIN_LENGTH:
        issues.append(f"Username must be at least {USERNAME_MIN_LENGTH} characters")

    if len(username) > USERNAME_MAX_LENGTH:
        issues.append(f"Username must be at most {USERNAME_MAX_LENGTH} characters")

    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        issues.append("Username can only contain letters, numbers, and underscores")

    return issues


def validate_file_extension(filename):
    """
    Validate file extension.

    Args:
        filename: Name of the file

    Returns:
        Error message if invalid, None if valid
    """
    if not filename:
        return None

    if "." not in filename:
        return "File must have an extension"

    ext = filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(ALLOWED_EXTENSIONS)
        return f"File extension not allowed. Allowed: {allowed}"

    return None


def validate_json_schema(data: Dict, schema: Dict) -> List[str]:
    """
    Validate data against JSON schema (simplified version).

    Args:
        data: Data to validate
        schema: JSON schema

    Returns:
        List of validation errors (empty if valid)
    """
    errors = []

    for field, rules in schema.items():
        value = data.get(field)

        # Check required
        if rules.get("required", False):
            error = validate_required(value, field)
            if error:
                errors.append(error)
                continue

        if value is None:
            continue

        # Check type
        expected_type = rules.get("type")
        if expected_type:
            type_valid = True
            if expected_type == "string" and not isinstance(value, str):
                type_valid = False
            elif expected_type == "number" and not isinstance(value, (int, float)):
                type_valid = False
            elif expected_type == "integer" and not isinstance(value, int):
                type_valid = False
            elif expected_type == "boolean" and not isinstance(value, bool):
                type_valid = False
            elif expected_type == "array" and not isinstance(value, list):
                type_valid = False
            elif expected_type == "object" and not isinstance(value, dict):
                type_valid = False

            if not type_valid:
                errors.append(f"{field} must be a {expected_type}")
                continue

        # Check pattern (for strings)
        pattern = rules.get("pattern")
        if pattern and isinstance(value, str):
            if not re.match(pattern, value):
                errors.append(f"{field} format is invalid")

        # Check range (for numbers)
        min_val = rules.get("min")
        max_val = rules.get("max")
        if isinstance(value, (int, float)):
            if min_val is not None and value < min_val:
                errors.append(f"{field} must be at least {min_val}")
            if max_val is not None and value > max_val:
                errors.append(f"{field} must be at most {max_val}")

        # Check length (for strings)
        min_len = rules.get("minLength")
        max_len = rules.get("maxLength")
        if isinstance(value, str):
            if min_len is not None and len(value) < min_len:
                errors.append(f"{field} must be at least {min_len} characters")
            if max_len is not None and len(value) > max_len:
                errors.append(f"{field} must be at most {max_len} characters")

        # Check enum
        enum_values = rules.get("enum")
        if enum_values and value not in enum_values:
            errors.append(f"{field} must be one of: {', '.join(map(str, enum_values))}")

    return errors


def validate_amount(amount, min_amount=0.01, max_amount=1000000):
    """
    Validate monetary amount.

    Args:
        amount: Amount to validate
        min_amount: Minimum allowed amount
        max_amount: Maximum allowed amount

    Returns:
        Error message if invalid, None if valid
    """
    if amount is None:
        return "Amount is required"

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return "Amount must be a number"

    if amount < min_amount:
        return f"Amount must be at least {min_amount}"

    if amount > max_amount:
        return f"Amount cannot exceed {max_amount}"

    # Check for reasonable decimal places
    if round(amount, 2) != amount:
        return "Amount can have at most 2 decimal places"

    return None


def validate_date_range(start_date, end_date, max_days=None):
    """
    Validate date range.

    Args:
        start_date: Start date
        end_date: End date
        max_days: Maximum allowed days in range

    Returns:
        Error message if invalid, None if valid
    """
    if not start_date or not end_date:
        return None

    if start_date > end_date:
        return "Start date must be before end date"

    if max_days:
        days_diff = (end_date - start_date).days
        if days_diff > max_days:
            return f"Date range cannot exceed {max_days} days"

    return None


def validate_id(id_value, field_name="ID"):
    """
    Validate ID field (positive integer).

    Args:
        id_value: ID value to validate
        field_name: Name of the ID field

    Returns:
        Error message if invalid, None if valid
    """
    if id_value is None:
        return f"{field_name} is required"

    try:
        id_int = int(id_value)
        if id_int <= 0:
            return f"{field_name} must be a positive integer"
    except (TypeError, ValueError):
        return f"{field_name} must be an integer"

    return None
