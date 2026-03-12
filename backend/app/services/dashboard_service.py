"""
Dashboard service for aggregated dashboard data.
"""

from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Dict, List

from app.models.monthly_stats import MonthlyStat
from app.models.transaction import Transaction
from app.services.budget_service import BudgetService
from app.services.notification_service import NotificationService


class DashboardService:
    """Service for dashboard data aggregation."""

    @staticmethod
    def get_kpis(user_id: int, days: int = 30) -> Dict:
        """
        Get key performance indicators.

        Args:
            user_id: User ID
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
    def get_recent_transactions(user_id: int, limit: int = 10) -> List[Dict]:
        """Get recent transactions."""
        tx = (
            Transaction.query.filter_by(user_id=user_id)
            .order_by(Transaction.date.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": t.id,
                "date": t.date.isoformat(),
                "desc": t.description,
                "amount": float(t.amount),
                "type": t.type,
                "category": t.category.name if t.category else None,
                "color": t.category.color if t.category else None,
            }
            for t in tx
        ]

    @staticmethod
    def get_spending_by_category(user_id: int, days: int = 30) -> List[Dict]:
        """Get spending breakdown by category."""
        end = date.today()
        start = end - timedelta(days=days)

        tx = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start,
            Transaction.type == "expense",
        ).all()

        cats = defaultdict(float)
        for t in tx:
            if t.category:
                cats[t.category.name] += float(t.amount)

        total = sum(cats.values())

        return [
            {
                "category": k,
                "amount": v,
                "percent": (v / total * 100) if total > 0 else 0,
            }
            for k, v in sorted(cats.items(), key=lambda x: x[1], reverse=True)
        ]

    @staticmethod
    def get_monthly_trends(user_id: int, months: int = 6) -> Dict:
        """Get monthly income/expense trends."""
        end = date.today()
        data = []

        for i in range(months):
            m = end.month - i
            y = end.year
            if m <= 0:
                m += 12
                y -= 1

            stats = MonthlyStat.query.filter_by(
                user_id=user_id, year=y, month=m
            ).first()

            if stats:
                data.append(
                    {
                        "month": f"{y}-{m:02d}",
                        "income": float(stats.total_income),
                        "expense": float(stats.total_expense),
                        "savings": float(stats.net_savings) if stats.net_savings else 0,
                    }
                )
            else:
                data.append(
                    {"month": f"{y}-{m:02d}", "income": 0, "expense": 0, "savings": 0}
                )

        return {"trends": list(reversed(data))}

    @staticmethod
    def get_insights(user_id: int) -> List[Dict]:
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
        if budget_status["alerts"]:
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
    def get_full_dashboard(user_id: int, days: int = 30) -> Dict:
        """Get complete dashboard data."""
        return {
            "kpis": DashboardService.get_kpis(user_id, days),
            "recent": DashboardService.get_recent_transactions(user_id),
            "spending_by_category": DashboardService.get_spending_by_category(
                user_id, days
            ),
            "trends": DashboardService.get_monthly_trends(user_id),
            "insights": DashboardService.get_insights(user_id),
            "generated": datetime.now().isoformat(),
        }
