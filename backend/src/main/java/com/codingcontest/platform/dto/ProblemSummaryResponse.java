package com.codingcontest.platform.dto;

import com.codingcontest.platform.entity.Problem;

/**
 * Response DTO for problem summary information
 */
public class ProblemSummaryResponse {
    
    private Long id;
    private String title;
    private Problem.Difficulty difficulty;
    private Integer timeLimit;
    private Integer memoryLimit;
    private Integer totalSubmissions;
    private Integer acceptedSubmissions;
    
    // Default constructor
    public ProblemSummaryResponse() {}
    
    // Constructor with all fields
    public ProblemSummaryResponse(Long id, String title, Problem.Difficulty difficulty, 
                                Integer timeLimit, Integer memoryLimit, 
                                Integer totalSubmissions, Integer acceptedSubmissions) {
        this.id = id;
        this.title = title;
        this.difficulty = difficulty;
        this.timeLimit = timeLimit;
        this.memoryLimit = memoryLimit;
        this.totalSubmissions = totalSubmissions;
        this.acceptedSubmissions = acceptedSubmissions;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public Problem.Difficulty getDifficulty() {
        return difficulty;
    }
    
    public void setDifficulty(Problem.Difficulty difficulty) {
        this.difficulty = difficulty;
    }
    
    public Integer getTimeLimit() {
        return timeLimit;
    }
    
    public void setTimeLimit(Integer timeLimit) {
        this.timeLimit = timeLimit;
    }
    
    public Integer getMemoryLimit() {
        return memoryLimit;
    }
    
    public void setMemoryLimit(Integer memoryLimit) {
        this.memoryLimit = memoryLimit;
    }
    
    public Integer getTotalSubmissions() {
        return totalSubmissions;
    }
    
    public void setTotalSubmissions(Integer totalSubmissions) {
        this.totalSubmissions = totalSubmissions;
    }
    
    public Integer getAcceptedSubmissions() {
        return acceptedSubmissions;
    }
    
    public void setAcceptedSubmissions(Integer acceptedSubmissions) {
        this.acceptedSubmissions = acceptedSubmissions;
    }
}
