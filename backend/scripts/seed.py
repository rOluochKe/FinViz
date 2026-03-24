#!/usr/bin/env python3
"""
Seed the database with default data.
"""
import sys
import os
import random
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.monthly_stats import MonthlyStat

def clear_all_data():
    """Clear all existing data."""
    print("Clearing existing data...")
    MonthlyStat.query.delete()
    Budget.query.delete()
    Transaction.query.delete()
    Category.query.delete()
    User.query.delete()
    db.session.commit()
    print("✅ Data cleared")

def seed_users():
    """Seed users."""
    print("\nSeeding users...")
    
    users_data = [
        {
            'username': 'admin',
            'password': 'Admin123!@#',
            'email': 'admin@finviz.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'admin',
            'status': 'active'
        },
        {
            'username': 'johndoe',
            'password': 'John123!@#',
            'email': 'john.doe@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'user',
            'status': 'active'
        },
        {
            'username': 'janesmith',
            'password': 'Jane123!@#',
            'email': 'jane.smith@example.com',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'role': 'user',
            'status': 'active'
        },
        {
            'username': 'bobjohnson',
            'password': 'Bob123!@#',
            'email': 'bob.johnson@example.com',
            'first_name': 'Bob',
            'last_name': 'Johnson',
            'role': 'user',
            'status': 'inactive'
        }
    ]
    
    created = []
    for user_data in users_data:
        print(f"  Creating user: {user_data['username']}")
        
        user = User(
            username=user_data['username'],
            email=user_data['email'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            role=user_data['role'],
            status=user_data['status'],
            email_verified=True
        )
        user.set_password(user_data['password'])
        
        # Verify password was set correctly
        if not user.check_password(user_data['password']):
            print(f"    ERROR: Password not set correctly for {user_data['username']}")
            continue
        
        db.session.add(user)
        db.session.flush()
        created.append(user)
        
        print(f"    ✓ Created user {user_data['username']} (ID: {user.id})")
        print(f"      Password: {user_data['password']}")
        print(f"      Email: {user_data['email']}")
        print(f"      Role: {user_data['role']}")
    
    db.session.commit()
    print(f"✅ Seeded {len(created)} users")
    
    # Verify all users can login
    for user in created:
        if user.status == 'active':
            password = 'Admin123!@#' if user.username == 'admin' else user.username.capitalize() + '123!@#'
            if not user.check_password(password):
                print(f"  ⚠️ WARNING: User {user.username} cannot login with password '{password}'")
            else:
                print(f"  ✓ User {user.username} can login")
    
    return created

def seed_categories(users):
    """Seed categories for each user."""
    print("\nSeeding categories...")
    
    system_categories = [
        # Income categories
        {'name': 'Salary', 'type': 'income', 'color': '#28a745', 'icon': 'briefcase'},
        {'name': 'Freelance', 'type': 'income', 'color': '#17a2b8', 'icon': 'laptop'},
        {'name': 'Investment', 'type': 'income', 'color': '#ffc107', 'icon': 'graph-up'},
        {'name': 'Gifts', 'type': 'income', 'color': '#e83e8c', 'icon': 'gift'},
        {'name': 'Refunds', 'type': 'income', 'color': '#6c757d', 'icon': 'arrow-return-left'},
        
        # Expense categories
        {'name': 'Groceries', 'type': 'expense', 'color': '#dc3545', 'icon': 'basket'},
        {'name': 'Rent', 'type': 'expense', 'color': '#fd7e14', 'icon': 'house'},
        {'name': 'Utilities', 'type': 'expense', 'color': '#6c757d', 'icon': 'lightning'},
        {'name': 'Entertainment', 'type': 'expense', 'color': '#e83e8c', 'icon': 'film'},
        {'name': 'Transportation', 'type': 'expense', 'color': '#20c997', 'icon': 'car'},
        {'name': 'Healthcare', 'type': 'expense', 'color': '#007bff', 'icon': 'heart'},
        {'name': 'Dining Out', 'type': 'expense', 'color': '#6610f2', 'icon': 'cup-straw'},
        {'name': 'Shopping', 'type': 'expense', 'color': '#d63384', 'icon': 'bag'},
        {'name': 'Education', 'type': 'expense', 'color': '#0dcaf0', 'icon': 'book'},
        {'name': 'Insurance', 'type': 'expense', 'color': '#198754', 'icon': 'shield'},
        {'name': 'Subscriptions', 'type': 'expense', 'color': '#6f42c1', 'icon': 'repeat'},
        {'name': 'Travel', 'type': 'expense', 'color': '#0d6efd', 'icon': 'airplane'},
        {'name': 'Pets', 'type': 'expense', 'color': '#e83e8c', 'icon': 'heart'},
        {'name': 'Gym', 'type': 'expense', 'color': '#20c997', 'icon': 'dumbbell'},
        
        # Transfer categories
        {'name': 'Transfer', 'type': 'transfer', 'color': '#6f42c1', 'icon': 'arrow-left-right'},
        {'name': 'Credit Card Payment', 'type': 'transfer', 'color': '#dc3545', 'icon': 'credit-card'},
    ]
    
    total_categories = 0
    for user in users:
        if user.status != 'active':
            continue
            
        count = 0
        for cat_data in system_categories:
            existing = Category.query.filter_by(name=cat_data['name'], user_id=user.id).first()
            if existing:
                continue
            
            category = Category(
                user_id=user.id,
                name=cat_data['name'],
                type=cat_data['type'],
                color=cat_data['color'],
                icon=cat_data['icon'],
                is_system=True,
                is_active=True
            )
            db.session.add(category)
            count += 1
        
        total_categories += count
        print(f"  Created {count} categories for {user.username}")
    
    db.session.commit()
    print(f"✅ Seeded {total_categories} categories")

def seed_transactions(users, count=50):
    """Seed transactions for each user."""
    print("\nSeeding transactions...")
    
    total_transactions = 0
    
    for user in users:
        if user.status != 'active':
            continue
            
        # Get categories for this user
        income_cats = Category.query.filter_by(user_id=user.id, type='income').all()
        expense_cats = Category.query.filter_by(user_id=user.id, type='expense').all()
        transfer_cats = Category.query.filter_by(user_id=user.id, type='transfer').all()
        
        transactions = []
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=365)
        
        for i in range(count):
            tx_date = start_date + timedelta(days=random.randint(0, 365))
            
            rand = random.random()
            if rand < 0.25 and income_cats:
                tx_type = 'income'
                category = random.choice(income_cats)
                amount = round(random.uniform(1000, 8000), 2)
                if category.name == 'Salary':
                    amount = round(random.uniform(3000, 8000), 2)
            elif rand < 0.7 and expense_cats:
                tx_type = 'expense'
                category = random.choice(expense_cats)
                amount = round(random.uniform(10, 500), 2)
                if category.name == 'Rent':
                    amount = round(random.uniform(1000, 3000), 2)
                elif category.name in ['Groceries', 'Dining Out']:
                    amount = round(random.uniform(20, 300), 2)
            elif transfer_cats:
                tx_type = 'transfer'
                category = random.choice(transfer_cats)
                amount = round(random.uniform(100, 2000), 2)
            else:
                continue
            
            transaction = Transaction(
                user_id=user.id,
                category_id=category.id,
                amount=amount,
                description=f"{category.name} - {tx_date.strftime('%b %Y')}",
                date=tx_date,
                type=tx_type,
                notes="",
                tags=[],
                is_recurring=False
            )
            db.session.add(transaction)
            transactions.append(transaction)
        
        total_transactions += len(transactions)
        print(f"  Created {len(transactions)} transactions for {user.username}")
    
    db.session.commit()
    print(f"✅ Seeded {total_transactions} transactions")

def main():
    """Main seed function."""
    app = create_app()
    
    with app.app_context():
        print("="*60)
        print("🌱 STARTING DATABASE SEED")
        print("="*60)
        
        # Clear existing data
        clear_all_data()
        
        # Seed users
        users = seed_users()
        
        # Seed categories
        seed_categories(users)
        
        # Seed transactions
        seed_transactions(users)
        
        print("\n" + "="*60)
        print("✅ DATABASE SEED COMPLETE")
        print("="*60)
        print("\n📋 TEST USER CREDENTIALS:")
        print("-"*40)
        for user in users:
            if user.username == 'admin':
                print(f"\n  👑 ADMIN USER:")
                print(f"     Username: {user.username}")
                print(f"     Password: Admin123!@#")
                print(f"     Email: {user.email}")
            elif user.status == 'active':
                password = user.username.capitalize() + '123!@#'
                print(f"\n  👤 REGULAR USER:")
                print(f"     Username: {user.username}")
                print(f"     Password: {password}")
                print(f"     Email: {user.email}")
        
        print("\n" + "="*60)
        print("⚠️  IMPORTANT: Use these exact credentials (case sensitive)")
        print("="*60)

if __name__ == '__main__':
    main()