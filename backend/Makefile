.PHONY: help install install-dev lint lint-fix format test test-cov test-watch \
        run run-prod run-dev \
        docker-up docker-down docker-logs docker-build docker-shell docker-clean \
        db-init db-migrate db-upgrade db-downgrade db-reset \
        seed shell backup restore \
        hooks-install hooks-run hooks-update hooks-uninstall clean

# Colors for output
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RED := $(shell tput -Txterm setaf 1)
BLUE := $(shell tput -Txterm setaf 4)
RESET := $(shell tput -Txterm sgr0)

# Application
run:
	@echo "$(GREEN)🚀 Starting Flask development server...$(RESET)"
	@echo "$(GREEN)   App will be available at: http://localhost:5000$(RESET)"
	@echo "$(GREEN)   Press Ctrl+C to stop$(RESET)"
	@export FLASK_APP=run.py && \
	 export FLASK_ENV=development && \
	 export FLASK_DEBUG=1 && \
	 flask run --host=0.0.0.0 --port=5000

run-prod:
	@echo "$(GREEN)🚀 Starting production server with Gunicorn...$(RESET)"
	@echo "$(GREEN)   App will be available at: http://localhost:5000$(RESET)"
	@echo "$(GREEN)   Press Ctrl+C to stop$(RESET)"
	@mkdir -p logs
	@gunicorn --bind 0.0.0.0:5000 \
		--workers 4 \
		--worker-class sync \
		--timeout 120 \
		--access-logfile logs/access.log \
		--error-logfile logs/error.log \
		--log-level info \
		wsgi:app

run-dev:
	@echo "$(GREEN)🚀 Starting Flask development server with debug mode...$(RESET)"
	@echo "$(GREEN)   App will be available at: http://localhost:5000$(RESET)"
	@echo "$(GREEN)   Auto-reload enabled, debug mode on$(RESET)"
	@echo "$(GREEN)   Press Ctrl+C to stop$(RESET)"
	@export FLASK_APP=run.py && \
	 export FLASK_ENV=development && \
	 export FLASK_DEBUG=1 && \
	 python run.py


help:
	@echo "$(GREEN)╔════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(GREEN)║           FinViz Pro Backend - Make Commands           ║$(RESET)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(BLUE)Installation & Dependencies:$(RESET)"
	@echo "  $(YELLOW)install$(RESET)        Install production dependencies"
	@echo "  $(YELLOW)install-dev$(RESET)    Install all dependencies (including dev)"
	@echo ""
	@echo "$(BLUE)Running the Application:$(RESET)"  # New section
	@echo "  $(YELLOW)run$(RESET)             Start Flask development server"
	@echo "  $(YELLOW)run-dev$(RESET)         Start Flask with debug mode (auto-reload)"
	@echo "  $(YELLOW)run-prod$(RESET)         Start production server with Gunicorn"
	@echo ""
	@echo "$(BLUE)Code Quality:$(RESET)"
	@echo "  $(YELLOW)lint$(RESET)           Run linters (flake8, mypy)"
	@echo "  $(YELLOW)lint-fix$(RESET)       Auto-fix linting issues"
	@echo "  $(YELLOW)format$(RESET)         Format code (black, isort)"
	@echo ""
	@echo "$(BLUE)Testing:$(RESET)"
	@echo "  $(YELLOW)test$(RESET)           Run tests"
	@echo "  $(YELLOW)test-cov$(RESET)       Run tests with coverage report"
	@echo "  $(YELLOW)test-watch$(RESET)     Run tests in watch mode"
	@echo ""
	@echo "$(BLUE)Docker:$(RESET)"
	@echo "  $(YELLOW)docker-up$(RESET)      Start Docker services"
	@echo "  $(YELLOW)docker-down$(RESET)    Stop Docker services"
	@echo "  $(YELLOW)docker-logs$(RESET)    View Docker logs"
	@echo "  $(YELLOW)docker-build$(RESET)   Rebuild Docker images"
	@echo "  $(YELLOW)docker-shell$(RESET)   Open shell in app container"
	@echo "  $(YELLOW)docker-clean$(RESET)   Clean Docker resources"
	@echo ""
	@echo "$(BLUE)Database:$(RESET)"
	@echo "  $(YELLOW)db-init$(RESET)        Initialize database migrations"
	@echo "  $(YELLOW)db-migrate$(RESET)     Create a new migration"
	@echo "  $(YELLOW)db-upgrade$(RESET)     Apply all migrations"
	@echo "  $(YELLOW)db-downgrade$(RESET)   Rollback last migration"
	@echo "  $(YELLOW)db-reset$(RESET)       Reset database (drop all tables)"
	@echo "  $(YELLOW)seed$(RESET)           Seed database with test data"
	@echo "  $(YELLOW)shell$(RESET)          Open Flask shell"
	@echo "  $(YELLOW)backup$(RESET)         Create database backup"
	@echo "  $(YELLOW)restore$(RESET)        Restore database from backup"
	@echo ""
	@echo "$(BLUE)Git Hooks:$(RESET)"
	@echo "  $(YELLOW)hooks-install$(RESET)  Install pre-commit hooks"
	@echo "  $(YELLOW)hooks-run$(RESET)      Run pre-commit hooks on all files"
	@echo "  $(YELLOW)hooks-update$(RESET)   Update pre-commit hooks"
	@echo "  $(YELLOW)hooks-uninstall$(RESET) Uninstall pre-commit hooks"
	@echo ""
	@echo "$(BLUE)Utilities:$(RESET)"
	@echo "  $(YELLOW)clean$(RESET)          Clean cache files"
	@echo "  $(YELLOW)help$(RESET)           Show this help message"

