#!/bin/bash

# Docker Environment Setup Script
# This script sets up the Docker environment for the coding contest platform

set -e

echo "🚀 Setting up Coding Contest Platform Docker Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p data/postgres data/redis data/submissions data/results logs/backend docker/nginx/ssl

print_success "Directories created"

# Set proper permissions
print_status "Setting directory permissions..."
chmod 755 data logs
chmod 777 data/submissions data/results
chmod 755 logs/backend

print_success "Permissions set"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp docker/environment.example .env
    print_warning "Please edit .env file with your configuration before starting services"
else
    print_warning ".env file already exists, skipping template copy"
fi

# Make scripts executable
print_status "Making scripts executable..."
chmod +x docker/scripts/*.sh
chmod +x docker/code-executor/scripts/*.sh

print_success "Scripts made executable"

# Build Docker images
print_status "Building Docker images..."
if docker-compose build; then
    print_success "Docker images built successfully"
else
    print_error "Failed to build Docker images"
    exit 1
fi

# Create Docker network if it doesn't exist
print_status "Creating Docker network..."
docker network create coding-contest-network 2>/dev/null || print_warning "Network already exists"

print_success "Setup completed successfully!"

echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start development environment: docker-compose --profile development up -d"
echo "3. Or start production environment: docker-compose --profile production up -d"
echo ""
echo "🔗 Access URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8080/api"
echo "- Database Admin (dev): http://localhost:8081"
echo ""
echo "📚 For more information, see docker/README.md"
