"""
Transaction schemas for serialization and validation.
"""

from datetime import date, datetime

from marshmallow import Schema, ValidationError, fields, post_load, pre_load, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from app.models.category import Category
from app.models.transaction import Transaction
from app.utils.constants import TransactionType
from app.utils.validators import validate_amount, validate_date_format


class TransactionSchema(SQLAlchemyAutoSchema):
    """Schema for transaction serialization."""

    class Meta:
        model = Transaction
        load_instance = True
        include_fk = True

    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(load_only=True)
    category_id = fields.Integer(required=True, validate=validate.Range(min=1))
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    description = fields.String(required=True, validate=validate.Length(min=1, max=200))
    date = fields.Date(required=True, format="%Y-%m-%d")
    type = fields.String(
        required=True, validate=validate.OneOf(TransactionType.choices())
    )
    notes = fields.String(allow_none=True, validate=validate.Length(max=5000))
    receipt_path = fields.String(allow_none=True)
    tags = fields.List(fields.String(), load_default=list)
    is_recurring = fields.Boolean(load_default=False)
    recurring_frequency = fields.String(
        allow_none=True,
        validate=validate.OneOf(["daily", "weekly", "monthly", "yearly"]),
    )
    recurring_end_date = fields.Date(allow_none=True, format="%Y-%m-%d")
    created_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")
    updated_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")

    # Computed fields
    formatted_amount = fields.String(dump_only=True)
    category_name = fields.String(dump_only=True)
    category_color = fields.String(dump_only=True)

    @pre_load
    def validate_amount_field(self, data, **kwargs):
        """Validate amount."""
        if "amount" in data:
            error = validate_amount(data["amount"])
            if error:
                raise ValidationError(error, "amount")
        return data

    @pre_load
    def validate_date_field(self, data, **kwargs):
        """Validate date format."""
        if "date" in data and isinstance(data["date"], str):
            error = validate_date_format(data["date"])
            if error:
                raise ValidationError(error, "date")
        return data

    @pre_load
    def validate_recurring(self, data, **kwargs):
        """Validate recurring transaction data."""
        if data.get("is_recurring"):
            if not data.get("recurring_frequency"):
                raise ValidationError(
                    "Recurring frequency is required for recurring transactions",
                    "recurring_frequency",
                )

            if data.get("recurring_end_date") and data[
                "recurring_end_date"
            ] <= data.get("date", date.today()):
                raise ValidationError(
                    "Recurring end date must be after the transaction date",
                    "recurring_end_date",
                )

        return data

    @post_load
    def validate_category_type(self, data, **kwargs):
        """Validate that category type matches transaction type."""
        if "category_id" in data and "type" in data:
            category = Category.query.get(data["category_id"])
            if category and category.type != data["type"]:
                raise ValidationError(
                    f"Category type '{category.type}' must match transaction type '{data['type']}'",
                    "type",
                )
        return data


class TransactionCreateSchema(Schema):
    """Schema for transaction creation."""

    category_id = fields.Integer(required=True, validate=validate.Range(min=1))
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    description = fields.String(required=True, validate=validate.Length(min=1, max=200))
    date = fields.Date(required=True)
    type = fields.String(
        required=True, validate=validate.OneOf(TransactionType.choices())
    )
    notes = fields.String(allow_none=True, validate=validate.Length(max=5000))
    tags = fields.List(fields.String(), load_default=list)
    is_recurring = fields.Boolean(load_default=False)
    recurring_frequency = fields.String(
        allow_none=True,
        validate=validate.OneOf(["daily", "weekly", "monthly", "yearly"]),
    )
    recurring_end_date = fields.Date(allow_none=True, format="%Y-%m-%d")

    @pre_load
    def validate_amount_field(self, data, **kwargs):
        """Validate amount."""
        if "amount" in data:
            error = validate_amount(data["amount"])
            if error:
                raise ValidationError(error, "amount")
        return data

    @pre_load
    def validate_date_field(self, data, **kwargs):
        """Validate date format."""
        if "date" in data and isinstance(data["date"], str):
            error = validate_date_format(data["date"])
            if error:
                raise ValidationError(error, "date")
        return data

    @pre_load
    def validate_type_amount(self, data, **kwargs):
        """Validate amount based on type."""
        if data.get("type") in ["income", "expense"] and data.get("amount", 0) <= 0:
            raise ValidationError(
                f"Amount must be positive for {data['type']}", "amount"
            )

        return data

    @post_load
    def set_defaults(self, data, **kwargs):
        """Set default values."""
        if "date" not in data:  # This will handle when date is not provided
            data["date"] = datetime.now().date()

        if "tags" not in data:
            data["tags"] = []

        return data


