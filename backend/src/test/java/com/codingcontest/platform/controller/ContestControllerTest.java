package com.codingcontest.platform.controller;

import com.codingcontest.platform.BaseIntegrationTest;
import com.codingcontest.platform.dto.UserRegistrationRequest;
import com.codingcontest.platform.entity.Contest;
import com.codingcontest.platform.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ContestController
 */
@DisplayName("Contest Controller Integration Tests")
class ContestControllerTest extends BaseIntegrationTest {

    @Test
    @DisplayName("Should get contest details successfully")
    void shouldGetContestDetails() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/contests/{contestId}", testContest.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testContest.getId().intValue())))
                .andExpect(jsonPath("$.title", is("Test Contest")))
                .andExpect(jsonPath("$.description", is("A test contest for integration tests")))
                .andExpect(jsonPath("$.maxParticipants", is(100)))
                .andExpect(jsonPath("$.problems", hasSize(1)))
                .andExpect(jsonPath("$.problems[0].title", is("Two Sum")))
                .andExpect(jsonPath("$.problems[0].difficulty", is("EASY")));
    }

    @Test
    @DisplayName("Should return 404 for non-existent contest")
    void shouldReturn404ForNonExistentContest() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/contests/{contestId}", 99999L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Contest not found")));
    }

    @Test
    @DisplayName("Should get contest leaderboard successfully")
    void shouldGetContestLeaderboard() throws Exception {
        // Create additional test data for leaderboard
        User user2 = new User();
        user2.setUsername("testuser2");
        user2.setEmail("test2@example.com");
        user2.setPassword("$2a$10$test.hash.here");
        user2 = userRepository.save(user2);

        // Create submissions for leaderboard
        createSubmission(getValidJavaCode(), "java");
        
        mockMvc.perform(MockMvcRequestBuilders.get("/contests/{contestId}/leaderboard", testContest.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    @DisplayName("Should register user for contest successfully")
    void shouldRegisterUserForContest() throws Exception {
        UserRegistrationRequest request = new UserRegistrationRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");

        mockMvc.perform(MockMvcRequestBuilders.post("/contests/{contestId}/register", testContest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("newuser")))
                .andExpect(jsonPath("$.email", is("newuser@example.com")));
    }

    @Test
    @DisplayName("Should handle duplicate username registration")
    void shouldHandleDuplicateUsernameRegistration() throws Exception {
        UserRegistrationRequest request = new UserRegistrationRequest();
        request.setUsername("testuser"); // Already exists
        request.setEmail("duplicate@example.com");

        mockMvc.perform(MockMvcRequestBuilders.post("/contests/{contestId}/register", testContest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("Should validate registration request fields")
    void shouldValidateRegistrationRequestFields() throws Exception {
        UserRegistrationRequest request = new UserRegistrationRequest();
        request.setUsername(""); // Invalid empty username
        request.setEmail("invalid-email"); // Invalid email format

        mockMvc.perform(MockMvcRequestBuilders.post("/contests/{contestId}/register", testContest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should not allow registration for ended contest")
    void shouldNotAllowRegistrationForEndedContest() throws Exception {
        // Create an ended contest
        Contest endedContest = new Contest();
        endedContest.setTitle("Ended Contest");
        endedContest.setDescription("This contest has ended");
        endedContest.setStartTime(LocalDateTime.now().minusHours(3));
        endedContest.setEndTime(LocalDateTime.now().minusHours(1)); // Ended 1 hour ago
        endedContest.setMaxParticipants(100);
        endedContest = contestRepository.save(endedContest);

        UserRegistrationRequest request = new UserRegistrationRequest();
        request.setUsername("lateuser");
        request.setEmail("lateuser@example.com");

        mockMvc.perform(MockMvcRequestBuilders.post("/contests/{contestId}/register", endedContest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ended")));
    }

    @Test
    @DisplayName("Should handle contest at capacity")
    void shouldHandleContestAtCapacity() throws Exception {
        // Create a contest with capacity of 1
        Contest fullContest = new Contest();
        fullContest.setTitle("Full Contest");
        fullContest.setDescription("This contest is at capacity");
        fullContest.setStartTime(LocalDateTime.now().minusHours(1));
        fullContest.setEndTime(LocalDateTime.now().plusHours(2));
        fullContest.setMaxParticipants(1); // Only 1 participant allowed
        fullContest = contestRepository.save(fullContest);

        // Register first user (should succeed)
        UserRegistrationRequest request1 = new UserRegistrationRequest();
        request1.setUsername("firstuser");
        request1.setEmail("first@example.com");

        mockMvc.perform(MockMvcRequestBuilders.post("/contests/{contestId}/register", fullContest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        // Try to register second user (should fail)
        UserRegistrationRequest request2 = new UserRegistrationRequest();
        request2.setUsername("seconduser");
        request2.setEmail("second@example.com");

        mockMvc.perform(MockMvcRequestBuilders.post("/contests/{contestId}/register", fullContest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("capacity")));
    }

    @Test
    @DisplayName("Should get problem details from contest")
    void shouldGetProblemDetailsFromContest() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/contests/{contestId}/problems/{problemId}", 
                        testContest.getId(), testProblem.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testProblem.getId().intValue())))
                .andExpect(jsonPath("$.title", is("Two Sum")))
                .andExpect(jsonPath("$.description", containsString("array of integers")))
                .andExpect(jsonPath("$.difficulty", is("EASY")))
                .andExpect(jsonPath("$.timeLimit", is(1000)))
                .andExpect(jsonPath("$.memoryLimit", is(256)))
                .andExpect(jsonPath("$.exampleTestCases", hasSize(greaterThan(0))));
    }

    @Test
    @DisplayName("Should return 404 for non-existent problem in contest")
    void shouldReturn404ForNonExistentProblemInContest() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/contests/{contestId}/problems/{problemId}", 
                        testContest.getId(), 99999L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Problem not found")));
    }

    @Test
    @DisplayName("Should get all active contests")
    void shouldGetAllActiveContests() throws Exception {
        // Create additional active contest
        Contest activeContest = new Contest();
        activeContest.setTitle("Active Contest");
        activeContest.setDescription("Another active contest");
        activeContest.setStartTime(LocalDateTime.now().minusMinutes(30));
        activeContest.setEndTime(LocalDateTime.now().plusHours(1));
        activeContest.setMaxParticipants(50);
        contestRepository.save(activeContest);

        // Create ended contest (should not appear in results)
        Contest endedContest = new Contest();
        endedContest.setTitle("Ended Contest");
        endedContest.setDescription("This contest has ended");
        endedContest.setStartTime(LocalDateTime.now().minusHours(3));
        endedContest.setEndTime(LocalDateTime.now().minusHours(1));
        endedContest.setMaxParticipants(100);
        contestRepository.save(endedContest);

        mockMvc.perform(MockMvcRequestBuilders.get("/contests")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2))) // Only active contests
                .andExpect(jsonPath("$[*].title", hasItems("Test Contest", "Active Contest")));
    }
}
