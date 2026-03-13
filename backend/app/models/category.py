"""
Category model for transaction categorization.
"""

from datetime import datetime

from sqlalchemy import CheckConstraint, Index, text
from sqlalchemy.dialects.postgresql import JSONB

from app.extensions import db


class Category(db.Model):
    """
    Category model for organizing transactions.
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

    # Additional metadata - renamed from 'metadata' to avoid reserved name
    meta_data = db.Column(JSONB, default={})

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships - use back_populates instead of backref
    transactions = db.relationship(
        "Transaction",
        back_populates="category",
        lazy="dynamic",
        foreign_keys="Transaction.category_id",
    )
    budgets = db.relationship(
        "Budget",
        back_populates="category",  # Changed from backref='category'
        lazy="dynamic",
    )
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
        result = db.session.execute(
            text(
                "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE category_id = :cat_id"
            ),
            {"cat_id": self.id},
        ).scalar()
        return float(result or 0)

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
            "meta_data": self.meta_data,
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
