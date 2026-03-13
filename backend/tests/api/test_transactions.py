"""
API tests for transaction endpoints.
"""

from datetime import datetime

from app.models.category import Category
from app.utils.constants import DEFAULT_CATEGORIES


def test_get_transactions(client, auth_headers, test_transactions):
    """Test getting transactions."""
    response = client.get("/api/transactions", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert "transactions" in data
    # Check for pagination fields directly in the response
    assert "page" in data
    assert "pages" in data
    assert "per_page" in data
    assert "total" in data
    assert len(data["transactions"]) > 0


def test_get_transactions_pagination(client, auth_headers, test_transactions):
    """Test pagination."""
    response = client.get("/api/transactions?page=1&per_page=5", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data["transactions"]) == 5
    # Access pagination fields directly
    assert data["page"] == 1
    assert data["per_page"] == 5


def test_get_transactions_filter(client, auth_headers, test_transactions):
    """Test filtering."""
    # Filter by type
    response = client.get("/api/transactions?type=expense", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    for tx in data["transactions"]:
        assert tx["type"] == "expense"


def test_get_single_transaction(client, auth_headers, test_transactions):
    """Test getting single transaction."""
    transaction_id = test_transactions[0].id

    response = client.get(f"/api/transactions/{transaction_id}", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    # Check the actual structure of your API response
    if "transaction" in data:
        assert data["transaction"]["id"] == transaction_id
    else:
        assert data["id"] == transaction_id


def test_create_transaction(
    client, auth_headers, test_user, test_categories, db_session
):
    """Test creating transaction."""

    # Try to find an expense category
    expense_category = None
    for cat in test_categories:
        if cat.type == "expense":
            expense_category = cat
            break

    # If no expense category found, create one with the test user's ID
    if expense_category is None:
        for cat_data in DEFAULT_CATEGORIES:
            if cat_data["type"] == "expense":
                expense_category = Category(
                    name=cat_data["name"],
                    type=cat_data["type"],
                    color=cat_data["color"],
                    icon=cat_data["icon"],
                    user_id=test_user.id,  # Use the actual test user ID
                    is_system=False,
                )
                db_session.add(expense_category)
                db_session.commit()
                db_session.refresh(expense_category)
                break

    assert expense_category is not None, "Could not create or find expense category"

    response = client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "category_id": expense_category.id,
            "amount": 50.00,
            "description": "Test transaction",
            "date": datetime.now().date().isoformat(),
            "type": "expense",
        },
    )

    assert response.status_code == 201
    data = response.get_json()


def test_update_transaction(client, auth_headers, test_transactions):
    """Test updating transaction."""
    transaction_id = test_transactions[0].id

    response = client.put(
        f"/api/transactions/{transaction_id}",
        headers=auth_headers,
        json={"description": "Updated description", "amount": 75.00},
    )

    assert response.status_code == 200
    data = response.get_json()


def test_delete_transaction(client, auth_headers, test_transactions):
    """Test deleting transaction."""
    transaction_id = test_transactions[0].id

    response = client.delete(
        f"/api/transactions/{transaction_id}", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.get_json()["message"] in [
        "Transaction deleted",
        "Transaction deleted successfully",
    ]

    # Verify it's gone
    get_response = client.get(
        f"/api/transactions/{transaction_id}", headers=auth_headers
    )
    assert get_response.status_code == 404


def test_bulk_create_transactions(
    client, auth_headers, test_user, test_categories, db_session
):
    """Test bulk creation."""

    # Find or create expense category
    expense_category = None
    for cat in test_categories:
        if cat.type == "expense":
            expense_category = cat
            break

    if expense_category is None:
        for cat_data in DEFAULT_CATEGORIES:
            if cat_data["type"] == "expense":
                expense_category = Category(
                    name=cat_data["name"],
                    type=cat_data["type"],
                    color=cat_data["color"],
                    icon=cat_data["icon"],
                    user_id=test_user.id,  # Use the actual test user ID
                    is_system=False,
                )
                db_session.add(expense_category)
                break

    # Find or create income category
    income_category = None
    for cat in test_categories:
        if cat.type == "income":
            income_category = cat
            break

    if income_category is None:
        for cat_data in DEFAULT_CATEGORIES:
            if cat_data["type"] == "income":
                income_category = Category(
                    name=cat_data["name"],
                    type=cat_data["type"],
                    color=cat_data["color"],
                    icon=cat_data["icon"],
                    user_id=test_user.id,  # Use the actual test user ID
                    is_system=False,
                )
                db_session.add(income_category)
                break

    db_session.commit()

    # Refresh to get IDs
    if expense_category:
        db_session.refresh(expense_category)
    if income_category:
        db_session.refresh(income_category)

    assert expense_category is not None, "Could not create or find expense category"
    assert income_category is not None, "Could not create or find income category"

    response = client.post(
        "/api/transactions/bulk",
        headers=auth_headers,
        json={
            "transactions": [
                {
                    "category_id": expense_category.id,
                    "amount": 50.00,
                    "description": "Bulk expense",
                    "date": datetime.now().date().isoformat(),
                    "type": "expense",
                },
                {
                    "category_id": income_category.id,
                    "amount": 1000.00,
                    "description": "Bulk income",
                    "date": datetime.now().date().isoformat(),
                    "type": "income",
                },
            ]
        },
    )

    assert response.status_code == 201
    data = response.get_json()
    assert "created" in data or "created_count" in data


def test_transaction_summary(client, auth_headers, test_transactions):
    """Test transaction summary."""
    response = client.get("/api/transactions/summary", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    # Check for your actual response keys
    assert "period" in data
    assert "income" in data
    assert "expense" in data
    assert "savings" in data
    assert "rate" in data
    assert "count" in data
    assert "categories" in data


def test_export_transactions(client, auth_headers, test_transactions):
    """Test transaction export."""
    response = client.get("/api/transactions/export?format=csv", headers=auth_headers)

    assert response.status_code == 200
    # Accept either content type
    assert response.mimetype in ["text/csv", "application/octet-stream"]
    assert "attachment" in response.headers["Content-Disposition"]
