package com.codingcontest.platform.service;

import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Comprehensive performance metrics and monitoring service
 * Provides detailed metrics for database, cache, API, and system performance
 */
@Service
public class PerformanceMetricsService implements HealthIndicator {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceMetricsService.class);
    
    private final MeterRegistry meterRegistry;
    private final DataSource dataSource;
    private final CacheManager cacheManager;
    
    // Performance counters
    private final Counter apiRequestCounter;
    private final Counter cacheHitCounter;
    private final Counter cacheMissCounter;
    private final Counter submissionCounter;
    private final Counter errorCounter;
    
    // Performance timers
    private final Timer databaseQueryTimer;
    private final Timer cacheOperationTimer;
    private final Timer submissionProcessingTimer;
    private final Timer leaderboardCalculationTimer;
    
    // Performance gauges
    private final AtomicLong activeSubmissions = new AtomicLong(0);
    private final AtomicLong queuedSubmissions = new AtomicLong(0);
    private final AtomicLong databaseConnections = new AtomicLong(0);
    
    // Performance tracking maps
    private final Map<String, AtomicLong> endpointMetrics = new ConcurrentHashMap<>();
    private final Map<String, Timer> endpointTimers = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> cacheMetrics = new ConcurrentHashMap<>();
    
    @Autowired
    public PerformanceMetricsService(MeterRegistry meterRegistry, DataSource dataSource, CacheManager cacheManager) {
        this.meterRegistry = meterRegistry;
        this.dataSource = dataSource;
        this.cacheManager = cacheManager;
        
        // Initialize counters
        this.apiRequestCounter = Counter.builder("api.requests.total")
            .description("Total number of API requests")
            .register(meterRegistry);
            
        this.cacheHitCounter = Counter.builder("cache.hits.total")
            .description("Total number of cache hits")
            .register(meterRegistry);
            
        this.cacheMissCounter = Counter.builder("cache.misses.total")
            .description("Total number of cache misses")
            .register(meterRegistry);
            
        this.submissionCounter = Counter.builder("submissions.total")
            .description("Total number of submissions processed")
            .register(meterRegistry);
            
        this.errorCounter = Counter.builder("errors.total")
            .description("Total number of errors")
            .register(meterRegistry);
        
        // Initialize timers
        this.databaseQueryTimer = Timer.builder("database.query.duration")
            .description("Database query execution time")
            .register(meterRegistry);
            
        this.cacheOperationTimer = Timer.builder("cache.operation.duration")
            .description("Cache operation execution time")
            .register(meterRegistry);
            
        this.submissionProcessingTimer = Timer.builder("submission.processing.duration")
            .description("Submission processing time")
            .register(meterRegistry);
            
        this.leaderboardCalculationTimer = Timer.builder("leaderboard.calculation.duration")
            .description("Leaderboard calculation time")
            .register(meterRegistry);
        
        // Initialize gauges
        Gauge.builder("submissions.active")
            .description("Number of active submissions being processed")
            .register(meterRegistry, activeSubmissions, AtomicLong::get);
            
        Gauge.builder("submissions.queued")
            .description("Number of queued submissions waiting for processing")
            .register(meterRegistry, queuedSubmissions, AtomicLong::get);
            
        Gauge.builder("database.connections.active")
            .description("Number of active database connections")
            .register(meterRegistry, databaseConnections, AtomicLong::get);
        
        logger.info("Performance metrics service initialized with comprehensive monitoring");
    }
    
    // ===============================
    // API PERFORMANCE TRACKING
    // ===============================
    
    /**
     * Record API request metrics
     */
    public void recordApiRequest(String endpoint, long responseTimeMs, int statusCode) {
        apiRequestCounter.increment(Tags.of(
            "endpoint", endpoint,
            "status", String.valueOf(statusCode),
            "status_class", getStatusClass(statusCode)
        ));
        
        // Track endpoint-specific metrics
        endpointMetrics.computeIfAbsent(endpoint, k -> new AtomicLong(0)).incrementAndGet();
        
        Timer endpointTimer = endpointTimers.computeIfAbsent(endpoint, 
            k -> Timer.builder("api.request.duration")
                .description("API request duration for " + endpoint)
                .tag("endpoint", endpoint)
                .register(meterRegistry)
        );
        
        endpointTimer.record(Duration.ofMillis(responseTimeMs));
        
        // Track errors
        if (statusCode >= 400) {
            errorCounter.increment(Tags.of("endpoint", endpoint, "status", String.valueOf(statusCode)));
        }
        
        // Log slow requests
        if (responseTimeMs > 1000) {
            logger.warn("Slow API request: {} took {}ms (status: {})", endpoint, responseTimeMs, statusCode);
        }
    }
    
    // ===============================
    // DATABASE PERFORMANCE TRACKING
    // ===============================
    
    /**
     * Record database query performance
     */
    public Timer.Sample startDatabaseTimer() {
        return Timer.start(meterRegistry);
    }
    
    public void recordDatabaseQuery(Timer.Sample sample, String queryType) {
        sample.stop(Timer.builder("database.query.duration")
            .description("Database query execution time")
            .tag("query_type", queryType)
            .register(meterRegistry));
    }
    
    /**
     * Monitor database connection pool
     */
    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void monitorDatabaseConnections() {
        try (Connection connection = dataSource.getConnection()) {
            // This is a simplified check - in production, you'd want to use
            // HikariCP's metrics directly
            databaseConnections.set(1); // Active connection count would come from pool metrics
        } catch (SQLException e) {
            logger.error("Failed to monitor database connections", e);
            databaseConnections.set(-1); // Indicate error
        }
    }
    
    // ===============================
    // CACHE PERFORMANCE TRACKING
    // ===============================
    
    /**
     * Record cache hit
     */
    public void recordCacheHit(String cacheName) {
        cacheHitCounter.increment(Tags.of("cache", cacheName));
        cacheMetrics.computeIfAbsent(cacheName + "_hits", k -> new AtomicLong(0)).incrementAndGet();
    }
    
    /**
     * Record cache miss
     */
    public void recordCacheMiss(String cacheName) {
        cacheMissCounter.increment(Tags.of("cache", cacheName));
        cacheMetrics.computeIfAbsent(cacheName + "_misses", k -> new AtomicLong(0)).incrementAndGet();
    }
    
    /**
     * Calculate cache hit ratio
     */
    public double getCacheHitRatio(String cacheName) {
        long hits = cacheMetrics.getOrDefault(cacheName + "_hits", new AtomicLong(0)).get();
        long misses = cacheMetrics.getOrDefault(cacheName + "_misses", new AtomicLong(0)).get();
        long total = hits + misses;
        return total > 0 ? (double) hits / total : 0.0;
    }
    
    // ===============================
    // SUBMISSION PERFORMANCE TRACKING
    // ===============================
    
    /**
     * Record submission processing start
     */
    public Timer.Sample startSubmissionProcessing(Long submissionId) {
        activeSubmissions.incrementAndGet();
        logger.debug("Started processing submission {}, active count: {}", submissionId, activeSubmissions.get());
        return Timer.start(meterRegistry);
    }
    
    /**
     * Record submission processing completion
     */
    public void recordSubmissionProcessing(Timer.Sample sample, String language, String status, boolean success) {
        activeSubmissions.decrementAndGet();
        
        sample.stop(Timer.builder("submission.processing.duration")
            .description("Submission processing time")
            .tag("language", language)
            .tag("status", status)
            .tag("success", String.valueOf(success))
            .register(meterRegistry));
        
        submissionCounter.increment(Tags.of(
            "language", language,
            "status", status,
            "success", String.valueOf(success)
        ));
    }
    
    /**
     * Update queued submissions count
     */
    public void updateQueuedSubmissions(long count) {
        queuedSubmissions.set(count);
    }
    
    // ===============================
    // LEADERBOARD PERFORMANCE TRACKING
    // ===============================
    
    /**
     * Record leaderboard calculation performance
     */
    public Timer.Sample startLeaderboardCalculation() {
        return Timer.start(meterRegistry);
    }
    
    public void recordLeaderboardCalculation(Timer.Sample sample, Long contestId, int participantCount) {
        sample.stop(Timer.builder("leaderboard.calculation.duration")
            .description("Leaderboard calculation time")
            .tag("contest_id", String.valueOf(contestId))
            .tag("participant_count_range", getParticipantCountRange(participantCount))
            .register(meterRegistry));
    }
    
    // ===============================
    // HEALTH CHECK IMPLEMENTATION
    // ===============================
    
    @Override
    public Health health() {
        Health.Builder healthBuilder = new Health.Builder();
        
        try {
            // Check database connectivity
            boolean dbHealthy = checkDatabaseHealth();
            
            // Check system metrics
            long activeSubmissionsCount = activeSubmissions.get();
            long queuedSubmissionsCount = queuedSubmissions.get();
            
            // Determine overall health
            if (dbHealthy && activeSubmissionsCount < 100 && queuedSubmissionsCount < 500) {
                healthBuilder.up();
            } else {
                healthBuilder.down();
            }
            
            // Add health details
            healthBuilder
                .withDetail("database", dbHealthy ? "UP" : "DOWN")
                .withDetail("activeSubmissions", activeSubmissionsCount)
                .withDetail("queuedSubmissions", queuedSubmissionsCount)
                .withDetail("timestamp", LocalDateTime.now());
                
        } catch (Exception e) {
            healthBuilder.down().withException(e);
        }
        
        return healthBuilder.build();
    }
    
    // ===============================
    // UTILITY METHODS
    // ===============================
    
    private boolean checkDatabaseHealth() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(5); // 5 second timeout
        } catch (SQLException e) {
            logger.warn("Database health check failed", e);
            return false;
        }
    }
    
    private String getStatusClass(int statusCode) {
        if (statusCode < 300) return "2xx";
        if (statusCode < 400) return "3xx";
        if (statusCode < 500) return "4xx";
        return "5xx";
    }
    
    private String getParticipantCountRange(int count) {
        if (count < 10) return "small";
        if (count < 100) return "medium";
        if (count < 1000) return "large";
        return "xlarge";
    }
    
    /**
     * Get performance summary for monitoring dashboard
     */
    public Map<String, Object> getPerformanceSummary() {
        Map<String, Object> summary = new ConcurrentHashMap<>();
        
        summary.put("activeSubmissions", activeSubmissions.get());
        summary.put("queuedSubmissions", queuedSubmissions.get());
        summary.put("databaseConnections", databaseConnections.get());
        summary.put("timestamp", LocalDateTime.now());
        
        // Add cache hit ratios
        Map<String, Double> cacheRatios = new ConcurrentHashMap<>();
        cacheMetrics.keySet().stream()
            .filter(key -> key.endsWith("_hits"))
            .map(key -> key.substring(0, key.length() - 5))
            .forEach(cacheName -> cacheRatios.put(cacheName, getCacheHitRatio(cacheName)));
        summary.put("cacheHitRatios", cacheRatios);
        
        return summary;
    }
}
