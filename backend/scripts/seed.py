#!/usr/bin/env python3
"""
Generate mock data for testing with UUIDs.
"""
import json
import csv
import argparse
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Generate mock data')
    parser.add_argument('--type', choices=['transactions', 'budgets', 'stats', 'all'],
                       default='all', help='Type of data')
    parser.add_argument('--count', type=int, default=100, help='Number of records')
    parser.add_argument('--format', choices=['json', 'csv', 'both'],
                       default='both', help='Output format')
    parser.add_argument('--output', default='mock_data', help='Output prefix')
    return parser.parse_args()

def generate_transactions(count):
    """Generate mock transactions with UUIDs."""
    categories = {
        'income': ['Salary', 'Freelance', 'Investment', 'Gifts'],
        'expense': ['Groceries', 'Rent', 'Utilities', 'Entertainment', 
                   'Transportation', 'Healthcare', 'Dining Out', 'Shopping'],
        'transfer': ['Transfer']
    }
    
    colors = {
        'Salary': '#28a745', 'Freelance': '#17a2b8', 'Investment': '#ffc107',
        'Gifts': '#e83e8c', 'Groceries': '#dc3545', 'Rent': '#fd7e14',
        'Utilities': '#6c757d', 'Entertainment': '#e83e8c', 'Transportation': '#20c997',
        'Healthcare': '#007bff', 'Dining Out': '#6610f2', 'Shopping': '#d63384',
        'Transfer': '#6f42c1'
    }
    
    # Generate a consistent user UUID for all transactions (mock user)
    user_uuid = uuid.uuid4()
    
    transactions = []
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)
    
    for i in range(count):
        tx_date = start_date + timedelta(days=random.randint(0, 365))
        
        rand = random.random()
        if rand < 0.3:
            tx_type = 'income'
            cat_name = random.choice(categories['income'])
            amount = round(random.uniform(500, 5000), 2)
        elif rand < 0.65:
            tx_type = 'expense'
            cat_name = random.choice(categories['expense'])
            amount = round(random.uniform(5, 500), 2)
        else:
            tx_type = 'transfer'
            cat_name = 'Transfer'
            amount = round(random.uniform(50, 1000), 2)
        
        # Generate category UUID
        category_uuid = uuid.uuid4()
        
        transactions.append({
            'id': str(uuid.uuid4()), 
            'user_id': str(user_uuid),  
            'category_id': str(category_uuid),  
            'date': tx_date.isoformat(),
            'description': fake.sentence(nb_words=4),
            'amount': amount,
            'type': tx_type,
            'category_name': cat_name,
            'category_color': colors.get(cat_name, '#808080'),
            'notes': fake.text(max_nb_chars=200) if random.random() < 0.3 else '',
            'tags': random.sample(['work', 'personal', 'travel', 'food'], 
                                 k=random.randint(0, 2)) if random.random() < 0.5 else [],
            'is_recurring': random.random() < 0.1,  # 10% chance of recurring
            'recurring_frequency': random.choice(['monthly', 'weekly', None]) if random.random() < 0.05 else None,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
    
    return sorted(transactions, key=lambda x: x['date'])

def generate_budgets(count):
    """Generate mock budgets with UUIDs."""
    categories = [
        {'name': 'Groceries', 'color': '#dc3545'},
        {'name': 'Dining Out', 'color': '#6610f2'},
        {'name': 'Entertainment', 'color': '#e83e8c'},
        {'name': 'Transportation', 'color': '#20c997'},
        {'name': 'Shopping', 'color': '#d63384'},
        {'name': 'Utilities', 'color': '#6c757d'}
    ]
    
    # Generate a consistent user UUID for all budgets
    user_uuid = uuid.uuid4()
    
    budgets = []
    year = datetime.now().year
    
    for i in range(count):
        category = random.choice(categories)
        period = random.choice(['monthly', 'yearly'])
        
        # Generate category UUID
        category_uuid = uuid.uuid4()
        
        if period == 'monthly':
            amount = round(random.uniform(200, 1000), 2)
            month = random.randint(1, 12)
        else:
            amount = round(random.uniform(2000, 10000), 2)
            month = None
        
        # Calculate spent amount (random percentage of budget)
        spent = round(random.uniform(0, amount * 1.2), 2)
        remaining = round(amount - spent, 2)
        spent_percentage = round((spent / amount) * 100, 1) if amount > 0 else 0
        
        budgets.append({
            'id': str(uuid.uuid4()),  
            'user_id': str(user_uuid),  
            'category_id': str(category_uuid), 
            'category_name': category['name'],
            'category_color': category['color'],
            'amount': amount,
            'period': period,
            'year': year,
            'month': month,
            'spent': spent,
            'remaining': remaining,
            'spent_percentage': spent_percentage,
            'alert_threshold': 80,
            'is_over_budget': spent > amount,
            'should_alert': spent_percentage >= 80,
            'is_active': True,
            'rollover': random.random() < 0.3,
            'notes': fake.sentence(nb_words=5) if random.random() < 0.3 else '',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
    
    return budgets

def generate_stats():
    """Generate monthly statistics with UUIDs."""
    # Generate a consistent user UUID for all stats
    user_uuid = uuid.uuid4()
    
    stats = []
    year = datetime.now().year
    
    for month in range(1, 13):
        base_income = random.uniform(3000, 5000)
        base_expense = random.uniform(2000, 4000)
        
        # Add seasonality
        if month in [12, 1]:
            expense_multiplier = 1.3
        elif month in [6, 7, 8]:
            expense_multiplier = 1.1
        else:
            expense_multiplier = 1.0
        
        income = round(base_income * random.uniform(0.9, 1.1), 2)
        expense = round(base_expense * expense_multiplier * random.uniform(0.9, 1.1), 2)
        savings = round(income - expense, 2)
        savings_rate = round((savings / income) * 100, 1) if income > 0 else 0
        transaction_count = random.randint(20, 50)
        
        # Generate category breakdown for the month
        category_breakdown = []
        top_categories = []
        categories = ['Groceries', 'Dining Out', 'Entertainment', 'Transportation', 'Shopping', 'Utilities']
        
        for cat in categories:
            cat_amount = round(expense * random.uniform(0.05, 0.3), 2)
            cat_count = random.randint(1, 10)
            percentage = round((cat_amount / expense) * 100, 1) if expense > 0 else 0
            
            breakdown = {
                'name': cat,
                'color': {
                    'Groceries': '#dc3545',
                    'Dining Out': '#6610f2',
                    'Entertainment': '#e83e8c',
                    'Transportation': '#20c997',
                    'Shopping': '#d63384',
                    'Utilities': '#6c757d'
                }.get(cat, '#808080'),
                'amount': cat_amount,
                'count': cat_count,
                'percentage': percentage
            }
            category_breakdown.append(breakdown)
            
            if random.random() < 0.3:  # 30% chance to be in top categories
                top_categories.append(breakdown)
        
        # Sort top categories by amount
        top_categories = sorted(top_categories, key=lambda x: x['amount'], reverse=True)[:3]
        
        stats.append({
            'id': str(uuid.uuid4()),
            'user_id': str(user_uuid), 
            'year': year,
            'month': month,
            'month_name': datetime(year, month, 1).strftime('%B'),
            'total_income': income,
            'total_expense': expense,
            'net_savings': savings,
            'savings_rate': savings_rate,
            'transaction_count': transaction_count,
            'average_transaction': round((income + expense) / transaction_count, 2) if transaction_count > 0 else 0,
            'top_categories': top_categories,
            'category_breakdown': category_breakdown,
            'best_day': (datetime(year, month, random.randint(1, 28)).date()).isoformat() if random.random() < 0.7 else None,
            'worst_day': (datetime(year, month, random.randint(1, 28)).date()).isoformat() if random.random() < 0.7 else None,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
    
    return stats

def generate_users(count=5):
    """Generate mock users with UUIDs."""
    users = []
    
    for i in range(count):
        first_name = fake.first_name()
        last_name = fake.last_name()
        
        users.append({
            'id': str(uuid.uuid4()),  # UUID
            'username': f"{first_name.lower()}{last_name.lower()}{random.randint(1, 999)}",
            'email': fake.email(),
            'first_name': first_name,
            'last_name': last_name,
            'full_name': f"{first_name} {last_name}",
            'password_hash': '$2b$12$hashed_password_placeholder',  # Placeholder hash
            'role': random.choice(['user', 'admin']) if i == 0 else 'user',
            'status': random.choice(['active', 'inactive']) if random.random() < 0.9 else 'suspended',
            'preferences': {
                'currency': random.choice(['USD', 'EUR', 'GBP']),
                'theme': random.choice(['light', 'dark']),
                'language': 'en',
                'notifications': {
                    'email': random.choice([True, False]),
                    'budget_alerts': True
                },
                'dashboard': {
                    'default_view': 'monthly',
                    'chart_type': 'line',
                    'show_recent': 10
                }
            },
            'email_verified': random.random() < 0.8,
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            'last_login': (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat() if random.random() < 0.9 else None
        })
    
    return users

def save_json(data, filename):
    """Save data as JSON."""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2, default=str) 
    print(f"Saved {len(data)} records to {filename}")

def save_csv(data, filename):
    """Save data as CSV."""
    if not data:
        return
    
    with open(filename, 'w', newline='') as f:
        # Handle nested structures for CSV (simplify complex fields)
        simplified_data = []
        for record in data:
            simplified_record = {}
            for key, value in record.items():
                if isinstance(value, (dict, list)):
                    # Convert nested structures to JSON string
                    simplified_record[key] = json.dumps(value)
                else:
                    simplified_record[key] = value
            simplified_data.append(simplified_record)
        
        writer = csv.DictWriter(f, fieldnames=simplified_data[0].keys())
        writer.writeheader()
        writer.writerows(simplified_data)
    print(f"Saved {len(data)} records to {filename}")

def main():
    """Main function."""
    args = parse_args()
    
    if args.type in ['transactions', 'all']:
        data = generate_transactions(args.count)
        if args.format in ['json', 'both']:
            save_json(data, f"{args.output}_transactions.json")
        if args.format in ['csv', 'both']:
            save_csv(data, f"{args.output}_transactions.csv")
    
    if args.type in ['budgets', 'all']:
        data = generate_budgets(min(20, args.count))
        if args.format in ['json', 'both']:
            save_json(data, f"{args.output}_budgets.json")
        if args.format in ['csv', 'both']:
            save_csv(data, f"{args.output}_budgets.csv")
    
    if args.type in ['stats', 'all']:
        data = generate_stats()
        if args.format in ['json', 'both']:
            save_json(data, f"{args.output}_stats.json")
        if args.format in ['csv', 'both']:
            save_csv(data, f"{args.output}_stats.csv")
    
    # Generate users separately if needed
    if args.type == 'all':
        users = generate_users(5)
        if args.format in ['json', 'both']:
            save_json(users, f"{args.output}_users.json")
        if args.format in ['csv', 'both']:
            save_csv(users, f"{args.output}_users.csv")

if __name__ == '__main__':
    main()