# Installation
install:
	@echo "$(GREEN)📦 Installing production dependencies...$(RESET)"
	uv pip install .
	@echo "$(GREEN)✅ Installation complete!$(RESET)"

install-dev:
	@echo "$(GREEN)📦 Installing development dependencies...$(RESET)"
	uv pip install -e ".[dev]"
	@echo "$(GREEN)✅ Development installation complete!$(RESET)"

# Code Quality
lint:
	@echo "$(GREEN)🔍 Running flake8...$(RESET)"
	flake8 app/ tests/ --extend-ignore=F403,F405
	@echo "$(GREEN)🔍 Running mypy...$(RESET)"
	mypy app/ --ignore-missing-imports
	@echo "$(GREEN)✅ Linting complete!$(RESET)"

lint-fix:
	@echo "$(GREEN)🔧 Auto-fixing linting issues...$(RESET)"
	@command -v black >/dev/null 2>&1 || { echo "$(YELLOW)Installing black...$(RESET)"; pip install black; }
	@command -v isort >/dev/null 2>&1 || { echo "$(YELLOW)Installing isort...$(RESET)"; pip install isort; }
	@command -v autoflake >/dev/null 2>&1 || { echo "$(YELLOW)Installing autoflake...$(RESET)"; pip install autoflake; }
	@command -v autopep8 >/dev/null 2>&1 || { echo "$(YELLOW)Installing autopep8...$(RESET)"; pip install autopep8; }
	
	@echo "$(GREEN)   Running black...$(RESET)"
	black app/ tests/ --quiet
	@echo "$(GREEN)   Running isort...$(RESET)"
	isort app/ tests/ --quiet
	@echo "$(GREEN)   Running autoflake...$(RESET)"
	autoflake --in-place --recursive --remove-all-unused-imports \
		--remove-unused-variables --ignore-init-module-imports app/ tests/
	@echo "$(GREEN)   Running autopep8...$(RESET)"
	autopep8 --in-place --recursive --aggressive --max-line-length=100 app/ tests/
	
	@echo "$(GREEN)✅ Linting fixes applied!$(RESET)"
	@echo "$(YELLOW)Remaining issues (if any):$(RESET)"
	-flake8 app/ tests/ --count --statistics --extend-ignore=F403,F405

format:
	@echo "$(GREEN)🎨 Formatting code...$(RESET)"
	@echo "$(GREEN)   Running black...$(RESET)"
	black app/ tests/
	@echo "$(GREEN)   Running isort...$(RESET)"
	isort app/ tests/
	@echo "$(GREEN)✅ Formatting complete!$(RESET)"

# Testing
test:
	@echo "$(GREEN)🧪 Running tests...$(RESET)"
	pytest -v

test-cov:
	@echo "$(GREEN)📊 Running tests with coverage...$(RESET)"
	pytest --cov=app --cov-report=term --cov-report=html
	@echo "$(GREEN)✅ Coverage report generated: open htmlcov/index.html$(RESET)"

test-watch:
	@echo "$(GREEN)👀 Running tests in watch mode...$(RESET)"
	ptw -- --cov=app --cov-report=term

# Docker
docker-up:
	@echo "$(GREEN)🐳 Starting Docker services...$(RESET)"
	docker-compose -f docker/docker-compose.yml up -d
	@echo "$(GREEN)✅ Services started!$(RESET)"
	@echo "$(GREEN)   App: http://localhost:5000$(RESET)"
	@echo "$(GREEN)   Health: http://localhost:5000/health$(RESET)"

docker-down:
	@echo "$(GREEN)🐳 Stopping Docker services...$(RESET)"
	docker-compose -f docker/docker-compose.yml down
	@echo "$(GREEN)✅ Services stopped!$(RESET)"

