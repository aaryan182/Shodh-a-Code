#!/bin/bash

# Docker Environment Start Script
# This script starts the coding contest platform services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default profile
PROFILE="development"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -p, --profile PROFILE   Docker Compose profile (development|production)"
            echo "  -h, --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Start development environment"
            echo "  $0 -p production       # Start production environment"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🚀 Starting Coding Contest Platform - Profile: $PROFILE"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found, using default values"
    print_warning "Consider copying docker/environment.example to .env and customizing it"
fi

# Check if required directories exist
if [ ! -d "data" ] || [ ! -d "logs" ]; then
    print_warning "Required directories not found. Running setup..."
    ./docker/scripts/setup.sh
fi

# Start services based on profile
print_status "Starting services with profile: $PROFILE"

if [ "$PROFILE" = "production" ]; then
    docker-compose --profile production up -d
elif [ "$PROFILE" = "development" ]; then
    docker-compose --profile development up -d
else
    print_error "Invalid profile: $PROFILE. Use 'development' or 'production'"
    exit 1
fi

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
print_status "Checking service health..."

services=("postgres" "redis" "backend" "frontend")
if [ "$PROFILE" = "development" ]; then
    services+=("adminer")
fi
if [ "$PROFILE" = "production" ]; then
    services+=("nginx")
fi

all_healthy=true
for service in "${services[@]}"; do
    if docker-compose ps "$service" | grep -q "healthy\|Up"; then
        print_success "$service is running"
    else
        print_warning "$service is not healthy yet"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    print_success "All services are running!"
else
    print_warning "Some services are still starting up. Check status with: docker-compose ps"
fi

# Display access URLs
echo ""
echo "🔗 Service URLs:"
if [ "$PROFILE" = "development" ]; then
    echo "- Frontend: http://localhost:${FRONTEND_PORT:-3000}"
    echo "- Backend API: http://localhost:${BACKEND_PORT:-8080}/api"
    echo "- Database Admin: http://localhost:${ADMINER_PORT:-8081}"
    echo "- Health Check: http://localhost:${BACKEND_PORT:-8080}/api/actuator/health"
elif [ "$PROFILE" = "production" ]; then
    echo "- Application: http://localhost:${NGINX_PORT:-80}"
    echo "- API: http://localhost:${NGINX_PORT:-80}/api"
    echo "- Health Check: http://localhost:${NGINX_PORT:-80}/api/actuator/health"
fi

echo ""
echo "📊 Useful commands:"
echo "- View logs: docker-compose logs -f [service_name]"
echo "- Check status: docker-compose ps"
echo "- Stop services: docker-compose down"
echo "- Restart service: docker-compose restart [service_name]"

print_success "Platform started successfully!"
