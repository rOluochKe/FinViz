"""
Dashboard service for aggregated dashboard data.
"""

import logging
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Dict, List

from sqlalchemy.orm import joinedload

from app.models.monthly_stats import MonthlyStat
from app.models.transaction import Transaction
from app.services.budget_service import BudgetService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class DashboardService:
    """Service for dashboard data aggregation."""

    @staticmethod
    def get_kpis(user_id: uuid.UUID, days: int = 30) -> Dict:
        """
        Get key performance indicators.

        Args:
            user_id: User ID (UUID)
            days: Days to analyze

        Returns:
            KPI data
        """
        end = date.today()
        start = end - timedelta(days=days)
        prev_start = start - timedelta(days=days)

        # Current period
        current = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start,
            Transaction.date <= end,
        ).all()

        # Previous period
        previous = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= prev_start,
            Transaction.date < start,
        ).all()

        cur_inc = sum(t.amount for t in current if t.is_income)
        cur_exp = sum(t.amount for t in current if t.is_expense)
        prev_inc = sum(t.amount for t in previous if t.is_income)
        prev_exp = sum(t.amount for t in previous if t.is_expense)

        return {
            "income": {
                "current": float(cur_inc),
                "previous": float(prev_inc),
                "change": float(cur_inc - prev_inc),
                "trend": ((cur_inc - prev_inc) / prev_inc * 100) if prev_inc > 0 else 0,
            },
            "expense": {
                "current": float(cur_exp),
                "previous": float(prev_exp),
                "change": float(cur_exp - prev_exp),
                "trend": ((cur_exp - prev_exp) / prev_exp * 100) if prev_exp > 0 else 0,
            },
            "savings": {
                "current": float(cur_inc - cur_exp),
                "previous": float(prev_inc - prev_exp),
                "change": float((cur_inc - cur_exp) - (prev_inc - prev_exp)),
            },
            "rate": ((cur_inc - cur_exp) / cur_inc * 100) if cur_inc > 0 else 0,
            "count": len(current),
        }

    @staticmethod
    def get_recent_transactions(user_id: uuid.UUID, limit: int = 10) -> List[Dict]:
        """Get recent transactions with category data."""
        # Use explicit join to ensure category data is loaded
        tx = (
            Transaction.query.filter_by(user_id=user_id)
            .options(joinedload(Transaction.category))
            .order_by(Transaction.date.desc())
            .limit(limit)
            .all()
        )

        result = []
        for t in tx:
            # Get category data
            category_name = None
            category_color = None

            if t.category:
                category_name = t.category.name
                category_color = t.category.color
            elif t.category_id:
                # Try to load category if relationship not loaded
                from app.models.category import Category

                category = Category.query.get(t.category_id)
                if category:
                    category_name = category.name
                    category_color = category.color
                    # Cache for future use
                    t.category = category

            result.append(
                {
                    "id": str(t.id),
                    "date": t.date.isoformat(),
                    "desc": t.description,
                    "amount": float(t.amount),
                    "type": t.type,
                    "category": category_name,
                    "category_name": category_name,
                    "color": category_color,
                    "category_color": category_color,
                }
            )

        return result

    @staticmethod
    def get_spending_by_category(user_id: uuid.UUID, days: int = 30) -> List[Dict]:
        """Get spending breakdown by category with proper category names."""
        end = date.today()
        start = end - timedelta(days=days)

        # Use explicit join to ensure category data is loaded
        tx = (
            Transaction.query.filter(
                Transaction.user_id == user_id,
                Transaction.date >= start,
                Transaction.type == "expense",
            )
            .options(joinedload(Transaction.category))
            .all()
        )

        cats = defaultdict(float)
        for t in tx:
            if t.category:
                cats[t.category.name] += float(t.amount)
            elif t.category_id:
                from app.models.category import Category

                category = Category.query.get(t.category_id)
                if category:
                    cats[category.name] += float(t.amount)
                else:
                    cats["Uncategorized"] += float(t.amount)
            else:
                cats["Uncategorized"] += float(t.amount)

        total = sum(cats.values())

        # Define category colors
        color_map = {
            "Groceries": "#dc3545",
            "Rent": "#fd7e14",
            "Utilities": "#6c757d",
            "Entertainment": "#e83e8c",
            "Transportation": "#20c997",
            "Healthcare": "#007bff",
            "Dining Out": "#6610f2",
            "Shopping": "#d63384",
            "Salary": "#28a745",
            "Freelance": "#17a2b8",
            "Investment": "#ffc107",
            "Gifts": "#e83e8c",
            "Transfer": "#6f42c1",
            "Credit Card Payment": "#dc3545",
            "Education": "#0dcaf0",
            "Insurance": "#198754",
            "Subscriptions": "#6f42c1",
            "Travel": "#0d6efd",
            "Pets": "#e83e8c",
            "Gym": "#20c997",
            "Uncategorized": "#808080",
        }

        return [
            {
                "category": k,
                "amount": v,
                "percent": (v / total * 100) if total > 0 else 0,
                "color": color_map.get(k, "#808080"),
            }
            for k, v in sorted(cats.items(), key=lambda x: x[1], reverse=True)
        ]

    @staticmethod
    def get_monthly_trends(user_id: uuid.UUID, months: int = 6) -> Dict:
        """Get monthly income/expense trends."""
        end = date.today()
        data = []

        for i in range(months):
            m = end.month - i
            y = end.year
            if m <= 0:
                m += 12
                y -= 1

            # Calculate from transactions directly instead of MonthlyStat
            start_date = date(y, m, 1)
            if m == 12:
                end_date = date(y + 1, 1, 1)
            else:
                end_date = date(y, m + 1, 1)

            transactions = Transaction.query.filter(
                Transaction.user_id == user_id,
                Transaction.date >= start_date,
                Transaction.date < end_date,
            ).all()

            income = sum(t.amount for t in transactions if t.is_income)
            expense = sum(t.amount for t in transactions if t.is_expense)
            net = income - expense

            data.append(
                {
                    "month": f"{y}-{m:02d}",
                    "date": f"{y}-{m:02d}",
                    "income": float(income),
                    "expense": float(expense),
                    "net": float(net),
                    "savings": float(net),
                }
            )

        return {"trends": list(reversed(data))}

    @staticmethod
    def get_insights(user_id: uuid.UUID) -> List[Dict]:
        """Generate quick insights."""
        insights = []

        # Check savings rate
        kpis = DashboardService.get_kpis(user_id, days=30)
        if kpis["rate"] < 10:
            insights.append(
                {
                    "type": "warning",
                    "title": "Low Savings Rate",
                    "msg": f"Your savings rate is only {kpis['rate']:.1f}%. Aim for 20%.",
                    "action": "Review your expenses",
                }
            )
        elif kpis["rate"] > 30:
            insights.append(
                {
                    "type": "success",
                    "title": "Great Savings!",
                    "msg": f"Your savings rate is {kpis['rate']:.1f}%. Keep it up!",
                    "action": "Consider investing",
                }
            )

        # Check budget alerts
        budget_status = BudgetService.get_budget_status(user_id)
        if budget_status.get("alerts"):
            insights.append(
                {
                    "type": "warning",
                    "title": "Budget Alerts",
                    "msg": f"You have {len(budget_status['alerts'])} budget alerts",
                    "action": "Check budgets",
                }
            )

        # Check large transactions
        large = NotificationService.check_large_transactions(user_id, threshold=1000)
        if large:
            insights.append(
                {
                    "type": "info",
                    "title": "Large Transactions",
                    "msg": f"{len(large)} large transactions in the last week",
                    "action": "Review",
                }
            )

        return insights

    @staticmethod
    def get_full_dashboard(user_id: uuid.UUID, days: int = 30) -> Dict:
        """Get complete dashboard data."""
        return {
            "kpis": DashboardService.get_kpis(user_id, days),
            "recent": DashboardService.get_recent_transactions(user_id, 5),
            "spending_by_category": DashboardService.get_spending_by_category(
                user_id, days
            ),
            "trends": DashboardService.get_monthly_trends(user_id),
            "insights": DashboardService.get_insights(user_id),
            "generated": datetime.now().isoformat(),
        }
