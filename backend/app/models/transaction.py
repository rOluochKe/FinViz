"""
Transaction model for financial transactions.
"""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Index, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.extensions import db


class Transaction(db.Model):
    """
    Transaction model representing financial transactions.
    """

    __tablename__ = "transactions"

    # Primary key - using UUID
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("categories.id", ondelete="SET NULL"),
        index=True,
    )

    # Transaction data
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    type = db.Column(db.String(20), nullable=False, index=True)
    notes = db.Column(db.Text)

    # Local file storage path (not cloud)
    receipt_path = db.Column(db.String(500))

    # Tags for flexible categorization
    tags = db.Column(JSONB, default=list)

    # Recurring transaction support
    is_recurring = db.Column(db.Boolean, default=False)
    recurring_frequency = db.Column(db.String(20))  # daily, weekly, monthly, yearly
    recurring_end_date = db.Column(db.Date)
    parent_transaction_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("transactions.id"), index=True
    )

    # Additional metadata - renamed from 'metadata' to avoid reserved name
    meta_data = db.Column(JSONB, default={})

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    child_transactions = db.relationship(
        "Transaction", backref=db.backref("parent", remote_side=[id]), lazy="dynamic"
    )
    category = db.relationship("Category", back_populates="transactions", lazy="joined")
    user = db.relationship("User", back_populates="transactions")

    # Indexes for performance
    __table_args__ = (
        Index("idx_transaction_user_date", "user_id", "date"),
        Index("idx_transaction_user_category", "user_id", "category_id"),
        Index("idx_transaction_type_date", "type", "date"),
        Index("idx_transaction_amount", "amount"),
        Index("idx_transaction_recurring", "is_recurring", "recurring_frequency"),
        CheckConstraint("amount > 0", name="check_amount_positive"),
        CheckConstraint(
            "type IN ('income', 'expense', 'transfer')", name="check_transaction_type"
        ),
        CheckConstraint(
            "recurring_frequency IN (NULL, 'daily', 'weekly', 'monthly', 'yearly')",
            name="check_valid_frequency",
        ),
    )

    @property
    def formatted_amount(self):
        """Get formatted amount with sign."""
        if self.type == "income":
            return f"+${self.amount:,.2f}"
        elif self.type == "expense":
            return f"-${self.amount:,.2f}"
        return f"${self.amount:,.2f}"

    @property
    def absolute_amount(self):
        """Get absolute amount."""
        return abs(self.amount)

    @property
    def is_income(self):
        """Check if transaction is income."""
        return self.type == "income"

    @property
    def is_expense(self):
        """Check if transaction is expense."""
        return self.type == "expense"

    @property
    def is_transfer(self):
        """Check if transaction is transfer."""
        return self.type == "transfer"

    @classmethod
    def get_user_transactions(
        cls,
        user_id,
        start_date=None,
        end_date=None,
        category_id=None,
        transaction_type=None,
        search=None,
    ):
        """Get transactions for a user with optional filters."""
        query = cls.query.filter_by(user_id=user_id)

        if start_date:
            query = query.filter(cls.date >= start_date)

        if end_date:
            query = query.filter(cls.date <= end_date)

        if category_id:
            query = query.filter_by(category_id=category_id)

        if transaction_type:
            query = query.filter_by(type=transaction_type)

        if search:
            search_term = f"%{search}%"
            query = query.filter(cls.description.ilike(search_term))

        return query.order_by(cls.date.desc())

    @classmethod
    def get_monthly_summary(cls, user_id, year, month):
        """Get monthly summary for a user."""
        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date()
        else:
            end_date = datetime(year, month + 1, 1).date()

        result = (
            db.session.query(
                func.coalesce(
                    func.sum(cls.amount).filter(cls.type == "income"), 0
                ).label("total_income"),
                func.coalesce(
                    func.sum(cls.amount).filter(cls.type == "expense"), 0
                ).label("total_expense"),
                func.count().label("transaction_count"),
            )
            .filter(cls.user_id == user_id, cls.date >= start_date, cls.date < end_date)
            .first()
        )

        return {
            "year": year,
            "month": month,
            "total_income": float(result.total_income),
            "total_expense": float(result.total_expense),
            "net_savings": float(result.total_income - result.total_expense),
            "transaction_count": result.transaction_count,
        }

    @classmethod
    def get_category_breakdown(
        cls, user_id, start_date=None, end_date=None, transaction_type="expense"
    ):
        """Get transaction breakdown by category."""
        query = """
            SELECT 
                c.name as category_name,
                c.color as category_color,
                COALESCE(SUM(t.amount), 0) as total,
                COUNT(t.id) as count
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = :user_id
                AND t.type = :tx_type
        """

        params = {"user_id": str(user_id), "tx_type": transaction_type}

        if start_date:
            query += " AND t.date >= :start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND t.date <= :end_date"
            params["end_date"] = end_date

        query += " GROUP BY c.id, c.name, c.color ORDER BY total DESC"

        result = db.session.execute(text(query), params)

        rows = result.fetchall()
        total = sum(r.total for r in rows) or 1

        return [
            {
                "category": r.category_name,
                "color": r.category_color,
                "amount": float(r.total),
                "count": r.count,
                "percentage": (float(r.total) / total * 100),
            }
            for r in rows
        ]

    def to_dict(self, include_relationships=True):
        """Convert transaction to dictionary."""
        data = {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "category_id": str(self.category_id) if self.category_id else None,
            "amount": float(self.amount),
            "description": self.description,
            "date": self.date.isoformat() if self.date else None,
            "type": self.type,
            "notes": self.notes,
            "receipt_path": self.receipt_path,
            "tags": self.tags or [],
            "is_recurring": self.is_recurring,
            "recurring_frequency": self.recurring_frequency,
            "recurring_end_date": (
                self.recurring_end_date.isoformat() if self.recurring_end_date else None
            ),
            "meta_data": self.meta_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "formatted_amount": self.formatted_amount,
        }

        # Lazy load category data - FIX: Use the relationship directly since we have lazy="joined"
        if include_relationships and self.category_id:
            # Since we have lazy="joined", self.category should be loaded
            if self.category is not None:
                data["category_name"] = self.category.name
                data["category_color"] = self.category.color
            else:
                # Fallback: try to query if relationship isn't loaded
                try:
                    from app.models.category import Category

                    category = Category.query.get(self.category_id)
                    if category:
                        data["category_name"] = category.name
                        data["category_color"] = category.color
                        # Cache the relationship for future use
                        self.category = category
                    else:
                        data["category_name"] = None
                        data["category_color"] = None
                except Exception as e:
                    import logging

                    logging.error(
                        f"Failed to load category for transaction {self.id}: {e}"
                    )
                    data["category_name"] = None
                    data["category_color"] = None
        else:
            data["category_name"] = None
            data["category_color"] = None

        return data

    def __repr__(self):
        return f"<Transaction {self.id}: {self.description} ${self.amount}>"
