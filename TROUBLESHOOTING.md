# 🛠️ Troubleshooting Guide

## Common Issues and Solutions

### 🐳 Docker Issues

#### Problem: Port already in use
```bash
# Error: bind: address already in use
Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use
```

**Solution:**
```bash
# Find process using the port
lsof -i :3000
# or on Windows
netstat -ano | findstr :3000

# Kill the process
kill -9 <PID>

# Or use different ports
echo "FRONTEND_PORT=3001" >> .env
echo "BACKEND_PORT=8081" >> .env
docker-compose up -d
```

#### Problem: Docker build fails with memory issues
```bash
# Error: virtual memory exhausted: Cannot allocate memory
```

**Solution:**
```bash
# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory > 4GB+

# Or build with limited parallelism
docker-compose build --parallel 1

# Clear build cache
docker system prune -a
```

#### Problem: Container health check failing
```bash
# Backend container keeps restarting
```

**Solution:**
```bash
# Check container logs
docker-compose logs backend

# Common issues and fixes:
# 1. Database not ready
docker-compose up -d postgres
sleep 30
docker-compose up -d backend

# 2. Environment variables missing
docker-compose exec backend env | grep -E "(DB_|JWT_|REDIS_)"

# 3. Check health endpoint manually
docker-compose exec backend curl localhost:8080/api/actuator/health
```

### 🗄️ Database Issues

#### Problem: Connection refused to PostgreSQL
```bash
# Error: Connection to localhost:5432 refused
```

**Solution:**
```bash
# Check if PostgreSQL container is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres

# Wait for database to be ready
docker-compose exec postgres pg_isready -U postgres
```

#### Problem: Flyway migration failures
```bash
# Error: Validate failed: Migration checksum mismatch
```

**Solution:**
```bash
# Check migration status
docker-compose exec backend java -jar app.jar --spring.flyway.info

# Repair migration
docker-compose exec backend java -jar app.jar --spring.flyway.repair

# Or reset database (development only!)
docker-compose down -v
docker volume rm coding-contest-platform_postgres_data
docker-compose up -d
```

#### Problem: Database performance issues
```bash
# Slow query performance
```

**Solution:**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY n_distinct DESC;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_submissions_status_created 
ON submissions(status, submitted_at);
```

### 🔧 Backend Issues

#### Problem: Spring Boot application won't start
```bash
# Error: APPLICATION FAILED TO START
```

**Solution:**
```bash
# Check Java version
docker-compose exec backend java -version

# Check application logs
docker-compose logs backend | grep ERROR

# Common fixes:
# 1. Port conflict
echo "SERVER_PORT=8081" >> .env

# 2. Database connection
echo "DB_HOST=postgres" >> .env
echo "DB_PORT=5432" >> .env

# 3. Memory issues
docker-compose exec backend java -XX:+PrintFlagsFinal -version | grep MaxHeapSize
```

#### Problem: JWT authentication not working
```bash
# Error: Invalid JWT token
```

**Solution:**
```bash
# Check JWT secret length (must be 32+ characters)
echo $JWT_SECRET | wc -c

# Generate new secret
openssl rand -base64 32

# Update environment
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
docker-compose restart backend
```

#### Problem: Code execution timeout
```bash
# Submissions stuck in PENDING status
```

**Solution:**
```bash
# Check code executor health
docker-compose exec code-executor /app/scripts/health-check.sh

# Check resource limits
docker stats coding-contest-executor

# Increase timeout
echo "EXECUTION_TIMEOUT=60" >> .env
docker-compose restart code-executor

# Check executor logs
docker-compose logs code-executor
```

### 🌐 Frontend Issues

#### Problem: Next.js build fails
```bash
# Error: Module not found or Type error
```

**Solution:**
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build

# Check TypeScript errors
npm run type-check

# Update dependencies
npm audit fix
npm update
```

#### Problem: API calls failing from frontend
```bash
# Error: Network Error or CORS issues
```

**Solution:**
```bash
# Check API URL configuration
echo $NEXT_PUBLIC_API_URL

# Verify backend is accessible
curl http://localhost:8080/api/health

# Check CORS configuration
docker-compose logs backend | grep CORS

# Update CORS origins
echo "ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001" >> .env
docker-compose restart backend
```

#### Problem: Monaco Editor not loading
```bash
# Error: Monaco Editor failed to load
```

**Solution:**
```bash
# Check if static files are served correctly
curl http://localhost:3000/_next/static/

# Clear browser cache
# Or use incognito mode

# Check console for errors
# F12 > Console tab in browser
```

### 🔄 Redis Issues

