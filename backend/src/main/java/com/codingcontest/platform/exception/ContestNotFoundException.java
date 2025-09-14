package com.codingcontest.platform.exception;

/**
 * Exception thrown when a contest is not found
 */
public class ContestNotFoundException extends RuntimeException {
    
    public ContestNotFoundException(String message) {
        super(message);
    }
    
    public ContestNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public ContestNotFoundException(Long contestId) {
        super("Contest not found with id: " + contestId);
    }
}
