"""
Pytest fixtures and configuration.
"""

import os
import tempfile
from datetime import datetime, timedelta

import pytest
from faker import Faker
from flask import Flask

from app import create_app
from app.extensions import db
from app.models.budget import Budget
from app.models.category import Category
from app.models.monthly_stats import MonthlyStat
from app.models.transaction import Transaction
from app.models.user import User
from app.utils.constants import DEFAULT_CATEGORIES

fake = Faker()


@pytest.fixture(scope="function")  # Change to function scope for isolation
def app():
    """Create test Flask app."""
    # Create temp file for test database
    db_fd, db_path = tempfile.mkstemp()

    app = create_app("testing")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    app.config["UPLOAD_FOLDER"] = tempfile.mkdtemp()

    # Create tables
    with app.app_context():
        db.create_all()
        # Create system categories once
        create_system_categories()

    yield app

    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def db_session(app):
    """Create database session for tests."""
    with app.app_context():
        yield db.session
        # Clean up after each test
        db.session.rollback()
        # Delete all data
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        first_name="Test",
        last_name="User",
    )
    user.set_password("Test123!@#")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers."""
    response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "Test123!@#"}
    )
    data = response.get_json()
    token = data["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_categories(db_session, test_user):
    """Create test categories."""
    categories = []

    for cat_data in DEFAULT_CATEGORIES[:5]:
        category = Category(
            name=cat_data["name"],
            type=cat_data["type"],
            color=cat_data["color"],
            icon=cat_data["icon"],
            user_id=test_user.id,
            is_system=False,
        )
        db_session.add(category)
        categories.append(category)

    db_session.commit()
    for cat in categories:
        db_session.refresh(cat)

    return categories


@pytest.fixture
def test_transactions(db_session, test_user, test_categories):
    """Create test transactions."""
    transactions = []

    # Clear existing transactions for this user to avoid duplicates
    Transaction.query.filter_by(user_id=test_user.id).delete()

    for i in range(20):
        if i % 3 == 0:
            tx_type = "income"
            category = next(
                (c for c in test_categories if c.type == "income"), test_categories[0]
            )
            # Generate amount between 1 and 9999
            amount = max(1.0, float(fake.random_number(digits=4)) or 100.0)
        else:
            tx_type = "expense"
            category = next(
                (c for c in test_categories if c.type == "expense"), test_categories[0]
            )
            # Generate amount between 1 and 999
            amount = max(1.0, float(fake.random_number(digits=3)) or 10.0)

        transaction = Transaction(
            user_id=test_user.id,
            category_id=category.id,
            amount=amount,
            description=fake.sentence(nb_words=4),
            date=datetime.now().date() - timedelta(days=i),
            type=tx_type,
            notes=fake.text(max_nb_chars=200) if i % 4 == 0 else None,
        )
        db_session.add(transaction)
        transactions.append(transaction)

    db_session.commit()
    for tx in transactions:
        db_session.refresh(tx)

    return transactions


@pytest.fixture
def test_budgets(db_session, test_user, test_categories):
    """Create test budgets."""
    budgets = []
    current_year = datetime.now().year
    current_month = datetime.now().month

    for category in test_categories:
        if category.type == "expense":
            budget = Budget(
                user_id=test_user.id,
                category_id=category.id,
                amount=float(fake.random_number(digits=4)),  # Convert to float
                period="monthly",
                month=current_month,
                year=current_year,
                alert_threshold=80.0,
                is_active=True,
            )
            db_session.add(budget)
            budgets.append(budget)

    db_session.commit()
    for budget in budgets:
        db_session.refresh(budget)

    return budgets


def create_system_categories():
    """Create system categories."""
    for cat_data in DEFAULT_CATEGORIES:
        existing = Category.query.filter_by(
            name=cat_data["name"], is_system=True
        ).first()

        if not existing:
            category = Category(
                name=cat_data["name"],
                type=cat_data["type"],
                color=cat_data["color"],
                icon=cat_data["icon"],
                is_system=True,
            )
            db.session.add(category)

    db.session.commit()
