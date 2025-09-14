package com.codingcontest.platform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for application monitoring and health checks
 */
@Service
public class MonitoringService implements HealthIndicator {

    private static final Logger logger = LoggerFactory.getLogger(MonitoringService.class);
    private static final Logger metricsLogger = LoggerFactory.getLogger("METRICS");

    private final DataSource dataSource;

    // Metrics tracking
    private final AtomicLong requestCount = new AtomicLong(0);
    private final AtomicLong errorCount = new AtomicLong(0);
    private final AtomicLong submissionCount = new AtomicLong(0);
    private final AtomicLong codeExecutionCount = new AtomicLong(0);
    private final ConcurrentHashMap<String, AtomicLong> endpointMetrics = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> responseTimeMetrics = new ConcurrentHashMap<>();

    @Value("${spring.datasource.url}")
    private String databaseUrl;

    @Value("${judge.docker.image}")
    private String dockerImage;

    public MonitoringService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try {
            // Check database connectivity
            boolean dbHealthy = checkDatabaseHealth();
            
            // Check Docker availability (simplified check)
            boolean dockerHealthy = checkDockerHealth();
            
            // Check system resources
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            double memoryUsagePercent = (double) usedMemory / totalMemory * 100;

            Health.Builder healthBuilder = Health.up()
                    .withDetail("database", dbHealthy ? "UP" : "DOWN")
                    .withDetail("docker", dockerHealthy ? "UP" : "DOWN")
                    .withDetail("memory_usage_percent", String.format("%.2f", memoryUsagePercent))
                    .withDetail("total_requests", requestCount.get())
                    .withDetail("total_errors", errorCount.get())
                    .withDetail("total_submissions", submissionCount.get())
                    .withDetail("code_executions", codeExecutionCount.get());

            // If any critical component is down, mark as unhealthy
            if (!dbHealthy) {
                healthBuilder = Health.down()
                        .withDetail("reason", "Database connectivity issue");
            }

            return healthBuilder.build();

        } catch (Exception e) {
            logger.error("Health check failed", e);
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }

    /**
     * Check database health
     */
    private boolean checkDatabaseHealth() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(5); // 5 second timeout
        } catch (SQLException e) {
            logger.warn("Database health check failed", e);
            return false;
        }
    }

    /**
     * Check Docker health (simplified)
     */
    private boolean checkDockerHealth() {
        try {
            ProcessBuilder pb = new ProcessBuilder("docker", "version");
            Process process = pb.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            logger.warn("Docker health check failed", e);
            return false;
        }
    }

    /**
     * Record request metrics
     */
    public void recordRequest(String endpoint, long responseTime, int statusCode) {
        requestCount.incrementAndGet();
        
        if (statusCode >= 400) {
            errorCount.incrementAndGet();
        }
        
        // Track endpoint-specific metrics
        endpointMetrics.computeIfAbsent(endpoint, k -> new AtomicLong(0)).incrementAndGet();
        responseTimeMetrics.put(endpoint, responseTime);
        
        // Log slow requests
        if (responseTime > 5000) { // 5 seconds
            logger.warn("Slow request detected: {} took {}ms (status: {})", endpoint, responseTime, statusCode);
        }
    }

    /**
     * Record submission metrics
     */
    public void recordSubmission() {
        submissionCount.incrementAndGet();
    }

    /**
     * Record code execution metrics
     */
    public void recordCodeExecution(long executionTime, String language, String status) {
        codeExecutionCount.incrementAndGet();
        
        // Log execution metrics
        metricsLogger.info("Code execution completed: language={}, status={}, time={}ms", 
                          language, status, executionTime);
        
        // Alert on long executions
        if (executionTime > 30000) { // 30 seconds
            logger.warn("Long code execution detected: {}ms for {} (status: {})", 
                       executionTime, language, status);
        }
    }

    /**
     * Record error metrics
     */
    public void recordError(String errorType, String endpoint, String message) {
        errorCount.incrementAndGet();
        
        // Log structured error for monitoring
        metricsLogger.error("Application error: type={}, endpoint={}, message={}", 
                           errorType, endpoint, message);
    }

    /**
     * Get current metrics
     */
    public MetricsSnapshot getMetrics() {
        return new MetricsSnapshot(
                requestCount.get(),
                errorCount.get(),
                submissionCount.get(),
                codeExecutionCount.get(),
                new ConcurrentHashMap<>(endpointMetrics),
                new ConcurrentHashMap<>(responseTimeMetrics)
        );
    }

    /**
     * Scheduled task to log system metrics
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void logSystemMetrics() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory();

        metricsLogger.info("System metrics: " +
                          "requests={}, errors={}, submissions={}, executions={}, " +
                          "memory_used={}MB, memory_free={}MB, memory_max={}MB",
                          requestCount.get(),
                          errorCount.get(),
                          submissionCount.get(),
                          codeExecutionCount.get(),
                          usedMemory / 1024 / 1024,
                          freeMemory / 1024 / 1024,
                          maxMemory / 1024 / 1024);
    }

    /**
     * Scheduled task to check for alerts
     */
    @Scheduled(fixedRate = 60000) // Every minute
    public void checkAlerts() {
        // Check error rate
        long totalRequests = requestCount.get();
        long totalErrors = errorCount.get();
        
        if (totalRequests > 100 && totalErrors > 0) {
            double errorRate = (double) totalErrors / totalRequests * 100;
            if (errorRate > 10) { // Alert if error rate > 10%
                logger.warn("High error rate detected: {:.2f}% ({} errors out of {} requests)", 
                           errorRate, totalErrors, totalRequests);
            }
        }

        // Check memory usage
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        double memoryUsage = (double) (totalMemory - freeMemory) / totalMemory * 100;
        
        if (memoryUsage > 85) { // Alert if memory usage > 85%
            logger.warn("High memory usage detected: {:.2f}%", memoryUsage);
        }
    }

    /**
     * Metrics snapshot for external consumption
     */
    public static class MetricsSnapshot {
        private final long totalRequests;
        private final long totalErrors;
        private final long totalSubmissions;
        private final long totalExecutions;
        private final ConcurrentHashMap<String, AtomicLong> endpointMetrics;
        private final ConcurrentHashMap<String, Long> responseTimeMetrics;

        public MetricsSnapshot(long totalRequests, long totalErrors, long totalSubmissions, 
                             long totalExecutions, ConcurrentHashMap<String, AtomicLong> endpointMetrics,
                             ConcurrentHashMap<String, Long> responseTimeMetrics) {
            this.totalRequests = totalRequests;
            this.totalErrors = totalErrors;
            this.totalSubmissions = totalSubmissions;
            this.totalExecutions = totalExecutions;
            this.endpointMetrics = endpointMetrics;
            this.responseTimeMetrics = responseTimeMetrics;
        }

        // Getters
        public long getTotalRequests() { return totalRequests; }
        public long getTotalErrors() { return totalErrors; }
        public long getTotalSubmissions() { return totalSubmissions; }
        public long getTotalExecutions() { return totalExecutions; }
        public ConcurrentHashMap<String, AtomicLong> getEndpointMetrics() { return endpointMetrics; }
        public ConcurrentHashMap<String, Long> getResponseTimeMetrics() { return responseTimeMetrics; }
    }
}
