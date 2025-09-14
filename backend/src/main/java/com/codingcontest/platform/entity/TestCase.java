package com.codingcontest.platform.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * TestCase entity representing test cases for problems
 */
@Entity
@Table(name = "test_cases")
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "problem_id", nullable = false)
    @NotNull(message = "Problem ID cannot be null")
    private Long problemId;

    @Column(name = "input", columnDefinition = "TEXT")
    @NotNull(message = "Test case input cannot be null")
    @Size(max = 10000, message = "Input must not exceed 10000 characters")
    private String input;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    @NotNull(message = "Expected output cannot be null")
    @Size(max = 10000, message = "Expected output must not exceed 10000 characters")
    private String expectedOutput;

    @Column(name = "is_hidden", nullable = false)
    @NotNull(message = "isHidden flag cannot be null")
    private Boolean isHidden = false;

    // Many-to-one relationship with Problem
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", insertable = false, updatable = false)
    private Problem problem;

    // Default constructor
    public TestCase() {}

    // Constructor with parameters
    public TestCase(Long problemId, String input, String expectedOutput, Boolean isHidden) {
        this.problemId = problemId;
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.isHidden = isHidden;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProblemId() {
        return problemId;
    }

    public void setProblemId(Long problemId) {
        this.problemId = problemId;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getExpectedOutput() {
        return expectedOutput;
    }

    public void setExpectedOutput(String expectedOutput) {
        this.expectedOutput = expectedOutput;
    }

    public Boolean getIsHidden() {
        return isHidden;
    }

    public void setIsHidden(Boolean isHidden) {
        this.isHidden = isHidden;
    }

    public Problem getProblem() {
        return problem;
    }

    public void setProblem(Problem problem) {
        this.problem = problem;
    }

    @Override
    public String toString() {
        return "TestCase{" +
                "id=" + id +
                ", problemId=" + problemId +
                ", input='" + input + '\'' +
                ", expectedOutput='" + expectedOutput + '\'' +
                ", isHidden=" + isHidden +
                '}';
    }
}
