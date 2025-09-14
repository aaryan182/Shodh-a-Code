package com.codingcontest.platform.repository;

import com.codingcontest.platform.BaseIntegrationTest;
import com.codingcontest.platform.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for database operations and entity relationships
 */
@DisplayName("Database Integration Tests")
class DatabaseIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("Should persist and retrieve user entity")
    void shouldPersistAndRetrieveUserEntity() {
        // Create and save user
        User user = new User();
        user.setUsername("dbtest_user");
        user.setEmail("dbtest@example.com");
        user.setPassword("hashedpassword");
        
        User savedUser = userRepository.save(user);
        
        assertNotNull(savedUser.getId());
        assertEquals("dbtest_user", savedUser.getUsername());
        assertEquals("dbtest@example.com", savedUser.getEmail());
        assertNotNull(savedUser.getCreatedAt());
        
        // Retrieve by ID
        Optional<User> retrievedUser = userRepository.findById(savedUser.getId());
        assertTrue(retrievedUser.isPresent());
        assertEquals("dbtest_user", retrievedUser.get().getUsername());
        
        // Retrieve by username
        Optional<User> userByUsername = userRepository.findByUsername("dbtest_user");
        assertTrue(userByUsername.isPresent());
        assertEquals(savedUser.getId(), userByUsername.get().getId());
        
        // Retrieve by email
        Optional<User> userByEmail = userRepository.findByEmail("dbtest@example.com");
        assertTrue(userByEmail.isPresent());
        assertEquals(savedUser.getId(), userByEmail.get().getId());
    }

    @Test
    @DisplayName("Should enforce unique constraints on user")
    void shouldEnforceUniqueConstraintsOnUser() {
        // Create first user
        User user1 = new User();
        user1.setUsername("unique_user");
        user1.setEmail("unique@example.com");
        user1.setPassword("password1");
        userRepository.save(user1);
        
        // Try to create user with same username
        User user2 = new User();
        user2.setUsername("unique_user"); // Same username
        user2.setEmail("different@example.com");
        user2.setPassword("password2");
        
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.save(user2);
        });
        
        // Try to create user with same email
        User user3 = new User();
        user3.setUsername("different_user");
        user3.setEmail("unique@example.com"); // Same email
        user3.setPassword("password3");
        
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.save(user3);
        });
    }

    @Test
    @DisplayName("Should persist and retrieve contest with problems")
    void shouldPersistAndRetrieveContestWithProblems() {
        // Create contest
        Contest contest = new Contest();
        contest.setTitle("DB Test Contest");
        contest.setDescription("Contest for database testing");
        contest.setStartTime(LocalDateTime.now().minusHours(1));
        contest.setEndTime(LocalDateTime.now().plusHours(3));
        contest.setMaxParticipants(50);
        
        Contest savedContest = contestRepository.save(contest);
        assertNotNull(savedContest.getId());
        
        // Create problems for the contest
        Problem problem1 = new Problem();
        problem1.setTitle("Problem 1");
        problem1.setDescription("First problem");
        problem1.setDifficulty("EASY");
        problem1.setTimeLimit(1000);
        problem1.setMemoryLimit(256);
        problem1.setContest(savedContest);
        
        Problem problem2 = new Problem();
        problem2.setTitle("Problem 2");
        problem2.setDescription("Second problem");
        problem2.setDifficulty("MEDIUM");
        problem2.setTimeLimit(2000);
        problem2.setMemoryLimit(512);
        problem2.setContest(savedContest);
        
        problemRepository.save(problem1);
        problemRepository.save(problem2);
        
        // Retrieve contest with problems
        Optional<Contest> retrievedContest = contestRepository.findById(savedContest.getId());
        assertTrue(retrievedContest.isPresent());
        
        List<Problem> problems = problemRepository.findByContestId(savedContest.getId());
        assertEquals(2, problems.size());
        
        // Verify relationship
        problems.forEach(problem -> {
            assertEquals(savedContest.getId(), problem.getContest().getId());
        });
    }

    @Test
    @DisplayName("Should persist and retrieve problem with test cases")
    void shouldPersistAndRetrieveProblemWithTestCases() {
        // Create problem
        Problem problem = new Problem();
        problem.setTitle("Test Case Problem");
        problem.setDescription("Problem for test case testing");
        problem.setDifficulty("HARD");
        problem.setTimeLimit(3000);
        problem.setMemoryLimit(1024);
        problem.setContest(testContest);
        
        Problem savedProblem = problemRepository.save(problem);
        
        // Create test cases
        TestCase testCase1 = new TestCase();
        testCase1.setInput("1 2");
        testCase1.setExpectedOutput("3");
        testCase1.setIsExample(true);
        testCase1.setProblem(savedProblem);
        
        TestCase testCase2 = new TestCase();
        testCase2.setInput("5 7");
        testCase2.setExpectedOutput("12");
        testCase2.setIsExample(false);
        testCase2.setProblem(savedProblem);
        
        testCaseRepository.save(testCase1);
        testCaseRepository.save(testCase2);
        
        // Retrieve test cases
        List<TestCase> testCases = testCaseRepository.findByProblemId(savedProblem.getId());
        assertEquals(2, testCases.size());
        
        // Verify relationships
        testCases.forEach(testCase -> {
            assertEquals(savedProblem.getId(), testCase.getProblem().getId());
        });
        
        // Test example test cases query
        List<TestCase> exampleTestCases = testCaseRepository.findByProblemIdAndIsExampleTrue(savedProblem.getId());
        assertEquals(1, exampleTestCases.size());
        assertTrue(exampleTestCases.get(0).getIsExample());
    }

    @Test
    @DisplayName("Should persist and retrieve submissions with relationships")
    void shouldPersistAndRetrieveSubmissionsWithRelationships() {
        // Create submission
        Submission submission = new Submission();
        submission.setUser(testUser);
        submission.setProblem(testProblem);
        submission.setContest(testContest);
        submission.setCode("System.out.println(\"Hello\");");
        submission.setLanguage("java");
        submission.setStatus("PENDING");
        submission.setSubmissionTime(LocalDateTime.now());
        submission.setScore(0);
        
        Submission savedSubmission = submissionRepository.save(submission);
        assertNotNull(savedSubmission.getId());
        
        // Update submission with results
        savedSubmission.setStatus("ACCEPTED");
        savedSubmission.setScore(100);
        savedSubmission.setExecutionTime(150L);
        savedSubmission.setMemoryUsed(64L);
        
        Submission updatedSubmission = submissionRepository.save(savedSubmission);
        
        // Retrieve and verify
        Optional<Submission> retrievedSubmission = submissionRepository.findById(updatedSubmission.getId());
        assertTrue(retrievedSubmission.isPresent());
        
        Submission submission1 = retrievedSubmission.get();
        assertEquals("ACCEPTED", submission1.getStatus());
        assertEquals(100, submission1.getScore());
        assertEquals(150L, submission1.getExecutionTime());
        assertEquals(64L, submission1.getMemoryUsed());
        assertEquals(testUser.getId(), submission1.getUser().getId());
        assertEquals(testProblem.getId(), submission1.getProblem().getId());
        assertEquals(testContest.getId(), submission1.getContest().getId());
    }

    @Test
    @DisplayName("Should query submissions by user and problem")
    void shouldQuerySubmissionsByUserAndProblem() {
        // Create multiple submissions
        Submission submission1 = createSubmission("code1", "java");
        submission1.setStatus("ACCEPTED");
        submission1.setScore(100);
        submissionRepository.save(submission1);
        
        Submission submission2 = createSubmission("code2", "python");
        submission2.setStatus("WRONG_ANSWER");
        submission2.setScore(50);
        submissionRepository.save(submission2);
        
        Submission submission3 = createSubmission("code3", "java");
        submission3.setStatus("COMPILATION_ERROR");
        submission3.setScore(0);
        submissionRepository.save(submission3);
        
        // Query by user and problem
        List<Submission> userProblemSubmissions = submissionRepository.findByUserIdAndProblemIdOrderBySubmissionTimeDesc(
            testUser.getId(), testProblem.getId()
        );
        
        assertEquals(3, userProblemSubmissions.size());
        
        // Verify ordering (most recent first)
        assertTrue(userProblemSubmissions.get(0).getSubmissionTime()
                .isAfter(userProblemSubmissions.get(1).getSubmissionTime()) ||
                userProblemSubmissions.get(0).getSubmissionTime()
                .isEqual(userProblemSubmissions.get(1).getSubmissionTime()));
        
        // Query by contest
        List<Submission> contestSubmissions = submissionRepository.findByContestIdOrderBySubmissionTimeDesc(testContest.getId());
        assertEquals(3, contestSubmissions.size());
        
        // Query by status
        List<Submission> acceptedSubmissions = submissionRepository.findByUserIdAndStatus(testUser.getId(), "ACCEPTED");
        assertEquals(1, acceptedSubmissions.size());
        assertEquals("ACCEPTED", acceptedSubmissions.get(0).getStatus());
    }

    @Test
    @DisplayName("Should handle cascade operations correctly")
    void shouldHandleCascadeOperationsCorrectly() {
        // Create contest with problems and test cases
        Contest contest = new Contest();
        contest.setTitle("Cascade Test Contest");
        contest.setDescription("Testing cascade operations");
        contest.setStartTime(LocalDateTime.now().minusHours(1));
        contest.setEndTime(LocalDateTime.now().plusHours(2));
        contest.setMaxParticipants(100);
        contest = contestRepository.save(contest);
        
        Problem problem = new Problem();
        problem.setTitle("Cascade Problem");
        problem.setDescription("Problem for cascade testing");
        problem.setDifficulty("EASY");
        problem.setTimeLimit(1000);
        problem.setMemoryLimit(256);
        problem.setContest(contest);
        problem = problemRepository.save(problem);
        
        TestCase testCase = new TestCase();
        testCase.setInput("test input");
        testCase.setExpectedOutput("test output");
        testCase.setIsExample(true);
        testCase.setProblem(problem);
        testCase = testCaseRepository.save(testCase);
        
        // Verify entities exist
        assertTrue(contestRepository.findById(contest.getId()).isPresent());
        assertTrue(problemRepository.findById(problem.getId()).isPresent());
        assertTrue(testCaseRepository.findById(testCase.getId()).isPresent());
        
        // Delete test case
        testCaseRepository.deleteById(testCase.getId());
        assertFalse(testCaseRepository.findById(testCase.getId()).isPresent());
        assertTrue(problemRepository.findById(problem.getId()).isPresent()); // Problem should still exist
        
        // Delete problem
        problemRepository.deleteById(problem.getId());
        assertFalse(problemRepository.findById(problem.getId()).isPresent());
        assertTrue(contestRepository.findById(contest.getId()).isPresent()); // Contest should still exist
        
        // Delete contest
        contestRepository.deleteById(contest.getId());
        assertFalse(contestRepository.findById(contest.getId()).isPresent());
    }

    @Test
    @DisplayName("Should handle complex queries for leaderboard")
    void shouldHandleComplexQueriesForLeaderboard() {
        // Create additional users
        User user2 = new User();
        user2.setUsername("user2");
        user2.setEmail("user2@example.com");
        user2.setPassword("password");
        user2 = userRepository.save(user2);
        
        User user3 = new User();
        user3.setUsername("user3");
        user3.setEmail("user3@example.com");
        user3.setPassword("password");
        user3 = userRepository.save(user3);
        
        // Create submissions with different scores
        Submission submission1 = new Submission();
        submission1.setUser(testUser);
        submission1.setProblem(testProblem);
        submission1.setContest(testContest);
        submission1.setCode("code1");
        submission1.setLanguage("java");
        submission1.setStatus("ACCEPTED");
        submission1.setScore(100);
        submission1.setSubmissionTime(LocalDateTime.now().minusMinutes(30));
        submissionRepository.save(submission1);
        
        Submission submission2 = new Submission();
        submission2.setUser(user2);
        submission2.setProblem(testProblem);
        submission2.setContest(testContest);
        submission2.setCode("code2");
        submission2.setLanguage("python");
        submission2.setStatus("ACCEPTED");
        submission2.setScore(100);
        submission2.setSubmissionTime(LocalDateTime.now().minusMinutes(20));
        submissionRepository.save(submission2);
        
        Submission submission3 = new Submission();
        submission3.setUser(user3);
        submission3.setProblem(testProblem);
        submission3.setContest(testContest);
        submission3.setCode("code3");
        submission3.setLanguage("java");
        submission3.setStatus("WRONG_ANSWER");
        submission3.setScore(50);
        submission3.setSubmissionTime(LocalDateTime.now().minusMinutes(10));
        submissionRepository.save(submission3);
        
        // Query for leaderboard data
        List<Submission> contestSubmissions = submissionRepository.findByContestIdOrderBySubmissionTimeDesc(testContest.getId());
        assertEquals(3, contestSubmissions.size());
        
        // Verify we can get best submissions per user
        List<Submission> userBestSubmissions = submissionRepository.findByUserIdAndProblemIdOrderByScoreDescSubmissionTimeAsc(
            testUser.getId(), testProblem.getId()
        );
        assertFalse(userBestSubmissions.isEmpty());
        assertEquals(100, userBestSubmissions.get(0).getScore()); // Best score first
    }

    @Test
    @DisplayName("Should handle transaction rollback on constraint violation")
    void shouldHandleTransactionRollbackOnConstraintViolation() {
        // Count initial users
        long initialUserCount = userRepository.count();
        
        try {
            // Try to save user with null required field (should fail)
            User invalidUser = new User();
            invalidUser.setUsername("valid_username");
            // Missing required email field
            invalidUser.setPassword("password");
            
            userRepository.save(invalidUser);
            fail("Should have thrown constraint violation exception");
        } catch (Exception e) {
            // Expected exception
        }
        
        // Verify no user was saved
        long finalUserCount = userRepository.count();
        assertEquals(initialUserCount, finalUserCount);
    }

    @Test
    @DisplayName("Should handle date/time operations correctly")
    void shouldHandleDateTimeOperationsCorrectly() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime past = now.minusHours(2);
        LocalDateTime future = now.plusHours(2);
        
        // Create contests with different time ranges
        Contest pastContest = new Contest();
        pastContest.setTitle("Past Contest");
        pastContest.setDescription("Ended contest");
        pastContest.setStartTime(past.minusHours(2));
        pastContest.setEndTime(past);
        pastContest.setMaxParticipants(100);
        contestRepository.save(pastContest);
        
        Contest activeContest = new Contest();
        activeContest.setTitle("Active Contest");
        activeContest.setDescription("Currently running");
        activeContest.setStartTime(past);
        activeContest.setEndTime(future);
        activeContest.setMaxParticipants(100);
        contestRepository.save(activeContest);
        
        Contest futureContest = new Contest();
        futureContest.setTitle("Future Contest");
        futureContest.setDescription("Not started yet");
        futureContest.setStartTime(future);
        futureContest.setEndTime(future.plusHours(2));
        futureContest.setMaxParticipants(100);
        contestRepository.save(futureContest);
        
        // Query active contests
        List<Contest> activeContests = contestRepository.findByStartTimeBeforeAndEndTimeAfter(now, now);
        assertEquals(1, activeContests.size());
        assertEquals("Active Contest", activeContests.get(0).getTitle());
        
        // Query all contests ordered by start time
        List<Contest> allContests = contestRepository.findAllByOrderByStartTimeAsc();
        assertTrue(allContests.size() >= 3);
        
        // Verify ordering
        for (int i = 1; i < allContests.size(); i++) {
            assertTrue(allContests.get(i-1).getStartTime().isBefore(allContests.get(i).getStartTime()) ||
                      allContests.get(i-1).getStartTime().isEqual(allContests.get(i).getStartTime()));
        }
    }
}
