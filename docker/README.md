# Docker Setup for Coding Contest Platform

This directory contains the complete Docker configuration for the coding contest platform, including multi-stage builds, comprehensive service orchestration, and secure code execution environment.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Code Executor  │
│   (Next.js)     │◄──►│  (Spring Boot)  │◄──►│   (Multi-lang)  │
│   Port: 3000    │    │   Port: 8080    │    │   Sandboxed     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┬─────┴─────┬─────────────────┐
         │                 │           │                 │
    ┌────▼────┐      ┌────▼────┐ ┌───▼────┐       ┌────▼────┐
    │ Nginx   │      │ Redis   │ │ Postgres│       │ Adminer │
    │ Proxy   │      │ Cache   │ │Database │       │  (Dev)  │
    │Port: 80 │      │Port:6379│ │Port:5432│       │Port:8081│
    └─────────┘      └─────────┘ └─────────┘       └─────────┘
```

## Services

### Core Services

1. **PostgreSQL Database** (`postgres`)

   - Image: `postgres:15-alpine`
   - Port: 5432 (configurable)
   - Persistent storage with initialization scripts

2. **Spring Boot Backend** (`backend`)

   - Multi-stage build with Maven
   - JVM optimized for containers
   - Health checks and logging

3. **Next.js Frontend** (`frontend`)

   - Multi-stage build with Node.js 18
   - Production optimized
   - Static file serving

4. **Code Execution Environment** (`code-executor`)
   - Custom Ubuntu-based image
   - Multiple language support (Java, Python, Node.js, C++, Go, Rust)
   - Sandboxed execution with Firejail
   - Resource limits and security controls

### Supporting Services

5. **Redis Cache** (`redis`)

   - Session management and caching
   - Password protected
   - Persistent data storage

6. **Nginx Reverse Proxy** (`nginx`)

   - Production profile only
   - SSL termination support
   - Load balancing

7. **Adminer** (`adminer`)
   - Development profile only
   - Database administration interface

## Quick Start

### Development Environment

1. **Copy environment file:**

   ```bash
   cp docker/environment.example .env
   ```

2. **Start development services:**

   ```bash
   docker-compose --profile development up -d
   ```

3. **Access services:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api
   - Database Admin: http://localhost:8081

### Production Environment

1. **Configure environment variables:**

   ```bash
   cp docker/environment.example .env
   # Edit .env with production values
   ```

2. **Start production services:**

   ```bash
   docker-compose --profile production up -d
   ```

3. **Access services:**
   - Application: http://localhost (via Nginx)
   - API: http://localhost/api (via Nginx)

## Environment Variables

### Database Configuration

- `DB_NAME`: Database name (default: coding_contest_db)
- `DB_USERNAME`: Database username (default: postgres)
- `DB_PASSWORD`: Database password (default: postgres)
- `DB_PORT`: Database port (default: 5432)

### Application Configuration

- `BACKEND_PORT`: Backend service port (default: 8080)
- `FRONTEND_PORT`: Frontend service port (default: 3000)
- `JWT_SECRET`: JWT signing secret (minimum 32 characters)
- `ALLOWED_ORIGINS`: CORS allowed origins

### Code Execution Configuration

- `EXECUTION_TIMEOUT`: Maximum execution time in seconds (default: 30)
- `MAX_MEMORY`: Maximum memory in MB (default: 128)
- `MAX_CPU_TIME`: Maximum CPU time in seconds (default: 10)

## Code Execution Environment

The code executor supports multiple programming languages:

### Supported Languages

- **Java**: OpenJDK 17 with Maven and Gradle
- **Python**: Python 3.10 with common packages
- **JavaScript/Node.js**: Node.js 18 with TypeScript
- **C/C++**: GCC with C11/C++17 support
- **Go**: Go 1.21.5
- **Rust**: Latest stable Rust

### Security Features

- Sandboxed execution using Firejail
- Resource limits (CPU, memory, time)
- Network isolation
- Temporary file system
- Non-root execution

### Usage Example

```bash
# Execute Python code
docker exec coding-contest-executor /app/scripts/execute.sh python solution.py 10

