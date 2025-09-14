package com.codingcontest.platform.service;

import com.codingcontest.platform.dto.ExecutionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for CodeJudgeService with actual Docker execution
 * These tests require Docker to be installed and running
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Code Judge Service Integration Tests")
class CodeJudgeServiceTest {

    @Autowired
    private CodeJudgeService codeJudgeService;

    private static final String VALID_JAVA_CODE = """
            import java.util.*;
            import java.io.*;
            
            public class Solution {
                public static void main(String[] args) throws IOException {
                    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                    String line = br.readLine().trim();
                    System.out.println("Hello " + line);
                }
            }
            """;

    private static final String VALID_PYTHON_CODE = """
            import sys
            line = input().strip()
            print(f"Hello {line}")
            """;

    private static final String VALID_CPP_CODE = """
            #include <iostream>
            #include <string>
            using namespace std;
            
            int main() {
                string line;
                getline(cin, line);
                cout << "Hello " << line << endl;
                return 0;
            }
            """;

    private static final String INVALID_JAVA_CODE = """
            public class Solution {
                public static void main(String[] args) {
                    System.out.println("Hello World"
                    // Missing closing parenthesis and semicolon
                }
            """;

    private static final String TIMEOUT_JAVA_CODE = """
            public class Solution {
                public static void main(String[] args) {
                    while (true) {
                        // Infinite loop to test timeout
                        try {
                            Thread.sleep(100);
                        } catch (InterruptedException e) {
                            break;
                        }
                    }
                }
            }
            """;

    private static final String MEMORY_INTENSIVE_JAVA_CODE = """
            import java.util.*;
            
            public class Solution {
                public static void main(String[] args) {
                    List<int[]> memoryHog = new ArrayList<>();
                    try {
                        for (int i = 0; i < 1000000; i++) {
                            memoryHog.add(new int[1000]); // Allocate large arrays
                        }
                    } catch (OutOfMemoryError e) {
                        System.out.println("Out of memory");
                    }
                }
            }
            """;

