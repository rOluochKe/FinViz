"""
Integration tests for database operations.
"""

from datetime import datetime

import pytest
from sqlalchemy import text

from app.extensions import db
from app.models.monthly_stats import MonthlyStat
from app.models.transaction import Transaction
from app.models.user import User


def test_database_connection(app):
    """Test database connection."""
    with app.app_context():
        result = db.session.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_user_transaction_relationship(db_session, test_user, test_transactions):
    """Test user-transaction relationship."""
    user = db_session.get(User, test_user.id)

    assert user.transactions.count() == len(test_transactions)

    for tx in user.transactions:
        assert tx.user_id == user.id


def test_transaction_category_relationship(db_session, test_transactions):
    """Test transaction-category relationship."""
    transaction = test_transactions[0]

    assert transaction.category is not None
    assert transaction.category_id == transaction.category.id


def test_cascade_delete(db_session, test_user, test_transactions):
    """Test cascade delete."""
    user_id = test_user.id
    len(test_transactions)

    # Delete user
    db_session.delete(test_user)
    db_session.commit()

    # Check transactions are deleted
    remaining = Transaction.query.filter_by(user_id=user_id).count()
    assert remaining == 0


def test_monthly_stats_generation(db_session, test_user, test_transactions):
    """Test monthly statistics generation."""
    now = datetime.now()

    stats = MonthlyStat.generate_for_user(test_user.id, now.year, now.month)

    assert stats is not None
    assert stats.user_id == test_user.id
    assert stats.year == now.year
    assert stats.month == now.month
    assert stats.total_income is not None
    assert stats.total_expense is not None


def test_transaction_constraints(db_session, test_user):
    """Test database constraints."""
    # Try to create transaction with negative amount
    with pytest.raises(Exception):
        transaction = Transaction(
            user_id=test_user.id,
            amount=-100,
            description="Negative amount",
            date=datetime.now().date(),
            type="expense",
        )
        db_session.add(transaction)
        db_session.commit()

    db_session.rollback()
