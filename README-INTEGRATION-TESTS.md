# Integration Tests Documentation

This document provides comprehensive information about the integration tests for the Coding Contest Platform.

## Overview

The integration test suite consists of four main categories:

1. **Backend Integration Tests** - Test Spring Boot application components, API endpoints, and database operations
2. **Frontend Integration Tests** - Test React components, user journeys, and API integration
3. **Docker Integration Tests** - Test containerized services, docker-compose setup, and cross-service communication
4. **End-to-End Tests** - Test complete user workflows using Playwright

## Quick Start

### Run All Tests

```bash
./scripts/run-all-tests.sh
```

### Run Individual Test Suites

```bash
# Backend tests only
./scripts/run-backend-tests.sh

# Frontend tests only
./scripts/run-frontend-tests.sh

# Docker tests only
./scripts/run-docker-tests.sh
```

## Prerequisites

### System Requirements

- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Python 3.11+
- Git

### Development Tools

- Maven 3.6+
- npm 8+
- curl (for health checks)

### Installation Commands

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install openjdk-17-jdk nodejs npm docker.io docker-compose python3 python3-pip curl

# macOS (using Homebrew)
brew install openjdk@17 node docker docker-compose python@3.11 curl

# Windows (using Chocolatey)
choco install openjdk17 nodejs docker-desktop python3 curl
```

## Test Structure

### Backend Tests (`backend/src/test/`)

```
backend/src/test/
├── java/com/codingcontest/platform/
│   ├── BaseIntegrationTest.java          # Base test class with common setup
│   ├── TestConfiguration.java            # Test-specific Spring configuration
│   ├── controller/
│   │   └── ContestControllerTest.java     # API endpoint tests
│   ├── service/
│   │   ├── SubmissionProcessingTest.java  # Async processing tests
│   │   └── CodeJudgeServiceTest.java      # Docker execution tests
│   └── repository/
│       └── DatabaseIntegrationTest.java   # Database integration tests
└── resources/
    └── application-test.yml               # Test configuration
```

#### Key Test Classes

- **ContestControllerTest**: Tests all REST API endpoints including contest retrieval, user registration, leaderboard, and problem access
- **SubmissionProcessingTest**: Tests the complete submission workflow from code submission to result processing
- **CodeJudgeServiceTest**: Tests Docker-based code execution with actual containers (requires Docker)
- **DatabaseIntegrationTest**: Tests entity relationships, queries, and data persistence

### Frontend Tests (`frontend/src/__tests__/`)

```
frontend/src/__tests__/
├── mocks/
│   ├── handlers.ts                       # MSW API mock handlers
│   ├── server.ts                         # MSW server setup
│   └── setup.ts                          # Test environment setup
├── integration/
│   ├── api.integration.test.ts           # API client integration tests
│   ├── components.integration.test.tsx   # Component interaction tests
│   └── user-journey.integration.test.tsx # End-to-end user flow tests
└── setup.ts                             # Global test setup
```

#### Key Test Features

- **API Integration**: Tests all API endpoints with proper error handling and retry logic
- **Component Integration**: Tests component interactions, state management, and real-time updates
- **User Journey**: Tests complete user workflows from registration to code submission
- **Mock Service Worker**: Provides realistic API responses for consistent testing

### Docker Tests (`docker-integration-tests/`)

```
docker-integration-tests/
├── docker-compose.test.yml               # Test environment configuration
├── Dockerfile.test-runner                # Test runner container
├── requirements.txt                      # Python dependencies
├── run_integration_tests.py              # Main test orchestrator
└── tests/
    ├── test_docker_compose.py            # Docker Compose functionality tests
    └── test_performance.py               # Performance and load tests
```

#### Test Coverage

- **Service Health**: Verifies all services start correctly and pass health checks
- **Database Schema**: Validates database migrations and table creation
- **API Endpoints**: Tests core API functionality in containerized environment
- **Service Communication**: Tests inter-service communication and networking
- **Performance**: Basic performance metrics and resource usage
- **Security**: Container security configuration and vulnerability scanning

### E2E Tests (`frontend/e2e/`)

```
frontend/e2e/
├── contest-flow.spec.ts                  # Complete contest participation flow
└── playwright.config.ts                 # Playwright configuration
```

## Running Tests

### Backend Tests

```bash
# All backend tests
./scripts/run-backend-tests.sh

