package com.codingcontest.platform.config;

import com.codingcontest.platform.exception.RateLimitExceededException;
import com.codingcontest.platform.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor for rate limiting requests
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimitInterceptor.class);
    
    private final RateLimitService rateLimitService;
    
    @Autowired
    public RateLimitInterceptor(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) 
            throws Exception {
        
        String clientId = getClientId(request);
        String endpoint = getEndpointPattern(request);
        
        try {
            rateLimitService.checkRateLimit(clientId, endpoint);
            
            // Add rate limit headers to response
            addRateLimitHeaders(response, clientId, endpoint);
            
            return true;
        } catch (RateLimitExceededException ex) {
            // Exception will be handled by GlobalExceptionHandler
            throw ex;
        }
    }
    
    /**
     * Get client identifier for rate limiting
     */
    private String getClientId(HttpServletRequest request) {
        // Try to get authenticated user ID first
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && 
            !\"anonymousUser\".equals(authentication.getName())) {\n            return \"user:\" + authentication.getName();\n        }\n        \n        // Fall back to IP address\n        String xForwardedFor = request.getHeader(\"X-Forwarded-For\");\n        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {\n            return \"ip:\" + xForwardedFor.split(\",\")[0].trim();\n        }\n        \n        String xRealIp = request.getHeader(\"X-Real-IP\");\n        if (xRealIp != null && !xRealIp.isEmpty()) {\n            return \"ip:\" + xRealIp;\n        }\n        \n        return \"ip:\" + request.getRemoteAddr();\n    }\n    \n    /**\n     * Get endpoint pattern for rate limiting\n     */\n    private String getEndpointPattern(HttpServletRequest request) {\n        String uri = request.getRequestURI();\n        String method = request.getMethod();\n        \n        // Normalize parameterized endpoints\n        String pattern = uri;\n        \n        // Replace numeric IDs with wildcards for pattern matching\n        pattern = pattern.replaceAll(\"/\\\\d+\", \"/*\");\n        \n        // Include HTTP method for more granular control\n        return method + \":\" + pattern;\n    }\n    \n    /**\n     * Add rate limit information to response headers\n     */\n    private void addRateLimitHeaders(HttpServletResponse response, String clientId, String endpoint) {\n        try {\n            RateLimitService.RateLimitStatus status = rateLimitService.getRateLimitStatus(clientId, endpoint);\n            \n            response.setHeader(\"X-RateLimit-Limit\", String.valueOf(status.getMaxRequests()));\n            response.setHeader(\"X-RateLimit-Remaining\", String.valueOf(status.getRemainingRequests()));\n            \n            if (status.getResetTime() != null) {\n                response.setHeader(\"X-RateLimit-Reset\", status.getResetTime().toString());\n            }\n        } catch (Exception ex) {\n            logger.warn(\"Failed to add rate limit headers\", ex);\n        }\n    }\n}
