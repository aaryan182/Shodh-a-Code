#!/bin/bash

# Comprehensive Test Runner for Coding Contest Platform
# This script runs all integration tests in the correct order

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DOCKER_TEST_DIR="docker-integration-tests"
RESULTS_DIR="test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create results directory
mkdir -p "${RESULTS_DIR}/${TIMESTAMP}"

# Cleanup function
cleanup() {
    log_info "Cleaning up test resources..."
    
    # Stop Docker containers
    if docker-compose -f docker-compose.test.yml ps -q >/dev/null 2>&1; then
        docker-compose -f docker-compose.test.yml down -v >/dev/null 2>&1 || true
    fi
    
    if docker-compose ps -q >/dev/null 2>&1; then
        docker-compose down -v >/dev/null 2>&1 || true
    fi
    
    # Clean up test databases
    docker container prune -f >/dev/null 2>&1 || true
    docker volume prune -f >/dev/null 2>&1 || true
    
    log_info "Cleanup completed"
}

# Set trap for cleanup
trap cleanup EXIT

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    local missing_tools=()
    
    command -v java >/dev/null 2>&1 || missing_tools+=("java")
    command -v mvn >/dev/null 2>&1 || missing_tools+=("maven")
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_tools+=("docker-compose")
    command -v python3 >/dev/null 2>&1 || missing_tools+=("python3")
    command -v pip3 >/dev/null 2>&1 || missing_tools+=("pip3")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install the missing tools and try again"
        exit 1
    fi
    
    # Check Java version
    java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$java_version" -lt 17 ]; then
        log_error "Java 17 or higher is required (found Java $java_version)"
        exit 1
    fi
    
    # Check Node version
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js 18 or higher is required (found Node $node_version)"
        exit 1
    fi
    
    # Check Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Function to run backend tests
run_backend_tests() {
    log_info "Starting backend integration tests..."
    
    cd "$BACKEND_DIR"
    
    # Start test database
    log_info "Starting test database..."
    docker run -d --name postgres-test \
        -e POSTGRES_DB=coding_contest_test \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=testpassword \
        -p 5433:5432 \
        postgres:15-alpine
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Set environment variables for tests
    export DB_HOST=localhost
    export DB_PORT=5433
    export DB_NAME=coding_contest_test
    export DB_USERNAME=postgres
    export DB_PASSWORD=testpassword
    
    # Run tests
    log_info "Running backend unit tests..."
    if mvn clean test -Dtest="!**/*IntegrationTest" > "../${RESULTS_DIR}/${TIMESTAMP}/backend-unit-tests.log" 2>&1; then
        log_success "Backend unit tests passed"
    else
        log_error "Backend unit tests failed"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/backend-unit-tests.log"
        return 1
    fi
    
    log_info "Running backend integration tests..."
    if mvn test -Dtest="**/*IntegrationTest" > "../${RESULTS_DIR}/${TIMESTAMP}/backend-integration-tests.log" 2>&1; then
        log_success "Backend integration tests passed"
    else
        log_error "Backend integration tests failed"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/backend-integration-tests.log"
        return 1
    fi
    
    # Copy test results
    cp -r target/surefire-reports "../${RESULTS_DIR}/${TIMESTAMP}/backend-surefire-reports" 2>/dev/null || true
    
    # Stop test database
    docker stop postgres-test >/dev/null 2>&1 || true
    docker rm postgres-test >/dev/null 2>&1 || true
    
    cd ..
    log_success "Backend tests completed successfully"
}

