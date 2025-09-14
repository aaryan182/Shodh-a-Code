#!/bin/bash

# Backend Integration Test Runner
# Runs all backend tests including unit tests and integration tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
BACKEND_DIR="backend"
TEST_DB_NAME="coding_contest_test"
TEST_DB_USER="postgres"
TEST_DB_PASSWORD="testpassword"
TEST_DB_PORT="5433"

# Cleanup function
cleanup() {
    log_info "Cleaning up test resources..."
    docker stop postgres-test-backend >/dev/null 2>&1 || true
    docker rm postgres-test-backend >/dev/null 2>&1 || true
    log_info "Cleanup completed"
}

trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v java &> /dev/null; then
        log_error "Java is not installed"
        exit 1
    fi
    
    if ! command -v mvn &> /dev/null; then
        log_error "Maven is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Java version
    java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$java_version" -lt 17 ]; then
        log_error "Java 17 or higher is required (found Java $java_version)"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Start test database
start_test_database() {
    log_info "Starting test database..."
    
    # Check if container already exists
    if docker ps -a --format 'table {{.Names}}' | grep -q postgres-test-backend; then
        log_info "Removing existing test database container..."
        docker stop postgres-test-backend >/dev/null 2>&1 || true
        docker rm postgres-test-backend >/dev/null 2>&1 || true
    fi
    
    # Start PostgreSQL container
    docker run -d \
        --name postgres-test-backend \
        -e POSTGRES_DB="$TEST_DB_NAME" \
        -e POSTGRES_USER="$TEST_DB_USER" \
        -e POSTGRES_PASSWORD="$TEST_DB_PASSWORD" \
        -p "$TEST_DB_PORT:5432" \
        postgres:15-alpine
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec postgres-test-backend pg_isready -U "$TEST_DB_USER" >/dev/null 2>&1; then
            log_success "Database is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Database failed to start within timeout"
            docker logs postgres-test-backend
            exit 1
        fi
        
        sleep 2
        ((attempt++))
    done
}

# Run unit tests
run_unit_tests() {
    log_info "Running backend unit tests..."
    
    cd "$BACKEND_DIR"
    
    if mvn clean test -Dtest="!**/*IntegrationTest"; then
        log_success "Unit tests passed"
    else
        log_error "Unit tests failed"
        exit 1
    fi
    
    cd ..
}

# Run integration tests
run_integration_tests() {
    log_info "Running backend integration tests..."
    
    cd "$BACKEND_DIR"
    
    # Set environment variables for integration tests
    export DB_HOST=localhost
    export DB_PORT="$TEST_DB_PORT"
    export DB_NAME="$TEST_DB_NAME"
    export DB_USERNAME="$TEST_DB_USER"
    export DB_PASSWORD="$TEST_DB_PASSWORD"
    export SPRING_PROFILES_ACTIVE=test
    
    if mvn test -Dtest="**/*IntegrationTest"; then
        log_success "Integration tests passed"
    else
        log_error "Integration tests failed"
        exit 1
    fi
    
    cd ..
}

# Run code quality checks
run_code_quality_checks() {
    log_info "Running code quality checks..."
    
    cd "$BACKEND_DIR"
    
    # Run Checkstyle
    log_info "Running Checkstyle..."
    if mvn checkstyle:check; then
        log_success "Checkstyle passed"
    else
        log_error "Checkstyle failed"
        exit 1
    fi
    
    # Run SpotBugs
    log_info "Running SpotBugs..."
    if mvn spotbugs:check; then
        log_success "SpotBugs passed"
    else
        log_error "SpotBugs found issues"
        exit 1
    fi
    
    cd ..
}

# Generate test reports
generate_reports() {
    log_info "Generating test reports..."
    
    cd "$BACKEND_DIR"
    
    # Generate Surefire report
    mvn surefire-report:report-only >/dev/null 2>&1 || true
    
    # Generate JaCoCo coverage report
    mvn jacoco:report >/dev/null 2>&1 || true
    
    log_success "Test reports generated"
    log_info "Surefire reports: target/site/surefire-report.html"
    log_info "Coverage report: target/site/jacoco/index.html"
    
    cd ..
}

# Main execution
main() {
    echo "=============================================="
    echo "  Backend Integration Test Runner"
    echo "=============================================="
    
    check_prerequisites
    start_test_database
    
    # Run tests based on arguments
    case "${1:-all}" in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "quality")
            run_code_quality_checks
            ;;
        "all")
            run_unit_tests
            run_integration_tests
            run_code_quality_checks
            generate_reports
            ;;
        *)
            log_error "Invalid argument: $1"
            echo "Usage: $0 [unit|integration|quality|all]"
            exit 1
            ;;
    esac
    
    log_success "Backend tests completed successfully! 🎉"
}

# Show usage if --help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Backend Integration Test Runner"
    echo ""
    echo "Usage: $0 [TYPE]"
    echo ""
    echo "Types:"
    echo "  unit         Run only unit tests"
    echo "  integration  Run only integration tests"
    echo "  quality      Run code quality checks"
    echo "  all          Run all tests and checks (default)"
    echo ""
    echo "Examples:"
    echo "  $0           # Run all tests"
    echo "  $0 unit      # Run only unit tests"
    echo "  $0 integration # Run only integration tests"
    exit 0
fi

main "$@"
