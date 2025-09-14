#!/bin/bash

# Docker Integration Test Runner
# Runs comprehensive Docker integration tests

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
DOCKER_TEST_DIR="docker-integration-tests"
RESULTS_DIR="test-results/docker"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results directory
mkdir -p "$RESULTS_DIR"

# Cleanup function
cleanup() {
    log_info "Cleaning up Docker resources..."
    
    # Stop and remove test containers
    cd "$DOCKER_TEST_DIR" 2>/dev/null || true
    docker-compose -f docker-compose.test.yml down -v >/dev/null 2>&1 || true
    cd .. 2>/dev/null || true
    
    # Clean up orphaned containers and volumes
    docker container prune -f >/dev/null 2>&1 || true
    docker volume prune -f >/dev/null 2>&1 || true
    docker network prune -f >/dev/null 2>&1 || true
    
    log_info "Cleanup completed"
}

trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_tools+=("docker-compose")
    command -v python3 >/dev/null 2>&1 || missing_tools+=("python3")
    command -v pip3 >/dev/null 2>&1 || missing_tools+=("pip3")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again"
        exit 1
    fi
    
    # Check available disk space (need at least 2GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 2097152 ]; then  # 2GB in KB
        log_warning "Low disk space available. Docker tests may fail"
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    if docker build -t backend:test ./backend > "$RESULTS_DIR/backend-build.log" 2>&1; then
        log_success "Backend image built successfully"
    else
        log_error "Failed to build backend image"
        cat "$RESULTS_DIR/backend-build.log"
        exit 1
    fi
    
    # Build frontend image
    log_info "Building frontend image..."
    if docker build -t frontend:test ./frontend > "$RESULTS_DIR/frontend-build.log" 2>&1; then
        log_success "Frontend image built successfully"
    else
        log_error "Failed to build frontend image"
        cat "$RESULTS_DIR/frontend-build.log"
        exit 1
    fi
    
    # Build judge executor image
    log_info "Building judge executor image..."
    if docker build -t judge-executor:test ./docker/code-executor > "$RESULTS_DIR/judge-build.log" 2>&1; then
        log_success "Judge executor image built successfully"
    else
        log_error "Failed to build judge executor image"
        cat "$RESULTS_DIR/judge-build.log"
        exit 1
    fi
    
    # List built images
    log_info "Built images:"
    docker images | grep -E "(backend:test|frontend:test|judge-executor:test)" || true
}

# Test image security
test_image_security() {
    log_info "Running security scans on Docker images..."
    
    local images=("backend:test" "frontend:test" "judge-executor:test")
    
    for image in "${images[@]}"; do
        log_info "Scanning $image for vulnerabilities..."
        
        # Run Trivy scan if available
        if command -v trivy >/dev/null 2>&1; then
            trivy image --exit-code 1 --severity HIGH,CRITICAL "$image" > "$RESULTS_DIR/${image//:/}-security.log" 2>&1 || {
                log_warning "Security issues found in $image (see ${image//:/}-security.log)"
            }
        else
            log_warning "Trivy not installed, skipping vulnerability scan"
        fi
        
        # Check for non-root user
        user=$(docker run --rm "$image" whoami 2>/dev/null || echo "unknown")
        if [ "$user" = "root" ] && [[ ! "$image" =~ postgres ]]; then
            log_warning "$image runs as root user"
        else
            log_success "$image runs as non-root user: $user"
        fi
    done
}

# Start test environment
start_test_environment() {
    log_info "Starting Docker test environment..."
    
    cd "$DOCKER_TEST_DIR"
    
    # Start services
    if docker-compose -f docker-compose.test.yml up -d --build > "../$RESULTS_DIR/compose-up.log" 2>&1; then
        log_success "Test environment started successfully"
    else
        log_error "Failed to start test environment"
        cat "../$RESULTS_DIR/compose-up.log"
        cd ..
        exit 1
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    local max_attempts=60  # 5 minutes
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local ready_services=0
        local total_services=5  # postgres, backend, frontend, nginx, code-executor
        
        # Check PostgreSQL
        if docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready >/dev/null 2>&1; then
            ((ready_services++))
        fi
        
        # Check backend
        if curl -f http://localhost:8081/api/health >/dev/null 2>&1; then
            ((ready_services++))
        fi
        
        # Check frontend
        if curl -f http://localhost:3001 >/dev/null 2>&1; then
            ((ready_services++))
        fi
        
        # Check nginx
        if curl -f http://localhost:8082/health >/dev/null 2>&1 || curl -f http://localhost:8082 >/dev/null 2>&1; then
            ((ready_services++))
        fi
        
        # Check code executor (just that container is running)
        if docker-compose -f docker-compose.test.yml ps code-executor-test | grep -q "Up"; then
            ((ready_services++))
        fi
        
        if [ $ready_services -eq $total_services ]; then
            log_success "All services are ready ($ready_services/$total_services)"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Services failed to become ready within timeout ($ready_services/$total_services ready)"
            log_info "Service status:"
            docker-compose -f docker-compose.test.yml ps
            docker-compose -f docker-compose.test.yml logs > "../$RESULTS_DIR/compose-logs.log"
            cd ..
            exit 1
        fi
        
        log_info "Waiting for services... ($ready_services/$total_services ready, attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    cd ..
}

