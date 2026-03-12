"""
API tests for transaction endpoints.
"""

from datetime import datetime


def test_get_transactions(client, auth_headers, test_transactions):
    """Test getting transactions."""
    response = client.get("/api/transactions", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert "data" in data
    assert "pagination" in data
    assert len(data["data"]) > 0


def test_get_transactions_pagination(client, auth_headers, test_transactions):
    """Test pagination."""
    response = client.get("/api/transactions?page=1&per_page=5", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data["data"]) == 5
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["per_page"] == 5


def test_get_transactions_filter(client, auth_headers, test_transactions):
    """Test filtering."""
    # Filter by type
    response = client.get("/api/transactions?type=expense", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    for tx in data["data"]:
        assert tx["type"] == "expense"


def test_get_single_transaction(client, auth_headers, test_transactions):
    """Test getting single transaction."""
    transaction_id = test_transactions[0].id

    response = client.get(f"/api/transactions/{transaction_id}", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data["data"]["id"] == transaction_id


def test_create_transaction(client, auth_headers, test_categories):
    """Test creating transaction."""
    category = next(c for c in test_categories if c.type.value == "expense")

    response = client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "category_id": category.id,
            "amount": 50.00,
            "description": "Test transaction",
            "date": datetime.now().date().isoformat(),
            "type": "expense",
        },
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "Transaction created successfully"
    assert data["data"]["amount"] == 50.00


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
    assert data["data"]["description"] == "Updated description"
    assert data["data"]["amount"] == 75.00


def test_delete_transaction(client, auth_headers, test_transactions):
    """Test deleting transaction."""
    transaction_id = test_transactions[0].id

    response = client.delete(
        f"/api/transactions/{transaction_id}", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Transaction deleted successfully"

    # Verify it's gone
    get_response = client.get(
        f"/api/transactions/{transaction_id}", headers=auth_headers
    )
    assert get_response.status_code == 404


def test_bulk_create_transactions(client, auth_headers, test_categories):
    """Test bulk creation."""
    expense_category = next(c for c in test_categories if c.type.value == "expense")
    income_category = next(c for c in test_categories if c.type.value == "income")

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
    assert data["created_count"] == 2


def test_transaction_summary(client, auth_headers, test_transactions):
    """Test transaction summary."""
    response = client.get("/api/transactions/summary", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert "total_income" in data
    assert "total_expense" in data
    assert "net_savings" in data


def test_export_transactions(client, auth_headers, test_transactions):
    """Test transaction export."""
    response = client.get("/api/transactions/export?format=csv", headers=auth_headers)

    assert response.status_code == 200
    assert response.mimetype == "text/csv"
    assert "attachment" in response.headers["Content-Disposition"]
