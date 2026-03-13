"""
Monthly statistics model for pre-aggregated data.
"""

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Index, func, text
from sqlalchemy.dialects.postgresql import JSONB

from app.extensions import db
from app.models.category import Category
from app.models.transaction import Transaction


class MonthlyStat(db.Model):
    """
    Monthly statistics model for pre-aggregated dashboard data.

    Attributes:
        id: Primary key
        user_id: Reference to user
        year: Year
        month: Month (1-12)
        total_income: Total income for month
        total_expense: Total expense for month
        net_savings: Income - Expense
        top_categories: JSONB of top spending categories
        category_breakdown: JSONB of all category spending
        transaction_count: Number of transactions
        average_transaction: Average transaction amount
        best_day: Day with lowest spending
        worst_day: Day with highest spending
        created_at: Timestamp
        updated_at: Timestamp
    """

    __tablename__ = "monthly_stats"

    id = db.Column(db.Integer, primary_key=True)

    # Foreign keys
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Time period
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)  # 1-12

    # Aggregated financial data
    total_income = db.Column(db.Numeric(12, 2), default=0)
    total_expense = db.Column(db.Numeric(12, 2), default=0)
    net_savings = db.Column(db.Numeric(12, 2))

    # Category analytics
    top_categories = db.Column(JSONB, default=list)
    category_breakdown = db.Column(JSONB, default=list)

    # Transaction stats
    transaction_count = db.Column(db.Integer, default=0)
    average_transaction = db.Column(db.Numeric(12, 2), default=0)

    # Additional metrics
    savings_rate = db.Column(db.Numeric(5, 2))  # Percentage
    best_day = db.Column(db.Date)
    worst_day = db.Column(db.Date)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Indexes and constraints
    __table_args__ = (
        db.UniqueConstraint(
            "user_id", "year", "month", name="uq_monthly_stats_user_year_month"
        ),
        Index("idx_monthly_stats_date", "year", "month"),
        CheckConstraint("month BETWEEN 1 AND 12", name="check_valid_month"),
    )

    @property
    def net_savings_value(self):
        """Get net savings (calculated if not stored)."""
        if self.net_savings is not None:
            return float(self.net_savings)
        return float(self.total_income) - float(self.total_expense)

    @property
    def savings_rate_value(self):
        """Get savings rate percentage."""
        if self.savings_rate is not None:
            return float(self.savings_rate)

        if self.total_income and self.total_income > 0:
            return (self.net_savings_value / float(self.total_income)) * 100
        return 0

    @classmethod
    def generate_for_user(cls, user_id, year, month):
        """
        Generate monthly statistics for a user.

        Args:
            user_id: User ID
            year: Year
            month: Month

        Returns:
            MonthlyStat: Generated statistics
        """

        # Calculate date range
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)

        # Get transactions for the month
        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start_date,
            Transaction.date < end_date,
        ).all()

        # Calculate totals - convert to float
        total_income = sum(float(t.amount) for t in transactions if t.is_income)
        total_expense = sum(float(t.amount) for t in transactions if t.is_expense)
        net_savings = total_income - total_expense
        transaction_count = len(transactions)
        avg_transaction = (
            (total_income + total_expense) / transaction_count
            if transaction_count > 0
            else 0
        )

        # Category breakdown
        category_query = db.session.execute(
            text("""
                SELECT 
                    c.name,
                    c.color,
                    COALESCE(SUM(t.amount), 0) as total,
                    COUNT(t.id) as count
                FROM transactions t
                JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = :user_id
                    AND t.date >= :start_date
                    AND t.date < :end_date
                    AND t.type = 'expense'
                GROUP BY c.id, c.name, c.color
                ORDER BY total DESC
            """),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchall()

        category_breakdown = [
            {
                "name": c.name,
                "color": c.color,
                "amount": float(c.total),
                "count": c.count,
                "percentage": (
                    (float(c.total) / total_expense * 100) if total_expense > 0 else 0
                ),
            }
            for c in category_query
        ]

        top_categories = category_breakdown[:5] if category_breakdown else []

        # Best and worst days
        daily_totals = db.session.execute(
            text("""
                SELECT 
                    date,
                    SUM(amount) as daily_total
                FROM transactions
                WHERE user_id = :user_id
                    AND date >= :start_date
                    AND date < :end_date
                    AND type = 'expense'
                GROUP BY date
            """),
            {"user_id": user_id, "start_date": start_date, "end_date": end_date},
        ).fetchall()

        best_day = None
        worst_day = None
        if daily_totals:
            # Convert to list of tuples for min/max operations
            daily_list = [(d.date, float(d.daily_total)) for d in daily_totals]
            if daily_list:
                best_day = min(daily_list, key=lambda x: x[1])[0]
                worst_day = max(daily_list, key=lambda x: x[1])[0]

        # Create or update stats
        stats = cls.query.filter_by(user_id=user_id, year=year, month=month).first()

        if not stats:
            stats = cls(user_id=user_id, year=year, month=month)

        stats.total_income = total_income
        stats.total_expense = total_expense
        stats.net_savings = net_savings
        stats.transaction_count = transaction_count
        stats.average_transaction = avg_transaction
        stats.savings_rate = (
            (net_savings / total_income * 100) if total_income > 0 else 0
        )
        stats.category_breakdown = category_breakdown
        stats.top_categories = top_categories
        stats.best_day = best_day
        stats.worst_day = worst_day

        db.session.add(stats)
        db.session.commit()

        return stats

    def to_dict(self):
        """
        Convert monthly stats to dictionary.

        Returns:
            dict: Statistics data
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "year": self.year,
            "month": self.month,
            "total_income": float(self.total_income) if self.total_income else 0,
            "total_expense": float(self.total_expense) if self.total_expense else 0,
            "net_savings": (
                float(self.net_savings) if self.net_savings else self.net_savings_value
            ),
            "savings_rate": (
                float(self.savings_rate)
                if self.savings_rate
                else self.savings_rate_value
            ),
            "transaction_count": self.transaction_count,
            "average_transaction": (
                float(self.average_transaction) if self.average_transaction else 0
            ),
            "top_categories": self.top_categories or [],
            "category_breakdown": self.category_breakdown or [],
            "best_day": self.best_day.isoformat() if self.best_day else None,
            "worst_day": self.worst_day.isoformat() if self.worst_day else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<MonthlyStat {self.year}-{self.month}: ${self.total_income}/${self.total_expense}>"
