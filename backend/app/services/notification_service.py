"""
Notification service for alerts and notifications.
"""

import smtplib
from collections import defaultdict
from datetime import date, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List

from flask import current_app

from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.user import User


class NotificationService:
    """Service for sending notifications."""

    @staticmethod
    def check_budget_alerts(user_id: int) -> List[Dict]:
        """
        Check for budgets that need alerts.

        Args:
            user_id: User ID

        Returns:
            List of budget alerts
        """
        today = date.today()
        budgets = (
            Budget.query.filter_by(user_id=user_id, is_active=True)
            .filter(Budget.year == today.year)
            .all()
        )

        alerts = []
        for b in budgets:
            if b.should_alert:
                alerts.append(
                    {
                        "budget_id": b.id,
                        "category": b.category.name if b.category else "Unknown",
                        "spent": b.spent,
                        "budget": float(b.amount),
                        "percent": b.spent_percentage,
                        "remaining": float(b.amount) - b.spent,
                    }
                )

        return alerts

    @staticmethod
    def check_large_transactions(user_id: int, threshold: float = 1000) -> List[Dict]:
        """
        Check for unusually large transactions.

        Args:
            user_id: User ID
            threshold: Amount threshold

        Returns:
            List of large transactions
        """
        today = date.today()
        week_ago = today - timedelta(days=7)

        large = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= week_ago,
            Transaction.amount >= threshold,
        ).all()

        return [
            {
                "id": t.id,
                "amount": float(t.amount),
                "desc": t.description,
                "date": t.date.isoformat(),
                "category": t.category.name if t.category else None,
            }
            for t in large
        ]

    @staticmethod
    def send_email(to: str, subject: str, body: str, html: bool = False):
        """
        Send email notification.

        Args:
            to: Recipient email
            subject: Email subject
            body: Email body
            html: Whether body is HTML
        """
        # Skip if email not configured
        if not current_app.config.get("MAIL_SERVER"):
            current_app.logger.warning("Email not configured")
            return

        msg = MIMEMultipart()
        msg["From"] = current_app.config.get("MAIL_FROM", "noreply@finviz.com")
        msg["To"] = to
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "html" if html else "plain"))

        try:
            server = smtplib.SMTP(
                current_app.config["MAIL_SERVER"],
                current_app.config.get("MAIL_PORT", 587),
            )
            server.starttls()
            server.login(
                current_app.config["MAIL_USERNAME"], current_app.config["MAIL_PASSWORD"]
            )
            server.send_message(msg)
            server.quit()
            current_app.logger.info(f"Email sent to {to}")
        except Exception as e:
            current_app.logger.error(f"Failed to send email: {e}")

    @staticmethod
    def send_budget_alert(user: User, alert: Dict):
        """Send budget alert email."""
        subject = f"Budget Alert: {alert['category']}"
        body = f"""
        Your budget for {alert['category']} is at {alert['percent']:.1f}%.
        Spent: ${alert['spent']:.2f} of ${alert['budget']:.2f}
        Remaining: ${alert['remaining']:.2f}
        """
        NotificationService.send_email(user.email, subject, body)

    @staticmethod
    def weekly_summary(user_id: int) -> Dict:
        """
        Generate weekly summary for user.

        Args:
            user_id: User ID

        Returns:
            Weekly summary data
        """
        today = date.today()
        week_ago = today - timedelta(days=7)

        tx = Transaction.query.filter(
            Transaction.user_id == user_id, Transaction.date >= week_ago
        ).all()

        income = sum(t.amount for t in tx if t.is_income)
        expense = sum(t.amount for t in tx if t.is_expense)

        # Category breakdown
        cats = defaultdict(float)
        for t in tx:
            if t.is_expense and t.category:
                cats[t.category.name] += float(t.amount)

        return {
            "period": f"{week_ago.isoformat()} to {today.isoformat()}",
            "summary": {
                "income": float(income),
                "expense": float(expense),
                "savings": float(income - expense),
                "count": len(tx),
            },
            "top_categories": [
                {"name": k, "amount": v}
                for k, v in sorted(cats.items(), key=lambda x: x[1], reverse=True)[:3]
            ],
        }
