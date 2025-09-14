#!/bin/bash

# Docker Environment Stop Script
# This script stops the coding contest platform services

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

# Default options
REMOVE_VOLUMES=false
REMOVE_IMAGES=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        -i|--images)
            REMOVE_IMAGES=true
            shift
            ;;
        -a|--all)
            REMOVE_VOLUMES=true
            REMOVE_IMAGES=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --volumes          Remove volumes (WARNING: This will delete all data)"
            echo "  -i, --images           Remove built images"
            echo "  -a, --all              Remove volumes and images"
            echo "  -h, --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Stop services only"
            echo "  $0 -v                  # Stop services and remove volumes"
            echo "  $0 -i                  # Stop services and remove images"
            echo "  $0 -a                  # Stop services, remove volumes and images"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🛑 Stopping Coding Contest Platform"

# Stop all services
print_status "Stopping all services..."
docker-compose down

if [ "$REMOVE_VOLUMES" = true ]; then
    print_warning "Removing volumes (this will delete all data)..."
    read -p "Are you sure you want to remove all volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        print_warning "All volumes removed"
    else
        print_status "Volume removal cancelled"
    fi
fi

if [ "$REMOVE_IMAGES" = true ]; then
    print_status "Removing built images..."
    
    # Get image names
    backend_image=$(docker-compose config | grep "image:" | grep "backend" | awk '{print $2}' || echo "")
    frontend_image=$(docker-compose config | grep "image:" | grep "frontend" | awk '{print $2}' || echo "")
    executor_image=$(docker-compose config | grep "image:" | grep "code-executor" | awk '{print $2}' || echo "")
    
    # Remove images if they exist
    for image in "$backend_image" "$frontend_image" "$executor_image"; do
        if [ -n "$image" ] && docker image inspect "$image" >/dev/null 2>&1; then
            docker rmi "$image"
            print_status "Removed image: $image"
        fi
    done
    
    # Also remove dangling images
    dangling_images=$(docker images -f "dangling=true" -q)
    if [ -n "$dangling_images" ]; then
        docker rmi $dangling_images
        print_status "Removed dangling images"
    fi
fi

# Clean up unused Docker resources
print_status "Cleaning up unused Docker resources..."
docker system prune -f

print_success "Platform stopped successfully!"

echo ""
echo "📋 Status:"
echo "- All services stopped"
if [ "$REMOVE_VOLUMES" = true ]; then
    echo "- All data volumes removed"
fi
if [ "$REMOVE_IMAGES" = true ]; then
    echo "- Built images removed"
fi

echo ""
echo "🔄 To start again:"
echo "- Development: ./docker/scripts/start.sh"
echo "- Production: ./docker/scripts/start.sh -p production"
