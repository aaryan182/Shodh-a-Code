package com.codingcontest.platform.exception;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Enhanced error response for validation errors with field-level details
 */
public class ValidationErrorResponse {
    
    private String error;
    private String message;
    private int status;
    private String path;
    private Map<String, List<String>> fieldErrors;
    private List<String> globalErrors;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;
    
    // Default constructor
    public ValidationErrorResponse() {
        this.timestamp = LocalDateTime.now();
    }
    
    // Constructor with all fields
    public ValidationErrorResponse(String error, String message, int status, String path,
                                 Map<String, List<String>> fieldErrors, List<String> globalErrors) {
        this.error = error;
        this.message = message;
        this.status = status;
        this.path = path;
        this.fieldErrors = fieldErrors;
        this.globalErrors = globalErrors;
        this.timestamp = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public int getStatus() {
        return status;
    }
    
    public void setStatus(int status) {
        this.status = status;
    }
    
    public String getPath() {
        return path;
    }
    
    public void setPath(String path) {
        this.path = path;
    }
    
    public Map<String, List<String>> getFieldErrors() {
        return fieldErrors;
    }
    
    public void setFieldErrors(Map<String, List<String>> fieldErrors) {
        this.fieldErrors = fieldErrors;
    }
    
    public List<String> getGlobalErrors() {
        return globalErrors;
    }
    
    public void setGlobalErrors(List<String> globalErrors) {
        this.globalErrors = globalErrors;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
