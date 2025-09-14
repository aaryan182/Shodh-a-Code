package com.codingcontest.platform.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for contest details with problems
 */
public class ContestDetailsResponse {
    
    private Long id;
    private String name;
    private String description;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    private List<ProblemSummaryResponse> problems;
    private ContestStatus status;
    
    public enum ContestStatus {
        UPCOMING, ACTIVE, ENDED
    }
    
    // Default constructor
    public ContestDetailsResponse() {}
    
    // Constructor with all fields
    public ContestDetailsResponse(Long id, String name, String description, 
                                LocalDateTime startTime, LocalDateTime endTime, 
                                LocalDateTime createdAt, List<ProblemSummaryResponse> problems, 
                                ContestStatus status) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createdAt = createdAt;
        this.problems = problems;
        this.status = status;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public List<ProblemSummaryResponse> getProblems() {
        return problems;
    }
    
    public void setProblems(List<ProblemSummaryResponse> problems) {
        this.problems = problems;
    }
    
    public ContestStatus getStatus() {
        return status;
    }
    
    public void setStatus(ContestStatus status) {
        this.status = status;
    }
}
