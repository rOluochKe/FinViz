"""
Tests for validation error handling.
"""


def test_validation_error_missing_field(client):
    """Test validation error for missing required field."""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            # Missing email and password
        },
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Validation error" in data["error"]


def test_validation_error_invalid_email(client):
    """Test validation error for invalid email."""
    response = client.post(
        "/api/auth/register",
        json={"username": "newuser", "email": "not-an-email", "password": "Test123!@#"},
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Validation error" in data["error"]


def test_validation_error_invalid_amount(client, auth_headers, test_categories):
    """Test validation error for invalid amount."""
    category = test_categories[0]

    response = client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "category_id": category.id,
            "amount": -50,  # Negative amount
            "description": "Test",
            "date": "2024-01-01",
            "type": "expense",
        },
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Validation error" in data["error"]


def test_validation_error_invalid_date(client, auth_headers, test_categories):
    """Test validation error for invalid date."""
    category = test_categories[0]

    response = client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "category_id": category.id,
            "amount": 50,
            "description": "Test",
            "date": "invalid-date",
            "type": "expense",
        },
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Validation error" in data["error"]


def test_validation_error_enum(client, auth_headers, test_categories):
    """Test validation error for invalid enum value."""
    category = test_categories[0]

    response = client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "category_id": category.id,
            "amount": 50,
            "description": "Test",
            "date": "2024-01-01",
            "type": "invalid_type",
        },
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Validation error" in data["error"]


def test_validation_error_category_type_mismatch(client, auth_headers, test_categories):
    """Test validation error for category-type mismatch."""
    # Get income category
    income_category = next(c for c in test_categories if c.type.value == "income")

    # Try to create expense transaction with income category
    response = client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "category_id": income_category.id,
            "amount": 50,
            "description": "Test",
            "date": "2024-01-01",
            "type": "expense",
        },
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Validation error" in data["error"]
