# Coding Contest Platform Makefile

.PHONY: help build up down logs clean install test lint format

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services"
	@echo "  down      - Stop all services"
	@echo "  logs      - Show logs from all services"
	@echo "  clean     - Clean up Docker resources"
	@echo "  install   - Install dependencies for local development"
	@echo "  test      - Run tests"
	@echo "  lint      - Run linting"
	@echo "  format    - Format code"
	@echo "  dev       - Start development environment"
	@echo "  prod      - Start production environment"

# Docker commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Development commands
install:
	@echo "Installing backend dependencies..."
	cd backend && mvn clean install -DskipTests
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

test:
	@echo "Running backend tests..."
	cd backend && mvn test
	@echo "Running frontend tests..."
	cd frontend && npm test

lint:
	@echo "Linting backend..."
	cd backend && mvn checkstyle:check
	@echo "Linting frontend..."
	cd frontend && npm run lint

format:
	@echo "Formatting frontend code..."
	cd frontend && npm run lint:fix

# Environment specific commands
dev:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

prod:
	docker-compose --profile production up -d

# Database commands
db-reset:
	docker-compose down postgres
	docker volume rm $(shell basename $(CURDIR))_postgres_data
	docker-compose up -d postgres

# Monitoring
status:
	docker-compose ps

health:
	@echo "Checking service health..."
	@curl -f http://localhost:8080/api/actuator/health || echo "Backend health check failed"
	@curl -f http://localhost:3000 || echo "Frontend health check failed"

# Backup
backup-db:
	docker-compose exec postgres pg_dump -U postgres coding_contest_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db:
	@read -p "Enter backup file path: " backup_file; \
	docker-compose exec -T postgres psql -U postgres coding_contest_db < $$backup_file
