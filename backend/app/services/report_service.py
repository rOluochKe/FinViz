"""
Report service for generating financial reports.
"""

from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Dict

from app.extensions import db
from app.models.budget import Budget
from app.models.category import Category
from app.models.monthly_stats import MonthlyStat
from app.models.transaction import Transaction


class ReportService:
    """Service for generating financial reports."""

    @staticmethod
    def monthly_report(user_id: int, year: int, month: int) -> Dict:
        """
        Generate monthly financial report.

        Args:
            user_id: User ID
            year: Year
            month: Month

        Returns:
            Monthly report data
        """
        start = date(year, month, 1)
        end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

        # Get transactions
        tx = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start,
            Transaction.date < end,
        ).all()

        income = sum(t.amount for t in tx if t.is_income)
        expense = sum(t.amount for t in tx if t.is_expense)

        # Category breakdown
        cats = defaultdict(lambda: {"amount": 0, "count": 0})
        for t in tx:
            if t.is_expense and t.category:
                cats[t.category.name]["amount"] += float(t.amount)
                cats[t.category.name]["count"] += 1
                cats[t.category.name]["color"] = t.category.color

        # Daily totals
        daily = defaultdict(float)
        for t in tx:
            if t.is_expense:
                daily[t.date.day] += float(t.amount)

        # Budget comparison
        budgets = (
            Budget.query.filter_by(user_id=user_id, year=year)
            .filter(
                db.or_(
                    Budget.period == "yearly",
                    db.and_(Budget.period == "monthly", Budget.month == month),
                )
            )
            .all()
        )

        budget_data = []
        for b in budgets:
            budget_data.append(
                {
                    "category": b.category.name if b.category else None,
                    "budget": float(b.amount),
                    "spent": b.spent,
                    "remaining": float(b.amount) - b.spent,
                    "percent": (b.spent / float(b.amount) * 100) if b.amount > 0 else 0,
                }
            )

        return {
            "period": f"{year}-{month:02d}",
            "summary": {
                "income": float(income),
                "expense": float(expense),
                "savings": float(income - expense),
                "rate": ((income - expense) / income * 100) if income > 0 else 0,
                "count": len(tx),
            },
            "categories": [
                {"name": k, **v}
                for k, v in sorted(
                    cats.items(), key=lambda x: x[1]["amount"], reverse=True
                )
            ],
            "daily": [{"day": d, "amount": v} for d, v in sorted(daily.items())],
            "budgets": budget_data,
        }

    @staticmethod
    def yearly_report(user_id: int, year: int) -> Dict:
        """
        Generate yearly financial report.

        Args:
            user_id: User ID
            year: Year

        Returns:
            Yearly report data
        """
        start = date(year, 1, 1)
        end = date(year + 1, 1, 1)

        stats = (
            MonthlyStat.query.filter_by(user_id=user_id, year=year)
            .order_by(MonthlyStat.month)
            .all()
        )

        if not stats:
            return {"error": "No data for this year"}

        monthly = []
        total_income = 0
        total_expense = 0

        for s in stats:
            monthly.append(
                {
                    "month": s.month,
                    "name": datetime(year, s.month, 1).strftime("%B"),
                    "income": float(s.total_income),
                    "expense": float(s.total_expense),
                    "savings": float(s.net_savings) if s.net_savings else 0,
                }
            )
            total_income += float(s.total_income)
            total_expense += float(s.total_expense)

        # Top categories
        cat_totals = (
            db.session.query(
                Category.name,
                Category.color,
                db.func.sum(Transaction.amount).label("total"),
            )
            .join(Transaction, Transaction.category_id == Category.id)
            .filter(
                Transaction.user_id == user_id,
                Transaction.date >= start,
                Transaction.date < end,
                Transaction.type == "expense",
            )
            .group_by(Category.id, Category.name, Category.color)
            .order_by(db.func.sum(Transaction.amount).desc())
            .limit(5)
            .all()
        )

        return {
            "year": year,
            "summary": {
                "income": float(total_income),
                "expense": float(total_expense),
                "savings": float(total_income - total_expense),
                "rate": (
                    ((total_income - total_expense) / total_income * 100)
                    if total_income > 0
                    else 0
                ),
            },
            "monthly": monthly,
            "top_categories": [
                {"name": c.name, "color": c.color, "amount": float(c.total)}
                for c in cat_totals
            ],
            "best_month": max(monthly, key=lambda x: x["savings"]) if monthly else None,
            "worst_month": (
                min(monthly, key=lambda x: x["savings"]) if monthly else None
            ),
        }

    @staticmethod
    def category_report(user_id: int, category_id: int, months: int = 12) -> Dict:
        """
        Generate report for specific category.

        Args:
            user_id: User ID
            category_id: Category ID
            months: Months to analyze

        Returns:
            Category report
        """
        end = datetime.now().date()
        start = end - timedelta(days=30 * months)

        tx = (
            Transaction.query.filter(
                Transaction.user_id == user_id,
                Transaction.category_id == category_id,
                Transaction.date >= start,
                Transaction.date <= end,
            )
            .order_by(Transaction.date)
            .all()
        )

        if not tx:
            return {"error": "No transactions found"}

        category = Category.query.get(category_id)

        # Monthly totals
        monthly = defaultdict(float)
        for t in tx:
            key = f"{t.date.year}-{t.date.month:02d}"
            monthly[key] += float(t.amount)

        # Statistics
        amounts = [float(t.amount) for t in tx]

        return {
            "category": {
                "id": category_id,
                "name": category.name if category else "Unknown",
                "color": category.color if category else "#808080",
                "type": category.type if category else "expense",
            },
            "period": f"Last {months} months",
            "summary": {
                "total": sum(amounts),
                "avg": sum(amounts) / len(amounts),
                "max": max(amounts),
                "min": min(amounts),
                "count": len(amounts),
            },
            "monthly": [{"month": k, "amount": v} for k, v in sorted(monthly.items())],
            "recent": [
                {
                    "date": t.date.isoformat(),
                    "amount": float(t.amount),
                    "desc": t.description,
                }
                for t in tx[-10:]
            ][::-1],
        }
