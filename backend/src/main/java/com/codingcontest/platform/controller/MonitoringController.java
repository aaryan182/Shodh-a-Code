package com.codingcontest.platform.controller;

import com.codingcontest.platform.service.MonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for monitoring and metrics endpoints
 */
@RestController
@RequestMapping("/monitoring")
public class MonitoringController {

    private final MonitoringService monitoringService;

    @Autowired
    public MonitoringController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    /**
     * Get application health status
     */
    @GetMapping("/health")
    public ResponseEntity<Health> health() {
        Health health = monitoringService.health();
        return ResponseEntity.ok(health);
    }

    /**
     * Get application metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> metrics() {
        MonitoringService.MetricsSnapshot metrics = monitoringService.getMetrics();
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalRequests", metrics.getTotalRequests());
        response.put("totalErrors", metrics.getTotalErrors());
        response.put("totalSubmissions", metrics.getTotalSubmissions());
        response.put("totalExecutions", metrics.getTotalExecutions());
        response.put("endpointMetrics", metrics.getEndpointMetrics());
        response.put("responseTimeMetrics", metrics.getResponseTimeMetrics());
        
        // Calculate error rate
        long totalRequests = metrics.getTotalRequests();
        long totalErrors = metrics.getTotalErrors();
        double errorRate = totalRequests > 0 ? (double) totalErrors / totalRequests * 100 : 0;
        response.put("errorRate", String.format("%.2f%%", errorRate));
        
        // Add system info
        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> systemInfo = new HashMap<>();
        systemInfo.put("totalMemory", runtime.totalMemory());
        systemInfo.put("freeMemory", runtime.freeMemory());
        systemInfo.put("usedMemory", runtime.totalMemory() - runtime.freeMemory());
        systemInfo.put("maxMemory", runtime.maxMemory());
        systemInfo.put("availableProcessors", runtime.availableProcessors());
        response.put("system", systemInfo);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get system status summary
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Health health = monitoringService.health();
        MonitoringService.MetricsSnapshot metrics = monitoringService.getMetrics();
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", health.getStatus().getCode());
        response.put("timestamp", System.currentTimeMillis());
        response.put("uptime", System.currentTimeMillis()); // Simplified uptime
        
        // Quick stats
        Map<String, Object> stats = new HashMap<>();
        stats.put("requests", metrics.getTotalRequests());
        stats.put("errors", metrics.getTotalErrors());
        stats.put("submissions", metrics.getTotalSubmissions());
        stats.put("executions", metrics.getTotalExecutions());
        response.put("stats", stats);
        
        return ResponseEntity.ok(response);
    }
}
