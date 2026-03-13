# FinViz Backend

Finance Analytics Dashboard Backend API built with Flask, PostgreSQL, and Redis.

## ✨ Features

- ✅ <strong>User Authentication</strong> - JWT-based authentication with refresh tokens
- ✅ <strong>Transaction Management</strong> - Full CRUD operations with filtering and pagination
- ✅ <strong>Category Management</strong> - Hierarchical categories with system defaults
- ✅ <strong>Budget Planning</strong> - Monthly and yearly budgets with alerts and projections
- ✅ <strong>Financial Analytics</strong> - Spending patterns, anomaly detection, and forecasts
- ✅ <strong>Dashboard</strong> - Real-time KPIs, charts, and insights
- ✅ <strong>Data Export/Import</strong> - CSV, JSON, Excel support
- ✅ <strong>Comprehensive Reporting</strong> - Monthly, yearly, and category reports
- ✅ <strong>API Documentation</strong> - Interactive Swagger UI
- ✅ <strong>Docker Support</strong> - Easy containerized deployment
- ✅ <strong>Comprehensive Testing</strong> - Unit, integration, and API tests

## 🛠️ Tech Stack

### Backend

- <strong>Framework:</strong> Flask 3.0 with Flask-RESTX
- <strong>Database:</strong> PostgreSQL 15 with SQLAlchemy 2.0
- <strong>Cache:</strong> Redis 7
- <strong>Authentication:</strong> JWT with Flask-JWT-Extended
- <strong>Serialization:</strong> Marshmallow
- <strong>Data Processing:</strong> Pandas, NumPy, Scikit-learn
- <strong>Task Queue:</strong> Redis (for rate limiting)

### DevOps

- <strong>Container:</strong> Docker & Docker Compose
- <strong>CI/CD:</strong> GitHub Actions
- <strong>Monitoring:</strong> Health check endpoints, Prometheus metrics
- <strong>Logging:</strong> Rotating file logs with JSON support

### Testing

- <strong>Framework:</strong> Pytest
- <strong>Coverage:</strong> Pytest-cov
- <strong>Fixtures:</strong> Factory Boy, Faker
- <strong>Mocking:</strong> Pytest-mock

## 📋 Prerequisites

### Local Setup

- Python 3.11 or higher
- PostgreSQL 15
- Redis 7
- UV package manager

### Docker Setup

- Docker Engine 24.0+
- Docker Compose V2

## 🚀 Quick Start

### Using Docker (Recommended)

```
# Clone the repository
git clone git@github.com:rOluochKe/FinViz.git
cd FinViz/backend

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start all services
make docker-up

# Run database migrations
make db-upgrade

# Seed database with test data (optional)
make seed

# Access the API
# API: http://localhost:5000
# Docs: http://localhost:5000/api/docs
# Health: http://localhost:5000/health
```

### Without Docker (Local Setup)

```
# Clone the repository
git clone git@github.com:rOluochKe/FinViz.git
cd finviz-pro-backend

# Install UV package manager
pip install uv

# Create and activate virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
make install-dev

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# Create databases
createdb finviz_dev
createdb finviz_test

# Run migrations
make db-upgrade

# Seed database (optional)
make seed

# Run the app
make run
```

## 🏃 Running the Application

### Development Server

```
# Start Flask development server
make run

# Start with auto-reload (debug mode)
make run-dev

# Access the application
# API: http://localhost:5000
# Docs: http://localhost:5000/api/docs
```

### Production Server

```
# Start with Gunicorn
make run-prod
```

### Docker

```
# Start all services
make docker-up

# View logs
make docker-logs

# Stop services
make docker-down

# Rebuild images
make docker-build

# Open shell in app container
make docker-shell

# Clean Docker resources
make docker-clean
```

## 🗄️ Database Management

### Migrations

```
# Initialize migrations (first time only)
make db-init

# Create a new migration
make db-migrate

# Apply migrations
make db-upgrade

# Rollback last migration
make db-downgrade

# Reset database (dangerous!)
make db-reset
```

### Seeding & Backup

```
# Seed database with test data
make seed

# Create database backup
make backup

# Restore from backup
make restore

# Open Flask shell
make shell
```

## 🧪 Testing

### Running Tests

```
# Run all tests
make test

# Run tests with coverage report
make test-cov

# Run tests in watch mode
make test-watch

# Run specific test file
make test-file FILE=tests/api/test_auth.py

# Run tests matching pattern
make test-match PATTERN=transaction
```

## 📚 API Documentation

### Interactive Documentation

```
Swagger UI: http://localhost:5000/api/docs
```

### 🔧 Makefile Commands

The project includes a comprehensive Makefile for all common tasks:

### Installation & Dependencies

```
make install        # Install production dependencies
make install-dev    # Install all dependencies (including dev)
```

### Running the Application

```
make run            # Start Flask development server
make run-dev        # Start with debug mode (auto-reload)
make run-prod       # Start production server with Gunicorn
```

### Code Quality

```
make lint           # Run linters (flake8, mypy)
make lint-fix       # Auto-fix linting issues
make format         # Format code (black, isort)
```

### Testing

```
make test           # Run all tests
make test-cov       # Run tests with coverage
make test-watch     # Run tests in watch mode
make test-file      # Run specific test file
make test-match     # Run tests matching pattern
```

### Docker

```
make docker-up      # Start Docker services
make docker-down    # Stop Docker services
make docker-logs    # View Docker logs
make docker-build   # Rebuild Docker images
make docker-shell   # Open shell in app container
make docker-clean   # Clean Docker resources
```

### Database

```
make db-init        # Initialize migrations
make db-migrate     # Create migration
make db-upgrade     # Apply migrations
make db-downgrade   # Rollback migration
make db-reset       # Reset database
make seed           # Seed database
make shell          # Open Flask shell
make backup         # Create backup
make restore        # Restore backup
```

### Git Hooks

```
make hooks-install    # Install pre-commit hooks
make hooks-run        # Run hooks on all files
make hooks-update     # Update hooks
make hooks-uninstall  # Uninstall hooks
```

### Utilities

```
make clean         # Clean cache files
make help          # Show all commands
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install development dependencies (`make install-dev`)
4. Make your changes
5. Run tests (`make test`)
6. Format code (`make format`)
7. Commit changes (`git commit -m 'Add amazing feature'`)
8. Push to branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Development Guidelines

- Write tests for new features
- Update documentation
- Follow PEP 8 style guide
- Use type hints
- Keep functions focused and small

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📞 Contact

Project Lead: Raymond Oluoch
GitHub Issues: [Issue Tracker](https://github.com/rOluochKe/FinViz/issues)
Documentation: [Wiki](https://github.com/rOluochKe/FinViz/wiki)

Built with ❤️ for the IU International University Portfolio Project