class TransactionUpdateSchema(Schema):
    """Schema for transaction updates."""

    category_id = fields.Integer(validate=validate.Range(min=1))
    amount = fields.Float(validate=validate.Range(min=0.01))
    description = fields.String(validate=validate.Length(min=1, max=200))
    date = fields.Date(format="%Y-%m-%d")
    notes = fields.String(allow_none=True, validate=validate.Length(max=5000))
    tags = fields.List(fields.String())
    is_recurring = fields.Boolean()
    recurring_frequency = fields.String(
        allow_none=True,
        validate=validate.OneOf(["daily", "weekly", "monthly", "yearly"]),
    )
    recurring_end_date = fields.Date(allow_none=True, format="%Y-%m-%d")

    @pre_load
    def validate_amount_field(self, data, **kwargs):
        """Validate amount."""
        if "amount" in data:
            error = validate_amount(data["amount"])
            if error:
                raise ValidationError(error, "amount")
        return data

    @pre_load
    def validate_date_field(self, data, **kwargs):
        """Validate date format."""
        if "date" in data and isinstance(data["date"], str):
            error = validate_date_format(data["date"])
            if error:
                raise ValidationError(error, "date")
        return data

    @post_load
    def validate_at_least_one(self, data, **kwargs):
        """Ensure at least one field is provided."""
        if not data:
            raise ValidationError("At least one field must be provided")
        return data


class TransactionFilterSchema(Schema):
    """Schema for transaction query filters."""

    start_date = fields.Date(allow_none=True, format="%Y-%m-%d")
    end_date = fields.Date(allow_none=True, format="%Y-%m-%d")
    category_id = fields.Integer(allow_none=True)
    type = fields.String(
        allow_none=True, validate=validate.OneOf(TransactionType.choices())
    )
    search = fields.String(allow_none=True)
    min_amount = fields.Float(allow_none=True, validate=validate.Range(min=0))
    max_amount = fields.Float(allow_none=True, validate=validate.Range(min=0))
    tags = fields.List(fields.String(), allow_none=True)
    is_recurring = fields.Boolean(allow_none=True)

    @pre_load
    def validate_date_range(self, data, **kwargs):
        """Validate date range."""
        if data.get("start_date") and data.get("end_date"):
            if data["start_date"] > data["end_date"]:
                raise ValidationError(
                    "start_date must be before end_date", "date_range"
                )

        if data.get("min_amount") and data.get("max_amount"):
            if data["min_amount"] > data["max_amount"]:
                raise ValidationError(
                    "min_amount must be less than max_amount", "amount_range"
                )

        return data


class BulkTransactionSchema(Schema):
    """Schema for bulk transaction operations."""

    transactions = fields.List(
        fields.Nested(TransactionCreateSchema),
        required=True,
        validate=validate.Length(min=1, max=100),
    )

    @pre_load
    def validate_bulk_size(self, data, **kwargs):
        """Validate bulk size."""
        if len(data.get("transactions", [])) > 100:
            raise ValidationError(
                "Cannot process more than 100 transactions at once", "transactions"
            )

        return data


class TransactionImportSchema(Schema):
    """Schema for transaction import."""

    file_format = fields.String(
        required=True,
        validate=validate.OneOf(["csv", "json", "excel", "bank_statement"]),
    )
    mapping = fields.Dict(required=True)  # Column mapping for CSV
    dry_run = fields.Boolean(load_default=False)
    skip_duplicates = fields.Boolean(load_default=True)

    @pre_load
    def validate_mapping(self, data, **kwargs):
        """Validate mapping has required fields."""
        mapping = data.get("mapping", {})
        required_fields = ["date", "amount", "description"]

        for field in required_fields:
            if field not in mapping:
                raise ValidationError(
                    f"Mapping must include '{field}' field", "mapping"
                )

        return data


class TransactionSummarySchema(Schema):
    """Schema for transaction summary."""

    total_income = fields.Float()
    total_expense = fields.Float()
    net_savings = fields.Float()
    savings_rate = fields.Float()
    transaction_count = fields.Integer()
    period = fields.String()
    start_date = fields.String()
    end_date = fields.String()
    breakdown = fields.List(fields.Dict())


class RecurringTransactionSchema(Schema):
    """Schema for recurring transactions."""

    id = fields.Integer()
    description = fields.String()
    amount = fields.Float()
    type = fields.String()
    category = fields.String()
    frequency = fields.String()
    next_date = fields.String()
    days_until = fields.Integer()