# Function to run frontend tests
run_frontend_tests() {
    log_info "Starting frontend integration tests..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    if npm ci > "../${RESULTS_DIR}/${TIMESTAMP}/frontend-install.log" 2>&1; then
        log_success "Frontend dependencies installed"
    else
        log_error "Failed to install frontend dependencies"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/frontend-install.log"
        return 1
    fi
    
    # Run linting
    log_info "Running frontend linting..."
    if npm run lint > "../${RESULTS_DIR}/${TIMESTAMP}/frontend-lint.log" 2>&1; then
        log_success "Frontend linting passed"
    else
        log_warning "Frontend linting issues found"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/frontend-lint.log"
    fi
    
    # Run type checking
    log_info "Running TypeScript type checking..."
    if npm run type-check > "../${RESULTS_DIR}/${TIMESTAMP}/frontend-typecheck.log" 2>&1; then
        log_success "TypeScript type checking passed"
    else
        log_error "TypeScript type checking failed"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/frontend-typecheck.log"
        return 1
    fi
    
    # Run unit tests
    log_info "Running frontend unit tests..."
    if npm test -- --coverage --watchAll=false --testPathIgnorePatterns=integration > "../${RESULTS_DIR}/${TIMESTAMP}/frontend-unit-tests.log" 2>&1; then
        log_success "Frontend unit tests passed"
    else
        log_error "Frontend unit tests failed"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/frontend-unit-tests.log"
        return 1
    fi
    
    # Run integration tests
    log_info "Running frontend integration tests..."
    if npm run test:integration > "../${RESULTS_DIR}/${TIMESTAMP}/frontend-integration-tests.log" 2>&1; then
        log_success "Frontend integration tests passed"
    else
        log_error "Frontend integration tests failed"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/frontend-integration-tests.log"
        return 1
    fi
    
    # Copy test results
    cp -r coverage "../${RESULTS_DIR}/${TIMESTAMP}/frontend-coverage" 2>/dev/null || true
    cp -r test-results "../${RESULTS_DIR}/${TIMESTAMP}/frontend-test-results" 2>/dev/null || true
    
    cd ..
    log_success "Frontend tests completed successfully"
}

# Function to run E2E tests
run_e2e_tests() {
    log_info "Starting E2E tests..."
    
    # Start services
    log_info "Starting services with Docker Compose..."
    if docker-compose up -d --build > "${RESULTS_DIR}/${TIMESTAMP}/docker-compose-up.log" 2>&1; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        cat "${RESULTS_DIR}/${TIMESTAMP}/docker-compose-up.log"
        return 1
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 60
    
    # Check service health
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8080/api/health >/dev/null 2>&1 && \
           curl -f http://localhost:3000 >/dev/null 2>&1; then
            log_success "All services are ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Services failed to become ready within timeout"
            docker-compose logs > "${RESULTS_DIR}/${TIMESTAMP}/docker-compose-logs.log"
            return 1
        fi
        
        log_info "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    # Run Playwright E2E tests
    cd "$FRONTEND_DIR"
    
    log_info "Installing Playwright browsers..."
    npx playwright install --with-deps > "../${RESULTS_DIR}/${TIMESTAMP}/playwright-install.log" 2>&1 || true
    
    log_info "Running E2E tests..."
    if npm run test:e2e > "../${RESULTS_DIR}/${TIMESTAMP}/e2e-tests.log" 2>&1; then
        log_success "E2E tests passed"
    else
        log_error "E2E tests failed"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/e2e-tests.log"
        cd ..
        return 1
    fi
    
    # Copy E2E test results
    cp -r playwright-report "../${RESULTS_DIR}/${TIMESTAMP}/playwright-report" 2>/dev/null || true
    
    cd ..
    
    # Stop services
    docker-compose down -v >/dev/null 2>&1 || true
    
    log_success "E2E tests completed successfully"
}

# Function to run Docker integration tests
run_docker_integration_tests() {
    log_info "Starting Docker integration tests..."
    
    cd "$DOCKER_TEST_DIR"
    
    # Install Python dependencies
    log_info "Installing Python dependencies..."
    if pip3 install -r requirements.txt > "../${RESULTS_DIR}/${TIMESTAMP}/python-install.log" 2>&1; then
        log_success "Python dependencies installed"
    else
        log_error "Failed to install Python dependencies"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/python-install.log"
        cd ..
        return 1
    fi
    
    # Start test environment
    log_info "Starting Docker test environment..."
    if docker-compose -f docker-compose.test.yml up -d --build > "../${RESULTS_DIR}/${TIMESTAMP}/docker-test-up.log" 2>&1; then
        log_success "Docker test environment started"
    else
        log_error "Failed to start Docker test environment"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/docker-test-up.log"
        cd ..
        return 1
    fi
    
    # Wait for services
    log_info "Waiting for test services to be ready..."
    sleep 120
    
    # Run integration tests
    log_info "Running Docker integration tests..."
    if python3 run_integration_tests.py > "../${RESULTS_DIR}/${TIMESTAMP}/docker-integration-tests.log" 2>&1; then
        log_success "Docker integration tests passed"
    else
        log_error "Docker integration tests failed"
        cat "../${RESULTS_DIR}/${TIMESTAMP}/docker-integration-tests.log"
        cd ..
        return 1
    fi
    
    # Copy results
    cp -r results "../${RESULTS_DIR}/${TIMESTAMP}/docker-integration-results" 2>/dev/null || true
    
    # Stop test environment
    docker-compose -f docker-compose.test.yml down -v >/dev/null 2>&1 || true
    
    cd ..
    log_success "Docker integration tests completed successfully"
}

