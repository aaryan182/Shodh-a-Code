package com.codingcontest.platform.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Problem entity representing a coding problem in a contest
 */
@Entity
@Table(name = "problems")
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contest_id", nullable = false)
    @NotNull(message = "Contest ID cannot be null")
    private Long contestId;

    @Column(name = "title", nullable = false, length = 200)
    @NotNull(message = "Problem title cannot be null")
    @Size(min = 1, max = 200, message = "Problem title must be between 1 and 200 characters")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    @NotNull(message = "Problem description cannot be null")
    @Size(min = 1, max = 10000, message = "Problem description must be between 1 and 10000 characters")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false, length = 10)
    @NotNull(message = "Difficulty cannot be null")
    private Difficulty difficulty;

    @Column(name = "time_limit", nullable = false)
    @NotNull(message = "Time limit cannot be null")
    @Min(value = 1, message = "Time limit must be at least 1 second")
    private Integer timeLimit; // in seconds

    @Column(name = "memory_limit", nullable = false)
    @NotNull(message = "Memory limit cannot be null")
    @Min(value = 1, message = "Memory limit must be at least 1 MB")
    private Integer memoryLimit; // in MB

    @Column(name = "input_format", columnDefinition = "TEXT")
    @Size(max = 2000, message = "Input format must not exceed 2000 characters")
    private String inputFormat;

    @Column(name = "output_format", columnDefinition = "TEXT")
    @Size(max = 2000, message = "Output format must not exceed 2000 characters")
    private String outputFormat;

    @Column(name = "constraints", columnDefinition = "TEXT")
    @Size(max = 2000, message = "Constraints must not exceed 2000 characters")
    private String constraints;

    // Many-to-one relationship with Contest
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", insertable = false, updatable = false)
    private Contest contest;

    // Bidirectional relationship with TestCase
    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TestCase> testCases;

    // Bidirectional relationship with Submission
    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Submission> submissions;

    // Enum for difficulty levels
    public enum Difficulty {
        EASY, MEDIUM, HARD
    }

    // Default constructor
    public Problem() {}

    // Constructor with parameters
    public Problem(Long contestId, String title, String description, Difficulty difficulty, 
                   Integer timeLimit, Integer memoryLimit) {
        this.contestId = contestId;
        this.title = title;
        this.description = description;
        this.difficulty = difficulty;
        this.timeLimit = timeLimit;
        this.memoryLimit = memoryLimit;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getContestId() {
        return contestId;
    }

    public void setContestId(Long contestId) {
        this.contestId = contestId;
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

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Difficulty difficulty) {
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

    public Contest getContest() {
        return contest;
    }

    public void setContest(Contest contest) {
        this.contest = contest;
    }

    public List<TestCase> getTestCases() {
        return testCases;
    }

    public void setTestCases(List<TestCase> testCases) {
        this.testCases = testCases;
    }

    public List<Submission> getSubmissions() {
        return submissions;
    }

    public void setSubmissions(List<Submission> submissions) {
        this.submissions = submissions;
    }

    @Override
    public String toString() {
        return "Problem{" +
                "id=" + id +
                ", contestId=" + contestId +
                ", title='" + title + '\'' +
                ", difficulty=" + difficulty +
                ", timeLimit=" + timeLimit +
                ", memoryLimit=" + memoryLimit +
                '}';
    }
}
