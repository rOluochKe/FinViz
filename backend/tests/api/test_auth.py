"""
API tests for authentication endpoints.
"""


def test_register(client):
    """Test user registration."""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "Test123!@#",
            "first_name": "New",
            "last_name": "User",
        },
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "User created successfully"
    assert "tokens" in data
    assert data["user"]["username"] == "newuser"


def test_register_duplicate_username(client, test_user):
    """Test registration with existing username."""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "another@example.com",
            "password": "Test123!@#",
        },
    )

    assert response.status_code == 409
    data = response.get_json()
    assert "Username already exists" in data["error"]


def test_register_weak_password(client):
    """Test registration with weak password."""
    response = client.post(
        "/api/auth/register",
        json={"username": "newuser", "email": "new@example.com", "password": "weak"},
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Validation error" in data["error"]


def test_login_success(client, test_user):
    """Test successful login."""
    response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "Test123!@#"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert "tokens" in data
    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]


def test_login_wrong_password(client, test_user):
    """Test login with wrong password."""
    response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "wrong"}
    )

    assert response.status_code == 401
    data = response.get_json()
    assert "Invalid username or password" in data["error"]


def test_refresh_token(client, test_user):
    """Test token refresh."""
    # Login to get refresh token
    login_response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "Test123!@#"}
    )
    refresh_token = login_response.get_json()["tokens"]["refresh_token"]

    # Use refresh token
    response = client.post(
        "/api/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data


def test_get_current_user(client, auth_headers):
    """Test getting current user."""
    response = client.get("/api/auth/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["username"] == "testuser"


def test_update_current_user(client, auth_headers):
    """Test updating user."""
    response = client.put(
        "/api/auth/me",
        headers=auth_headers,
        json={"first_name": "Updated", "preferences": {"theme": "dark"}},
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["first_name"] == "Updated"
    assert data["user"]["preferences"]["theme"] == "dark"


def test_change_password(client, auth_headers):
    """Test password change."""
    response = client.post(
        "/api/auth/change-password",
        headers=auth_headers,
        json={"current_password": "Test123!@#", "new_password": "NewTest123!@#"},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Password changed successfully"
