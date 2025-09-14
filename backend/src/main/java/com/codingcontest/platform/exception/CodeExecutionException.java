package com.codingcontest.platform.exception;

/**
 * Exception thrown when code execution fails
 */
public class CodeExecutionException extends RuntimeException {
    
    private final String executionId;
    private final String language;
    private final ExecutionFailureType failureType;
    private final String dockerOutput;
    
    public enum ExecutionFailureType {
        DOCKER_UNAVAILABLE,
        CONTAINER_CREATION_FAILED,
        EXECUTION_TIMEOUT,
        COMPILATION_ERROR,
        RUNTIME_ERROR,
        MEMORY_LIMIT_EXCEEDED,
        OUTPUT_LIMIT_EXCEEDED,
        SECURITY_VIOLATION,
        UNKNOWN_ERROR
    }
    
    public CodeExecutionException(String message) {
        super(message);
        this.executionId = null;
        this.language = null;
        this.failureType = ExecutionFailureType.UNKNOWN_ERROR;
        this.dockerOutput = null;
    }
    
    public CodeExecutionException(String message, Throwable cause) {
        super(message, cause);
        this.executionId = null;
        this.language = null;
        this.failureType = ExecutionFailureType.UNKNOWN_ERROR;
        this.dockerOutput = null;
    }
    
    public CodeExecutionException(String executionId, String language, ExecutionFailureType failureType, String message) {
        super(message);
        this.executionId = executionId;
        this.language = language;
        this.failureType = failureType;
        this.dockerOutput = null;
    }
    
    public CodeExecutionException(String executionId, String language, ExecutionFailureType failureType, 
                                String message, String dockerOutput) {
        super(message);
        this.executionId = executionId;
        this.language = language;
        this.failureType = failureType;
        this.dockerOutput = dockerOutput;
    }
    
    public CodeExecutionException(String executionId, String language, ExecutionFailureType failureType, 
                                String message, Throwable cause) {
        super(message, cause);
        this.executionId = executionId;
        this.language = language;
        this.failureType = failureType;
        this.dockerOutput = null;
    }
    
    public String getExecutionId() {
        return executionId;
    }
    
    public String getLanguage() {
        return language;
    }
    
    public ExecutionFailureType getFailureType() {
        return failureType;
    }
    
    public String getDockerOutput() {
        return dockerOutput;
    }
}