docker-logs:
	@echo "$(GREEN)📋 Showing Docker logs (Ctrl+C to exit)...$(RESET)"
	docker-compose -f docker/docker-compose.yml logs -f

docker-build:
	@echo "$(GREEN)🏗️  Rebuilding Docker images...$(RESET)"
	docker-compose -f docker/docker-compose.yml build --no-cache
	@echo "$(GREEN)✅ Build complete!$(RESET)"

docker-shell:
	@echo "$(GREEN)🐚 Opening shell in app container...$(RESET)"
	docker-compose -f docker/docker-compose.yml exec app /bin/bash

docker-clean:
	@echo "$(GREEN)🧹 Cleaning Docker resources...$(RESET)"
	docker-compose -f docker/docker-compose.yml down -v
	docker system prune -f
	@echo "$(GREEN)✅ Docker cleanup complete!$(RESET)"

# Database
db-init:
	@echo "$(GREEN)🗄️  Initializing database migrations...$(RESET)"
	@if [ ! -d "migrations" ]; then \
		flask db init; \
		echo "$(GREEN)✅ Migrations initialized!$(RESET)"; \
	else \
		echo "$(YELLOW)⚠️  Migrations already initialized$(RESET)"; \
	fi

db-migrate:
	@echo "$(GREEN)📝 Creating migration...$(RESET)"
	@read -p "Enter migration message: " message; \
	if [ -z "$$message" ]; then \
		echo "$(RED)❌ Migration message cannot be empty$(RESET)"; \
		exit 1; \
	fi; \
	flask db migrate -m "$$message"
	@echo "$(GREEN)✅ Migration created!$(RESET)"

db-upgrade:
	@echo "$(GREEN)⬆️  Applying migrations...$(RESET)"
	flask db upgrade
	@echo "$(GREEN)✅ Migrations applied!$(RESET)"

db-downgrade:
	@echo "$(YELLOW)⬇️  Reverting last migration...$(RESET)"
	flask db downgrade
	@echo "$(GREEN)✅ Migration reverted!$(RESET)"

db-reset:
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(RESET)"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "$(YELLOW)Dropping all tables...$(RESET)"; \
		flask db downgrade base; \
		echo "$(GREEN)✅ Database reset!$(RESET)"; \
	else \
		echo "$(GREEN)❌ Operation cancelled$(RESET)"; \
	fi

seed:
	@echo "$(GREEN)🌱 Seeding database...$(RESET)"
	python scripts/seed.py
	@echo "$(GREEN)✅ Database seeded!$(RESET)"

shell:
	@echo "$(GREEN)🐚 Opening Flask shell...$(RESET)"
	flask shell

backup:
	@echo "$(GREEN)💾 Creating database backup...$(RESET)"
	@mkdir -p backups
	python scripts/backup.py
	@echo "$(GREEN)✅ Backup complete!$(RESET)"

restore:
	@echo "$(YELLOW)🔄 Restoring database from backup...$(RESET)"
	@read -p "Enter backup file path: " file; \
	if [ ! -f "$$file" ]; then \
		echo "$(RED)❌ Backup file not found: $$file$(RESET)"; \
		exit 1; \
	fi; \
	psql finviz_dev < $$file
	@echo "$(GREEN)✅ Database restored!$(RESET)"

# Git Hooks
hooks-install:
	@echo "$(GREEN)🔗 Installing pre-commit hooks...$(RESET)"
	@command -v pre-commit >/dev/null 2>&1 || { \
		echo "$(YELLOW)Installing pre-commit...$(RESET)"; \
		pip install pre-commit; \
	}
	pre-commit install
	pre-commit install --hook-type pre-push
	@echo "$(GREEN)✅ Hooks installed! They will run on git commit and git push$(RESET)"

hooks-run:
	@echo "$(GREEN)🏃 Running pre-commit hooks on all files...$(RESET)"
	pre-commit run --all-files

hooks-update:
	@echo "$(GREEN)🔄 Updating pre-commit hooks...$(RESET)"
	pre-commit autoupdate
	@echo "$(GREEN)✅ Hooks updated!$(RESET)"

hooks-uninstall:
	@echo "$(YELLOW)🗑️  Uninstalling pre-commit hooks...$(RESET)"
	pre-commit uninstall
	pre-commit uninstall --hook-type pre-push
	@echo "$(GREEN)✅ Hooks uninstalled!$(RESET)"

# Cleanup
clean:
	@echo "$(GREEN)🧹 Cleaning cache files...$(RESET)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov .coverage 2>/dev/null || true
	@echo "$(GREEN)✅ Cleanup complete!$(RESET)"

# Default target
.DEFAULT_GOAL := help