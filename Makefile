# QuantEnergx Makefile
# Common development and deployment tasks

.PHONY: help install dev build test lint clean docker-up docker-down deploy

# Default target
help:
	@echo "Available commands:"
	@echo "  install          - Install all dependencies"
	@echo "  dev              - Start development servers"
	@echo "  dev-backend      - Start backend development server"
	@echo "  dev-frontend     - Start frontend development server"
	@echo "  build            - Build all projects"
	@echo "  build-backend    - Build backend project"
	@echo "  build-frontend   - Build frontend project"
	@echo "  test             - Run all tests"
	@echo "  test-backend     - Run backend tests"
	@echo "  test-frontend    - Run frontend tests"
	@echo "  lint             - Run linting on all projects"
	@echo "  lint-fix         - Fix linting issues automatically"
	@echo "  security-check   - Run security audits"
	@echo "  clean            - Clean build artifacts and dependencies"
	@echo "  docker-up        - Start Docker services"
	@echo "  docker-down      - Stop Docker services"
	@echo "  setup            - Initial project setup"
	@echo "  verify           - Verify setup and run basic tests"

# Installation
install:
	@echo "Installing root dependencies..."
	npm install
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "All dependencies installed successfully!"

# Development servers
dev: docker-up
	@echo "Starting all development servers..."
	concurrently "make dev-backend" "make dev-frontend"

dev-backend: docker-up
	@echo "Starting backend development server..."
	cd backend && npm run dev || npm start

dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm start

# Build targets
build: build-backend build-frontend

build-backend:
	@echo "Building backend..."
	cd backend && npm run build

build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build

# Testing
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend && npm test

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test

test-coverage:
	@echo "Running tests with coverage..."
	cd backend && npm run test:coverage
	cd frontend && npm run test:coverage

test-e2e:
	@echo "Running end-to-end tests..."
	npm run test:e2e

# Linting and formatting
lint: lint-backend lint-frontend

lint-backend:
	@echo "Linting backend..."
	cd backend && npm run lint

lint-frontend:
	@echo "Linting frontend..."
	cd frontend && npm run lint

lint-fix:
	@echo "Fixing linting issues..."
	cd backend && npm run lint:fix
	cd frontend && npm run lint:fix

format:
	@echo "Formatting code..."
	cd backend && npm run format
	cd frontend && npm run format

# Security
security-check:
	@echo "Running security audits..."
	npm audit
	cd backend && npm audit
	cd frontend && npm audit

security-fix:
	@echo "Fixing security vulnerabilities..."
	npm audit fix
	cd backend && npm audit fix
	cd frontend && npm audit fix

# Docker operations
docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

docker-clean:
	@echo "Cleaning Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Database operations
db-migrate:
	@echo "Running database migrations..."
	cd backend && npm run migrate

db-seed:
	@echo "Seeding database..."
	cd backend && npm run seed

db-reset:
	@echo "Resetting database..."
	cd backend && npm run db:reset

# Environment setup
setup: install docker-up
	@echo "Setting up environment files..."
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "Created backend/.env"; fi
	@if [ ! -f frontend/.env ]; then cp frontend/.env.example frontend/.env; echo "Created frontend/.env"; fi
	@echo "Setup complete! Edit .env files as needed."

verify: setup
	@echo "Verifying setup..."
	@echo "Checking Docker services..."
	docker-compose ps
	@echo "Running basic tests..."
	make test
	@echo "Verification complete!"

# Cleanup
clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf backend/build
	rm -rf frontend/build
	rm -rf frontend/dist
	rm -rf node_modules/.cache
	@echo "Clean complete!"

clean-all: clean
	@echo "Removing all dependencies..."
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	@echo "All dependencies removed!"

# Deployment helpers
deploy-staging:
	@echo "Deploying to staging..."
	git push origin develop

deploy-production:
	@echo "Deploying to production..."
	git push origin main

# Quality checks
quality: lint security-check test

# Development workflow
dev-check: quality
	@echo "Running pre-commit checks..."
	@echo "All checks passed!"

# Utility commands
logs-backend:
	@echo "Showing backend logs..."
	cd backend && tail -f logs/app.log

logs-frontend:
	@echo "Showing frontend logs..."
	cd frontend && npm run logs

status:
	@echo "Project status:"
	@echo "Backend port: 3001"
	@echo "Frontend port: 3000"
	@echo "Database: PostgreSQL (localhost:5432)"
	@echo "Redis: localhost:6379"
	docker-compose ps