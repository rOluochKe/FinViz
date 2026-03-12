"""
Category model for transaction categorization.
"""

from datetime import datetime

from sqlalchemy import CheckConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB

from app.extensions import db
from app.models.transaction import Transaction


class Category(db.Model):
    """
    Category model for organizing transactions.

    Attributes:
        id: Primary key
        name: Category name
        type: income/expense/transfer
        color: Hex color code for UI
        icon: Icon identifier
        description: Category description
        parent_id: Parent category for hierarchies
        user_id: User ID (null for system categories)
        is_system: Whether category is system-defined
        is_active: Whether category is active
        metadata: JSONB for additional data
        created_at: Timestamp
        updated_at: Timestamp
    """

    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(20), nullable=False, default="expense")
    color = db.Column(db.String(7), default="#808080")
    icon = db.Column(db.String(50))
    description = db.Column(db.String(200))

    # Hierarchy support
    parent_id = db.Column(
        db.Integer, db.ForeignKey("categories.id", ondelete="SET NULL"), index=True
    )

    # Ownership (null for system categories)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # System vs custom
    is_system = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    # Additional metadata
    metadata = db.Column(JSONB, default={})

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    transactions = db.relationship(
        "Transaction",
        backref="category",
        lazy="dynamic",
        foreign_keys="Transaction.category_id",
    )
    budgets = db.relationship("Budget", backref="category", lazy="dynamic")
    children = db.relationship(
        "Category", backref=db.backref("parent", remote_side=[id]), lazy="dynamic"
    )

    # Constraints and indexes
    __table_args__ = (
        db.UniqueConstraint("name", "user_id", name="uq_category_name_user"),
        Index("idx_category_type", "type"),
        Index("idx_category_active", "is_active"),
        Index("idx_category_system", "is_system"),
        CheckConstraint(
            "type IN ('income', 'expense', 'transfer')", name="check_category_type"
        ),
        CheckConstraint("color ~ '^#[0-9A-Fa-f]{6}$'", name="check_valid_color"),
    )

    @property
    def full_path(self):
        """Get full category path."""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name

    @property
    def transaction_count(self):
        """Get number of transactions in this category."""
        return self.transactions.count()

    @property
    def total_amount(self):
        """Get total amount of all transactions in this category."""
        return (
            db.session.query(db.func.coalesce(db.func.sum(Transaction.amount), 0))
            .filter(Transaction.category_id == self.id)
            .scalar()
        )

    def to_dict(self, include_stats=False):
        """
        Convert category to dictionary.

        Args:
            include_stats: Include transaction statistics

        Returns:
            dict: Category data
        """
        data = {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "color": self.color,
            "icon": self.icon,
            "description": self.description,
            "parent_id": self.parent_id,
            "user_id": self.user_id,
            "is_system": self.is_system,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_stats:
            data.update(
                {
                    "transaction_count": self.transaction_count,
                    "total_amount": (
                        float(self.total_amount) if self.total_amount else 0
                    ),
                }
            )

        if self.parent:
            data["parent_name"] = self.parent.name

        return data

    @classmethod
    def get_system_categories(cls):
        """Get all system categories."""
        return cls.query.filter_by(is_system=True, is_active=True).all()

    @classmethod
    def get_user_categories(cls, user_id):
        """Get all categories for a user."""
        return (
            cls.query.filter(
                db.or_(cls.is_system == True, cls.user_id == user_id),
                cls.is_active == True,
            )
            .order_by(cls.type, cls.name)
            .all()
        )

    def __repr__(self):
        return f"<Category {self.name} ({self.type})>"