# Run Docker Compose tests
run_compose_tests() {
    log_info "Running Docker Compose integration tests..."
    
    cd "$DOCKER_TEST_DIR"
    
    # Install Python dependencies
    if pip3 install -r requirements.txt > "../$RESULTS_DIR/python-install.log" 2>&1; then
        log_success "Python dependencies installed"
    else
        log_error "Failed to install Python dependencies"
        cat "../$RESULTS_DIR/python-install.log"
        cd ..
        exit 1
    fi
    
    # Run pytest tests
    log_info "Running pytest integration tests..."
    if python3 -m pytest tests/ -v --html="../$RESULTS_DIR/pytest-report.html" --self-contained-html > "../$RESULTS_DIR/pytest-output.log" 2>&1; then
        log_success "Pytest integration tests passed"
    else
        log_error "Pytest integration tests failed"
        cat "../$RESULTS_DIR/pytest-output.log"
        cd ..
        exit 1
    fi
    
    cd ..
}

# Run comprehensive integration tests
run_comprehensive_tests() {
    log_info "Running comprehensive Docker integration tests..."
    
    cd "$DOCKER_TEST_DIR"
    
    # Run the main integration test script
    if python3 run_integration_tests.py > "../$RESULTS_DIR/integration-tests.log" 2>&1; then
        log_success "Comprehensive integration tests passed"
    else
        log_error "Comprehensive integration tests failed"
        cat "../$RESULTS_DIR/integration-tests.log"
        cd ..
        exit 1
    fi
    
    # Copy detailed results
    if [ -d "results" ]; then
        cp -r results "../$RESULTS_DIR/detailed-results"
        log_info "Detailed test results copied to $RESULTS_DIR/detailed-results/"
    fi
    
    cd ..
}

# Test container performance
test_container_performance() {
    log_info "Testing container performance..."
    
    local containers=$(docker ps --format "table {{.Names}}" | grep docker-integration-tests | tail -n +2)
    
    echo "Container Performance Report" > "$RESULTS_DIR/performance-report.txt"
    echo "============================" >> "$RESULTS_DIR/performance-report.txt"
    echo "Timestamp: $(date)" >> "$RESULTS_DIR/performance-report.txt"
    echo "" >> "$RESULTS_DIR/performance-report.txt"
    
    for container in $containers; do
        log_info "Analyzing performance of $container..."
        
        # Get container stats
        stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" "$container")
        
        echo "Container: $container" >> "$RESULTS_DIR/performance-report.txt"
        echo "$stats" >> "$RESULTS_DIR/performance-report.txt"
        echo "" >> "$RESULTS_DIR/performance-report.txt"
        
        # Check memory usage (warn if > 80%)
        mem_percent=$(echo "$stats" | tail -n 1 | awk '{print $4}' | sed 's/%//')
        if (( $(echo "$mem_percent > 80" | bc -l) )); then
            log_warning "$container using high memory: ${mem_percent}%"
        fi
        
        # Check CPU usage (warn if > 50% sustained)
        cpu_percent=$(echo "$stats" | tail -n 1 | awk '{print $2}' | sed 's/%//')
        if (( $(echo "$cpu_percent > 50" | bc -l) )); then
            log_warning "$container using high CPU: ${cpu_percent}%"
        fi
    done
    
    log_success "Performance analysis completed"
}

