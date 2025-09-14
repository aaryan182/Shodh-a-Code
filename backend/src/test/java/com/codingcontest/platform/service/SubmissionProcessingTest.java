package com.codingcontest.platform.service;

import com.codingcontest.platform.BaseIntegrationTest;
import com.codingcontest.platform.dto.ExecutionResult;
import com.codingcontest.platform.dto.SubmissionRequest;
import com.codingcontest.platform.entity.Submission;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Integration tests for submission processing flow
 */
@DisplayName("Submission Processing Integration Tests")
class SubmissionProcessingTest extends BaseIntegrationTest {

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private SubmissionProcessorService submissionProcessorService;

    @MockBean
    private CodeJudgeService codeJudgeService;

    @Test
    @DisplayName("Should process submission successfully with valid code")
    void shouldProcessSubmissionSuccessfullyWithValidCode() throws Exception {
        // Mock successful execution result
        ExecutionResult mockResult = new ExecutionResult();
        mockResult.setSuccess(true);
        mockResult.setOutput("[0,1]");
        mockResult.setExecutionTime(150L);
        mockResult.setMemoryUsed(64L);
        
        when(codeJudgeService.executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(mockResult);

        // Create submission request
        SubmissionRequest request = new SubmissionRequest();
        request.setUserId(testUser.getId());
        request.setProblemId(testProblem.getId());
        request.setContestId(testContest.getId());
        request.setCode(getValidJavaCode());
        request.setLanguage("java");

        // Submit code
        Long submissionId = submissionService.submitCode(request);
        assertNotNull(submissionId);

        // Verify submission was created with QUEUED status
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("QUEUED", submission.getStatus());
        assertEquals(testUser.getId(), submission.getUser().getId());
        assertEquals(testProblem.getId(), submission.getProblem().getId());
        assertEquals("java", submission.getLanguage());

        // Process the submission asynchronously
        CompletableFuture<Void> processingFuture = submissionProcessorService.processSubmission(submissionId);
        
        // Wait for processing to complete
        processingFuture.get();

        // Verify final submission state
        submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("ACCEPTED", submission.getStatus());
        assertTrue(submission.getScore() > 0);
        assertNotNull(submission.getExecutionTime());
        assertNotNull(submission.getMemoryUsed());

        // Verify code judge service was called for each test case
        verify(codeJudgeService, times(testCases.size())).executeCode(
                eq(getValidJavaCode()),
                eq("java"),
                anyString(), // input
                eq(testProblem.getTimeLimit()),
                eq(testProblem.getMemoryLimit())
        );
    }

    @Test
    @DisplayName("Should handle compilation error")
    void shouldHandleCompilationError() throws Exception {
        // Mock compilation error
        ExecutionResult mockResult = new ExecutionResult();
        mockResult.setSuccess(false);
        mockResult.setError("Compilation failed: ';' expected");
        mockResult.setExecutionTime(0L);
        
        when(codeJudgeService.executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(mockResult);

        // Create submission with invalid code
        SubmissionRequest request = new SubmissionRequest();
        request.setUserId(testUser.getId());
        request.setProblemId(testProblem.getId());
        request.setContestId(testContest.getId());
        request.setCode(getInvalidCode());
        request.setLanguage("java");

        // Submit code
        Long submissionId = submissionService.submitCode(request);
        
        // Process the submission
        CompletableFuture<Void> processingFuture = submissionProcessorService.processSubmission(submissionId);
        processingFuture.get();

        // Verify submission status
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("COMPILATION_ERROR", submission.getStatus());
        assertEquals(0, submission.getScore());
        assertNotNull(submission.getErrorMessage());
        assertTrue(submission.getErrorMessage().contains("Compilation failed"));
    }

    @Test
    @DisplayName("Should handle wrong answer")
    void shouldHandleWrongAnswer() throws Exception {
        // Mock wrong answer result
        ExecutionResult correctResult = new ExecutionResult();
        correctResult.setSuccess(true);
        correctResult.setOutput("[0,1]");
        correctResult.setExecutionTime(100L);
        correctResult.setMemoryUsed(32L);

        ExecutionResult wrongResult = new ExecutionResult();
        wrongResult.setSuccess(true);
        wrongResult.setOutput("[1,0]"); // Wrong answer
        wrongResult.setExecutionTime(110L);
        wrongResult.setMemoryUsed(36L);

        // First test case passes, second fails
        when(codeJudgeService.executeCode(anyString(), anyString(), eq(testCases.get(0).getInput()), anyInt(), anyInt()))
                .thenReturn(correctResult);
        when(codeJudgeService.executeCode(anyString(), anyString(), eq(testCases.get(1).getInput()), anyInt(), anyInt()))
                .thenReturn(wrongResult);
        when(codeJudgeService.executeCode(anyString(), anyString(), eq(testCases.get(2).getInput()), anyInt(), anyInt()))
                .thenReturn(correctResult);

        // Create submission
        SubmissionRequest request = new SubmissionRequest();
        request.setUserId(testUser.getId());
        request.setProblemId(testProblem.getId());
        request.setContestId(testContest.getId());
        request.setCode(getValidJavaCode());
        request.setLanguage("java");

        Long submissionId = submissionService.submitCode(request);
        
        // Process the submission
        CompletableFuture<Void> processingFuture = submissionProcessorService.processSubmission(submissionId);
        processingFuture.get();

        // Verify submission status
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("WRONG_ANSWER", submission.getStatus());
        assertTrue(submission.getScore() > 0); // Partial score for passed test cases
        assertTrue(submission.getScore() < 100); // But not full score
    }

    @Test
    @DisplayName("Should handle timeout error")
    void shouldHandleTimeoutError() throws Exception {
        // Mock timeout error
        ExecutionResult timeoutResult = new ExecutionResult();
        timeoutResult.setSuccess(false);
        timeoutResult.setError("Time limit exceeded");
        timeoutResult.setExecutionTime((long) testProblem.getTimeLimit() + 1000);
        
        when(codeJudgeService.executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(timeoutResult);

        // Create submission
        SubmissionRequest request = new SubmissionRequest();
        request.setUserId(testUser.getId());
        request.setProblemId(testProblem.getId());
        request.setContestId(testContest.getId());
        request.setCode(getValidJavaCode());
        request.setLanguage("java");

        Long submissionId = submissionService.submitCode(request);
        
        // Process the submission
        CompletableFuture<Void> processingFuture = submissionProcessorService.processSubmission(submissionId);
        processingFuture.get();

        // Verify submission status
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("TIME_LIMIT_EXCEEDED", submission.getStatus());
        assertEquals(0, submission.getScore());
        assertNotNull(submission.getErrorMessage());
        assertTrue(submission.getErrorMessage().contains("Time limit exceeded"));
    }

    @Test
    @DisplayName("Should handle memory limit exceeded")
    void shouldHandleMemoryLimitExceeded() throws Exception {
        // Mock memory limit exceeded
        ExecutionResult memoryResult = new ExecutionResult();
        memoryResult.setSuccess(false);
        memoryResult.setError("Memory limit exceeded");
        memoryResult.setMemoryUsed((long) testProblem.getMemoryLimit() + 100);
        
        when(codeJudgeService.executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(memoryResult);

        // Create submission
        SubmissionRequest request = new SubmissionRequest();
        request.setUserId(testUser.getId());
        request.setProblemId(testProblem.getId());
        request.setContestId(testContest.getId());
        request.setCode(getValidJavaCode());
        request.setLanguage("java");

        Long submissionId = submissionService.submitCode(request);
        
        // Process the submission
        CompletableFuture<Void> processingFuture = submissionProcessorService.processSubmission(submissionId);
        processingFuture.get();

        // Verify submission status
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("MEMORY_LIMIT_EXCEEDED", submission.getStatus());
        assertEquals(0, submission.getScore());
        assertNotNull(submission.getErrorMessage());
        assertTrue(submission.getErrorMessage().contains("Memory limit exceeded"));
    }

    @Test
    @DisplayName("Should handle runtime error")
    void shouldHandleRuntimeError() throws Exception {
        // Mock runtime error
        ExecutionResult runtimeErrorResult = new ExecutionResult();
        runtimeErrorResult.setSuccess(false);
        runtimeErrorResult.setError("Exception in thread \"main\" java.lang.ArrayIndexOutOfBoundsException");
        runtimeErrorResult.setExecutionTime(50L);
        
        when(codeJudgeService.executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(runtimeErrorResult);

        // Create submission
        SubmissionRequest request = new SubmissionRequest();
        request.setUserId(testUser.getId());
        request.setProblemId(testProblem.getId());
        request.setContestId(testContest.getId());
        request.setCode(getValidJavaCode());
        request.setLanguage("java");

        Long submissionId = submissionService.submitCode(request);
        
        // Process the submission
        CompletableFuture<Void> processingFuture = submissionProcessorService.processSubmission(submissionId);
        processingFuture.get();

        // Verify submission status
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("RUNTIME_ERROR", submission.getStatus());
        assertEquals(0, submission.getScore());
        assertNotNull(submission.getErrorMessage());
        assertTrue(submission.getErrorMessage().contains("ArrayIndexOutOfBoundsException"));
    }

    @Test
    @DisplayName("Should handle multiple concurrent submissions")
    void shouldHandleMultipleConcurrentSubmissions() throws Exception {
        // Mock successful execution
        ExecutionResult mockResult = new ExecutionResult();
        mockResult.setSuccess(true);
        mockResult.setOutput("[0,1]");
        mockResult.setExecutionTime(100L);
        mockResult.setMemoryUsed(50L);
        
        when(codeJudgeService.executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(mockResult);

        // Create multiple submissions
        int numSubmissions = 5;
        Long[] submissionIds = new Long[numSubmissions];
        CompletableFuture<Void>[] futures = new CompletableFuture[numSubmissions];

        for (int i = 0; i < numSubmissions; i++) {
            SubmissionRequest request = new SubmissionRequest();
            request.setUserId(testUser.getId());
            request.setProblemId(testProblem.getId());
            request.setContestId(testContest.getId());
            request.setCode(getValidJavaCode());
            request.setLanguage("java");

            submissionIds[i] = submissionService.submitCode(request);
            futures[i] = submissionProcessorService.processSubmission(submissionIds[i]);
        }

        // Wait for all submissions to complete
        CompletableFuture.allOf(futures).get();

        // Verify all submissions were processed successfully
        for (Long submissionId : submissionIds) {
            Submission submission = submissionRepository.findById(submissionId).orElse(null);
            assertNotNull(submission);
            assertEquals("ACCEPTED", submission.getStatus());
            assertTrue(submission.getScore() > 0);
        }

        // Verify code judge service was called correct number of times
        verify(codeJudgeService, times(numSubmissions * testCases.size()))
                .executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("Should handle system error gracefully")
    void shouldHandleSystemErrorGracefully() throws Exception {
        // Mock system error (exception thrown)
        when(codeJudgeService.executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("Docker container failed to start"));

        // Create submission
        SubmissionRequest request = new SubmissionRequest();
        request.setUserId(testUser.getId());
        request.setProblemId(testProblem.getId());
        request.setContestId(testContest.getId());
        request.setCode(getValidJavaCode());
        request.setLanguage("java");

        Long submissionId = submissionService.submitCode(request);
        
        // Process the submission
        CompletableFuture<Void> processingFuture = submissionProcessorService.processSubmission(submissionId);
        processingFuture.get();

        // Verify submission status
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("SYSTEM_ERROR", submission.getStatus());
        assertEquals(0, submission.getScore());
        assertNotNull(submission.getErrorMessage());
        assertTrue(submission.getErrorMessage().contains("System error occurred"));
    }

    @Test
    @DisplayName("Should update submission status transitions correctly")
    void shouldUpdateSubmissionStatusTransitionsCorrectly() throws Exception {
        // Mock successful execution with delay to observe status transitions
        ExecutionResult mockResult = new ExecutionResult();
        mockResult.setSuccess(true);
        mockResult.setOutput("[0,1]");
        mockResult.setExecutionTime(100L);
        mockResult.setMemoryUsed(50L);
        
        when(codeJudgeService.executeCode(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(mockResult);

        // Create submission
        SubmissionRequest request = new SubmissionRequest();
        request.setUserId(testUser.getId());
        request.setProblemId(testProblem.getId());
        request.setContestId(testContest.getId());
        request.setCode(getValidJavaCode());
        request.setLanguage("java");

        Long submissionId = submissionService.submitCode(request);
        
        // Verify initial status is QUEUED
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("QUEUED", submission.getStatus());

        // Process the submission
        CompletableFuture<Void> processingFuture = submissionProcessorService.processSubmission(submissionId);
        processingFuture.get();

        // Verify final status
        submission = submissionRepository.findById(submissionId).orElse(null);
        assertNotNull(submission);
        assertEquals("ACCEPTED", submission.getStatus());
        assertNotNull(submission.getExecutionTime());
        assertNotNull(submission.getMemoryUsed());
        assertTrue(submission.getScore() > 0);
    }
}
