"""
Budget schemas for serialization and validation.
"""

from datetime import datetime

from marshmallow import Schema, ValidationError, fields, post_load, pre_load, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from app.models.budget import Budget
from app.utils.constants import BudgetPeriod


class BudgetSchema(SQLAlchemyAutoSchema):
    """Schema for budget serialization."""

    class Meta:
        model = Budget
        load_instance = True
        include_fk = True

    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(load_only=True)
    category_id = fields.Integer(required=True, validate=validate.Range(min=1))
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    period = fields.String(
        required=True,
        validate=validate.OneOf(BudgetPeriod.choices()),
    )
    month = fields.Integer(allow_none=True, validate=validate.Range(min=1, max=12))
    year = fields.Integer(required=True, validate=validate.Range(min=2000, max=2100))
    alert_threshold = fields.Float(
        validate=validate.Range(min=0, max=100), load_default=80.0
    )
    is_active = fields.Boolean(load_default=True)
    rollover = fields.Boolean(load_default=False)
    notes = fields.String(allow_none=True, validate=validate.Length(max=500))
    created_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")
    updated_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")

    # Computed fields
    spent = fields.Float(dump_only=True)
    remaining = fields.Float(dump_only=True)
    spent_percentage = fields.Float(dump_only=True)
    is_over_budget = fields.Boolean(dump_only=True)
    should_alert = fields.Boolean(dump_only=True)
    category_name = fields.String(dump_only=True)
    category_color = fields.String(dump_only=True)
    projection = fields.Dict(dump_only=True, allow_none=True)

    @pre_load
    def validate_month_for_period(self, data, **kwargs):
        """Validate month field based on period."""
        period = data.get("period", "monthly")
        month = data.get("month")

        if period == "monthly" and not month:
            raise ValidationError("Month is required for monthly budgets", "month")

        if period == "yearly" and month:
            data["month"] = None  # Clear month for yearly budgets

        return data


class BudgetCreateSchema(Schema):
    """Schema for budget creation."""

    category_id = fields.Integer(required=True, validate=validate.Range(min=1))
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    period = fields.String(
        required=True,
        validate=validate.OneOf(BudgetPeriod.choices()),
    )
    month = fields.Integer(allow_none=True, validate=validate.Range(min=1, max=12))
    year = fields.Integer(required=True, validate=validate.Range(min=2000, max=2100))
    alert_threshold = fields.Float(
        validate=validate.Range(min=0, max=100),
        load_default=80.0,  # ✅ OK - not required
    )
    is_active = fields.Boolean(load_default=True)
    rollover = fields.Boolean(load_default=False)
    notes = fields.String(allow_none=True, validate=validate.Length(max=500))

    @pre_load
    def validate_month_for_period(self, data, **kwargs):
        """Validate month field based on period."""
        period = data.get("period", "monthly")
        month = data.get("month")

        if period == "monthly" and not month:
            # Default to current month if not provided
            data["month"] = datetime.now().month

        if period == "yearly" and month:
            data["month"] = None  # Clear month for yearly budgets

        return data

    @post_load
    def validate_future_date(self, data, **kwargs):
        """Validate that budget is not for past periods."""
        now = datetime.now()

        if data["year"] < now.year:
            raise ValidationError("Cannot create budget for past years", "year")

        if data["year"] == now.year and data.get("month") and data["month"] < now.month:
            if data["period"] == "monthly":
                raise ValidationError("Cannot create budget for past months", "month")

        return data


class BudgetUpdateSchema(Schema):
    """Schema for budget updates."""

    amount = fields.Float(validate=validate.Range(min=0.01))
    alert_threshold = fields.Float(validate=validate.Range(min=0, max=100))
    is_active = fields.Boolean()
    rollover = fields.Boolean()
    notes = fields.String(allow_none=True, validate=validate.Length(max=500))

    @post_load
    def validate_at_least_one(self, data, **kwargs):
        """Ensure at least one field is provided."""
        if not data:
            raise ValidationError("At least one field must be provided")
        return data


class BudgetFilterSchema(Schema):
    """Schema for budget filters."""

    year = fields.Integer(required=False, validate=validate.Range(min=2000, max=2100))
    month = fields.Integer(allow_none=True, validate=validate.Range(min=1, max=12))
    category_id = fields.Integer(allow_none=True)
    is_active = fields.Boolean(load_default=True)
    period = fields.String(
        allow_none=True, validate=validate.OneOf(BudgetPeriod.choices())
    )


class BudgetStatusSchema(Schema):
    """Schema for budget status."""

    budget_id = fields.Integer()
    category_id = fields.Integer()
    category_name = fields.String()
    category_color = fields.String()
    budget_amount = fields.Float()
    spent = fields.Float()
    remaining = fields.Float()
    percentage = fields.Float()
    status = fields.String()  # 'good', 'warning', 'over'
    days_remaining = fields.Integer(allow_none=True)


class BudgetStatusOverviewSchema(Schema):
    """Schema for budget status overview."""

    period = fields.Dict()
    summary = fields.Dict()
    category_status = fields.List(fields.Nested(BudgetStatusSchema))
    alerts = fields.Dict()


class BudgetSuggestionSchema(Schema):
    """Schema for budget suggestions."""

    category_id = fields.Integer()
    category_name = fields.String()
    category_color = fields.String()
    current_avg_monthly = fields.Float()
    suggested_budget = fields.Float()
    confidence = fields.String()  # 'high', 'medium', 'low'
    transaction_count_90d = fields.Integer()
    variability = fields.Float()
    is_consistent = fields.Boolean()
    notes = fields.String()


class BudgetProgressSchema(Schema):
    """Schema for budget progress."""

    budget = fields.Nested(BudgetSchema)
    period = fields.Dict()
    daily_progress = fields.List(fields.Dict)
    projections = fields.Dict()
