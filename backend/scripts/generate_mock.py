#!/usr/bin/env python3
"""
Generate mock data for testing.
"""
import json
import csv
import argparse
import random
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
    """Generate mock transactions."""
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
        
        transactions.append({
            'id': i + 1,
            'date': tx_date.isoformat(),
            'description': fake.sentence(nb_words=4),
            'amount': amount,
            'type': tx_type,
            'category': cat_name,
            'category_color': colors.get(cat_name, '#808080'),
            'notes': fake.text(max_nb_chars=200) if random.random() < 0.3 else '',
            'tags': random.sample(['work', 'personal', 'travel', 'food'], 
                                 k=random.randint(0, 2)) if random.random() < 0.5 else []
        })
    
    return sorted(transactions, key=lambda x: x['date'])

def generate_budgets(count):
    """Generate mock budgets."""
    categories = [
        {'name': 'Groceries', 'color': '#dc3545'},
        {'name': 'Dining Out', 'color': '#6610f2'},
        {'name': 'Entertainment', 'color': '#e83e8c'},
        {'name': 'Transportation', 'color': '#20c997'},
        {'name': 'Shopping', 'color': '#d63384'},
        {'name': 'Utilities', 'color': '#6c757d'}
    ]
    
    budgets = []
    year = datetime.now().year
    
    for i in range(count):
        category = random.choice(categories)
        period = random.choice(['monthly', 'yearly'])
        
        if period == 'monthly':
            amount = round(random.uniform(200, 1000), 2)
            month = random.randint(1, 12)
        else:
            amount = round(random.uniform(2000, 10000), 2)
            month = None
        
        budgets.append({
            'id': i + 1,
            'category': category['name'],
            'category_color': category['color'],
            'amount': amount,
            'period': period,
            'year': year,
            'month': month,
            'spent': round(random.uniform(0, amount * 1.2), 2),
            'alert_threshold': 80
        })
    
    return budgets

def generate_stats():
    """Generate monthly statistics."""
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
        
        stats.append({
            'year': year,
            'month': month,
            'month_name': datetime(year, month, 1).strftime('%B'),
            'income': income,
            'expense': expense,
            'savings': round(income - expense, 2),
            'savings_rate': round((income - expense) / income * 100, 1) if income > 0 else 0,
            'transaction_count': random.randint(20, 50)
        })
    
    return stats

def save_json(data, filename):
    """Save data as JSON."""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(data)} records to {filename}")

def save_csv(data, filename):
    """Save data as CSV."""
    if not data:
        return
    
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
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

if __name__ == '__main__':
    main()