package com.codingcontest.platform.exception;

/**
 * Exception thrown when a submission is invalid
 */
public class InvalidSubmissionException extends RuntimeException {
    
    private final String field;
    private final String rejectedValue;
    
    public InvalidSubmissionException(String message) {
        super(message);
        this.field = null;
        this.rejectedValue = null;
    }
    
    public InvalidSubmissionException(String message, Throwable cause) {
        super(message, cause);
        this.field = null;
        this.rejectedValue = null;
    }
    
    public InvalidSubmissionException(String field, String rejectedValue, String message) {
        super(message);
        this.field = field;
        this.rejectedValue = rejectedValue;
    }
    
    public InvalidSubmissionException(String message, String field, String rejectedValue, Throwable cause) {
        super(message, cause);
        this.field = field;
        this.rejectedValue = rejectedValue;
    }
    
    public String getField() {
        return field;
    }
    
    public String getRejectedValue() {
        return rejectedValue;
    }
}
