.PHONY: lint lint-backend lint-frontend lint-pipelines format format-backend format-frontend format-pipelines test test-backend test-e2e generate-api-client help

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
	@echo "  make test-backend      Run backend unit tests (pytest)"
	@echo "  make test-e2e          Run E2E tests for challenge flow (requires backend running)"
	@echo "  make generate-api-client  Generate OpenAPI spec and frontend TypeScript client"

lint: lint-backend lint-frontend lint-pipelines

lint-backend:
	@echo "Linting backend..."
	cd backend && pre-commit run --all-files || true

lint-frontend:
	@echo "Linting frontend..."
	cd frontend && npm run api && npm run check || true

lint-pipelines:
	@echo "Linting pipelines..."
	cd pipelines && pre-commit run --all-files || true

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

build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build || true

test:
	@echo "Running tests..."
	cd backend && uv run pytest || true
	cd frontend && npm test || true

test-backend:
	@echo "Running backend unit tests..."
	cd backend && uv run pytest

test-e2e:
	@echo "Running E2E tests for challenge flow..."
	@echo "Note: Backend must be running on http://localhost:8000"
	cd e2e && python3 test_challenge_flow.py

generate-api-client:
	@echo "Generating OpenAPI spec and frontend TypeScript client..."
	cd frontend && npm run api

fix: format lint build-frontend
	@echo "Code has been formatted and linted."
