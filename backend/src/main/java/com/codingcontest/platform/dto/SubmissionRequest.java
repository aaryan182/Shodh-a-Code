package com.codingcontest.platform.dto;

import com.codingcontest.platform.entity.Submission.ProgrammingLanguage;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new submission
 */
public class SubmissionRequest {
    
    @NotNull(message = "User ID cannot be null")
    @Positive(message = "User ID must be positive")
    private Long userId;
    
    @NotNull(message = "Problem ID cannot be null")
    @Positive(message = "Problem ID must be positive")
    private Long problemId;
    
    @NotNull(message = "Contest ID cannot be null")
    @Positive(message = "Contest ID must be positive")
    private Long contestId;
    
    @NotNull(message = "Code cannot be null")
    @Size(min = 1, max = 50000, message = "Code must be between 1 and 50000 characters")
    private String code;
    
    @NotNull(message = "Programming language cannot be null")
    private ProgrammingLanguage language;
    
    // Default constructor
    public SubmissionRequest() {}
    
    // Constructor with all fields
    public SubmissionRequest(Long userId, Long problemId, Long contestId, 
                           String code, ProgrammingLanguage language) {
        this.userId = userId;
        this.problemId = problemId;
        this.contestId = contestId;
        this.code = code;
        this.language = language;
    }
    
    // Getters and Setters
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
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public ProgrammingLanguage getLanguage() {
        return language;
    }
    
    public void setLanguage(ProgrammingLanguage language) {
        this.language = language;
    }
    
    @Override
    public String toString() {
        return "SubmissionRequest{" +
                "userId=" + userId +
                ", problemId=" + problemId +
                ", contestId=" + contestId +
                ", language=" + language +
                ", codeLength=" + (code != null ? code.length() : 0) +
                '}';
    }
}
