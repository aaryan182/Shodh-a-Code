#!/bin/bash

# Frontend Integration Test Runner
# Runs all frontend tests including unit tests, integration tests, and E2E tests

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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
FRONTEND_DIR="frontend"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Node version
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js 18 or higher is required (found Node $node_version)"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    cd "$FRONTEND_DIR"
    
    if npm ci; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    cd ..
}

# Run linting
run_linting() {
    log_info "Running ESLint..."
    
    cd "$FRONTEND_DIR"
    
    if npm run lint; then
        log_success "Linting passed"
    else
        log_warning "Linting issues found"
        # Don't exit on linting errors, just warn
    fi
    
    cd ..
}

# Run type checking
run_type_checking() {
    log_info "Running TypeScript type checking..."
    
    cd "$FRONTEND_DIR"
    
    if npm run type-check; then
        log_success "Type checking passed"
    else
        log_error "Type checking failed"
        exit 1
    fi
    
    cd ..
}

# Run unit tests
run_unit_tests() {
    log_info "Running unit tests..."
    
    cd "$FRONTEND_DIR"
    
    if npm test -- --coverage --watchAll=false --testPathIgnorePatterns=integration; then
        log_success "Unit tests passed"
    else
        log_error "Unit tests failed"
        exit 1
    fi
    
    cd ..
}

# Run integration tests
run_integration_tests() {
    log_info "Running integration tests..."
    
    cd "$FRONTEND_DIR"
    
    if npm run test:integration; then
        log_success "Integration tests passed"
    else
        log_error "Integration tests failed"
        exit 1
    fi
    
    cd ..
}

# Run E2E tests
run_e2e_tests() {
    log_info "Running E2E tests..."
    
    # Check if services are running
    if ! curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
        log_warning "Backend service not running at localhost:8080"
        log_info "Starting services with Docker Compose..."
        
        # Start services
        docker-compose up -d --build
        
        # Wait for services
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f http://localhost:8080/api/health >/dev/null 2>&1 && \
               curl -f http://localhost:3000 >/dev/null 2>&1; then
                log_success "Services are ready"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                log_error "Services failed to start within timeout"
                docker-compose logs
                exit 1
            fi
            
            log_info "Waiting for services... (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        done
    fi
    
    cd "$FRONTEND_DIR"
    
    # Install Playwright browsers
    log_info "Installing Playwright browsers..."
    npx playwright install --with-deps >/dev/null 2>&1 || true
    
    # Run E2E tests
    if npm run test:e2e; then
        log_success "E2E tests passed"
    else
        log_error "E2E tests failed"
        cd ..
        exit 1
    fi
    
    cd ..
}

# Build application
build_application() {
    log_info "Building application..."
    
    cd "$FRONTEND_DIR"
    
    if npm run build; then
        log_success "Build successful"
    else
        log_error "Build failed"
        exit 1
    fi
    
    cd ..
}

# Check bundle size
check_bundle_size() {
    log_info "Checking bundle size..."
    
    cd "$FRONTEND_DIR"
    
    # Run bundle analyzer if available
    if npm list --depth=0 | grep -q "webpack-bundle-analyzer"; then
        npm run analyze >/dev/null 2>&1 || true
        log_info "Bundle analysis completed"
    fi
    
    # Check for large bundles
    if [ -d ".next/static/chunks" ]; then
        large_files=$(find .next/static/chunks -name "*.js" -size +500k 2>/dev/null || true)
        if [ -n "$large_files" ]; then
            log_warning "Large bundle files detected:"
            echo "$large_files" | while read -r file; do
                size=$(du -h "$file" | cut -f1)
                echo "  - $file ($size)"
            done
        fi
    fi
    
    cd ..
}

# Generate test reports
generate_reports() {
    log_info "Generating test reports..."
    
    cd "$FRONTEND_DIR"
    
    # Generate HTML coverage report
    if [ -d "coverage" ]; then
        log_success "Coverage report available at: coverage/lcov-report/index.html"
    fi
    
    # Generate Playwright report
    if [ -d "playwright-report" ]; then
        log_success "Playwright report available at: playwright-report/index.html"
    fi
    
    # Generate test results summary
    if [ -f "test-results.json" ]; then
        log_info "Test results summary:"
        cat test-results.json | grep -E '"numTotalTests"|"numPassedTests"|"numFailedTests"' || true
    fi
    
    cd ..
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Stop Docker services if we started them
    if [ "$STARTED_SERVICES" = "true" ]; then
        log_info "Stopping Docker services..."
        docker-compose down >/dev/null 2>&1 || true
    fi
}

trap cleanup EXIT

# Main execution
main() {
    echo "=============================================="
    echo "  Frontend Integration Test Runner"
    echo "=============================================="
    
    local test_type="${1:-all}"
    local STARTED_SERVICES=false
    
    check_prerequisites
    
    case "$test_type" in
        "lint")
            install_dependencies
            run_linting
            ;;
        "type-check")
            install_dependencies
            run_type_checking
            ;;
        "unit")
            install_dependencies
            run_unit_tests
            ;;
        "integration")
            install_dependencies
            run_integration_tests
            ;;
        "e2e")
            install_dependencies
            STARTED_SERVICES=true
            run_e2e_tests
            ;;
        "build")
            install_dependencies
            build_application
            check_bundle_size
            ;;
        "all")
            install_dependencies
            run_linting
            run_type_checking
            run_unit_tests
            run_integration_tests
            build_application
            check_bundle_size
            STARTED_SERVICES=true
            run_e2e_tests
            generate_reports
            ;;
        *)
            log_error "Invalid test type: $test_type"
            echo "Usage: $0 [lint|type-check|unit|integration|e2e|build|all]"
            exit 1
            ;;
    esac
    
    log_success "Frontend tests completed successfully! 🎉"
}

# Show usage if --help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Frontend Integration Test Runner"
    echo ""
    echo "Usage: $0 [TYPE]"
    echo ""
    echo "Types:"
    echo "  lint         Run ESLint"
    echo "  type-check   Run TypeScript type checking"
    echo "  unit         Run unit tests"
    echo "  integration  Run integration tests"
    echo "  e2e          Run E2E tests (requires services)"
    echo "  build        Build application and check bundle size"
    echo "  all          Run all tests and checks (default)"
    echo ""
    echo "Examples:"
    echo "  $0           # Run all tests"
    echo "  $0 unit      # Run only unit tests"
    echo "  $0 e2e       # Run only E2E tests"
    echo "  $0 build     # Build and analyze bundle"
    exit 0
fi

main "$@"
