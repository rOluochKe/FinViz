"""
Analytics service for complex data processing and business logic.
"""

import warnings
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from app.models.category import Category
from app.models.transaction import Transaction

warnings.filterwarnings("ignore")


class AnalyticsService:
    """Service for advanced analytics operations."""

    @staticmethod
    def calculate_spending_patterns(user_id: int, months: int = 12) -> Dict:
        """
        Analyze spending patterns and detect trends.

        Args:
            user_id: User ID
            months: Number of months to analyze

        Returns:
            Dict with spending pattern analysis
        """
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30 * months)

        # Get transactions
        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start_date,
            Transaction.type == "expense",
        ).all()

        if len(transactions) < 10:
            return {"error": "Insufficient data"}

        # Convert to DataFrame
        data = [
            {
                "date": t.date,
                "amount": float(t.amount),
                "category": t.category.name if t.category else "Unknown",
                "day": t.date.weekday(),
                "week": t.date.isocalendar()[1],
                "month": t.date.month,
                "year": t.date.year,
            }
            for t in transactions
        ]

        df = pd.DataFrame(data)

        # Day of week patterns
        dow = df.groupby("day")["amount"].agg(["sum", "mean", "count"]).reset_index()
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        dow["day_name"] = dow["day"].map(lambda x: days[x])

        # Monthly patterns
        monthly = df.groupby(["year", "month"])["amount"].sum().reset_index()

        # Category breakdown
        cats = df.groupby("category")["amount"].agg(["sum", "count"]).reset_index()
        cats = cats.sort_values("sum", ascending=False)

        # Calculate trends
        if len(monthly) > 1:
            monthly["growth"] = monthly["amount"].pct_change() * 100
            avg_growth = monthly["growth"].mean()
        else:
            avg_growth = 0

        return {
            "summary": {
                "total": float(df["amount"].sum()),
                "avg": float(df["amount"].mean()),
                "count": len(df),
                "avg_monthly": (
                    float(monthly["amount"].mean()) if len(monthly) > 0 else 0
                ),
            },
            "by_day": dow[["day_name", "sum", "mean", "count"]].to_dict("records"),
            "by_category": cats.to_dict("records"),
            "monthly_trend": {
                "growth": float(avg_growth),
                "is_increasing": avg_growth > 0,
            },
        }

    @staticmethod
    def detect_anomalies(user_id: int, days: int = 30, threshold: float = 2.0) -> Dict:
        """
        Detect anomalous transactions using z-score.

        Args:
            user_id: User ID
            days: Days to analyze
            threshold: Z-score threshold

        Returns:
            Dict with detected anomalies
        """
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)

        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start_date,
            Transaction.type == "expense",
        ).all()

        if len(transactions) < 5:
            return {"error": "Insufficient data"}

        amounts = [float(t.amount) for t in transactions]
        mean = np.mean(amounts)
        std = np.std(amounts)

        anomalies = []
        for tx in transactions:
            z = (float(tx.amount) - mean) / std if std > 0 else 0
            if abs(z) > threshold:
                anomalies.append(
                    {
                        "id": tx.id,
                        "date": tx.date.isoformat(),
                        "amount": float(tx.amount),
                        "desc": tx.description,
                        "category": tx.category.name if tx.category else None,
                        "z_score": float(z),
                    }
                )

        return {
            "total": len(transactions),
            "anomalies": len(anomalies),
            "threshold": threshold,
            "items": anomalies,
        }

    @staticmethod
    def generate_forecast(user_id: int, months: int = 6) -> Dict:
        """
        Generate simple forecast using linear regression.

        Args:
            user_id: User ID
            months: Months to forecast

        Returns:
            Dict with forecast data
        """
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=365)

        transactions = Transaction.query.filter(
            Transaction.user_id == user_id, Transaction.date >= start_date
        ).all()

        if len(transactions) < 20:
            return {"error": "Insufficient data"}

        # Monthly aggregates
        monthly = defaultdict(lambda: {"income": 0, "expense": 0})
        for tx in transactions:
            key = f"{tx.date.year}-{tx.date.month:02d}"
            if tx.is_income:
                monthly[key]["income"] += float(tx.amount)
            else:
                monthly[key]["expense"] += float(tx.amount)

        months_list = sorted(monthly.keys())
        if len(months_list) < 6:
            return {"error": "Need at least 6 months"}

        # Prepare data for regression
        X = np.array(range(len(months_list))).reshape(-1, 1)
        y_income = [monthly[m]["income"] for m in months_list]
        y_expense = [monthly[m]["expense"] for m in months_list]

        # Fit models
        inc_model = LinearRegression().fit(X, y_income)
        exp_model = LinearRegression().fit(X, y_expense)

        # Forecast
        future_X = np.array(range(len(months_list), len(months_list) + months)).reshape(
            -1, 1
        )
        inc_forecast = inc_model.predict(future_X)
        exp_forecast = exp_model.predict(future_X)

        # Generate periods
        last = datetime.strptime(months_list[-1] + "-01", "%Y-%m-%d")
        forecast = []
        for i in range(months):
            if last.month + i + 1 > 12:
                y = last.year + ((last.month + i) // 12)
                m = ((last.month + i) % 12) + 1
            else:
                y = last.year
                m = last.month + i + 1

            forecast.append(
                {
                    "period": f"{y}-{m:02d}",
                    "income": float(inc_forecast[i]),
                    "expense": float(exp_forecast[i]),
                    "net": float(inc_forecast[i] - exp_forecast[i]),
                }
            )

        return {
            "historical": months_list,
            "forecast": forecast,
            "confidence": 0.8,  # Simplified confidence score
        }

    @staticmethod
    def get_category_insights(user_id: int) -> List[Dict]:
        """
        Get insights for each category.

        Args:
            user_id: User ID

        Returns:
            List of category insights
        """
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=90)

        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start_date,
            Transaction.type == "expense",
        ).all()

        if not transactions:
            return []

        # Group by category
        cat_data = defaultdict(list)
        for tx in transactions:
            if tx.category_id:
                cat_data[tx.category_id].append(float(tx.amount))

        insights = []
        for cat_id, amounts in cat_data.items():
            category = Category.query.get(cat_id)
            if not category:
                continue

            total = sum(amounts)
            avg = total / len(amounts)
            max_val = max(amounts)
            min_val = min(amounts)

            insights.append(
                {
                    "category_id": cat_id,
                    "category": category.name,
                    "color": category.color,
                    "total": total,
                    "avg": avg,
                    "max": max_val,
                    "min": min_val,
                    "count": len(amounts),
                    "frequency": f"{len(amounts)} times in 90 days",
                }
            )

        return sorted(insights, key=lambda x: x["total"], reverse=True)
