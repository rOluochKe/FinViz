.PHONY: help install install-dev lint format test test-cov clean \
        docker-up docker-down docker-logs db-init db-migrate db-upgrade \
        db-downgrade seed shell backup restore

# Colors for output
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET := $(shell tput -Txterm sgr0)

help:
	@echo "$(GREEN)Available commands:$(RESET)"
	@echo "  $(YELLOW)install$(RESET)        Install production dependencies"
	@echo "  $(YELLOW)install-dev$(RESET)    Install all dependencies"
	@echo "  $(YELLOW)lint$(RESET)           Run linters"
	@echo "  $(YELLOW)format$(RESET)         Format code"
	@echo "  $(YELLOW)test$(RESET)           Run tests"
	@echo "  $(YELLOW)test-cov$(RESET)        Run tests with coverage"
	@echo "  $(YELLOW)clean$(RESET)           Clean cache files"
	@echo "  $(YELLOW)docker-up$(RESET)       Start Docker services"
	@echo "  $(YELLOW)docker-down$(RESET)      Stop Docker services"
	@echo "  $(YELLOW)docker-logs$(RESET)      View Docker logs"
	@echo "  $(YELLOW)db-init$(RESET)         Initialize database"
	@echo "  $(YELLOW)db-migrate$(RESET)       Create migration"
	@echo "  $(YELLOW)db-upgrade$(RESET)       Apply migrations"
	@echo "  $(YELLOW)db-downgrade$(RESET)     Rollback migration"
	@echo "  $(YELLOW)seed$(RESET)             Seed database"
	@echo "  $(YELLOW)shell$(RESET)            Open Flask shell"
	@echo "  $(YELLOW)backup$(RESET)           Backup database"
	@echo "  $(YELLOW)restore$(RESET)          Restore database"

install:
	uv pip install .

install-dev:
	uv pip install -e ".[dev]"

lint:
	@echo "$(GREEN)Running flake8...$(RESET)"
	flake8 app/ tests/
	@echo "$(GREEN)Running mypy...$(RESET)"
	mypy app/

lint-fix:
	@echo "$(GREEN)Auto-fixing linting issues...$(RESET)"
	@command -v black >/dev/null 2>&1 || { echo "Installing black..."; pip install black; }
	@command -v isort >/dev/null 2>&1 || { echo "Installing isort..."; pip install isort; }
	@command -v autoflake >/dev/null 2>&1 || { echo "Installing autoflake..."; pip install autoflake; }
	@command -v autopep8 >/dev/null 2>&1 || { echo "Installing autopep8..."; pip install autopep8; }
	
	black app/ tests/
	isort app/ tests/
	autoflake --in-place --recursive --remove-all-unused-imports --remove-unused-variables app/ tests/
	autopep8 --in-place --recursive --aggressive app/ tests/
	
	@echo "$(GREEN)✅ Linting fixes applied!$(RESET)"
	@echo "$(YELLOW)Remaining issues (if any):$(RESET)"
	-flake8 app/ tests/ --count --statistics

format:
	@echo "$(GREEN)Running black...$(RESET)"
	black app/ tests/
	@echo "$(GREEN)Running isort...$(RESET)"
	isort app/ tests/

test:
	@echo "$(GREEN)Running tests...$(RESET)"
	pytest -v

test-cov:
	@echo "$(GREEN)Running tests with coverage...$(RESET)"
	pytest --cov=app --cov-report=term --cov-report=html
	@echo "$(GREEN)Coverage report:$(RESET) open htmlcov/index.html"

clean:
	@echo "$(GREEN)Cleaning cache files...$(RESET)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	rm -rf .pytest_cache .mypy_cache .coverage htmlcov
	@echo "$(GREEN)Done!$(RESET)"

docker-up:
	@echo "$(GREEN)Starting Docker services...$(RESET)"
	docker-compose -f docker/docker-compose.yml up -d
	@echo "$(GREEN)Services started!$(RESET)"

docker-down:
	@echo "$(GREEN)Stopping Docker services...$(RESET)"
	docker-compose -f docker/docker-compose.yml down

docker-logs:
	docker-compose -f docker/docker-compose.yml logs -f

db-init:
	@echo "$(GREEN)Initializing database...$(RESET)"
	flask db init

db-migrate:
	@echo "$(GREEN)Creating migration...$(RESET)"
	@read -p "Migration message: " message; \
	flask db migrate -m "$$message"

db-upgrade:
	@echo "$(GREEN)Applying migrations...$(RESET)"
	flask db upgrade

db-downgrade:
	@echo "$(YELLOW)Reverting migration...$(RESET)"
	flask db downgrade

seed:
	@echo "$(GREEN)Seeding database...$(RESET)"
	python scripts/seed.py

shell:
	@echo "$(GREEN)Opening Flask shell...$(RESET)"
	flask shell

backup:
	@echo "$(GREEN)Creating database backup...$(RESET)"
	python scripts/backup.py

restore:
	@echo "$(YELLOW)Restoring database from backup...$(RESET)"
	@read -p "Backup file path: " file; \
	psql finviz_dev < $$file

.PHONY: help install install-dev lint format test test-cov clean \
        docker-up docker-down docker-logs db-init db-migrate db-upgrade \
        db-downgrade seed shell backup restore