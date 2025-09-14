package com.codingcontest.platform;

import com.codingcontest.platform.entity.*;
import com.codingcontest.platform.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Base class for integration tests with common setup and utilities
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.yml")
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected ContestRepository contestRepository;

    @Autowired
    protected ProblemRepository problemRepository;

    @Autowired
    protected TestCaseRepository testCaseRepository;

    @Autowired
    protected SubmissionRepository submissionRepository;

    // Test data
    protected User testUser;
    protected Contest testContest;
    protected Problem testProblem;
    protected List<TestCase> testCases;

    @BeforeEach
    void setUpTestData() {
        // Clean up existing data
        submissionRepository.deleteAll();
        testCaseRepository.deleteAll();
        problemRepository.deleteAll();
        contestRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("$2a$10$test.hash.here"); // BCrypt hash for "password"
        testUser = userRepository.save(testUser);

        // Create test contest
        testContest = new Contest();
        testContest.setTitle("Test Contest");
        testContest.setDescription("A test contest for integration tests");
        testContest.setStartTime(LocalDateTime.now().minusHours(1));
        testContest.setEndTime(LocalDateTime.now().plusHours(2));
        testContest.setMaxParticipants(100);
        testContest = contestRepository.save(testContest);

        // Create test problem
        testProblem = new Problem();
        testProblem.setTitle("Two Sum");
        testProblem.setDescription("Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.");
        testProblem.setDifficulty("EASY");
        testProblem.setTimeLimit(1000);
        testProblem.setMemoryLimit(256);
        testProblem.setContest(testContest);
        testProblem = problemRepository.save(testProblem);

        // Create test cases
        testCases = new ArrayList<>();
        
        TestCase testCase1 = new TestCase();
        testCase1.setInput("[2,7,11,15]\n9");
        testCase1.setExpectedOutput("[0,1]");
        testCase1.setProblem(testProblem);
        testCase1.setIsExample(true);
        testCases.add(testCaseRepository.save(testCase1));

        TestCase testCase2 = new TestCase();
        testCase2.setInput("[3,2,4]\n6");
        testCase2.setExpectedOutput("[1,2]");
        testCase2.setProblem(testProblem);
        testCase2.setIsExample(false);
        testCases.add(testCaseRepository.save(testCase2));

        TestCase testCase3 = new TestCase();
        testCase3.setInput("[3,3]\n6");
        testCase3.setExpectedOutput("[0,1]");
        testCase3.setProblem(testProblem);
        testCase3.setIsExample(false);
        testCases.add(testCaseRepository.save(testCase3));
    }

    /**
     * Helper method to create a submission
     */
    protected Submission createSubmission(String code, String language) {
        Submission submission = new Submission();
        submission.setUser(testUser);
        submission.setProblem(testProblem);
        submission.setContest(testContest);
        submission.setCode(code);
        submission.setLanguage(language);
        submission.setStatus("PENDING");
        submission.setSubmissionTime(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

    /**
     * Helper method to get valid Java solution code
     */
    protected String getValidJavaCode() {
        return """
            import java.util.*;
            import java.io.*;
            
            public class Solution {
                public static void main(String[] args) throws IOException {
                    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                    String[] nums = br.readLine().replace("[", "").replace("]", "").split(",");
                    int target = Integer.parseInt(br.readLine().trim());
                    
                    int[] arr = new int[nums.length];
                    for (int i = 0; i < nums.length; i++) {
                        arr[i] = Integer.parseInt(nums[i].trim());
                    }
                    
                    int[] result = twoSum(arr, target);
                    System.out.println("[" + result[0] + "," + result[1] + "]");
                }
                
                public static int[] twoSum(int[] nums, int target) {
                    Map<Integer, Integer> map = new HashMap<>();
                    for (int i = 0; i < nums.length; i++) {
                        int complement = target - nums[i];
                        if (map.containsKey(complement)) {
                            return new int[] { map.get(complement), i };
                        }
                        map.put(nums[i], i);
                    }
                    return new int[] { -1, -1 };
                }
            }
            """;
    }

    /**
     * Helper method to get valid Python solution code
     */
    protected String getValidPythonCode() {
        return """
            import sys
            import json
            
            def two_sum(nums, target):
                num_map = {}
                for i, num in enumerate(nums):
                    complement = target - num
                    if complement in num_map:
                        return [num_map[complement], i]
                    num_map[num] = i
                return [-1, -1]
            
            if __name__ == "__main__":
                line1 = input().strip()
                nums = json.loads(line1)
                target = int(input().strip())
                
                result = two_sum(nums, target)
                print(json.dumps(result))
            """;
    }

    /**
     * Helper method to get invalid code that should fail compilation
     */
    protected String getInvalidCode() {
        return """
            public class InvalidSolution {
                public static void main(String[] args) {
                    // This code has syntax errors
                    System.out.println("Hello World"
                    // Missing closing parenthesis and semicolon
                }
            """;
    }
}
