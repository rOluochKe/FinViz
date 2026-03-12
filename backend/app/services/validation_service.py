"""
Validation service for complex validation logic.
"""

from datetime import datetime
from typing import Dict, List

from app.models.category import Category
from app.models.user import User
from app.utils.validators import (
    validate_amount,
    validate_email_format,
    validate_password_strength,
    validate_username,
)


class ValidationService:
    """Service for complex validation operations."""

    @staticmethod
    def validate_user_registration(data: Dict) -> List[str]:
        """
        Validate user registration data.

        Args:
            data: Registration data

        Returns:
            List of validation errors
        """
        errors = []

        # Username
        username_issues = validate_username(data.get("username", ""))
        if username_issues:
            errors.extend(username_issues)
        elif User.query.filter_by(username=data["username"]).first():
            errors.append("Username already taken")

        # Email
        email_error = validate_email_format(data.get("email", ""))
        if email_error:
            errors.append(email_error)
        elif User.query.filter_by(email=data["email"]).first():
            errors.append("Email already registered")

        # Password
        password_issues = validate_password_strength(data.get("password", ""))
        if password_issues:
            errors.extend(password_issues)

        return errors

    @staticmethod
    def validate_transaction(data: Dict, user_id: int) -> List[str]:
        """
        Validate transaction data.

        Args:
            data: Transaction data
            user_id: User ID

        Returns:
            List of validation errors
        """
        errors = []

        # Required fields
        required = ["amount", "description", "date", "type", "category_id"]
        for field in required:
            if field not in data:
                errors.append(f"Missing required field: {field}")

        if errors:
            return errors

        # Amount
        amount_error = validate_amount(data["amount"])
        if amount_error:
            errors.append(amount_error)

        # Date
        try:
            if isinstance(data["date"], str):
                datetime.strptime(data["date"], "%Y-%m-%d")
        except BaseException:
            errors.append("Invalid date format (use YYYY-MM-DD)")

        # Type
        valid_types = ["income", "expense", "transfer"]
        if data["type"] not in valid_types:
            errors.append(f"Type must be one of: {', '.join(valid_types)}")

        # Category
        category = Category.query.filter_by(
            id=data["category_id"], user_id=user_id
        ).first()

        if not category:
            errors.append("Category not found")
        elif category.type != data["type"]:
            errors.append(f"Category type must be {data['type']}")

        return errors

    @staticmethod
    def validate_budget(data: Dict, user_id: int) -> List[str]:
        """
        Validate budget data.

        Args:
            data: Budget data
            user_id: User ID

        Returns:
            List of validation errors
        """
        errors = []

        # Required fields
        required = ["category_id", "amount", "period", "year"]
        for field in required:
            if field not in data:
                errors.append(f"Missing required field: {field}")

        if errors:
            return errors

        # Amount
        if data["amount"] <= 0:
            errors.append("Amount must be positive")

        # Period
        valid_periods = ["monthly", "quarterly", "yearly"]
        if data["period"] not in valid_periods:
            errors.append(f"Period must be one of: {', '.join(valid_periods)}")

        # Month for monthly budgets
        if data["period"] == "monthly" and "month" not in data:
            errors.append("Month required for monthly budget")

        # Category
        category = Category.query.filter_by(
            id=data["category_id"], user_id=user_id
        ).first()

        if not category:
            errors.append("Category not found")
        elif category.type != "expense":
            errors.append("Budget can only be created for expense categories")

        return errors
