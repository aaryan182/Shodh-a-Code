package com.codingcontest.platform.service;

import com.codingcontest.platform.dto.ExecutionResult;
import com.codingcontest.platform.entity.Submission;
import com.codingcontest.platform.entity.TestCase;
import com.codingcontest.platform.repository.SubmissionRepository;
import com.codingcontest.platform.repository.TestCaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Service class for asynchronous submission processing
 * Handles the complete submission lifecycle from QUEUED to final status
 */
@Service
public class SubmissionProcessorService {
    
    private static final Logger logger = LoggerFactory.getLogger(SubmissionProcessorService.class);
    
    private final SubmissionRepository submissionRepository;
    private final TestCaseRepository testCaseRepository;
    private final CodeJudgeService codeJudgeService;
    
    @Autowired
    public SubmissionProcessorService(SubmissionRepository submissionRepository,
                                    TestCaseRepository testCaseRepository,
                                    CodeJudgeService codeJudgeService) {
        this.submissionRepository = submissionRepository;
        this.testCaseRepository = testCaseRepository;
        this.codeJudgeService = codeJudgeService;
    }
    
    /**
     * Processes a submission asynchronously through all stages
     * 
     * Process flow:
     * 1. Receive submission -> set status QUEUED (already done by caller)
     * 2. Fetch test cases for the problem
     * 3. Set status to RUNNING
     * 4. Execute code for each test case
     * 5. Calculate final score and result
     * 6. Update submission with final status
     * 
     * @param submissionId the ID of the submission to process
     * @return CompletableFuture<Void> for async processing
     */
    @Async("submissionExecutor")
    public CompletableFuture<Void> processSubmission(Long submissionId) {
        logger.info("Starting async submission processing for submission ID: {}", submissionId);
        
        try {
            // Step 1: Get submission details (should already be QUEUED)
            Submission submission = getSubmissionById(submissionId);
            if (submission == null) {
                logger.error("Submission not found with ID: {}", submissionId);
                return CompletableFuture.completedFuture(null);
            }
            
            logger.info("Processing submission {} for user {} on problem {}", 
                       submissionId, submission.getUserId(), submission.getProblemId());
            
            // Step 2: Fetch test cases for the problem
            List<TestCase> testCases = fetchTestCases(submission.getProblemId());
            if (testCases.isEmpty()) {
                logger.warn("No test cases found for problem {}", submission.getProblemId());
                updateSubmissionStatus(submissionId, Submission.SubmissionStatus.SYSTEM_ERROR,
                                     "No test cases available for this problem", 0, null, null);
                return CompletableFuture.completedFuture(null);
            }
            
            logger.info("Found {} test cases for problem {}", testCases.size(), submission.getProblemId());
            
            // Step 3: Set status to RUNNING
            updateSubmissionStatus(submissionId, Submission.SubmissionStatus.RUNNING,
                                 "Executing code against test cases...", null, null, null);
            
            // Step 4: Execute code for each test case using CodeJudgeService
            logger.info("Starting code execution for submission {}", submissionId);
            ExecutionResult executionResult = executeCodeAgainstTestCases(submission, testCases);
            
            // Step 5: Calculate final score and result
            int finalScore = calculateFinalScore(executionResult, testCases.size());
            Submission.SubmissionStatus finalStatus = determineFinalStatus(executionResult);
            String finalResult = generateResultMessage(executionResult, testCases.size());
            
            // Extract execution metrics
            Integer executionTime = executionResult.getExecutionTime() != null ? 
                executionResult.getExecutionTime().intValue() : null;
            Integer memoryUsed = executionResult.getMemoryUsed() != null ? 
                executionResult.getMemoryUsed().intValue() : null;
            
            // Step 6: Update submission with final status
            updateSubmissionStatus(submissionId, finalStatus, finalResult, 
                                 finalScore, executionTime, memoryUsed);
            
            logger.info("Submission {} processing completed with status: {}, score: {}", 
                       submissionId, finalStatus, finalScore);
            
        } catch (Exception e) {
            logger.error("Error during async processing for submission {}: {}", submissionId, e.getMessage(), e);
            
            // Update submission with system error status
            try {
                updateSubmissionStatus(submissionId, Submission.SubmissionStatus.SYSTEM_ERROR,
                                     "Internal system error during processing: " + e.getMessage(), 
                                     0, null, null);
            } catch (Exception updateError) {
                logger.error("Failed to update submission {} with error status: {}", 
                           submissionId, updateError.getMessage(), updateError);
            }
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * Retrieves submission by ID with proper error handling
     */
    @Transactional(readOnly = true)
    private Submission getSubmissionById(Long submissionId) {
        try {
            return submissionRepository.findById(submissionId).orElse(null);
        } catch (Exception e) {
            logger.error("Error fetching submission {}: {}", submissionId, e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Fetches test cases for a given problem
     */
    @Transactional(readOnly = true)
    private List<TestCase> fetchTestCases(Long problemId) {
        try {
            List<TestCase> testCases = testCaseRepository.findByProblemId(problemId);
            logger.debug("Fetched {} test cases for problem {}", testCases.size(), problemId);
            return testCases;
        } catch (Exception e) {
            logger.error("Error fetching test cases for problem {}: {}", problemId, e.getMessage(), e);
            return List.of(); // Return empty list on error
        }
    }
    
    /**
     * Executes code against all test cases using CodeJudgeService
     */
    private ExecutionResult executeCodeAgainstTestCases(Submission submission, List<TestCase> testCases) {
        try {
            return codeJudgeService.executeCode(submission, testCases);
        } catch (Exception e) {
            logger.error("Error executing code for submission {}: {}", submission.getId(), e.getMessage(), e);
            // Return a system error result
            return ExecutionResult.systemError("Code execution failed: " + e.getMessage());
        }
    }
    
    /**
     * Calculates the final score based on execution results
     */
    private int calculateFinalScore(ExecutionResult result, int totalTestCases) {
        if (result.isSuccessful()) {
            // For now, we give full score (100) for successful execution
            // In a more sophisticated system, this could be based on:
            // - Number of passed test cases
            // - Execution time performance
            // - Memory usage efficiency
            return 100;
        } else if (result.getStatus() == Submission.SubmissionStatus.COMPILATION_ERROR ||
                   result.getStatus() == Submission.SubmissionStatus.SYSTEM_ERROR) {
            return 0; // No score for compilation or system errors
        } else {
            // For runtime errors, time limit exceeded, etc.
            // Could implement partial scoring here based on passed test cases
            return 0;
        }
    }
    
    /**
     * Determines the final submission status based on execution results
     */
    private Submission.SubmissionStatus determineFinalStatus(ExecutionResult result) {
        // The ExecutionResult already contains the appropriate status
        // from the CodeJudgeService execution
        return result.getStatus();
    }
    
    /**
     * Generates a user-friendly result message
     */
    private String generateResultMessage(ExecutionResult result, int totalTestCases) {
        if (result.isSuccessful()) {
            return String.format("All %d test cases passed successfully", totalTestCases);
        } else {
            String errorOutput = result.getErrorOutput();
            if (errorOutput != null && !errorOutput.trim().isEmpty()) {
                return errorOutput;
            } else {
                return "Execution failed - " + result.getStatus().toString().toLowerCase().replace('_', ' ');
            }
        }
    }
    
    /**
     * Updates submission status in the database with proper transaction management
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void updateSubmissionStatus(Long submissionId, Submission.SubmissionStatus status,
                                       String result, Integer score, Integer executionTime,
                                       Integer memoryUsed) {
        try {
            Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with ID: " + submissionId));
            
            submission.setStatus(status);
            submission.setResult(result);
            
            if (score != null) {
                submission.setScore(score);
            }
            if (executionTime != null) {
                submission.setExecutionTime(executionTime);
            }
            if (memoryUsed != null) {
                submission.setMemoryUsed(memoryUsed);
            }
            
            submissionRepository.save(submission);
            
            logger.debug("Updated submission {} - Status: {}, Score: {}", 
                        submissionId, status, score);
            
        } catch (Exception e) {
            logger.error("Failed to update submission {} status: {}", submissionId, e.getMessage(), e);
            throw e; // Re-throw to ensure proper error handling
        }
    }
}
