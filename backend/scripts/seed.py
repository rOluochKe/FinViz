#!/usr/bin/env python3
"""
Database seeding script.
"""
import sys
import os
import argparse
from datetime import datetime, timedelta
import random
from faker import Faker

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.utils.constants import DEFAULT_CATEGORIES

fake = Faker()

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Seed database with test data')
    parser.add_argument('--users', type=int, default=3, help='Number of test users')
    parser.add_argument('--transactions', type=int, default=100, help='Transactions per user')
    parser.add_argument('--clean', action='store_true', help='Clean existing data')
    parser.add_argument('--env', default='development', help='Environment')
    return parser.parse_args()

def main():
    """Main seeding function."""
    args = parse_args()
    
    app = create_app(args.env)
    
    with app.app_context():
        print(f"🌱 Seeding database with {args.users} users...")
        
        if args.clean:
            print("Cleaning existing data...")
            db.session.query(Transaction).delete()
            db.session.query(Budget).delete()
            db.session.query(Category).filter_by(is_system=False).delete()
            db.session.query(User).delete()
            db.session.commit()
        
        # Create system categories if not exist
        create_system_categories()
        
        # Create users
        users = []
        for i in range(args.users):
            user = create_user(i)
            users.append(user)
            print(f"  ✓ Created user: {user.username}")
        
        # Create data for each user
        for user in users:
            create_categories(user)
            create_transactions(user, args.transactions)
            create_budgets(user)
            print(f"  ✓ Created data for user: {user.username}")
        
        db.session.commit()
        print("✅ Database seeded successfully!")

def create_system_categories():
    """Create system categories."""
    for cat_data in DEFAULT_CATEGORIES:
        existing = Category.query.filter_by(
            name=cat_data['name'],
            is_system=True
        ).first()
        
        if not existing:
            category = Category(**cat_data, is_system=True)
            db.session.add(category)
    
    db.session.flush()

def create_user(index):
    """Create a test user."""
    username = f"testuser_{index}"
    email = f"test{index}@example.com"
    
    user = User(
        username=username,
        email=email,
        first_name=fake.first_name(),
        last_name=fake.last_name(),
        email_verified=True
    )
    user.set_password("Test123!@#")
    
    db.session.add(user)
    db.session.flush()
    
    return user

def create_categories(user):
    """Create categories for user."""
    # Copy system categories
    system_cats = Category.query.filter_by(is_system=True).all()
    
    for sys_cat in system_cats:
        existing = Category.query.filter_by(
            name=sys_cat.name,
            user_id=user.id
        ).first()
        
        if not existing:
            category = Category(
                name=sys_cat.name,
                type=sys_cat.type,
                color=sys_cat.color,
                icon=sys_cat.icon,
                user_id=user.id,
                is_system=False
            )
            db.session.add(category)
    
    db.session.flush()

def create_transactions(user, count):
    """Create transactions for user."""
    categories = Category.query.filter_by(user_id=user.id).all()
    
    if not categories:
        return
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)
    
    transactions = []
    
    for _ in range(count):
        tx_date = start_date + timedelta(days=random.randint(0, 365))
        category = random.choice(categories)
        
        if category.type.value == 'income':
            amount = random.uniform(500, 5000)
        else:
            amount = random.uniform(5, 500)
        
        transaction = Transaction(
            user_id=user.id,
            category_id=category.id,
            amount=round(amount, 2),
            description=fake.sentence(nb_words=4),
            date=tx_date,
            type=category.type.value
        )
        transactions.append(transaction)
    
    db.session.bulk_save_objects(transactions)
    db.session.flush()

def create_budgets(user):
    """Create budgets for user."""
    expense_cats = Category.query.filter_by(
        user_id=user.id,
        type='expense'
    ).all()
    
    if not expense_cats:
        return
    
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    budgets = []
    
    for category in random.sample(expense_cats, min(5, len(expense_cats))):
        budget = Budget(
            user_id=user.id,
            category_id=category.id,
            amount=random.uniform(200, 1000),
            period='monthly',
            month=current_month,
            year=current_year,
            alert_threshold=80,
            is_active=True
        )
        budgets.append(budget)
    
    db.session.bulk_save_objects(budgets)
    db.session.flush()

if __name__ == '__main__':
    main()
    