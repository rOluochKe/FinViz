"""
Budget service for budget calculations and recommendations.
"""

from collections import defaultdict
from datetime import date, timedelta
from typing import Dict, List, Optional

import numpy as np

from app.extensions import db
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction


class BudgetService:
    """Service for budget operations."""

    @staticmethod
    def get_budget_status(user_id: int, year: int = None, month: int = None) -> Dict:
        """
        Get current budget status.

        Args:
            user_id: User ID
            year: Year (default: current)
            month: Month (default: current)

        Returns:
            Budget status data
        """
        today = date.today()
        year = year or today.year
        month = month or today.month

        budgets = (
            Budget.query.filter_by(user_id=user_id, is_active=True, year=year)
            .filter(
                db.or_(
                    Budget.period == "yearly",
                    db.and_(Budget.period == "monthly", Budget.month == month),
                )
            )
            .all()
        )

        total_budget = 0
        total_spent = 0
        categories = []
        alerts = []

        for b in budgets:
            spent = b.spent
            amount = float(b.amount)
            percent = (spent / amount * 100) if amount > 0 else 0

            total_budget += amount
            total_spent += spent

            cat_data = {
                "id": b.id,
                "category": b.category.name if b.category else "Unknown",
                "color": b.category.color if b.category else "#808080",
                "budget": amount,
                "spent": spent,
                "remaining": amount - spent,
                "percent": percent,
                "status": (
                    "over" if percent > 100 else "warning" if percent > 80 else "good"
                ),
            }
            categories.append(cat_data)

            if percent > 100:
                alerts.append(
                    {
                        "type": "over",
                        "category": cat_data["category"],
                        "message": f"Over budget by ${spent - amount:.2f}",
                    }
                )
            elif percent > 80:
                alerts.append(
                    {
                        "type": "warning",
                        "category": cat_data["category"],
                        "message": f"At {percent:.0f}% of budget",
                    }
                )

        return {
            "period": f"{year}-{month:02d}",
            "summary": {
                "total_budget": total_budget,
                "total_spent": total_spent,
                "remaining": total_budget - total_spent,
                "percent": (
                    (total_spent / total_budget * 100) if total_budget > 0 else 0
                ),
                "count": len(budgets),
            },
            "categories": categories,
            "alerts": alerts,
        }

    @staticmethod
    def suggest_budgets(user_id: int) -> List[Dict]:
        """
        Suggest budget amounts based on spending history.

        Args:
            user_id: User ID

        Returns:
            List of budget suggestions
        """
        # Get last 3 months of spending
        end = date.today()
        start = end - timedelta(days=90)

        tx = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start,
            Transaction.type == "expense",
        ).all()

        if len(tx) < 10:
            return []

        # Group by category
        cat_spending = defaultdict(list)
        for t in tx:
            if t.category_id:
                cat_spending[t.category_id].append(float(t.amount))

        suggestions = []
        for cat_id, amounts in cat_spending.items():
            category = Category.query.get(cat_id)
            if not category:
                continue

            # Calculate statistics
            total = sum(amounts)
            avg_monthly = total / 3
            std = np.std(amounts) if len(amounts) > 1 else avg_monthly * 0.2

            # Suggest budget (avg + buffer based on variability)
            if std / avg_monthly < 0.2:
                buffer = 1.1  # 10% buffer for consistent spending
            elif std / avg_monthly < 0.4:
                buffer = 1.2  # 20% buffer
            else:
                buffer = 1.3  # 30% buffer for variable spending

            suggested = avg_monthly * buffer

            suggestions.append(
                {
                    "category_id": cat_id,
                    "category": category.name,
                    "color": category.color,
                    "current_avg": round(avg_monthly, 2),
                    "suggested": round(suggested, 2),
                    "confidence": (
                        "high"
                        if len(amounts) >= 10
                        else "medium" if len(amounts) >= 5 else "low"
                    ),
                    "count": len(amounts),
                }
            )

        return sorted(suggestions, key=lambda x: x["suggested"], reverse=True)

    @staticmethod
    def create_budget_from_suggestion(
        user_id: int, category_id: int, year: int, month: int = None
    ) -> Optional[Budget]:
        """
        Create budget from suggestion.

        Args:
            user_id: User ID
            category_id: Category ID
            year: Year
            month: Month (for monthly budgets)

        Returns:
            Created budget or None
        """
        suggestions = BudgetService.suggest_budgets(user_id)
        suggestion = next(
            (s for s in suggestions if s["category_id"] == category_id), None
        )

        if not suggestion:
            return None

        period = "monthly" if month else "yearly"

        # Check if budget already exists
        existing = Budget.query.filter_by(
            user_id=user_id,
            category_id=category_id,
            period=period,
            year=year,
            month=month,
        ).first()

        if existing:
            return None

        budget = Budget(
            user_id=user_id,
            category_id=category_id,
            amount=suggestion["suggested"],
            period=period,
            year=year,
            month=month,
            alert_threshold=80,
            is_active=True,
        )

        db.session.add(budget)
        db.session.commit()

        return budget

    @staticmethod
    def rollover_budgets(
        user_id: int, from_month: int, from_year: int, to_month: int, to_year: int
    ) -> int:
        """
        Rollover unused budget amounts to next month.

        Args:
            user_id: User ID
            from_month: Source month
            from_year: Source year
            to_month: Target month
            to_year: Target year

        Returns:
            Number of budgets rolled over
        """
        budgets = Budget.query.filter_by(
            user_id=user_id,
            period="monthly",
            month=from_month,
            year=from_year,
            is_active=True,
            rollover=True,
        ).all()

        count = 0
        for b in budgets:
            remaining = b.remaining
            if remaining > 0:
                # Check if target budget exists
                target = Budget.query.filter_by(
                    user_id=user_id,
                    category_id=b.category_id,
                    period="monthly",
                    month=to_month,
                    year=to_year,
                ).first()

                if target:
                    # Add to existing
                    target.amount = float(target.amount) + remaining
                else:
                    # Create new
                    target = Budget(
                        user_id=user_id,
                        category_id=b.category_id,
                        amount=remaining,
                        period="monthly",
                        month=to_month,
                        year=to_year,
                        alert_threshold=b.alert_threshold,
                        rollover=True,
                        is_active=True,
                    )
                    db.session.add(target)

                count += 1

        db.session.commit()
        return count
