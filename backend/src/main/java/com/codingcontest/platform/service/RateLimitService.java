package com.codingcontest.platform.service;

import com.codingcontest.platform.config.RateLimitConfig;
import com.codingcontest.platform.exception.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Service for handling rate limiting
 */
@Service
public class RateLimitService {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimitService.class);
    
    private final RateLimitConfig rateLimitConfig;
    private final ConcurrentMap<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();
    
    @Autowired
    public RateLimitService(RateLimitConfig rateLimitConfig) {
        this.rateLimitConfig = rateLimitConfig;
    }
    
    /**
     * Check if request is allowed under rate limit
     * @param clientId Client identifier (IP address, user ID, etc.)
     * @param endpoint Endpoint being accessed
     * @throws RateLimitExceededException if rate limit is exceeded
     */
    public void checkRateLimit(String clientId, String endpoint) throws RateLimitExceededException {\n        if (!rateLimitConfig.isEnabled()) {\n            return;\n        }\n        \n        RateLimitConfig.EndpointRateLimit limit = rateLimitConfig.getEndpointLimit(endpoint);\n        String bucketKey = clientId + \":\" + endpoint;\n        \n        RateLimitBucket bucket = buckets.computeIfAbsent(bucketKey, k -> \n            new RateLimitBucket(limit.getMaxRequests(), limit.getWindowSeconds()));\n        \n        if (!bucket.tryConsume()) {\n            logger.warn(\"Rate limit exceeded for client {} on endpoint {}: {}/{} requests in {} seconds\", \n                       clientId, endpoint, bucket.getCurrentRequests(), limit.getMaxRequests(), limit.getWindowSeconds());\n            \n            throw new RateLimitExceededException(\n                endpoint, \n                clientId, \n                bucket.getCurrentRequests(), \n                limit.getMaxRequests(), \n                bucket.getResetTime(),\n                String.format(\"Rate limit exceeded. Maximum %d requests per %d seconds allowed.\", \n                             limit.getMaxRequests(), limit.getWindowSeconds())\n            );\n        }\n        \n        logger.debug(\"Rate limit check passed for client {} on endpoint {}: {}/{} requests\", \n                    clientId, endpoint, bucket.getCurrentRequests(), limit.getMaxRequests());\n    }\n    \n    /**\n     * Get current rate limit status for a client and endpoint\n     */\n    public RateLimitStatus getRateLimitStatus(String clientId, String endpoint) {\n        if (!rateLimitConfig.isEnabled()) {\n            return new RateLimitStatus(0, Integer.MAX_VALUE, null);\n        }\n        \n        RateLimitConfig.EndpointRateLimit limit = rateLimitConfig.getEndpointLimit(endpoint);\n        String bucketKey = clientId + \":\" + endpoint;\n        \n        RateLimitBucket bucket = buckets.get(bucketKey);\n        if (bucket == null) {\n            return new RateLimitStatus(0, limit.getMaxRequests(), null);\n        }\n        \n        return new RateLimitStatus(\n            bucket.getCurrentRequests(),\n            limit.getMaxRequests(),\n            bucket.getResetTime()\n        );\n    }\n    \n    /**\n     * Clear expired buckets to prevent memory leaks\n     */\n    public void cleanupExpiredBuckets() {\n        LocalDateTime now = LocalDateTime.now();\n        buckets.entrySet().removeIf(entry -> {\n            RateLimitBucket bucket = entry.getValue();\n            return bucket.getResetTime() != null && bucket.getResetTime().isBefore(now);\n        });\n    }\n    \n    /**\n     * Rate limit bucket implementation using token bucket algorithm\n     */\n    private static class RateLimitBucket {\n        private final int maxRequests;\n        private final int windowSeconds;\n        private int currentRequests;\n        private LocalDateTime windowStart;\n        private LocalDateTime resetTime;\n        \n        public RateLimitBucket(int maxRequests, int windowSeconds) {\n            this.maxRequests = maxRequests;\n            this.windowSeconds = windowSeconds;\n            this.currentRequests = 0;\n            this.windowStart = LocalDateTime.now();\n            this.resetTime = windowStart.plusSeconds(windowSeconds);\n        }\n        \n        public synchronized boolean tryConsume() {\n            LocalDateTime now = LocalDateTime.now();\n            \n            // Reset window if expired\n            if (now.isAfter(resetTime)) {\n                currentRequests = 0;\n                windowStart = now;\n                resetTime = now.plusSeconds(windowSeconds);\n            }\n            \n            // Check if request can be allowed\n            if (currentRequests >= maxRequests) {\n                return false;\n            }\n            \n            currentRequests++;\n            return true;\n        }\n        \n        public int getCurrentRequests() {\n            return currentRequests;\n        }\n        \n        public LocalDateTime getResetTime() {\n            return resetTime;\n        }\n    }\n    \n    /**\n     * Rate limit status information\n     */\n    public static class RateLimitStatus {\n        private final int currentRequests;\n        private final int maxRequests;\n        private final LocalDateTime resetTime;\n        \n        public RateLimitStatus(int currentRequests, int maxRequests, LocalDateTime resetTime) {\n            this.currentRequests = currentRequests;\n            this.maxRequests = maxRequests;\n            this.resetTime = resetTime;\n        }\n        \n        public int getCurrentRequests() {\n            return currentRequests;\n        }\n        \n        public int getMaxRequests() {\n            return maxRequests;\n        }\n        \n        public int getRemainingRequests() {\n            return Math.max(0, maxRequests - currentRequests);\n        }\n        \n        public LocalDateTime getResetTime() {\n            return resetTime;\n        }\n    }\n}
