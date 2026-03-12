"""
Unit tests for models.
"""
import pytest
from datetime import datetime, timedelta
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.utils.constants import TransactionType, CategoryType


class TestUserModel:
    """Test User model."""
    
    def test_create_user(self, db_session):
        """Test user creation."""
        user = User(
            username='newuser',
            email='new@example.com',
            first_name='New',
            last_name='User'
        )
        user.set_password('Test123!@#')
        
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.username == 'newuser'
        assert user.check_password('Test123!@#') is True
        assert user.check_password('wrong') is False
    
    def test_user_properties(self, test_user):
        """Test user properties."""
        assert test_user.full_name == 'Test User'
        assert test_user.is_active is True
        assert test_user.is_admin is False
    
    def test_user_tokens(self, test_user):
        """Test token generation."""
        tokens = test_user.generate_auth_tokens()
        
        assert 'access_token' in tokens
        assert 'refresh_token' in tokens
        assert tokens['token_type'] == 'bearer'
    
    def test_password_reset_token(self, test_user):
        """Test password reset token."""
        token = test_user.generate_reset_token()
        
        assert token is not None
        assert test_user.reset_token is not None
        assert test_user.reset_token_expires is not None


class TestCategoryModel:
    """Test Category model."""
    
    def test_create_category(self, db_session, test_user):
        """Test category creation."""
        category = Category(
            name='Test Category',
            type='expense',
            color='#ff0000',
            user_id=test_user.id
        )
        
        db_session.add(category)
        db_session.commit()
        
        assert category.id is not None
        assert category.name == 'Test Category'
        assert category.type.value == 'expense'
    
    def test_category_relationships(self, db_session, test_user, test_transactions):
        """Test category relationships."""
        category = test_transactions[0].category
        
        assert category.transactions.count() > 0
        assert category.transaction_count > 0
        assert category.total_amount is not None
    
    def test_system_categories(self, db_session):
        """Test system categories."""
        categories = Category.get_system_categories()
        
        assert len(categories) > 0
        for cat in categories:
            assert cat.is_system is True


class TestTransactionModel:
    """Test Transaction model."""
    
    def test_create_transaction(self, db_session, test_user, test_categories):
        """Test transaction creation."""
        category = test_categories[0]
        
        transaction = Transaction(
            user_id=test_user.id,
            category_id=category.id,
            amount=100.50,
            description='Test transaction',
            date=datetime.now().date(),
            type='expense'
        )
        
        db_session.add(transaction)
        db_session.commit()
        
        assert transaction.id is not None
        assert transaction.formatted_amount == '-$100.50'
        assert transaction.is_expense is True
    
    def test_transaction_properties(self, test_transactions):
        """Test transaction properties."""
        transaction = test_transactions[0]
        
        assert transaction.absolute_amount == transaction.amount
        assert transaction.is_income == (transaction.type.value == 'income')
        assert transaction.is_expense == (transaction.type.value == 'expense')
    
    def test_get_user_transactions(self, db_session, test_user, test_transactions):
        """Test getting user transactions."""
        transactions = Transaction.get_user_transactions(
            test_user.id,
            start_date=datetime.now().date() - timedelta(days=30)
        )
        
        assert transactions.count() > 0
    
    def test_get_monthly_summary(self, db_session, test_user, test_transactions):
        """Test monthly summary."""
        now = datetime.now()
        summary = Transaction.get_monthly_summary(
            test_user.id,
            now.year,
            now.month
        )
        
        assert 'total_income' in summary
        assert 'total_expense' in summary
        assert 'net_savings' in summary


class TestBudgetModel:
    """Test Budget model."""
    
    def test_create_budget(self, db_session, test_user, test_categories):
        """Test budget creation."""
        category = next(c for c in test_categories if c.type.value == 'expense')
        
        budget = Budget(
            user_id=test_user.id,
            category_id=category.id,
            amount=1000,
            period='monthly',
            month=datetime.now().month,
            year=datetime.now().year
        )
        
        db_session.add(budget)
        db_session.commit()
        
        assert budget.id is not None
        assert budget.spent is not None
        assert budget.remaining is not None
    
    def test_budget_properties(self, test_budgets):
        """Test budget properties."""
        budget = test_budgets[0]
        
        assert budget.spent_percentage is not None
        assert budget.is_over_budget in [True, False]
        assert budget.should_alert in [True, False]
    
    def test_budget_projection(self, test_budgets):
        """Test budget projection."""
        budget = test_budgets[0]
        projection = budget.get_projection()
        
        assert 'projected_spend' in projection
        assert 'will_exceed' in projection
        assert 'confidence' in projection
        