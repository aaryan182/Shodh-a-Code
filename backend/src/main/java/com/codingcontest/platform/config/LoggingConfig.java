package com.codingcontest.platform.config;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.ConsoleAppender;
import ch.qos.logback.core.rolling.RollingFileAppender;
import ch.qos.logback.core.rolling.TimeBasedRollingPolicy;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.CommonsRequestLoggingFilter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

/**
 * Configuration for application logging and monitoring
 */
@Configuration
public class LoggingConfig {

    @Value("${logging.file.name:logs/application.log}")
    private String logFileName;

    @Value("${logging.level.root:INFO}")
    private String rootLogLevel;

    /**
     * Configure request logging filter
     */
    @Bean
    public CommonsRequestLoggingFilter requestLoggingFilter() {
        CommonsRequestLoggingFilter loggingFilter = new CommonsRequestLoggingFilter();
        loggingFilter.setIncludeClientInfo(true);
        loggingFilter.setIncludeQueryString(true);
        loggingFilter.setIncludePayload(true);
        loggingFilter.setIncludeHeaders(false);
        loggingFilter.setMaxPayloadLength(1000);
        loggingFilter.setAfterMessagePrefix("REQUEST: ");
        return loggingFilter;
    }

    /**
     * MDC (Mapped Diagnostic Context) filter for request tracing
     */
    @Bean
    public Filter mdcFilter() {
        return new Filter() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest request, 
                               jakarta.servlet.ServletResponse response, 
                               FilterChain chain) throws IOException, ServletException {
                
                HttpServletRequest httpRequest = (HttpServletRequest) request;
                HttpServletResponse httpResponse = (HttpServletResponse) response;
                
                try {
                    // Generate unique request ID
                    String requestId = UUID.randomUUID().toString().substring(0, 8);
                    MDC.put("requestId", requestId);
                    MDC.put("method", httpRequest.getMethod());
                    MDC.put("uri", httpRequest.getRequestURI());
                    MDC.put("remoteAddr", getClientIpAddress(httpRequest));
                    
                    // Add request ID to response header for client-side correlation
                    httpResponse.setHeader("X-Request-ID", requestId);
                    
                    long startTime = System.currentTimeMillis();
                    
                    chain.doFilter(request, response);
                    
                    long duration = System.currentTimeMillis() - startTime;
                    MDC.put("duration", String.valueOf(duration));
                    MDC.put("status", String.valueOf(httpResponse.getStatus()));
                    
                    // Log request completion
                    org.slf4j.Logger logger = LoggerFactory.getLogger("REQUEST_LOGGER");
                    logger.info("Request completed: {} {} - {} ({} ms)", 
                               httpRequest.getMethod(), 
                               httpRequest.getRequestURI(), 
                               httpResponse.getStatus(), 
                               duration);
                    
                } finally {
                    // Always clear MDC to prevent memory leaks
                    MDC.clear();
                }
            }
        };
    }

    /**
     * Get client IP address, considering proxy headers
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
