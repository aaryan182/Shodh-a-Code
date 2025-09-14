package com.codingcontest.platform.service;

import com.codingcontest.platform.dto.UserRegistrationRequest;
import com.codingcontest.platform.dto.UserResponse;
import com.codingcontest.platform.entity.Contest;
import com.codingcontest.platform.entity.User;
import com.codingcontest.platform.exception.ContestNotFoundException;
import com.codingcontest.platform.repository.ContestRepository;
import com.codingcontest.platform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service class for User-related business logic
 */
@Service
@Transactional(readOnly = true)
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final ContestRepository contestRepository;
    
    @Autowired
    public UserService(UserRepository userRepository, ContestRepository contestRepository) {
        this.userRepository = userRepository;
        this.contestRepository = contestRepository;
    }
    
    /**
     * Register a new user with username validation
     * 
     * @param registrationRequest the registration request containing user details
     * @return UserResponse with the created user information
     * @throws IllegalArgumentException if username already exists or validation fails
     */
    @Transactional
    public UserResponse registerUser(UserRegistrationRequest registrationRequest) {
        logger.info("Registering new user with username: {}", registrationRequest.getUsername());
        
        // Check if username already exists
        if (userRepository.findByUsername(registrationRequest.getUsername()).isPresent()) {
            logger.warn("Registration failed: Username '{}' already exists", registrationRequest.getUsername());
            throw new IllegalArgumentException("Username '" + registrationRequest.getUsername() + "' is already taken");
        }
        
        // Create new user entity
        User user = new User(registrationRequest.getUsername(), registrationRequest.getEmail());
        
        try {
            User savedUser = userRepository.save(user);
            logger.info("Successfully registered user with ID: {} and username: {}", 
                       savedUser.getId(), savedUser.getUsername());
            
            return convertToUserResponse(savedUser);
            
        } catch (DataIntegrityViolationException e) {
            // Handle case where email might already exist (database constraint)
            logger.error("Registration failed due to data integrity violation: {}", e.getMessage());
            throw new IllegalArgumentException("Email or username already exists");
        } catch (Exception e) {
            logger.error("Unexpected error during user registration", e);
            throw new RuntimeException("Failed to register user", e);
        }
    }
    
    /**
     * Get user profile by user ID
     * 
     * @param userId the ID of the user
     * @return UserResponse with user information
     * @throws IllegalArgumentException if user is not found
     */
    public UserResponse getUserProfile(Long userId) {
        logger.debug("Fetching user profile for user ID: {}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> {
                logger.warn("User not found with ID: {}", userId);
                return new IllegalArgumentException("User not found with ID: " + userId);
            });
        
        logger.debug("Successfully retrieved user profile for ID: {}", userId);
        return convertToUserResponse(user);
    }
    
    /**
     * Join a contest - validates that both user and contest exist
     * For prototype, this simply validates the entities exist
     * In a full implementation, this would create a contest participation record
     * 
     * @param userId the ID of the user joining the contest
     * @param contestId the ID of the contest to join
     * @return UserResponse of the user who joined
     * @throws IllegalArgumentException if user is not found
     * @throws ContestNotFoundException if contest is not found
     * @throws IllegalStateException if contest has already ended
     */
    @Transactional
    public UserResponse joinContest(Long userId, Long contestId) {
        logger.info("User {} attempting to join contest {}", userId, contestId);
        
        // Validate user exists
        User user = userRepository.findById(userId)
            .orElseThrow(() -> {
                logger.warn("Join contest failed: User not found with ID: {}", userId);
                return new IllegalArgumentException("User not found with ID: " + userId);
            });
        
        // Validate contest exists
        Contest contest = contestRepository.findById(contestId)
            .orElseThrow(() -> {
                logger.warn("Join contest failed: Contest not found with ID: {}", contestId);
                return new ContestNotFoundException(contestId);
            });
        
        // Check if contest has already ended
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(contest.getEndTime())) {
            logger.warn("Join contest failed: Contest {} has already ended", contestId);
            throw new IllegalStateException("Cannot join contest: Contest has already ended");
        }
        
        // For prototype: Just log the successful join
        // In a full implementation, you would create a contest_participants table
        // and insert a record there
        logger.info("User {} successfully joined contest {} (prototype mode)", userId, contestId);
        
        return convertToUserResponse(user);
    }
    
    /**
     * Check if a username is available
     * 
     * @param username the username to check
     * @return true if username is available, false if taken
     */
    public boolean isUsernameAvailable(String username) {
        logger.debug("Checking availability for username: {}", username);
        return userRepository.findByUsername(username).isEmpty();
    }
    
    /**
     * Simple authentication mechanism for prototype
     * In a real application, this would involve password hashing, JWT tokens, etc.
     * For now, it just validates that the user exists
     * 
     * @param username the username to authenticate
     * @return UserResponse if user exists
     * @throws IllegalArgumentException if user is not found
     */
    public UserResponse authenticateUser(String username) {
        logger.debug("Authenticating user: {}", username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> {
                logger.warn("Authentication failed: User not found with username: {}", username);
                return new IllegalArgumentException("User not found with username: " + username);
            });
        
        logger.debug("Successfully authenticated user: {}", username);
        return convertToUserResponse(user);
    }
    
    /**
     * Convert User entity to UserResponse DTO
     */
    private UserResponse convertToUserResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getCreatedAt()
        );
    }
}
