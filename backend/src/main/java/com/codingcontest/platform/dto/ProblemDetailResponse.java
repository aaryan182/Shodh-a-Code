package com.codingcontest.platform.dto;

import com.codingcontest.platform.entity.Problem;

/**
 * Response DTO for detailed problem information
 */
public class ProblemDetailResponse {
    
    private Long id;
    private String title;
    private String description;
    private Problem.Difficulty difficulty;
    private Integer timeLimit;
    private Integer memoryLimit;
    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private Integer totalSubmissions;
    private Integer acceptedSubmissions;
    
    // Default constructor
    public ProblemDetailResponse() {}
    
    // Constructor with all fields
    public ProblemDetailResponse(Long id, String title, String description, 
                               Problem.Difficulty difficulty, Integer timeLimit, 
                               Integer memoryLimit, String inputFormat, 
                               String outputFormat, String constraints,
                               Integer totalSubmissions, Integer acceptedSubmissions) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.difficulty = difficulty;
        this.timeLimit = timeLimit;
        this.memoryLimit = memoryLimit;
        this.inputFormat = inputFormat;
        this.outputFormat = outputFormat;
        this.constraints = constraints;
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
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
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
    
    public String getInputFormat() {
        return inputFormat;
    }
    
    public void setInputFormat(String inputFormat) {
        this.inputFormat = inputFormat;
    }
    
    public String getOutputFormat() {
        return outputFormat;
    }
    
    public void setOutputFormat(String outputFormat) {
        this.outputFormat = outputFormat;
    }
    
    public String getConstraints() {
        return constraints;
    }
    
    public void setConstraints(String constraints) {
        this.constraints = constraints;
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
