package com.codingcontest.platform.controller;

import com.codingcontest.platform.dto.ContestDetailsResponse;
import com.codingcontest.platform.dto.LeaderboardResponse;
import com.codingcontest.platform.dto.ProblemDetailResponse;
import com.codingcontest.platform.dto.UserResponse;
import com.codingcontest.platform.service.ContestService;
import com.codingcontest.platform.service.UserService;
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
 * REST Controller for Contest-related operations
 * Provides endpoints for contest details, problems, and leaderboards
 * 
 * Base URL: /api/contests
 * 
 * Endpoints:
 * - GET /{contestId} - Get contest details with problems
 * - GET /{contestId}/problems - Get problems for a contest
 * - GET /{contestId}/leaderboard - Get current rankings
 * - POST /{contestId}/join - Join a contest
 * - GET /health - Health check endpoint
 */
@RestController
@RequestMapping("/api/contests")
@Validated
public class ContestController {
    
    private static final Logger logger = LoggerFactory.getLogger(ContestController.class);
    
    private final ContestService contestService;
    private final UserService userService;
    
    @Autowired
    public ContestController(ContestService contestService, UserService userService) {
        this.contestService = contestService;
        this.userService = userService;
    }
    
    /**
     * Get contest details with problems
     * 
     * @param contestId the ID of the contest
     * @return ResponseEntity containing contest details with HTTP 200 OK
     */
    @GetMapping("/{contestId}")
    public ResponseEntity<ContestDetailsResponse> getContestDetails(
            @PathVariable @Positive(message = "Contest ID must be positive") Long contestId) {
        
        logger.info("Received request to get contest details for contest ID: {}", contestId);
        
        ContestDetailsResponse contestDetails = contestService.getContestDetails(contestId);
        
        logger.info("Successfully retrieved contest details for contest ID: {}", contestId);
        return ResponseEntity.ok(contestDetails);
    }
    
    /**
     * Get problems for a specific contest
     * 
     * @param contestId the ID of the contest
     * @return ResponseEntity containing list of problems with HTTP 200 OK
     */
    @GetMapping("/{contestId}/problems")
    public ResponseEntity<List<ProblemDetailResponse>> getContestProblems(
            @PathVariable @Positive(message = "Contest ID must be positive") Long contestId) {
        
        logger.info("Received request to get problems for contest ID: {}", contestId);
        
        List<ProblemDetailResponse> problems = contestService.getContestProblems(contestId);
        
        logger.info("Successfully retrieved {} problems for contest ID: {}", 
                   problems.size(), contestId);
        return ResponseEntity.ok(problems);
    }
    
    /**
     * Get current rankings/leaderboard for a contest
     * 
     * @param contestId the ID of the contest
     * @return ResponseEntity containing leaderboard with HTTP 200 OK
     */
    @GetMapping("/{contestId}/leaderboard")
    public ResponseEntity<LeaderboardResponse> getContestLeaderboard(
            @PathVariable @Positive(message = "Contest ID must be positive") Long contestId) {
        
        logger.info("Received request to get leaderboard for contest ID: {}", contestId);
        
        LeaderboardResponse leaderboard = contestService.getContestLeaderboard(contestId);
        
        logger.info("Successfully retrieved leaderboard with {} participants for contest ID: {}", 
                   leaderboard.getTotalParticipants(), contestId);
        return ResponseEntity.ok(leaderboard);
    }
    
    /**
     * Join a contest
     * 
     * @param contestId the ID of the contest to join
     * @param userId the ID of the user joining (passed as request parameter)
     * @return ResponseEntity containing the user who joined with HTTP 200 OK
     */
    @PostMapping("/{contestId}/join")
    public ResponseEntity<UserResponse> joinContest(
            @PathVariable @Positive(message = "Contest ID must be positive") Long contestId,
            @RequestParam @Positive(message = "User ID must be positive") Long userId) {
        
        logger.info("Received request for user {} to join contest {}", userId, contestId);
        
        try {
            UserResponse userResponse = userService.joinContest(userId, contestId);
            
            logger.info("User {} successfully joined contest {}", userId, contestId);
            return ResponseEntity.ok(userResponse);
            
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Contest join failed: {}", e.getMessage());
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Unexpected error during contest join for user {} and contest {}", 
                        userId, contestId, e);
            throw new RuntimeException("Failed to join contest", e);
        }
    }
    
    /**
     * Health check endpoint for the contest controller
     * 
     * @return ResponseEntity with HTTP 200 OK and simple status message
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        logger.debug("Contest controller health check requested");
        return ResponseEntity.ok("Contest Controller is healthy");
    }
}
