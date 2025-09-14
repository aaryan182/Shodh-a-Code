package com.codingcontest.platform.dto;

import com.codingcontest.platform.entity.Submission.SubmissionStatus;

/**
 * Represents the result of code execution in the judge system
 */
public class ExecutionResult {
    
    private SubmissionStatus status;
    private String output;
    private String errorOutput;
    private Long executionTime; // in milliseconds
    private Long memoryUsed; // in KB
    private Integer exitCode;
    
    // Default constructor
    public ExecutionResult() {}
    
    // Constructor with all parameters
    public ExecutionResult(SubmissionStatus status, String output, String errorOutput, 
                          Long executionTime, Long memoryUsed, Integer exitCode) {
        this.status = status;
        this.output = output;
        this.errorOutput = errorOutput;
        this.executionTime = executionTime;
        this.memoryUsed = memoryUsed;
        this.exitCode = exitCode;
    }
    
    // Static factory methods for common results
    public static ExecutionResult success(String output, Long executionTime, Long memoryUsed) {
        return new ExecutionResult(SubmissionStatus.ACCEPTED, output, null, 
                                 executionTime, memoryUsed, 0);
    }
    
    public static ExecutionResult timeLimitExceeded(Long executionTime) {
        return new ExecutionResult(SubmissionStatus.TIME_LIMIT_EXCEEDED, null, 
                                 "Time limit exceeded", executionTime, null, 124);
    }
    
    public static ExecutionResult memoryLimitExceeded(Long memoryUsed) {
        return new ExecutionResult(SubmissionStatus.MEMORY_LIMIT_EXCEEDED, null, 
                                 "Memory limit exceeded", null, memoryUsed, 137);
    }
    
    public static ExecutionResult runtimeError(String errorOutput, Integer exitCode) {
        return new ExecutionResult(SubmissionStatus.RUNTIME_ERROR, null, 
                                 errorOutput, null, null, exitCode);
    }
    
    public static ExecutionResult compilationError(String errorOutput) {
        return new ExecutionResult(SubmissionStatus.COMPILATION_ERROR, null, 
                                 errorOutput, null, null, 1);
    }
    
    public static ExecutionResult systemError(String errorMessage) {
        return new ExecutionResult(SubmissionStatus.SYSTEM_ERROR, null, 
                                 errorMessage, null, null, -1);
    }
    
    public static ExecutionResult wrongAnswer(String actualOutput, String errorOutput) {
        return new ExecutionResult(SubmissionStatus.WRONG_ANSWER, actualOutput, 
                                 errorOutput, null, null, 0);
    }
    
    // Getters and Setters
    public SubmissionStatus getStatus() {
        return status;
    }
    
    public void setStatus(SubmissionStatus status) {
        this.status = status;
    }
    
    public String getOutput() {
        return output;
    }
    
    public void setOutput(String output) {
        this.output = output;
    }
    
    public String getErrorOutput() {
        return errorOutput;
    }
    
    public void setErrorOutput(String errorOutput) {
        this.errorOutput = errorOutput;
    }
    
    public Long getExecutionTime() {
        return executionTime;
    }
    
    public void setExecutionTime(Long executionTime) {
        this.executionTime = executionTime;
    }
    
    public Long getMemoryUsed() {
        return memoryUsed;
    }
    
    public void setMemoryUsed(Long memoryUsed) {
        this.memoryUsed = memoryUsed;
    }
    
    public Integer getExitCode() {
        return exitCode;
    }
    
    public void setExitCode(Integer exitCode) {
        this.exitCode = exitCode;
    }
    
    // Utility methods
    public boolean isSuccessful() {
        return status == SubmissionStatus.ACCEPTED;
    }
    
    public boolean hasCompilationError() {
        return status == SubmissionStatus.COMPILATION_ERROR;
    }
    
    public boolean hasRuntimeError() {
        return status == SubmissionStatus.RUNTIME_ERROR;
    }
    
    public boolean hasTimeoutError() {
        return status == SubmissionStatus.TIME_LIMIT_EXCEEDED;
    }
    
    public boolean hasMemoryError() {
        return status == SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
    }
    
    @Override
    public String toString() {
        return "ExecutionResult{" +
                "status=" + status +
                ", output='" + (output != null ? output.substring(0, Math.min(output.length(), 100)) : null) + "'" +
                ", errorOutput='" + (errorOutput != null ? errorOutput.substring(0, Math.min(errorOutput.length(), 100)) : null) + "'" +
                ", executionTime=" + executionTime +
                ", memoryUsed=" + memoryUsed +
                ", exitCode=" + exitCode +
                '}';
    }
}
