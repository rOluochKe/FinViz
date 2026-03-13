"""
Unit tests for models.
"""

from datetime import datetime, timedelta

import pytest

from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.utils.constants import DEFAULT_CATEGORIES


class TestUserModel:
    """Test User model."""

    def test_create_user(self, db_session):
        """Test user creation."""
        user = User(
            username="newuser",
            email="new@example.com",
            first_name="New",
            last_name="User",
        )
        user.set_password("Test123!@#")

        db_session.add(user)
        db_session.commit()

        assert user.id is not None
        assert user.username == "newuser"
        assert user.check_password("Test123!@#") is True
        assert user.check_password("wrong") is False

    def test_user_properties(self, test_user):
        """Test user properties."""
        assert test_user.full_name == "Test User"
        assert test_user.is_active is True
        assert test_user.is_admin is False

    def test_user_tokens(self, test_user):
        """Test token generation."""
        tokens = test_user.generate_auth_tokens()

        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "bearer"

    def test_password_reset_token(self, test_user):
        """Test password reset token."""
        token = test_user.generate_reset_token()
        assert token is not None


class TestCategoryModel:
    """Test Category model."""

    def test_create_category(self, db_session, test_user):
        """Test category creation."""
        category = Category(
            name="Test Category", type="expense", color="#ff0000", user_id=test_user.id
        )

        db_session.add(category)
        db_session.commit()

        assert category.id is not None
        assert category.name == "Test Category"
        assert category.type == "expense"

    def test_category_relationships(self, db_session, test_user, test_transactions):
        """Test category relationships."""
        category = test_transactions[0].category

        assert category.transactions.count() > 0
        assert category.transaction_count > 0
        assert category.total_amount is not None

    def test_system_categories(self, db_session):
        """Test system categories."""

        # Create system categories if they don't exist
        for cat_data in DEFAULT_CATEGORIES:
            existing = Category.query.filter_by(
                name=cat_data["name"], is_system=True
            ).first()
            if not existing:
                category = Category(**cat_data, is_system=True)
                db_session.add(category)
        db_session.commit()

        categories = Category.get_system_categories()
        assert len(categories) > 0


class TestTransactionModel:
    """Test Transaction model."""

    def test_create_transaction(self, db_session, test_user, test_categories):
        """Test transaction creation."""
        category = test_categories[0]

        transaction = Transaction(
            user_id=test_user.id,
            category_id=category.id,
            amount=100.50,
            description="Test transaction",
            date=datetime.now().date(),
            type="expense",
        )

        db_session.add(transaction)
        db_session.commit()

        assert transaction.id is not None
        assert transaction.formatted_amount == "-$100.50"
        assert transaction.is_expense is True

    def test_transaction_properties(self, test_transactions):
        """Test transaction properties."""
        transaction = test_transactions[0]

        assert transaction.absolute_amount == transaction.amount
        assert transaction.is_income == (transaction.type == "income")
        assert transaction.is_expense == (transaction.type == "expense")

    def test_get_user_transactions(self, db_session, test_user, test_transactions):
        """Test getting user transactions."""
        transactions = Transaction.get_user_transactions(
            test_user.id, start_date=datetime.now().date() - timedelta(days=30)
        )

        assert transactions.count() > 0

    def test_get_monthly_summary(self, db_session, test_user, test_transactions):
        """Test monthly summary."""
        now = datetime.now()
        summary = Transaction.get_monthly_summary(test_user.id, now.year, now.month)

        assert "total_income" in summary
        assert "total_expense" in summary
        assert "net_savings" in summary


class TestBudgetModel:
    """Test Budget model."""

    def test_create_budget(self, db_session, test_user, test_categories):
        """Test budget creation."""
        # Try to find an expense category
        expense_category = None
        for cat in test_categories:
            if cat.type == "expense":
                expense_category = cat
                break

        # If no expense category found, create one
        if expense_category is None:

            # Find an expense category from defaults
            for cat_data in DEFAULT_CATEGORIES:
                if cat_data["type"] == "expense":
                    expense_category = Category(
                        name=cat_data["name"],
                        type=cat_data["type"],
                        color=cat_data["color"],
                        icon=cat_data["icon"],
                        user_id=test_user.id,
                        is_system=False,
                    )
                    db_session.add(expense_category)
                    db_session.commit()
                    db_session.refresh(expense_category)
                    break

        assert expense_category is not None, "Could not create or find expense category"

        budget = Budget(
            user_id=test_user.id,
            category_id=expense_category.id,
            amount=1000,
            period="monthly",
            month=datetime.now().month,
            year=datetime.now().year,
        )

        db_session.add(budget)
        db_session.commit()

        assert budget.id is not None
        assert budget.spent is not None
        assert budget.remaining is not None

    def test_budget_properties(
        self, test_budgets, db_session, test_user, test_categories
    ):
        """Test budget properties."""
        # If no budgets exist, create one for testing
        budgets = list(test_budgets) if test_budgets else []

        if not budgets:
            # Find or create an expense category
            expense_category = None
            for cat in test_categories:
                if cat.type == "expense":
                    expense_category = cat
                    break

            if expense_category is None:

                for cat_data in DEFAULT_CATEGORIES:
                    if cat_data["type"] == "expense":
                        expense_category = Category(
                            name=cat_data["name"],
                            type=cat_data["type"],
                            color=cat_data["color"],
                            icon=cat_data["icon"],
                            user_id=test_user.id,
                            is_system=False,
                        )
                        db_session.add(expense_category)
                        db_session.commit()
                        db_session.refresh(expense_category)
                        break

            if expense_category:
                budget = Budget(
                    user_id=test_user.id,
                    category_id=expense_category.id,
                    amount=1000,
                    period="monthly",
                    month=datetime.now().month,
                    year=datetime.now().year,
                )
                db_session.add(budget)
                db_session.commit()
                db_session.refresh(budget)
                budgets = [budget]

        # Skip test if still no budgets
        if not budgets:
            pytest.skip("No budgets available for testing")

        budget = budgets[0]
        assert budget.spent_percentage is not None
        assert budget.is_over_budget in [True, False]
        assert budget.should_alert in [True, False]

    def test_budget_projection(
        self, test_budgets, db_session, test_user, test_categories
    ):
        """Test budget projection."""
        # If no budgets exist, create one for testing
        budgets = list(test_budgets) if test_budgets else []

        if not budgets:
            # Find or create an expense category
            expense_category = None
            for cat in test_categories:
                if cat.type == "expense":
                    expense_category = cat
                    break

            if expense_category is None:

                for cat_data in DEFAULT_CATEGORIES:
                    if cat_data["type"] == "expense":
                        expense_category = Category(
                            name=cat_data["name"],
                            type=cat_data["type"],
                            color=cat_data["color"],
                            icon=cat_data["icon"],
                            user_id=test_user.id,
                            is_system=False,
                        )
                        db_session.add(expense_category)
                        db_session.commit()
                        db_session.refresh(expense_category)
                        break

            if expense_category:
                budget = Budget(
                    user_id=test_user.id,
                    category_id=expense_category.id,
                    amount=1000,
                    period="monthly",
                    month=datetime.now().month,
                    year=datetime.now().year,
                )
                db_session.add(budget)
                db_session.commit()
                db_session.refresh(budget)
                budgets = [budget]

        # Skip test if still no budgets
        if not budgets:
            pytest.skip("No budgets available for testing")

        budget = budgets[0]
        projection = budget.get_projection()
        assert "projected_spend" in projection
        assert "will_exceed" in projection
        assert "confidence" in projection
