package com.codingcontest.platform.controller;

import com.codingcontest.platform.dto.SubmissionResponse;
import com.codingcontest.platform.dto.UserRegistrationRequest;
import com.codingcontest.platform.dto.UserResponse;
import com.codingcontest.platform.service.SubmissionService;
import com.codingcontest.platform.service.UserService;
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
 * REST Controller for User-related operations
 * Provides endpoints for user registration, profiles, contest participation, and submissions
 * 
 * Base URL: /api/users
 * 
 * Endpoints:
 * - POST /register - Register a new user
 * - GET /{userId} - Get user profile
 * - GET /{userId}/submissions - Get user's submission history
 * - POST /auth - Simple authentication (prototype)
 * 
 * Note: Contest join endpoint is available at POST /api/contests/{contestId}/join
 */
@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    private final SubmissionService submissionService;
    private final UserService userService;
    
    @Autowired
    public UserController(SubmissionService submissionService, UserService userService) {
        this.submissionService = submissionService;
        this.userService = userService;
    }
    
    /**
     * Register a new user
     * 
     * @param registrationRequest the user registration request
     * @return ResponseEntity containing the created user with HTTP 201 Created
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(
            @Valid @RequestBody UserRegistrationRequest registrationRequest) {
        
        logger.info("Received user registration request for username: {}", 
                   registrationRequest.getUsername());
        
        try {
            UserResponse userResponse = userService.registerUser(registrationRequest);
            
            logger.info("Successfully registered user with ID: {} and username: {}", 
                       userResponse.getId(), userResponse.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
            
        } catch (IllegalArgumentException e) {
            logger.warn("User registration failed: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Unexpected error during user registration", e);
            throw new RuntimeException("Failed to register user", e);
        }
    }
    
    /**
     * Get user profile by ID
     * 
     * @param userId the ID of the user
     * @return ResponseEntity containing user profile with HTTP 200 OK
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserProfile(
            @PathVariable @Positive(message = "User ID must be positive") Long userId) {
        
        logger.info("Received request to get user profile for user ID: {}", userId);
        
        try {
            UserResponse userResponse = userService.getUserProfile(userId);
            
            logger.info("Successfully retrieved user profile for ID: {}", userId);
            return ResponseEntity.ok(userResponse);
            
        } catch (IllegalArgumentException e) {
            logger.warn("User profile retrieval failed: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Unexpected error retrieving user profile for ID: {}", userId, e);
            throw new RuntimeException("Failed to retrieve user profile", e);
        }
    }
    
    /**
     * Get all submissions for a specific user
     * 
     * @param userId the ID of the user
     * @return ResponseEntity containing list of user's submissions with HTTP 200 OK
     */
    @GetMapping("/{userId}/submissions")
    public ResponseEntity<List<SubmissionResponse>> getUserSubmissions(
            @PathVariable @Positive(message = "User ID must be positive") Long userId) {
        
        logger.info("Received request to get submissions for user ID: {}", userId);
        
        try {
            List<SubmissionResponse> submissions = submissionService.getUserSubmissions(userId);
            
            logger.info("Successfully retrieved {} submissions for user ID: {}", 
                       submissions.size(), userId);
            return ResponseEntity.ok(submissions);
            
        } catch (IllegalArgumentException e) {
            logger.warn("User not found: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Unexpected error retrieving submissions for user ID: {}", userId, e);
            throw new RuntimeException("Failed to retrieve user submissions", e);
        }
    }
    
    /**
     * Simple authentication endpoint for prototype
     * In a real application, this would involve password verification and JWT token generation
     * 
     * @param username the username to authenticate (passed as request parameter)
     * @return ResponseEntity containing user information with HTTP 200 OK
     */
    @PostMapping("/auth")
    public ResponseEntity<UserResponse> authenticateUser(
            @RequestParam String username) {
        
        logger.info("Received authentication request for username: {}", username);
        
        try {
            UserResponse userResponse = userService.authenticateUser(username);
            
            logger.info("Successfully authenticated user: {}", username);
            return ResponseEntity.ok(userResponse);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Authentication failed: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Unexpected error during authentication for username: {}", username, e);
            throw new RuntimeException("Failed to authenticate user", e);
        }
    }
    
    /**
     * Health check endpoint for the user controller
     * 
     * @return ResponseEntity with HTTP 200 OK and simple status message
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        logger.debug("User controller health check requested");
        return ResponseEntity.ok("User Controller is healthy");
    }
}
