"""
Analytics schemas for data validation and serialization.
"""

from marshmallow import Schema, ValidationError, fields, pre_load, validate


class TimeSeriesSchema(Schema):
    """Schema for time series data points."""

    period = fields.String(required=True)
    date = fields.Date(format="%Y-%m-%d")
    income = fields.Float(required=True)
    expense = fields.Float(required=True)
    net = fields.Float(required=True)
    count = fields.Integer(required=True)
    income_ma3 = fields.Float(allow_none=True)  # 3-period moving average
    expense_ma3 = fields.Float(allow_none=True)
    net_ma3 = fields.Float(allow_none=True)
    income_trend = fields.String(allow_none=True)
    expense_trend = fields.String(allow_none=True)

    class Meta:
        ordered = True


class CategoryBreakdownItemSchema(Schema):
    """Schema for category breakdown items."""

    category_id = fields.Integer(required=True)
    category_name = fields.String(required=True)
    color = fields.String(required=True)
    icon = fields.String(allow_none=True)
    amount = fields.Float(required=True)
    count = fields.Integer(required=True)
    percentage = fields.Float(required=True)
    previous_amount = fields.Float(allow_none=True)
    trend = fields.Float(allow_none=True)
    is_increasing = fields.Boolean(allow_none=True)
    average_transaction = fields.Float(allow_none=True)


class CategoryBreakdownSchema(Schema):
    """Schema for category breakdown."""

    period = fields.Dict(required=True)
    type = fields.String(required=True)
    total_amount = fields.Float(required=True)
    total_transactions = fields.Integer(required=True)
    category_count = fields.Integer(required=True)
    breakdown = fields.List(fields.Nested(CategoryBreakdownItemSchema))


class KPISchema(Schema):
    """Schema for KPI metrics."""

    total_income = fields.Float()
    total_expense = fields.Float()
    net_savings = fields.Float()
    savings_rate = fields.Float()
    transaction_count = fields.Integer()
    average_daily_expense = fields.Float()
    average_transaction_value = fields.Float()


class TrendSchema(Schema):
    """Schema for trend analysis."""

    income_trend = fields.Float()
    expense_trend = fields.Float()
    savings_trend = fields.Float()
    is_income_up = fields.Boolean()
    is_expense_down = fields.Boolean()
    is_savings_up = fields.Boolean()


class DashboardSummarySchema(Schema):
    """Schema for dashboard summary."""

    period = fields.String(required=True)
    date_range = fields.Dict(required=True)
    kpis = fields.Nested(KPISchema, required=True)
    trends = fields.Nested(TrendSchema, required=True)
    category_breakdown = fields.List(fields.Nested(CategoryBreakdownItemSchema))
    time_series = fields.List(fields.Nested(TimeSeriesSchema))
    budget_status = fields.List(fields.Dict)
    top_categories = fields.List(fields.Dict)
    insights = fields.List(fields.Dict, allow_none=True)


class MonthlyStatsSchema(Schema):
    """Schema for monthly statistics."""

    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(required=True)
    year = fields.Integer(required=True, validate=validate.Range(min=2000, max=2100))
    month = fields.Integer(required=True, validate=validate.Range(min=1, max=12))
    month_name = fields.String(dump_only=True)
    total_income = fields.Float(required=True)
    total_expense = fields.Float(required=True)
    net_savings = fields.Float(allow_none=True)
    savings_rate = fields.Float(allow_none=True)
    transaction_count = fields.Integer(required=True)
    average_transaction = fields.Float(required=True)
    top_categories = fields.List(fields.Dict)
    category_breakdown = fields.List(fields.Dict)
    best_day = fields.Date(allow_none=True, format="%Y-%m-%d")
    worst_day = fields.Date(allow_none=True, format="%Y-%m-%d")
    created_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")
    updated_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")


class AnalyticsFilterSchema(Schema):
    """Schema for analytics query filters."""

    start_date = fields.Date(required=False, format="%Y-%m-%d")
    end_date = fields.Date(required=False, format="%Y-%m-%d")
    group_by = fields.String(
        validate=validate.OneOf(["day", "week", "month", "quarter", "year"]),
        missing="month",
    )
    type = fields.String(
        validate=validate.OneOf(["income", "expense", "all"]), missing="all"
    )
    categories = fields.List(fields.Integer(), missing=[])

    @pre_load
    def validate_dates(self, data, **kwargs):
        """Validate date range."""
        if data.get("start_date") and data.get("end_date"):
            if data["start_date"] > data["end_date"]:
                raise ValidationError("start_date must be before end_date")
        return data


class ForecastPeriodSchema(Schema):
    """Schema for forecast period."""

    year = fields.Integer()
    month = fields.Integer()
    period = fields.String()
    forecast_income = fields.Float()
    forecast_expense = fields.Float()
    forecast_net = fields.Float()
    confidence_lower = fields.Float(allow_none=True)
    confidence_upper = fields.Float(allow_none=True)


class ConfidenceSchema(Schema):
    """Schema for forecast confidence."""

    score = fields.Float()
    income_interval = fields.Float()
    expense_interval = fields.Float()
    interpretation = fields.String()


class ForecastSchema(Schema):
    """Schema for forecast data."""

    method = fields.String(required=True)
    historical_period = fields.Dict(required=True)
    forecast_periods = fields.List(fields.Nested(ForecastPeriodSchema), required=True)
    confidence = fields.Nested(ConfidenceSchema, required=True)
    statistics = fields.Dict(required=True)


class InsightSchema(Schema):
    """Schema for financial insights."""

    type = fields.String(
        validate=validate.OneOf(["positive", "warning", "critical", "info"])
    )
    category = fields.String()
    title = fields.String()
    description = fields.String()
    action = fields.String()
    generated_at = fields.DateTime(format="%Y-%m-%d %H:%M:%S")


class AnomalySchema(Schema):
    """Schema for anomaly detection."""

    transaction_id = fields.Integer(allow_none=True)
    date = fields.String()
    amount = fields.Float()
    description = fields.String()
    category = fields.String()
    z_score = fields.Float()
    type = fields.String()
    reason = fields.String()


class CashFlowSchema(Schema):
    """Schema for cash flow analysis."""

    period = fields.Dict()
    summary = fields.Dict()
    daily_flow = fields.Dict()
    balance_history = fields.List(fields.Dict)
    statistics = fields.Dict()


class NetWorthSchema(Schema):
    """Schema for net worth tracking."""

    current_net_worth = fields.Float()
    history = fields.List(fields.Dict)
    change = fields.Dict()


class ProjectionSchema(Schema):
    """Schema for budget projections."""

    projected_spend = fields.Float()
    remaining_budget = fields.Float()
    will_exceed = fields.Boolean()
    excess_amount = fields.Float()
    confidence = fields.Float()
    days_remaining = fields.Integer()
    avg_daily_spend = fields.Float()