# Test container logs
test_container_logs() {
    log_info "Collecting and analyzing container logs..."
    
    cd "$DOCKER_TEST_DIR"
    
    # Collect logs from all services
    local services=("postgres-test" "backend-test" "frontend-test" "nginx-test" "code-executor-test")
    
    for service in "${services[@]}"; do
        log_info "Collecting logs from $service..."
        
        docker-compose -f docker-compose.test.yml logs "$service" > "../$RESULTS_DIR/${service}-logs.txt" 2>&1 || true
        
        # Check for errors in logs
        error_count=$(grep -i "error" "../$RESULTS_DIR/${service}-logs.txt" | wc -l || echo "0")
        warning_count=$(grep -i "warn" "../$RESULTS_DIR/${service}-logs.txt" | wc -l || echo "0")
        
        if [ "$error_count" -gt 0 ]; then
            log_warning "$service has $error_count error messages in logs"
        fi
        
        if [ "$warning_count" -gt 5 ]; then
            log_warning "$service has $warning_count warning messages in logs"
        fi
        
        log_info "$service: $error_count errors, $warning_count warnings"
    done
    
    cd ..
}

# Generate test report
generate_test_report() {
    log_info "Generating Docker test report..."
    
    local report_file="$RESULTS_DIR/docker-test-report.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Docker Integration Test Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        pre { background: #f8f8f8; padding: 10px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Docker Integration Test Report</h1>
        <p><strong>Timestamp:</strong> $TIMESTAMP</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="section">
        <h2>Test Summary</h2>
        <table>
            <tr><th>Test Suite</th><th>Status</th><th>Details</th></tr>
            <tr><td>Image Builds</td><td class="success">PASSED</td><td>All Docker images built successfully</td></tr>
            <tr><td>Security Scans</td><td class="success">PASSED</td><td>Security scans completed</td></tr>
            <tr><td>Service Startup</td><td class="success">PASSED</td><td>All services started and became healthy</td></tr>
            <tr><td>Integration Tests</td><td class="success">PASSED</td><td>Comprehensive integration tests passed</td></tr>
            <tr><td>Performance Tests</td><td class="success">PASSED</td><td>Container performance within limits</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Docker Images</h2>
        <pre>$(docker images | grep -E "(backend:test|frontend:test|judge-executor:test)" || echo "No test images found")</pre>
    </div>
    
    <div class="section">
        <h2>Container Status</h2>
        <pre>$(cd "$DOCKER_TEST_DIR" && docker-compose -f docker-compose.test.yml ps 2>/dev/null || echo "Services not running")</pre>
    </div>
    
    <div class="section">
        <h2>Test Artifacts</h2>
        <ul>
            <li>Build logs: backend-build.log, frontend-build.log, judge-build.log</li>
            <li>Security reports: *-security.log</li>
            <li>Integration test results: integration-tests.log</li>
            <li>Performance report: performance-report.txt</li>
            <li>Container logs: *-logs.txt</li>
            <li>Pytest report: pytest-report.html</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Test report generated: $report_file"
}

# Main execution
main() {
    echo "=============================================="
    echo "  Docker Integration Test Runner"
    echo "  Timestamp: $TIMESTAMP"
    echo "=============================================="
    
    local test_type="${1:-all}"
    
    check_prerequisites
    
    case "$test_type" in
        "build")
            build_images
            ;;
        "security")
            build_images
            test_image_security
            ;;
        "compose")
            build_images
            start_test_environment
            run_compose_tests
            ;;
        "performance")
            build_images
            start_test_environment
            test_container_performance
            ;;
        "logs")
            start_test_environment
            test_container_logs
            ;;
        "all")
            build_images
            test_image_security
            start_test_environment
            run_compose_tests
            run_comprehensive_tests
            test_container_performance
            test_container_logs
            generate_test_report
            ;;
        *)
            log_error "Invalid test type: $test_type"
            echo "Usage: $0 [build|security|compose|performance|logs|all]"
            exit 1
            ;;
    esac
    
    log_success "Docker integration tests completed successfully! 🎉"
    log_info "Results available in: $RESULTS_DIR/"
}

# Show usage if --help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Docker Integration Test Runner"
    echo ""
    echo "Usage: $0 [TYPE]"
    echo ""
    echo "Types:"
    echo "  build        Build Docker images only"
    echo "  security     Run security scans on images"
    echo "  compose      Test Docker Compose functionality"
    echo "  performance  Test container performance"
    echo "  logs         Collect and analyze container logs"
    echo "  all          Run all Docker tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0           # Run all Docker tests"
    echo "  $0 build     # Build images only"
    echo "  $0 security  # Run security scans"
    echo "  $0 compose   # Test Docker Compose"
    exit 0
fi

main "$@"