# Unit tests only
./scripts/run-backend-tests.sh unit

# Integration tests only
./scripts/run-backend-tests.sh integration

# Code quality checks only
./scripts/run-backend-tests.sh quality
```

### Frontend Tests

```bash
# All frontend tests
./scripts/run-frontend-tests.sh

# Linting only
./scripts/run-frontend-tests.sh lint

# Type checking only
./scripts/run-frontend-tests.sh type-check

# Unit tests only
./scripts/run-frontend-tests.sh unit

# Integration tests only
./scripts/run-frontend-tests.sh integration

# E2E tests only
./scripts/run-frontend-tests.sh e2e

# Build and bundle analysis
./scripts/run-frontend-tests.sh build
```

### Docker Tests

```bash
# All Docker tests
./scripts/run-docker-tests.sh

# Build images only
./scripts/run-docker-tests.sh build

# Security scans only
./scripts/run-docker-tests.sh security

# Docker Compose tests only
./scripts/run-docker-tests.sh compose

# Performance tests only
./scripts/run-docker-tests.sh performance

# Log analysis only
./scripts/run-docker-tests.sh logs
```

### Comprehensive Test Suite

```bash
# Run everything
./scripts/run-all-tests.sh

# Skip specific test suites
./scripts/run-all-tests.sh --skip-e2e
./scripts/run-all-tests.sh --skip-docker --skip-e2e
```

## Test Configuration

### Environment Variables

```bash
# Backend Test Configuration
export DB_HOST=localhost
export DB_PORT=5433
export DB_NAME=coding_contest_test
export DB_USERNAME=postgres
export DB_PASSWORD=testpassword
export SPRING_PROFILES_ACTIVE=test

# Frontend Test Configuration
export NODE_ENV=test
export NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Docker Test Configuration
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Test Data

Tests use the following test data:

- **Test User**: `testuser` / `test@example.com`
- **Test Contest**: "Test Contest" with 1-3 hours duration
- **Test Problem**: "Two Sum" with example test cases
- **Test Database**: `coding_contest_test` (PostgreSQL)

## CI/CD Integration

### GitHub Actions

The project includes comprehensive GitHub Actions workflows:

- **Main CI/CD Pipeline** (`.github/workflows/ci-cd.yml`): Runs on pushes to main/develop
- **Pull Request Validation** (`.github/workflows/pull-request.yml`): Runs on all PRs

### Pipeline Stages

1. **Code Quality**: Linting, formatting, type checking
2. **Unit Tests**: Fast unit tests for both backend and frontend
3. **Integration Tests**: Comprehensive integration test suite
4. **E2E Tests**: Full user journey testing
5. **Docker Tests**: Container and orchestration testing
6. **Security Scans**: Vulnerability scanning and security checks
7. **Build & Deploy**: Image building and deployment (main branch only)
8. **Performance Tests**: Load testing against deployed environment

### Required Secrets

```yaml
# Docker Hub
DOCKER_USERNAME: your-docker-username
DOCKER_PASSWORD: your-docker-password

# SonarCloud (optional)
SONAR_TOKEN: your-sonar-token

# Slack Notifications (optional)
SLACK_WEBHOOK_URL: your-slack-webhook
```

## Test Reports

### Generated Reports

All test runs generate comprehensive reports:

- **Backend**: Surefire reports (`target/site/surefire-report.html`)
- **Frontend**: Coverage reports (`coverage/lcov-report/index.html`)
- **E2E**: Playwright reports (`playwright-report/index.html`)
- **Docker**: Custom HTML reports (`test-results/docker/docker-test-report.html`)

### Test Results Location

