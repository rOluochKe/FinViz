"""
Budget model for spending limits by category.
"""

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Index, text

from app.extensions import db


class Budget(db.Model):
    """
    Budget model for spending limits.
    """

    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)

    # Foreign keys
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Budget data
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    period = db.Column(db.String(20), default="monthly", nullable=False)
    month = db.Column(db.Integer)  # 1-12
    year = db.Column(db.Integer, nullable=False)

    # Settings
    alert_threshold = db.Column(db.Numeric(5, 2), default=80.00)  # Percentage
    is_active = db.Column(db.Boolean, default=True)
    rollover = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships - use back_populates
    category = db.relationship("Category", back_populates="budgets", lazy="joined")

    # Indexes and constraints
    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "category_id",
            "period",
            "month",
            "year",
            name="uq_budget_user_category_period",
        ),
        Index("idx_budget_active", "is_active"),
        Index("idx_budget_date", "year", "month"),
        Index("idx_budget_period", "period"),
        CheckConstraint("amount > 0", name="check_budget_amount_positive"),
        CheckConstraint(
            "period IN ('monthly', 'quarterly', 'yearly')", name="check_valid_period"
        ),
        CheckConstraint(
            "month BETWEEN 1 AND 12 OR month IS NULL", name="check_valid_month"
        ),
        CheckConstraint(
            "alert_threshold BETWEEN 0 AND 100", name="check_valid_threshold"
        ),
    )

    @property
    def spent(self):
        """Get amount spent in this budget period."""
        query = """
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions
            WHERE user_id = :user_id
                AND category_id = :cat_id
                AND type = 'expense'
        """

        params = {"user_id": self.user_id, "cat_id": self.category_id}

        if self.period == "monthly":
            query += " AND EXTRACT(YEAR FROM date) = :year AND EXTRACT(MONTH FROM date) = :month"
            params["year"] = self.year
            params["month"] = self.month
        elif self.period == "quarterly" and self.month:
            start_month = (self.month - 1) * 3 + 1
            end_month = start_month + 2
            query += """ AND EXTRACT(YEAR FROM date) = :year 
                         AND EXTRACT(MONTH FROM date) BETWEEN :start_month AND :end_month"""
            params["start_month"] = start_month
            params["end_month"] = end_month
        else:  # yearly
            query += " AND EXTRACT(YEAR FROM date) = :year"
            params["year"] = self.year

        result = db.session.execute(text(query), params).scalar()
        return float(result or 0)

    @property
    def remaining(self):
        """Get remaining budget amount."""
        return float(self.amount) - self.spent

    @property
    def spent_percentage(self):
        """Get percentage of budget spent."""
        if self.amount and self.amount > 0:
            return (self.spent / float(self.amount)) * 100
        return 0

    @property
    def is_over_budget(self):
        """Check if over budget."""
        return self.spent > float(self.amount)

    @property
    def should_alert(self):
        """Check if should trigger alert."""
        return self.spent_percentage >= float(self.alert_threshold)

    def get_projection(self):
        """
        Get spending projection based on trends.

        Returns:
            dict: Projection data
        """
        from datetime import timedelta

        today = date.today()

        # Calculate days in period
        if self.period == "monthly":
            if not self.month:
                return None
            if self.month in [4, 6, 9, 11]:
                days_in_period = 30
            elif self.month == 2:
                if self.year % 4 == 0 and (
                    self.year % 100 != 0 or self.year % 400 == 0
                ):
                    days_in_period = 29
                else:
                    days_in_period = 28
            else:
                days_in_period = 31

            period_start = date(self.year, self.month, 1)
            days_passed = (today - period_start).days + 1
            days_remaining = days_in_period - days_passed

        elif self.period == "quarterly":
            if not self.month:
                return None
            days_in_period = 91
            start_month = (self.month - 1) * 3 + 1
            period_start = date(self.year, start_month, 1)
            days_passed = (today - period_start).days + 1
            days_remaining = days_in_period - days_passed

        else:  # yearly
            days_in_period = 366 if self.year % 4 == 0 else 365
            period_start = date(self.year, 1, 1)
            days_passed = (today - period_start).days + 1
            days_remaining = days_in_period - days_passed

        if days_passed <= 0:
            days_passed = 1

        avg_daily = self.spent / days_passed
        projected = self.spent + (avg_daily * max(days_remaining, 0))

        # Get recent transaction count for confidence
        thirty_days_ago = today - timedelta(days=30)
        result = db.session.execute(
            text("""
                SELECT COUNT(*) 
                FROM transactions 
                WHERE user_id = :user_id 
                    AND category_id = :cat_id 
                    AND type = 'expense'
                    AND date >= :cutoff
            """),
            {
                "user_id": self.user_id,
                "cat_id": self.category_id,
                "cutoff": thirty_days_ago,
            },
        ).scalar()

        recent_count = result or 0
        confidence = min((recent_count / 10) * 100, 100) if recent_count > 0 else 50

        return {
            "projected_spend": projected,
            "remaining_budget": float(self.amount) - projected,
            "will_exceed": projected > float(self.amount),
            "excess_amount": max(projected - float(self.amount), 0),
            "confidence": confidence,
            "days_remaining": max(days_remaining, 0),
            "avg_daily_spend": avg_daily,
        }

    def to_dict(self, include_stats=True):
        """
        Convert budget to dictionary.

        Args:
            include_stats: Include spending statistics

        Returns:
            dict: Budget data
        """
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "amount": float(self.amount),
            "period": self.period,
            "month": self.month,
            "year": self.year,
            "alert_threshold": float(self.alert_threshold),
            "is_active": self.is_active,
            "rollover": self.rollover,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_stats:
            spent = self.spent
            data.update(
                {
                    "spent": spent,
                    "remaining": self.remaining,
                    "spent_percentage": self.spent_percentage,
                    "is_over_budget": self.is_over_budget,
                    "should_alert": self.should_alert,
                    "projection": self.get_projection() if self.is_active else None,
                }
            )

        if self.category:
            data["category_name"] = self.category.name
            data["category_color"] = self.category.color

        return data

    def __repr__(self):
        return f"<Budget {self.id}: {self.category_id} ${self.amount}>"