    @BeforeEach
    void setUp() {
        // Ensure temp directory exists
        try {
            Path tempDir = Paths.get("/tmp/judge-test");
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
            }
        } catch (IOException e) {
            // Ignore - will be handled by the service
        }
    }

    @Test
    @DisplayName("Should execute valid Java code successfully")
    @EnabledIf("isDockerAvailable")
    void shouldExecuteValidJavaCodeSuccessfully() {
        String input = "World";
        
        ExecutionResult result = codeJudgeService.executeCode(
            VALID_JAVA_CODE, "java", input, 5000, 256
        );

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals("Hello World", result.getOutput().trim());
        assertNotNull(result.getExecutionTime());
        assertTrue(result.getExecutionTime() > 0);
        assertNotNull(result.getMemoryUsed());
        assertTrue(result.getMemoryUsed() > 0);
        assertNull(result.getError());
    }

    @Test
    @DisplayName("Should execute valid Python code successfully")
    @EnabledIf("isDockerAvailable")
    void shouldExecuteValidPythonCodeSuccessfully() {
        String input = "Python";
        
        ExecutionResult result = codeJudgeService.executeCode(
            VALID_PYTHON_CODE, "python", input, 5000, 256
        );

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals("Hello Python", result.getOutput().trim());
        assertNotNull(result.getExecutionTime());
        assertTrue(result.getExecutionTime() > 0);
        assertNull(result.getError());
    }

    @Test
    @DisplayName("Should execute valid C++ code successfully")
    @EnabledIf("isDockerAvailable")
    void shouldExecuteValidCppCodeSuccessfully() {
        String input = "C++";
        
        ExecutionResult result = codeJudgeService.executeCode(
            VALID_CPP_CODE, "cpp", input, 5000, 256
        );

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals("Hello C++", result.getOutput().trim());
        assertNotNull(result.getExecutionTime());
        assertTrue(result.getExecutionTime() > 0);
        assertNull(result.getError());
    }

    @Test
    @DisplayName("Should handle compilation error")
    @EnabledIf("isDockerAvailable")
    void shouldHandleCompilationError() {
        String input = "test";
        
        ExecutionResult result = codeJudgeService.executeCode(
            INVALID_JAVA_CODE, "java", input, 5000, 256
        );

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getError());
        assertTrue(result.getError().contains("error") || 
                   result.getError().contains("expected") ||
                   result.getError().contains("compilation failed"));
        assertEquals(0L, result.getExecutionTime());
    }

    @Test
    @DisplayName("Should handle timeout")
    @EnabledIf("isDockerAvailable")
    void shouldHandleTimeout() {
        String input = "test";
        
        ExecutionResult result = codeJudgeService.executeCode(
            TIMEOUT_JAVA_CODE, "java", input, 2, 256 // 2 second timeout
        );

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getError());
        assertTrue(result.getError().toLowerCase().contains("timeout") ||
                   result.getError().toLowerCase().contains("time") ||
                   result.getError().toLowerCase().contains("killed"));
        assertTrue(result.getExecutionTime() >= 2000); // At least 2 seconds
    }

    @Test
    @DisplayName("Should handle memory limit exceeded")
    @EnabledIf("isDockerAvailable")
    void shouldHandleMemoryLimitExceeded() {
        String input = "test";
        
        ExecutionResult result = codeJudgeService.executeCode(
            MEMORY_INTENSIVE_JAVA_CODE, "java", input, 10000, 64 // Low memory limit
        );

        assertNotNull(result);
        // May succeed with OutOfMemoryError message or fail due to container limits
        if (!result.isSuccess()) {
            assertNotNull(result.getError());
            assertTrue(result.getError().toLowerCase().contains("memory") ||
                       result.getError().toLowerCase().contains("killed") ||
                       result.getError().toLowerCase().contains("oom"));
        } else {
            // If it succeeds, it should print "Out of memory"
            assertTrue(result.getOutput().contains("Out of memory"));
        }
    }

    @Test
    @DisplayName("Should handle empty input")
    @EnabledIf("isDockerAvailable")
    void shouldHandleEmptyInput() {
        String input = "";
        
        ExecutionResult result = codeJudgeService.executeCode(
            VALID_JAVA_CODE, "java", input, 5000, 256
        );

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals("Hello ", result.getOutput().trim());
    }

    @Test
    @DisplayName("Should handle multi-line input")
    @EnabledIf("isDockerAvailable")
    void shouldHandleMultiLineInput() {
        String multiLineCode = """
            import java.util.*;
            import java.io.*;
            
            public class Solution {
                public static void main(String[] args) throws IOException {
                    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                    String line1 = br.readLine().trim();
                    String line2 = br.readLine().trim();
                    System.out.println(line1 + " " + line2);
                }
            }
            """;
        
        String input = "Hello\\nWorld";
        
        ExecutionResult result = codeJudgeService.executeCode(
            multiLineCode, "java", input, 5000, 256
        );

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals("Hello World", result.getOutput().trim());
    }

    @Test
    @DisplayName("Should handle runtime error")
    @EnabledIf("isDockerAvailable")
    void shouldHandleRuntimeError() {
        String runtimeErrorCode = """
            public class Solution {
                public static void main(String[] args) {
                    int[] arr = new int[1];
                    System.out.println(arr[10]); // ArrayIndexOutOfBoundsException
                }
            }
            """;
        
        String input = "test";
        
        ExecutionResult result = codeJudgeService.executeCode(
            runtimeErrorCode, "java", input, 5000, 256
        );

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getError());
        assertTrue(result.getError().contains("Exception") ||
                   result.getError().contains("error") ||
                   result.getError().contains("ArrayIndexOutOfBoundsException"));
    }

    @Test
    @DisplayName("Should handle unsupported language")
    void shouldHandleUnsupportedLanguage() {
        String input = "test";
        
        ExecutionResult result = codeJudgeService.executeCode(
            "console.log('Hello World');", "javascript", input, 5000, 256
        );

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getError());
        assertTrue(result.getError().toLowerCase().contains("unsupported") ||
                   result.getError().toLowerCase().contains("language"));
    }

    @Test
    @DisplayName("Should cleanup temporary files")
    @EnabledIf("isDockerAvailable")
    void shouldCleanupTemporaryFiles() throws InterruptedException {
        String input = "cleanup test";
        
        // Execute multiple times to test cleanup
        for (int i = 0; i < 3; i++) {
            ExecutionResult result = codeJudgeService.executeCode(
                VALID_JAVA_CODE, "java", input, 5000, 256
            );
            assertNotNull(result);
            assertTrue(result.isSuccess());
        }

        // Give some time for cleanup
        Thread.sleep(1000);

        // Check that temp directory is not cluttered
        Path tempDir = Paths.get("/tmp/judge-test");
        if (Files.exists(tempDir)) {
            try {
                long fileCount = Files.list(tempDir).count();
                // Should have minimal files (cleanup should have occurred)
                assertTrue(fileCount < 10, "Too many temporary files remaining: " + fileCount);
            } catch (IOException e) {
                // Directory might not exist or be accessible, which is fine
            }
        }
    }

    @Test
    @DisplayName("Should handle concurrent executions")
    @EnabledIf("isDockerAvailable")
    void shouldHandleConcurrentExecutions() throws InterruptedException {
        int numThreads = 3;
        Thread[] threads = new Thread[numThreads];
        ExecutionResult[] results = new ExecutionResult[numThreads];
        
        for (int i = 0; i < numThreads; i++) {
            final int index = i;
            threads[i] = new Thread(() -> {
                String input = "Thread " + index;
                results[index] = codeJudgeService.executeCode(
                    VALID_JAVA_CODE, "java", input, 5000, 256
                );
            });
            threads[i].start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }

        // Verify all executions succeeded
        for (int i = 0; i < numThreads; i++) {
            assertNotNull(results[i]);
            assertTrue(results[i].isSuccess());
            assertEquals("Hello Thread " + i, results[i].getOutput().trim());
        }
    }

    /**
     * Helper method to check if Docker is available
     */
    static boolean isDockerAvailable() {
        try {
            Process process = Runtime.getRuntime().exec("docker --version");
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
