"""
Constants used throughout the application.
"""


class HTTP_STATUS:
    """HTTP status codes."""

    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    UNPROCESSABLE_ENTITY = 422
    TOO_MANY_REQUESTS = 429
    INTERNAL_SERVER_ERROR = 500
    SERVICE_UNAVAILABLE = 503


class TransactionType:
    """Transaction type constants."""

    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"

    @classmethod
    def choices(cls):
        return [cls.INCOME, cls.EXPENSE, cls.TRANSFER]

    @classmethod
    def is_valid(cls, value):
        return value in cls.choices()


class CategoryType:
    """Category type constants."""

    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"

    @classmethod
    def choices(cls):
        return [cls.INCOME, cls.EXPENSE, cls.TRANSFER]

    @classmethod
    def is_valid(cls, value):
        return value in cls.choices()


class BudgetPeriod:
    """Budget period constants."""

    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

    @classmethod
    def choices(cls):
        return [cls.MONTHLY, cls.QUARTERLY, cls.YEARLY]

    @classmethod
    def is_valid(cls, value):
        return value in cls.choices()


class UserRoles:
    """User role constants."""

    ADMIN = "admin"
    USER = "user"

    @classmethod
    def choices(cls):
        return [cls.ADMIN, cls.USER]

    @classmethod
    def is_valid(cls, value):
        return value in cls.choices()


class AccountStatus:
    """Account status constants."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

    @classmethod
    def choices(cls):
        return [cls.ACTIVE, cls.INACTIVE, cls.SUSPENDED]

    @classmethod
    def is_valid(cls, value):
        return value in cls.choices()


class ExportFormat:
    """Export format constants."""

    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    PDF = "pdf"

    @classmethod
    def choices(cls):
        return [cls.CSV, cls.JSON, cls.EXCEL, cls.PDF]

    @classmethod
    def is_valid(cls, value):
        return value in cls.choices()


class DateRange:
    """Common date ranges."""

    TODAY = "today"
    YESTERDAY = "yesterday"
    THIS_WEEK = "this_week"
    LAST_WEEK = "last_week"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    THIS_QUARTER = "this_quarter"
    LAST_QUARTER = "last_quarter"
    THIS_YEAR = "this_year"
    LAST_YEAR = "last_year"
    LAST_30_DAYS = "last_30_days"
    LAST_90_DAYS = "last_90_days"
    LAST_12_MONTHS = "last_12_months"
    CUSTOM = "custom"

    @classmethod
    def choices(cls):
        return [
            cls.TODAY,
            cls.YESTERDAY,
            cls.THIS_WEEK,
            cls.LAST_WEEK,
            cls.THIS_MONTH,
            cls.LAST_MONTH,
            cls.THIS_QUARTER,
            cls.LAST_QUARTER,
            cls.THIS_YEAR,
            cls.LAST_YEAR,
            cls.LAST_30_DAYS,
            cls.LAST_90_DAYS,
            cls.LAST_12_MONTHS,
            cls.CUSTOM,
        ]


# Default system categories
DEFAULT_CATEGORIES = [
    # Income categories
    {"name": "Salary", "type": "income", "color": "#28a745", "icon": "briefcase"},
    {"name": "Freelance", "type": "income", "color": "#17a2b8", "icon": "laptop"},
    {"name": "Investment", "type": "income", "color": "#ffc107", "icon": "graph-up"},
    {"name": "Gifts", "type": "income", "color": "#e83e8c", "icon": "gift"},
    {
        "name": "Refunds",
        "type": "income",
        "color": "#6c757d",
        "icon": "arrow-return-left",
    },
    # Expense categories
    {"name": "Groceries", "type": "expense", "color": "#dc3545", "icon": "basket"},
    {"name": "Rent", "type": "expense", "color": "#fd7e14", "icon": "house"},
    {"name": "Utilities", "type": "expense", "color": "#6c757d", "icon": "lightning"},
    {"name": "Entertainment", "type": "expense", "color": "#e83e8c", "icon": "film"},
    {"name": "Transportation", "type": "expense", "color": "#20c997", "icon": "car"},
    {"name": "Healthcare", "type": "expense", "color": "#007bff", "icon": "heart"},
    {"name": "Dining Out", "type": "expense", "color": "#6610f2", "icon": "cup-straw"},
    {"name": "Shopping", "type": "expense", "color": "#d63384", "icon": "bag"},
    {"name": "Education", "type": "expense", "color": "#0dcaf0", "icon": "book"},
    {"name": "Insurance", "type": "expense", "color": "#198754", "icon": "shield"},
    {"name": "Subscriptions", "type": "expense", "color": "#6f42c1", "icon": "repeat"},
    {"name": "Travel", "type": "expense", "color": "#0d6efd", "icon": "airplane"},
    {"name": "Pets", "type": "expense", "color": "#e83e8c", "icon": "heart"},
    {"name": "Gym", "type": "expense", "color": "#20c997", "icon": "dumbbell"},
    # Transfer categories
    {
        "name": "Transfer",
        "type": "transfer",
        "color": "#6f42c1",
        "icon": "arrow-left-right",
    },
    {
        "name": "Credit Card Payment",
        "type": "transfer",
        "color": "#dc3545",
        "icon": "credit-card",
    },
]

# Validation constants
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128
USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 50
EMAIL_MAX_LENGTH = 100
DESCRIPTION_MAX_LENGTH = 200
NOTES_MAX_LENGTH = 5000

# Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Cache timeouts (in seconds)
CACHE_SHORT = 60  # 1 minute
CACHE_MEDIUM = 300  # 5 minutes
CACHE_LONG = 3600  # 1 hour
CACHE_DAY = 86400  # 24 hours

# File upload
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf", "csv", "xlsx", "xls", "txt"}

# Date formats
DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%d-%m-%Y",
    "%Y%m%d",
    "%b %d, %Y",
    "%B %d, %Y",
]

# Currency symbols
CURRENCY_SYMBOLS = {
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "CAD": "C$",
    "AUD": "A$",
    "CHF": "Fr",
    "CNY": "¥",
    "INR": "₹",
}
