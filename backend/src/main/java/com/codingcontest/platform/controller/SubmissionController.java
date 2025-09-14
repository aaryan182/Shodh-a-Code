package com.codingcontest.platform.controller;

import com.codingcontest.platform.dto.SubmissionRequest;
import com.codingcontest.platform.dto.SubmissionResponse;
import com.codingcontest.platform.dto.SubmissionStatusResponse;
import com.codingcontest.platform.service.SubmissionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Submission-related operations
 * Provides endpoints for code submission, status checking, and user submission history
 * 
 * Base URL: /api/submissions
 * 
 * Endpoints:
 * - POST / - Submit code for evaluation
 * - GET /{submissionId} - Get submission status and details
 * - GET /users/{userId}/submissions - Get user's submission history
 */
@RestController
@RequestMapping("/api/submissions")
@Validated
public class SubmissionController {
    
    private static final Logger logger = LoggerFactory.getLogger(SubmissionController.class);
    
    private final SubmissionService submissionService;
    
    @Autowired
    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }
    
    /**
     * Submit code for evaluation
     * 
     * @param request the submission request containing code and metadata
     * @return ResponseEntity containing submission response with HTTP 201 Created
     */
    @PostMapping
    public ResponseEntity<SubmissionResponse> submitCode(@Valid @RequestBody SubmissionRequest request) {
        logger.info("Received code submission request: {}", request);
        
        try {
            SubmissionResponse response = submissionService.createSubmission(request);
            
            logger.info("Code submission created successfully with ID: {}", response.getSubmissionId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid submission request: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (IllegalStateException e) {
            logger.warn("Contest state error: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Unexpected error during code submission", e);
            throw new RuntimeException("Failed to process submission", e);
        }
    }
    
    /**
     * Get submission status and details by ID
     * 
     * @param submissionId the ID of the submission
     * @return ResponseEntity containing submission status with HTTP 200 OK
     */
    @GetMapping("/{submissionId}")
    public ResponseEntity<SubmissionStatusResponse> getSubmissionStatus(
            @PathVariable @Positive(message = "Submission ID must be positive") Long submissionId) {
        
        logger.info("Received request to get submission status for ID: {}", submissionId);
        
        try {
            SubmissionStatusResponse response = submissionService.getSubmissionStatus(submissionId);
            
            logger.info("Successfully retrieved submission status for ID: {}", submissionId);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Submission not found: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Unexpected error retrieving submission status for ID: {}", submissionId, e);
            throw new RuntimeException("Failed to retrieve submission status", e);
        }
    }
    
    /**
     * Get detailed submission information by ID
     * This endpoint provides full submission details including code and execution metrics
     * 
     * @param submissionId the ID of the submission
     * @return ResponseEntity containing detailed submission information with HTTP 200 OK
     */
    @GetMapping("/{submissionId}/details")
    public ResponseEntity<SubmissionResponse> getSubmissionDetails(
            @PathVariable @Positive(message = "Submission ID must be positive") Long submissionId) {
        
        logger.info("Received request to get submission details for ID: {}", submissionId);
        
        try {
            SubmissionResponse response = submissionService.getSubmissionById(submissionId);
            
            logger.info("Successfully retrieved submission details for ID: {}", submissionId);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Submission not found: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Unexpected error retrieving submission details for ID: {}", submissionId, e);
            throw new RuntimeException("Failed to retrieve submission details", e);
        }
    }
    
    
    /**
     * Health check endpoint for the submission controller
     * 
     * @return ResponseEntity with HTTP 200 OK and simple status message
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        logger.debug("Submission controller health check requested");
        return ResponseEntity.ok("Submission Controller is healthy");
    }
}
