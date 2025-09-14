package com.codingcontest.platform.exception;

/**
 * Exception thrown when database connection issues occur
 */
public class DatabaseConnectionException extends RuntimeException {
    
    private final String operation;
    private final String details;
    
    public DatabaseConnectionException(String message) {
        super(message);
        this.operation = null;
        this.details = null;
    }
    
    public DatabaseConnectionException(String message, Throwable cause) {
        super(message, cause);
        this.operation = null;
        this.details = null;
    }
    
    public DatabaseConnectionException(String operation, String message) {
        super(message);
        this.operation = operation;
        this.details = null;
    }
    
    public DatabaseConnectionException(String operation, String message, String details) {
        super(message);
        this.operation = operation;
        this.details = details;
    }
    
    public DatabaseConnectionException(String operation, String message, Throwable cause) {
        super(message, cause);
        this.operation = operation;
        this.details = null;
    }
    
    public String getOperation() {
        return operation;
    }
    
    public String getDetails() {
        return details;
    }
}