```
test-results/
├── YYYYMMDD_HHMMSS/                     # Timestamped results
│   ├── backend-surefire-reports/        # Backend test results
│   ├── frontend-coverage/               # Frontend coverage
│   ├── playwright-report/               # E2E test results
│   ├── docker-integration-results/      # Docker test results
│   └── test-report.html                 # Comprehensive report
```

## Troubleshooting

### Common Issues

#### Backend Tests

**Database Connection Issues**

```bash
# Check if PostgreSQL test container is running
docker ps | grep postgres-test

# Check database logs
docker logs postgres-test-backend
```

**Maven Build Issues**

```bash
# Clean and rebuild
cd backend
mvn clean install -DskipTests

# Check Java version
java -version
```

#### Frontend Tests

**Node Module Issues**

```bash
# Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Playwright Issues**

```bash
# Reinstall browsers
npx playwright install --with-deps
```

#### Docker Tests

**Docker Issues**

```bash
# Check Docker daemon
docker info

# Clean up Docker resources
docker system prune -a -f
docker volume prune -f
```

**Port Conflicts**

```bash
# Check for port conflicts
netstat -tulpn | grep -E ':(3000|5432|8080|8081|8082)'

# Kill conflicting processes
sudo kill -9 $(lsof -t -i:8080)
```

### Performance Issues

**Slow Tests**

- Increase timeouts in test configurations
- Run tests with fewer parallel workers
- Check available system resources (RAM, CPU, disk)

**Docker Resource Limits**

- Increase Docker memory allocation
- Clean up unused containers and images
- Monitor disk space usage

### Debug Mode

Enable debug logging for detailed test output:

```bash
# Backend
export LOGGING_LEVEL_ROOT=DEBUG
./scripts/run-backend-tests.sh

# Frontend
export DEBUG=true
./scripts/run-frontend-tests.sh

# Docker
export DOCKER_LOG_LEVEL=debug
./scripts/run-docker-tests.sh
```

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain the scenario being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test edge cases** and error conditions
4. **Mock external dependencies** appropriately
5. **Keep tests independent** and idempotent

### Test Data Management

1. **Use test-specific data** that doesn't conflict with development
2. **Clean up test data** after each test run
3. **Use realistic test data** that represents actual usage
4. **Avoid hardcoded values** in favor of configurable test data

### Performance Considerations

1. **Run fast tests first** (unit tests before integration tests)
2. **Parallelize tests** where possible
3. **Use test containers** for database tests
4. **Cache dependencies** to speed up builds

## Contributing

When adding new tests:

1. **Follow existing patterns** and conventions
2. **Add tests to appropriate test suites**
3. **Update documentation** for new test scenarios
4. **Ensure tests pass in CI/CD pipeline**
5. **Add proper error handling** and cleanup

### Test Review Checklist

- [ ] Tests are independent and can run in any order
- [ ] Tests clean up resources after execution
- [ ] Tests have appropriate timeouts
- [ ] Tests cover both happy path and error scenarios
- [ ] Tests are properly categorized (unit vs integration)
- [ ] Test names clearly describe the scenario
- [ ] Tests use appropriate assertion messages

## Support

For issues with integration tests:

1. Check the troubleshooting section above
2. Review test logs in the `test-results/` directory
3. Verify all prerequisites are installed correctly
4. Check system resources (memory, disk space)
5. Ensure Docker is running and properly configured

## Metrics and Monitoring

### Test Coverage Goals

- **Backend**: >80% line coverage, >70% branch coverage
- **Frontend**: >75% line coverage, >65% branch coverage
- **Integration**: All critical user paths covered
- **E2E**: All main user journeys covered

### Performance Benchmarks

- **Backend Tests**: Complete in <5 minutes
- **Frontend Tests**: Complete in <3 minutes
- **Docker Tests**: Complete in <10 minutes
- **E2E Tests**: Complete in <8 minutes
- **Full Suite**: Complete in <20 minutes

### Success Criteria

Tests should:

- Have >95% success rate in CI/CD
- Complete within time benchmarks
- Provide clear failure messages
- Generate comprehensive reports
- Clean up all resources properly