# Function to generate test report
generate_test_report() {
    log_info "Generating comprehensive test report..."
    
    local report_file="${RESULTS_DIR}/${TIMESTAMP}/test-report.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Integration Test Report - ${TIMESTAMP}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        pre { background: #f8f8f8; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Integration Test Report</h1>
        <p><strong>Timestamp:</strong> ${TIMESTAMP}</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
EOF
    
    # Add test results sections
    local sections=("Backend Tests" "Frontend Tests" "E2E Tests" "Docker Integration Tests")
    local results=("$backend_result" "$frontend_result" "$e2e_result" "$docker_result")
    
    for i in "${!sections[@]}"; do
        local section="${sections[$i]}"
        local result="${results[$i]}"
        local status_class="success"
        local status_text="PASSED"
        
        if [ "$result" != "0" ]; then
            status_class="error"
            status_text="FAILED"
        fi
        
        cat >> "$report_file" << EOF
    <div class="section">
        <h2>${section}</h2>
        <p class="${status_class}"><strong>Status:</strong> ${status_text}</p>
    </div>
EOF
    done
    
    # Add summary
    local total_tests=4
    local passed_tests=$((4 - failed_tests))
    
    cat >> "$report_file" << EOF
    <div class="section">
        <h2>Summary</h2>
        <p><strong>Total Test Suites:</strong> ${total_tests}</p>
        <p><strong>Passed:</strong> <span class="success">${passed_tests}</span></p>
        <p><strong>Failed:</strong> <span class="error">${failed_tests}</span></p>
        <p><strong>Success Rate:</strong> $((passed_tests * 100 / total_tests))%</p>
    </div>
    
    <div class="section">
        <h2>Test Artifacts</h2>
        <ul>
            <li>Backend test results: backend-surefire-reports/</li>
            <li>Frontend coverage: frontend-coverage/</li>
            <li>E2E test results: playwright-report/</li>
            <li>Docker test results: docker-integration-results/</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Test report generated: $report_file"
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    echo "=============================================="
    echo "  Coding Contest Platform - Integration Tests"
    echo "  Timestamp: $TIMESTAMP"
    echo "=============================================="
    
    # Initialize counters
    local failed_tests=0
    local backend_result=0
    local frontend_result=0
    local e2e_result=0
    local docker_result=0
    
    # Check prerequisites
    check_prerequisites
    
    # Run test suites
    log_info "Starting comprehensive integration test suite..."
    
    # Backend tests
    if run_backend_tests; then
        backend_result=0
    else
        backend_result=1
        ((failed_tests++))
    fi
    
    # Frontend tests
    if run_frontend_tests; then
        frontend_result=0
    else
        frontend_result=1
        ((failed_tests++))
    fi
    
    # E2E tests
    if run_e2e_tests; then
        e2e_result=0
    else
        e2e_result=1
        ((failed_tests++))
    fi
    
    # Docker integration tests
    if run_docker_integration_tests; then
        docker_result=0
    else
        docker_result=1
        ((failed_tests++))
    fi
    
    # Generate report
    generate_test_report
    
    # Calculate execution time
    local end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    local minutes=$((execution_time / 60))
    local seconds=$((execution_time % 60))
    
    echo "=============================================="
    echo "  Test Execution Summary"
    echo "=============================================="
    echo "Total execution time: ${minutes}m ${seconds}s"
    echo "Results directory: ${RESULTS_DIR}/${TIMESTAMP}"
    echo ""
    
    if [ $failed_tests -eq 0 ]; then
        log_success "All integration tests passed! 🎉"
        echo "The coding contest platform is ready for deployment."
        exit 0
    else
        log_error "$failed_tests test suite(s) failed ❌"
        echo "Please check the logs in ${RESULTS_DIR}/${TIMESTAMP}/ for details."
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --skip-e2e)
            SKIP_E2E=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-backend    Skip backend integration tests"
            echo "  --skip-frontend   Skip frontend integration tests"
            echo "  --skip-e2e        Skip E2E tests"
            echo "  --skip-docker     Skip Docker integration tests"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                        # Run all tests"
            echo "  $0 --skip-e2e             # Skip E2E tests"
            echo "  $0 --skip-docker --skip-e2e  # Run only backend and frontend tests"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
