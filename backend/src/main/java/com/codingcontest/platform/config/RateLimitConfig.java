package com.codingcontest.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration for rate limiting
 */
@Configuration
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitConfig {
    
    private boolean enabled = true;
    private Map<String, EndpointRateLimit> endpoints = new HashMap<>();
    
    // Default rate limits
    public RateLimitConfig() {
        // Default rate limits for different endpoints
        endpoints.put("/api/submissions", new EndpointRateLimit(10, 60)); // 10 requests per minute
        endpoints.put("/api/contests", new EndpointRateLimit(30, 60)); // 30 requests per minute
        endpoints.put("/api/users/register", new EndpointRateLimit(5, 300)); // 5 requests per 5 minutes
        endpoints.put("/api/auth/login", new EndpointRateLimit(10, 300)); // 10 requests per 5 minutes
        endpoints.put("default", new EndpointRateLimit(100, 60)); // Default: 100 requests per minute
    }
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public Map<String, EndpointRateLimit> getEndpoints() {
        return endpoints;
    }
    
    public void setEndpoints(Map<String, EndpointRateLimit> endpoints) {
        this.endpoints = endpoints;
    }
    
    public EndpointRateLimit getEndpointLimit(String endpoint) {\n        // Try exact match first\n        EndpointRateLimit limit = endpoints.get(endpoint);\n        if (limit != null) {\n            return limit;\n        }\n        \n        // Try pattern matching for parameterized endpoints\n        for (Map.Entry<String, EndpointRateLimit> entry : endpoints.entrySet()) {\n            String pattern = entry.getKey();\n            if (endpoint.matches(pattern.replace(\"*\", \".*\"))) {\n                return entry.getValue();\n            }\n        }\n        \n        // Return default if no match found\n        return endpoints.getOrDefault(\"default\", new EndpointRateLimit(100, 60));\n    }\n    \n    public static class EndpointRateLimit {\n        private int maxRequests;\n        private int windowSeconds;\n        \n        public EndpointRateLimit() {}\n        \n        public EndpointRateLimit(int maxRequests, int windowSeconds) {\n            this.maxRequests = maxRequests;\n            this.windowSeconds = windowSeconds;\n        }\n        \n        public int getMaxRequests() {\n            return maxRequests;\n        }\n        \n        public void setMaxRequests(int maxRequests) {\n            this.maxRequests = maxRequests;\n        }\n        \n        public int getWindowSeconds() {\n            return windowSeconds;\n        }\n        \n        public void setWindowSeconds(int windowSeconds) {\n            this.windowSeconds = windowSeconds;\n        }\n    }\n}
