.PHONY: lint lint-backend lint-frontend lint-pipelines format format-backend format-frontend format-pipelines test help

help:
	@echo "Available commands:"
	@echo "  make lint              Run all linters (backend, frontend, pipelines)"
	@echo "  make lint-backend      Run backend linting (ruff, mypy)"
	@echo "  make lint-frontend     Run frontend linting (prettier)"
	@echo "  make lint-pipelines    Run pipelines linting (ruff, mypy)"
	@echo "  make format            Format all code (backend, frontend, pipelines)"
	@echo "  make format-backend    Format backend code (ruff)"
	@echo "  make format-frontend   Format frontend code (prettier)"
	@echo "  make format-pipelines  Format pipelines code (ruff)"
	@echo "  make test              Run all tests"

lint: lint-backend lint-frontend lint-pipelines

lint-backend:
	@echo "Linting backend..."
	cd backend && uv run ruff check .
	cd backend && uv run mypy .

lint-frontend:
	@echo "Linting frontend..."
	cd frontend && npx prettier --check src/**/*.{ts,tsx} || true

lint-pipelines:
	@echo "Linting pipelines..."
	cd pipelines && uv run ruff check .
	cd pipelines && uv run mypy flows/ main.py || true

format: format-backend format-frontend format-pipelines

format-backend:
	@echo "Formatting backend..."
	cd backend && uv run ruff format .
	cd backend && uv run ruff check --fix .

format-frontend:
	@echo "Formatting frontend..."
	cd frontend && npm run format || true

format-pipelines:
	@echo "Formatting pipelines..."
	cd pipelines && uv run ruff format .
	cd pipelines && uv run ruff check --fix .

test:
	@echo "Running tests..."
	cd backend && uv run pytest || true
	cd frontend && npm test || true