#### Problem: Redis connection failed
```bash
# Error: Unable to connect to Redis
```

**Solution:**
```bash
# Check Redis container status
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Check password configuration
docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping

# Reset Redis
docker-compose restart redis
```

### 🏗️ Build Issues

#### Problem: Maven build fails
```bash
# Error: Failed to execute goal
```

**Solution:**
```bash
# Clear Maven cache
cd backend
mvn clean

# Skip tests if needed (not recommended for production)
mvn clean install -DskipTests

# Check Java version compatibility
mvn -version
java -version

# Update dependencies
mvn versions:display-dependency-updates
```

#### Problem: npm install fails
```bash
# Error: npm ERR! peer dep missing
```

**Solution:**
```bash
cd frontend

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use specific Node version
nvm use 18
npm install
```

## Performance Issues

### 🐌 Slow Application Performance

#### Database Performance:
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Check connection pool
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM submissions WHERE user_id = 1;
```

#### Backend Performance:
```bash
# Check JVM metrics
docker-compose exec backend curl localhost:8080/api/actuator/metrics/jvm.memory.used

# Monitor garbage collection
docker-compose exec backend java -XX:+PrintGC -jar app.jar

# Thread dump for debugging
docker-compose exec backend jstack 1 > thread_dump.txt
```

#### Frontend Performance:
```bash
# Bundle analysis
cd frontend
npm run analyze

# Lighthouse audit
npx lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

## Monitoring and Debugging

### 📊 Log Analysis

#### Centralized Logging:
```bash
# View all logs
docker-compose logs -f

# Filter by service
docker-compose logs -f backend | grep ERROR

# Search logs by timestamp
docker-compose logs --since "2024-01-20T10:00:00" backend
```

#### Log Levels:
```bash
# Increase log verbosity for debugging
echo "LOGGING_LEVEL_ROOT=DEBUG" >> .env
docker-compose restart backend

# Reset to normal
echo "LOGGING_LEVEL_ROOT=INFO" >> .env
```

### 🔍 Health Monitoring

#### Health Check Script:
```bash
#!/bin/bash
# scripts/health-check.sh

echo "=== Health Check Report ==="
echo "Timestamp: $(date)"
echo

# Check services
services=("frontend:3000" "backend:8080/api" "postgres:5432" "redis:6379")
for service in "${services[@]}"; do
    name=${service%:*}
    port=${service#*:}
    if curl -f http://localhost:$port/health >/dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is unhealthy"
    fi
done

# Check disk space
echo
echo "=== Disk Usage ==="
df -h

# Check memory usage
echo
echo "=== Memory Usage ==="
free -h

# Check Docker resources
echo
echo "=== Docker Resources ==="
docker system df
```

### 🚨 Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `CONNECTION_REFUSED` | Service unreachable | Check if service is running and ports are correct |
| `TIMEOUT` | Request timeout | Increase timeout values or check performance |
| `UNAUTHORIZED` | Authentication failed | Check JWT token and user permissions |
| `VALIDATION_ERROR` | Input validation failed | Check request format and required fields |
| `RESOURCE_NOT_FOUND` | Entity not found | Verify entity exists and user has access |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff or increase rate limits |
| `INTERNAL_SERVER_ERROR` | Unexpected error | Check server logs for detailed error information |

## Getting Help

### 📞 Support Channels

1. **GitHub Issues**: [Create an issue](https://github.com/your-org/coding-contest-platform/issues)
2. **Documentation**: Check this README and code comments
3. **Community Forum**: [Discussions](https://github.com/your-org/coding-contest-platform/discussions)
4. **Stack Overflow**: Tag with `coding-contest-platform`

### 🐛 Bug Report Template

When reporting issues, please include:

```markdown
**Environment:**
- OS: [Windows/macOS/Linux]
- Docker version: [e.g., 24.0.6]
- Browser: [if frontend issue]
- Version: [git commit hash or release version]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Logs:**
```
[paste relevant logs here]
```

**Additional Context:**
[Any other relevant information]
```

### 🔧 Debug Mode

Enable debug mode for detailed troubleshooting:

```bash
# Create debug environment
cat > .env.debug << EOF
# Debug configuration
SPRING_PROFILES_ACTIVE=debug
LOGGING_LEVEL_ROOT=DEBUG
LOGGING_LEVEL_COM_CODINGCONTEST=TRACE
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
SHOW_SQL=true
EOF

# Start with debug configuration
docker-compose --env-file .env.debug up -d
```

Remember: Most issues can be resolved by checking logs, verifying configuration, and ensuring all services are healthy. When in doubt, try restarting services or resetting the development environment.
