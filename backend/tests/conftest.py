"""
Pytest fixtures and configuration.
"""
import pytest
import tempfile
import os
from datetime import datetime, timedelta
from flask import Flask
from faker import Faker

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.utils.constants import DEFAULT_CATEGORIES

fake = Faker()


@pytest.fixture(scope='session')
def app():
    """Create test Flask app."""
    # Create temp file for test database
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app('testing')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    yield app
    
    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def db_session(app):
    """Create database session for tests."""
    with app.app_context():
        yield db.session
        db.session.remove()


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        username='testuser',
        email='test@example.com',
        first_name='Test',
        last_name='User'
    )
    user.set_password('Test123!@#')
    db_session.add(user)
    db_session.commit()
    
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers."""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'Test123!@#'
    })
    token = response.get_json()['tokens']['access_token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def test_categories(db_session, test_user):
    """Create test categories."""
    categories = []
    
    # Create system categories for user
    for cat_data in DEFAULT_CATEGORIES[:5]:
        category = Category(
            **cat_data,
            user_id=test_user.id,
            is_system=False
        )
        db_session.add(category)
        categories.append(category)
    
    db_session.commit()
    return categories


@pytest.fixture
def test_transactions(db_session, test_user, test_categories):
    """Create test transactions."""
    transactions = []
    
    for i in range(20):
        # Alternate between income and expense
        if i % 3 == 0:
            tx_type = 'income'
            category = next((c for c in test_categories if c.type.value == 'income'), test_categories[0])
            amount = fake.random_number(digits=4)
        else:
            tx_type = 'expense'
            category = next((c for c in test_categories if c.type.value == 'expense'), test_categories[0])
            amount = fake.random_number(digits=3)
        
        transaction = Transaction(
            user_id=test_user.id,
            category_id=category.id,
            amount=amount,
            description=fake.sentence(nb_words=4),
            date=datetime.now().date() - timedelta(days=i),
            type=tx_type,
            notes=fake.text(max_nb_chars=200) if i % 4 == 0 else None
        )
        db_session.add(transaction)
        transactions.append(transaction)
    
    db_session.commit()
    return transactions


@pytest.fixture
def test_budgets(db_session, test_user, test_categories):
    """Create test budgets."""
    budgets = []
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    for category in test_categories:
        if category.type.value == 'expense':
            budget = Budget(
                user_id=test_user.id,
                category_id=category.id,
                amount=fake.random_number(digits=4),
                period='monthly',
                month=current_month,
                year=current_year,
                alert_threshold=80,
                is_active=True
            )
            db_session.add(budget)
            budgets.append(budget)
    
    db_session.commit()
    return budgets