# Execute Java code
docker exec coding-contest-executor /app/scripts/execute.sh java Solution.java 15
```

## Volume Management

### Persistent Volumes

- `postgres_data`: Database storage
- `redis_data`: Redis persistence
- `backend_logs`: Application logs
- `code_submissions`: User code submissions
- `code_results`: Execution results

### Volume Locations

All volumes are bind-mounted to local directories:

- `./data/postgres`: Database files
- `./data/redis`: Redis data
- `./logs/backend`: Backend logs
- `./data/submissions`: Code submissions
- `./data/results`: Execution results

## Network Configuration

### Custom Network

- Name: `coding-contest-network`
- Subnet: 172.20.0.0/16 (configurable)
- Bridge driver with custom bridge name

### Service Communication

All services communicate through the custom network using service names as hostnames.

## Health Checks

All services include comprehensive health checks:

- **Database**: PostgreSQL connection test
- **Backend**: Spring Boot Actuator health endpoint
- **Frontend**: Next.js health endpoint
- **Redis**: Redis ping command
- **Code Executor**: Multi-language environment test

## Resource Limits

Services are configured with resource limits to prevent resource exhaustion:

| Service       | CPU Limit | Memory Limit | CPU Reserve | Memory Reserve |
| ------------- | --------- | ------------ | ----------- | -------------- |
| Backend       | 1.0       | 1GB          | 0.5         | 512MB          |
| Frontend      | 0.5       | 512MB        | 0.25        | 256MB          |
| Code Executor | 2.0       | 2GB          | 0.5         | 512MB          |
| Redis         | 0.5       | 256MB        | 0.1         | 64MB           |
| Nginx         | 0.5       | 128MB        | 0.1         | 32MB           |

## Monitoring and Logging

### Log Collection

- Backend logs: `./logs/backend/`
- Container logs: `docker-compose logs [service]`

### Health Monitoring

```bash
# Check all service health
docker-compose ps

# View specific service logs
docker-compose logs -f backend

# Monitor resource usage
docker stats
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8080, 5432, 6379 are available
2. **Permission issues**: Check volume mount permissions
3. **Memory issues**: Adjust resource limits in docker-compose.yml
4. **Build failures**: Clear Docker build cache with `docker system prune`

### Debug Commands

```bash
# Rebuild specific service
docker-compose build --no-cache backend

# View service logs
docker-compose logs -f --tail=100 backend

# Execute commands in running container
docker exec -it coding-contest-backend bash

# Test code executor
docker exec coding-contest-executor /app/scripts/health-check.sh
```

## Security Considerations

### Production Deployment

1. Change default passwords and secrets
2. Use environment-specific configuration
3. Enable SSL/TLS for Nginx
4. Implement proper firewall rules
5. Regular security updates
6. Monitor resource usage
7. Implement backup strategies

### Code Execution Security

- Sandboxed execution environment
- Resource limits enforcement
- Network isolation
- Temporary file systems
- Non-privileged user execution
- Security scanning of submitted code

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec coding-contest-db pg_dump -U postgres coding_contest_db > backup.sql

# Restore backup
docker exec -i coding-contest-db psql -U postgres coding_contest_db < backup.sql
```

### Volume Backup

```bash
# Backup all data
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/
```

## Development Workflow

### Local Development

1. Start development services: `docker-compose --profile development up -d`
2. Make code changes
3. Rebuild affected services: `docker-compose build [service]`
4. Restart services: `docker-compose restart [service]`

### Testing

```bash
# Run backend tests
docker-compose exec backend ./mvnw test

# Run frontend tests
docker-compose exec frontend npm test

# Test code execution
docker-compose exec code-executor /app/scripts/health-check.sh
```
