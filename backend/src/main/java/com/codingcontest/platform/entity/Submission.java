package com.codingcontest.platform.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Submission entity representing a code submission for a problem
 */
@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    @NotNull(message = "User ID cannot be null")
    private Long userId;

    @Column(name = "problem_id", nullable = false)
    @NotNull(message = "Problem ID cannot be null")
    private Long problemId;

    @Column(name = "contest_id", nullable = false)
    @NotNull(message = "Contest ID cannot be null")
    private Long contestId;

    @Column(name = "code", columnDefinition = "TEXT")
    @NotNull(message = "Code cannot be null")
    @Size(min = 1, max = 50000, message = "Code must be between 1 and 50000 characters")
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "language", nullable = false, length = 20)
    @NotNull(message = "Programming language cannot be null")
    private ProgrammingLanguage language;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull(message = "Submission status cannot be null")
    private SubmissionStatus status = SubmissionStatus.PENDING;

    @Column(name = "result", length = 500)
    @Size(max = 500, message = "Result must not exceed 500 characters")
    private String result;

    @Column(name = "score")
    @Min(value = 0, message = "Score cannot be negative")
    private Integer score = 0;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime submittedAt;

    @Column(name = "execution_time")
    @Min(value = 0, message = "Execution time cannot be negative")
    private Integer executionTime; // in milliseconds

    @Column(name = "memory_used")
    @Min(value = 0, message = "Memory used cannot be negative")
    private Integer memoryUsed; // in KB

    // Many-to-one relationship with User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    // Many-to-one relationship with Problem
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", insertable = false, updatable = false)
    private Problem problem;

    // Many-to-one relationship with Contest
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", insertable = false, updatable = false)
    private Contest contest;

    // Enum for programming languages
    public enum ProgrammingLanguage {
        JAVA, PYTHON, CPP, C, JAVASCRIPT, GO, RUST
    }

    // Enum for submission status
    public enum SubmissionStatus {
        PENDING,
        QUEUED,
        RUNNING,
        ACCEPTED,
        WRONG_ANSWER,
        TIME_LIMIT_EXCEEDED,
        MEMORY_LIMIT_EXCEEDED,
        RUNTIME_ERROR,
        COMPILATION_ERROR,
        PRESENTATION_ERROR,
        SYSTEM_ERROR
    }

    // Default constructor
    public Submission() {}

    // Constructor with parameters
    public Submission(Long userId, Long problemId, Long contestId, String code, 
                     ProgrammingLanguage language) {
        this.userId = userId;
        this.problemId = problemId;
        this.contestId = contestId;
        this.code = code;
        this.language = language;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Problem getProblem() {
        return problem;
    }

    public void setProblem(Problem problem) {
        this.problem = problem;
    }

    public Contest getContest() {
        return contest;
    }

    public void setContest(Contest contest) {
        this.contest = contest;
    }

    @Override
    public String toString() {
        return "Submission{" +
                "id=" + id +
                ", userId=" + userId +
                ", problemId=" + problemId +
                ", contestId=" + contestId +
                ", language=" + language +
                ", status=" + status +
                ", score=" + score +
                ", submittedAt=" + submittedAt +
                ", executionTime=" + executionTime +
                ", memoryUsed=" + memoryUsed +
                '}';
    }
}
