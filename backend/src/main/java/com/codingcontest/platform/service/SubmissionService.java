package com.codingcontest.platform.service;

import com.codingcontest.platform.dto.SubmissionRequest;
import com.codingcontest.platform.dto.SubmissionResponse;
import com.codingcontest.platform.dto.SubmissionStatusResponse;
import com.codingcontest.platform.entity.Contest;
import com.codingcontest.platform.entity.Problem;
import com.codingcontest.platform.entity.Submission;
import com.codingcontest.platform.entity.User;
import com.codingcontest.platform.exception.ContestNotFoundException;
import com.codingcontest.platform.repository.ContestRepository;
import com.codingcontest.platform.repository.ProblemRepository;
import com.codingcontest.platform.repository.SubmissionRepository;
import com.codingcontest.platform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for Submission-related business logic
 */
@Service
@Transactional(readOnly = true)
public class SubmissionService {
    
    private static final Logger logger = LoggerFactory.getLogger(SubmissionService.class);
    
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final ContestRepository contestRepository;
    private final SubmissionProcessorService submissionProcessorService;
    
    @Autowired
    public SubmissionService(SubmissionRepository submissionRepository,
                           UserRepository userRepository,
                           ProblemRepository problemRepository,
                           ContestRepository contestRepository,
                           SubmissionProcessorService submissionProcessorService) {
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.problemRepository = problemRepository;
        this.contestRepository = contestRepository;
        this.submissionProcessorService = submissionProcessorService;
    }
    
    /**
     * Creates a new submission and processes it asynchronously
     * 
     * @param request the submission request containing code and metadata
     * @return SubmissionResponse with initial submission details
     * @throws IllegalArgumentException if user, problem, or contest doesn't exist
     * @throws IllegalStateException if contest is not active
     */
    @Transactional
    public SubmissionResponse createSubmission(SubmissionRequest request) {
        logger.info("Creating submission for user {}, problem {}, contest {}", 
                   request.getUserId(), request.getProblemId(), request.getContestId());
        
        // Validate that user exists
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + request.getUserId()));
        
        // Validate that problem exists
        Problem problem = problemRepository.findById(request.getProblemId())
            .orElseThrow(() -> new IllegalArgumentException("Problem not found with ID: " + request.getProblemId()));
        
        // Validate that contest exists and is active
        Contest contest = contestRepository.findById(request.getContestId())
            .orElseThrow(() -> new ContestNotFoundException(request.getContestId()));
        
        // Check if contest is active
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(contest.getStartTime())) {
            throw new IllegalStateException("Contest has not started yet");
        }
        if (now.isAfter(contest.getEndTime())) {
            throw new IllegalStateException("Contest has already ended");
        }
        
        // Check if problem belongs to the contest
        if (!problem.getContestId().equals(request.getContestId())) {
            throw new IllegalArgumentException("Problem does not belong to the specified contest");
        }
        
        // Create submission entity with QUEUED status
        Submission submission = new Submission(
            request.getUserId(),
            request.getProblemId(),
            request.getContestId(),
            request.getCode(),
            request.getLanguage()
        );
        
        // Set initial status to QUEUED for async processing
        submission.setStatus(Submission.SubmissionStatus.QUEUED);
        submission.setResult("Submission queued for processing...");
        
        // Save submission
        submission = submissionRepository.save(submission);
        logger.info("Submission created with ID: {} and status: QUEUED", submission.getId());
        
        // Process submission asynchronously using SubmissionProcessorService
        submissionProcessorService.processSubmission(submission.getId());
        logger.info("Async processing initiated for submission: {}", submission.getId());
        
        // Return response
        return convertToSubmissionResponse(submission);
    }
    
    /**
     * Retrieves a submission by ID
     * 
     * @param submissionId the ID of the submission
     * @return SubmissionResponse with submission details
     * @throws IllegalArgumentException if submission not found
     */
    public SubmissionResponse getSubmissionById(Long submissionId) {
        logger.debug("Fetching submission with ID: {}", submissionId);
        
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new IllegalArgumentException("Submission not found with ID: " + submissionId));
        
        return convertToSubmissionResponse(submission);
    }
    
    /**
     * Retrieves submission status by ID (lightweight response)
     * 
     * @param submissionId the ID of the submission
     * @return SubmissionStatusResponse with status information
     * @throws IllegalArgumentException if submission not found
     */
    public SubmissionStatusResponse getSubmissionStatus(Long submissionId) {
        logger.debug("Fetching submission status for ID: {}", submissionId);
        
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new IllegalArgumentException("Submission not found with ID: " + submissionId));
        
        return convertToSubmissionStatusResponse(submission);
    }
    
    /**
     * Retrieves all submissions for a specific user
     * 
     * @param userId the ID of the user
     * @return List of SubmissionResponse objects
     * @throws IllegalArgumentException if user not found
     */
    public List<SubmissionResponse> getUserSubmissions(Long userId) {
        logger.debug("Fetching submissions for user ID: {}", userId);
        
        // Validate that user exists
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        
        List<Submission> submissions = submissionRepository.findByUserId(userId);
        
        return submissions.stream()
            .map(this::convertToSubmissionResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Updates the status and results of a submission
     * 
     * @param submissionId the ID of the submission
     * @param status the new status
     * @param result the execution result
     * @param score the score achieved
     * @param executionTime the execution time in milliseconds
     * @param memoryUsed the memory used in KB
     * @throws IllegalArgumentException if submission not found
     */
    @Transactional
    public void updateSubmissionStatus(Long submissionId, Submission.SubmissionStatus status, 
                                     String result, Integer score, Integer executionTime, 
                                     Integer memoryUsed) {
        logger.info("Updating submission {} with status: {}, score: {}", submissionId, status, score);
        
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new IllegalArgumentException("Submission not found with ID: " + submissionId));
        
        submission.setStatus(status);
        submission.setResult(result);
        submission.setScore(score);
        submission.setExecutionTime(executionTime);
        submission.setMemoryUsed(memoryUsed);
        
        submissionRepository.save(submission);
        logger.info("Submission {} updated successfully", submissionId);
    }
    
    
    /**
     * Converts Submission entity to SubmissionResponse DTO
     */
    private SubmissionResponse convertToSubmissionResponse(Submission submission) {
        return new SubmissionResponse(
            submission.getId(),
            submission.getStatus(),
            submission.getResult(),
            submission.getScore(),
            submission.getExecutionTime(),
            submission.getMemoryUsed(),
            submission.getUserId(),
            submission.getProblemId(),
            submission.getContestId(),
            submission.getLanguage(),
            submission.getSubmittedAt()
        );
    }
    
    /**
     * Converts Submission entity to SubmissionStatusResponse DTO
     */
    private SubmissionStatusResponse convertToSubmissionStatusResponse(Submission submission) {
        return new SubmissionStatusResponse(
            submission.getId(),
            submission.getStatus(),
            submission.getResult(),
            submission.getSubmittedAt(),
            submission.getSubmittedAt() // Using submittedAt as updatedAt since we don't have a separate updatedAt field
        );
    }
}
