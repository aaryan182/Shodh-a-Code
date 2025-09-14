package com.codingcontest.platform.exception;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * Specialized error response for rate limiting errors
 */
public class RateLimitErrorResponse extends ErrorResponse {
    
    private String endpoint;
    private int currentRequests;
    private int maxRequests;
    private long retryAfterSeconds;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime resetTime;
    
    // Default constructor
    public RateLimitErrorResponse() {
        super();
    }
    
    // Constructor with all fields
    public RateLimitErrorResponse(String error, String message, int status, String path,
                                String endpoint, int currentRequests, int maxRequests, 
                                long retryAfterSeconds, LocalDateTime resetTime) {
        super(error, message, status, path);
        this.endpoint = endpoint;
        this.currentRequests = currentRequests;
        this.maxRequests = maxRequests;
        this.retryAfterSeconds = retryAfterSeconds;
        this.resetTime = resetTime;
    }
    
    // Getters and Setters
    public String getEndpoint() {
        return endpoint;
    }
    
    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }
    
    public int getCurrentRequests() {
        return currentRequests;
    }
    
    public void setCurrentRequests(int currentRequests) {
        this.currentRequests = currentRequests;
    }
    
    public int getMaxRequests() {
        return maxRequests;
    }
    
    public void setMaxRequests(int maxRequests) {
        this.maxRequests = maxRequests;
    }
    
    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
    
    public void setRetryAfterSeconds(long retryAfterSeconds) {
        this.retryAfterSeconds = retryAfterSeconds;
    }
    
    public LocalDateTime getResetTime() {
        return resetTime;
    }
    
    public void setResetTime(LocalDateTime resetTime) {
        this.resetTime = resetTime;
    }
}
