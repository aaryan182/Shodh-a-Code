package com.codingcontest.platform.exception;

import java.time.LocalDateTime;

/**
 * Exception thrown when rate limit is exceeded
 */
public class RateLimitExceededException extends RuntimeException {
    
    private final String endpoint;
    private final String clientId;
    private final int currentRequests;
    private final int maxRequests;
    private final LocalDateTime resetTime;
    
    public RateLimitExceededException(String message) {
        super(message);
        this.endpoint = null;
        this.clientId = null;
        this.currentRequests = 0;
        this.maxRequests = 0;
        this.resetTime = null;
    }
    
    public RateLimitExceededException(String endpoint, String clientId, int currentRequests, 
                                    int maxRequests, LocalDateTime resetTime, String message) {
        super(message);
        this.endpoint = endpoint;
        this.clientId = clientId;
        this.currentRequests = currentRequests;
        this.maxRequests = maxRequests;
        this.resetTime = resetTime;
    }
    
    public String getEndpoint() {
        return endpoint;
    }
    
    public String getClientId() {
        return clientId;
    }
    
    public int getCurrentRequests() {
        return currentRequests;
    }
    
    public int getMaxRequests() {
        return maxRequests;
    }
    
    public LocalDateTime getResetTime() {
        return resetTime;
    }
}
