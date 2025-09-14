package com.codingcontest.platform.dto;

import com.codingcontest.platform.entity.Submission.ProgrammingLanguage;
import com.codingcontest.platform.entity.Submission.SubmissionStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * Response DTO for submission details
 */
public class SubmissionResponse {
    
    private Long submissionId;
    private SubmissionStatus status;
    private String result;
    private Integer score;
    private Integer executionTime; // in milliseconds
    private Integer memoryUsed;    // in KB
    private Long userId;
    private Long problemId;
    private Long contestId;
    private ProgrammingLanguage language;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submittedAt;
    
    // Default constructor
    public SubmissionResponse() {}
    
    // Constructor with essential fields
    public SubmissionResponse(Long submissionId, SubmissionStatus status, String result, 
                            Integer score, Integer executionTime, Integer memoryUsed) {
        this.submissionId = submissionId;
        this.status = status;
        this.result = result;
        this.score = score;
        this.executionTime = executionTime;
        this.memoryUsed = memoryUsed;
    }
    
    // Constructor with all fields
    public SubmissionResponse(Long submissionId, SubmissionStatus status, String result, 
                            Integer score, Integer executionTime, Integer memoryUsed,
                            Long userId, Long problemId, Long contestId, 
                            ProgrammingLanguage language, LocalDateTime submittedAt) {
        this.submissionId = submissionId;
        this.status = status;
        this.result = result;
        this.score = score;
        this.executionTime = executionTime;
        this.memoryUsed = memoryUsed;
        this.userId = userId;
        this.problemId = problemId;
        this.contestId = contestId;
        this.language = language;
        this.submittedAt = submittedAt;
    }
    
    // Getters and Setters
    public Long getSubmissionId() {
        return submissionId;
    }
    
    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
    }
    
    public SubmissionStatus getStatus() {
        return status;
    }
    
    public void setStatus(SubmissionStatus status) {
        this.status = status;
    }
    
    public String getResult() {
        return result;
    }
    
    public void setResult(String result) {
        this.result = result;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
    }
    
    public Integer getExecutionTime() {
        return executionTime;
    }
    
    public void setExecutionTime(Integer executionTime) {
        this.executionTime = executionTime;
    }
    
    public Integer getMemoryUsed() {
        return memoryUsed;
    }
    
    public void setMemoryUsed(Integer memoryUsed) {
        this.memoryUsed = memoryUsed;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Long getProblemId() {
        return problemId;
    }
    
    public void setProblemId(Long problemId) {
        this.problemId = problemId;
    }
    
    public Long getContestId() {
        return contestId;
    }
    
    public void setContestId(Long contestId) {
        this.contestId = contestId;
    }
    
    public ProgrammingLanguage getLanguage() {
        return language;
    }
    
    public void setLanguage(ProgrammingLanguage language) {
        this.language = language;
    }
    
    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    @Override
    public String toString() {
        return "SubmissionResponse{" +
                "submissionId=" + submissionId +
                ", status=" + status +
                ", score=" + score +
                ", executionTime=" + executionTime +
                ", memoryUsed=" + memoryUsed +
                ", userId=" + userId +
                ", problemId=" + problemId +
                ", contestId=" + contestId +
                ", language=" + language +
                ", submittedAt=" + submittedAt +
                '}';
    }
}
