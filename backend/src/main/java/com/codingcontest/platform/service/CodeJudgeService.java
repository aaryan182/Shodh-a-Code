package com.codingcontest.platform.service;

import com.codingcontest.platform.dto.ExecutionResult;
import com.codingcontest.platform.entity.Submission;
import com.codingcontest.platform.entity.TestCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for executing and judging code submissions using Docker containers
 */
@Service
public class CodeJudgeService {
    
    private static final Logger logger = LoggerFactory.getLogger(CodeJudgeService.class);
    
    // Configuration properties
    @Value("${judge.docker.image:judge-executor:latest}")
    private String dockerImage;
    
    @Value("${judge.timeout.default:10}")
    private int defaultTimeoutSeconds;
    
    @Value("${judge.memory.default:256}")
    private int defaultMemoryLimitMB;
    
    @Value("${judge.temp.directory:/tmp/judge}")
    private String tempDirectory;
    
    // Language-specific configurations
    private static final String JAVA_SCRIPT = "/usr/local/bin/judge/run_java.sh";
    private static final String PYTHON_SCRIPT = "/usr/local/bin/judge/run_python.sh";
    private static final String CPP_SCRIPT = "/usr/local/bin/judge/run_cpp.sh";
    
    // Patterns for parsing execution output
    private static final Pattern EXECUTION_TIME_PATTERN = Pattern.compile("Execution Time: ([0-9.]+)s");
    private static final Pattern MEMORY_USAGE_PATTERN = Pattern.compile("Memory: ([0-9]+)KB");
    private static final Pattern EXIT_CODE_PATTERN = Pattern.compile("Exit Code: ([0-9]+)");
    
    /**
     * Executes code submission against all test cases
     * 
     * @param submission the submission to execute
     * @param testCases list of test cases to run against
     * @return ExecutionResult with overall execution status
     */
    public ExecutionResult executeCode(Submission submission, List<TestCase> testCases) {
        logger.info("Executing submission {} with {} test cases", submission.getId(), testCases.size());
        
        String executionId = generateExecutionId();
        
        try {
            // Create execution directory
            Path executionDir = createExecutionDirectory(executionId);
            
            // Write code to file
            Path codeFile = writeCodeToFile(submission, executionDir);
            
            List<ExecutionResult> testResults = new ArrayList<>();
            long totalExecutionTime = 0;
            long maxMemoryUsed = 0;
            
            // Run each test case
            for (int i = 0; i < testCases.size(); i++) {
                TestCase testCase = testCases.get(i);
                logger.debug("Running test case {} for submission {}", i + 1, submission.getId());
                
                ExecutionResult result = runSingleTestCase(
                    submission.getCode(), 
                    submission.getLanguage().name().toLowerCase(), 
                    testCase
                );
                
                testResults.add(result);
                
                // If any test case fails, return the failure result
                if (!result.isSuccessful()) {
                    logger.info("Test case {} failed for submission {}: {}", 
                               i + 1, submission.getId(), result.getStatus());
                    return result;
                }
                
                // Accumulate metrics
                if (result.getExecutionTime() != null) {
                    totalExecutionTime += result.getExecutionTime();
                }
                if (result.getMemoryUsed() != null && result.getMemoryUsed() > maxMemoryUsed) {
                    maxMemoryUsed = result.getMemoryUsed();
                }
            }
            
            // All test cases passed
            logger.info("All {} test cases passed for submission {}", testCases.size(), submission.getId());
            return ExecutionResult.success("All test cases passed", totalExecutionTime, maxMemoryUsed);
            
        } catch (Exception e) {
            logger.error("Error executing submission {}: {}", submission.getId(), e.getMessage(), e);
            return ExecutionResult.systemError("System error during execution: " + e.getMessage());
        } finally {
            // Always cleanup
            cleanupExecution(executionId);
        }
    }
    
    /**
     * Runs code against a single test case using Docker
     * 
     * @param code the source code to execute
     * @param language the programming language
     * @param testCase the test case to run
     * @return ExecutionResult for this specific test case
     */
    public ExecutionResult runSingleTestCase(String code, String language, TestCase testCase) {
        String executionId = generateExecutionId();
        
        try {
            // Create execution directory
            Path executionDir = createExecutionDirectory(executionId);
            
            // Write code and input files
            Path codeFile = writeCodeFile(code, language, executionDir);
            Path inputFile = writeInputFile(testCase.getInput(), executionDir);
            
            // Get language-specific script
            String scriptPath = getExecutionScript(language);
            
            // Build Docker command
            List<String> command = buildDockerCommand(executionDir, scriptPath, codeFile, inputFile);
            
            // Execute with timeout
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(false);
            
            long startTime = System.currentTimeMillis();
            Process process = processBuilder.start();
            
            // Read output and error streams
            StringBuilder output = new StringBuilder();
            StringBuilder errorOutput = new StringBuilder();
            
            Thread outputReader = new Thread(() -> readStream(process.getInputStream(), output));
            Thread errorReader = new Thread(() -> readStream(process.getErrorStream(), errorOutput));
            
            outputReader.start();
            errorReader.start();
            
            // Wait for process completion with timeout
            boolean finished = process.waitFor(defaultTimeoutSeconds + 5, TimeUnit.SECONDS);
            long executionTime = System.currentTimeMillis() - startTime;
            
            if (!finished) {
                // Kill the process and container
                process.destroyForcibly();
                killDockerContainer(executionId);
                return ExecutionResult.timeLimitExceeded(executionTime);
            }
            
            // Wait for stream readers to complete
            outputReader.join(1000);
            errorReader.join(1000);
            
            int exitCode = process.exitValue();
            String outputStr = output.toString();
            String errorStr = errorOutput.toString();
            
            // Parse execution result
            ExecutionResult result = parseExecutionOutput(outputStr, errorStr, exitCode, executionTime);
            
            // If execution was successful, compare outputs
            if (result.isSuccessful()) {
                String actualOutput = extractProgramOutput(outputStr);
                return evaluateResult(testCase.getExpectedOutput(), actualOutput);
            }
            
            return result;
            
        } catch (Exception e) {
            logger.error("Error running test case for execution {}: {}", executionId, e.getMessage(), e);
            return ExecutionResult.systemError("Error during test case execution: " + e.getMessage());
        } finally {
            cleanupExecution(executionId);
        }
    }
    
    /**
     * Evaluates the result by comparing expected and actual output
     * 
     * @param expectedOutput the expected output
     * @param actualOutput the actual output from execution
     * @return ExecutionResult indicating whether outputs match
     */
    public ExecutionResult evaluateResult(String expectedOutput, String actualOutput) {
        if (expectedOutput == null && actualOutput == null) {
            return ExecutionResult.success("", 0L, 0L);
        }
        
        if (expectedOutput == null || actualOutput == null) {
            logger.debug("Output mismatch: expected={}, actual={}", expectedOutput, actualOutput);
            return ExecutionResult.wrongAnswer(actualOutput, "Output mismatch");
        }
        
        // Normalize outputs (trim whitespace, normalize line endings)
        String normalizedExpected = normalizeOutput(expectedOutput);
        String normalizedActual = normalizeOutput(actualOutput);
        
        if (normalizedExpected.equals(normalizedActual)) {
            return ExecutionResult.success(actualOutput, 0L, 0L);
        } else {
            logger.debug("Output mismatch: expected='{}', actual='{}'", 
                        normalizedExpected, normalizedActual);
            return ExecutionResult.wrongAnswer(actualOutput, 
                "Expected: " + normalizedExpected + ", Got: " + normalizedActual);
        }
    }
    
    /**
     * Cleans up execution resources including temporary files and containers
     * 
     * @param executionId the execution ID to clean up
     */
    public void cleanupExecution(String executionId) {
        try {
            // Kill any running containers
            killDockerContainer(executionId);
            
            // Remove temporary directory
            Path executionDir = Paths.get(tempDirectory, executionId);
            if (Files.exists(executionDir)) {
                Files.walk(executionDir)
                    .sorted((a, b) -> b.compareTo(a)) // Delete files before directories
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            logger.warn("Failed to delete file: {}", path, e);
                        }
                    });
            }
            
            logger.debug("Cleaned up execution: {}", executionId);
            
        } catch (Exception e) {
            logger.warn("Error during cleanup for execution {}: {}", executionId, e.getMessage());
        }
    }
    
    // Private helper methods
    
    private String generateExecutionId() {
        return "exec_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
    
    private Path createExecutionDirectory(String executionId) throws IOException {
        Path executionDir = Paths.get(tempDirectory, executionId);
        Files.createDirectories(executionDir);
        return executionDir;
    }
    
    private Path writeCodeToFile(Submission submission, Path executionDir) throws IOException {
        String language = submission.getLanguage().name().toLowerCase();
        return writeCodeFile(submission.getCode(), language, executionDir);
    }
    
    private Path writeCodeFile(String code, String language, Path executionDir) throws IOException {
        String fileName = getCodeFileName(language);
        Path codeFile = executionDir.resolve(fileName);
        Files.write(codeFile, code.getBytes(), StandardOpenOption.CREATE);
        return codeFile;
    }
    
    private Path writeInputFile(String input, Path executionDir) throws IOException {
        Path inputFile = executionDir.resolve("input.txt");
        Files.write(inputFile, (input != null ? input : "").getBytes(), StandardOpenOption.CREATE);
        return inputFile;
    }
    
    private String getCodeFileName(String language) {
        switch (language.toLowerCase()) {
            case "java":
                return "Solution.java";
            case "python":
                return "solution.py";
            case "cpp":
            case "c++":
                return "solution.cpp";
            case "c":
                return "solution.c";
            default:
                return "solution.txt";
        }
    }
    
    private String getExecutionScript(String language) {
        switch (language.toLowerCase()) {
            case "java":
                return JAVA_SCRIPT;
            case "python":
                return PYTHON_SCRIPT;
            case "cpp":
            case "c++":
            case "c":
                return CPP_SCRIPT;
            default:
                throw new IllegalArgumentException("Unsupported language: " + language);
        }
    }
    
    private List<String> buildDockerCommand(Path executionDir, String scriptPath, Path codeFile, Path inputFile) {
        List<String> command = new ArrayList<>();
        command.add("docker");
        command.add("run");
        command.add("--rm");
        command.add("--name");
        command.add("judge_" + executionDir.getFileName().toString());
        command.add("-v");
        command.add(executionDir.toAbsolutePath() + ":/tmp/execution");
        command.add("-u");
        command.add("coderunner");
        command.add("--memory=" + defaultMemoryLimitMB + "m");
        command.add("--cpus=1.0");
        command.add("--network=none");
        command.add(dockerImage);
        command.add(scriptPath);
        command.add("/tmp/execution/" + codeFile.getFileName().toString());
        command.add("/tmp/execution/" + inputFile.getFileName().toString());
        command.add(String.valueOf(defaultTimeoutSeconds));
        command.add(String.valueOf(defaultMemoryLimitMB));
        
        return command;
    }
    
    private void readStream(java.io.InputStream inputStream, StringBuilder output) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        } catch (IOException e) {
            logger.warn("Error reading stream: {}", e.getMessage());
        }
    }
    
    private void killDockerContainer(String executionId) {
        try {
            String containerName = "judge_" + executionId;
            ProcessBuilder killBuilder = new ProcessBuilder("docker", "kill", containerName);
            Process killProcess = killBuilder.start();
            killProcess.waitFor(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.debug("Error killing container for execution {}: {}", executionId, e.getMessage());
        }
    }
    
    private ExecutionResult parseExecutionOutput(String output, String errorOutput, int exitCode, long executionTime) {
        // Parse execution time and memory usage from output
        Long parsedExecutionTime = parseExecutionTime(output);
        Long memoryUsed = parseMemoryUsage(output);
        
        if (parsedExecutionTime == null) {
            parsedExecutionTime = executionTime;
        }
        
        // Determine status based on exit code and output
        if (output.contains("COMPILATION_ERROR") || output.contains("SYNTAX_ERROR")) {
            return ExecutionResult.compilationError(extractErrorMessage(output, errorOutput));
        } else if (output.contains("TIME_LIMIT_EXCEEDED") || exitCode == 124) {
            return ExecutionResult.timeLimitExceeded(parsedExecutionTime);
        } else if (output.contains("MEMORY_LIMIT_EXCEEDED") || exitCode == 137) {
            return ExecutionResult.memoryLimitExceeded(memoryUsed);
        } else if (output.contains("RUNTIME_ERROR") || exitCode != 0) {
            return ExecutionResult.runtimeError(extractErrorMessage(output, errorOutput), exitCode);
        } else if (output.contains("SUCCESS")) {
            return ExecutionResult.success(extractProgramOutput(output), parsedExecutionTime, memoryUsed);
        } else {
            return ExecutionResult.systemError("Unknown execution result");
        }
    }
    
    private Long parseExecutionTime(String output) {
        Matcher matcher = EXECUTION_TIME_PATTERN.matcher(output);
        if (matcher.find()) {
            try {
                double seconds = Double.parseDouble(matcher.group(1));
                return (long) (seconds * 1000); // Convert to milliseconds
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse execution time: {}", matcher.group(1));
            }
        }
        return null;
    }
    
    private Long parseMemoryUsage(String output) {
        Matcher matcher = MEMORY_USAGE_PATTERN.matcher(output);
        if (matcher.find()) {
            try {
                return Long.parseLong(matcher.group(1));
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse memory usage: {}", matcher.group(1));
            }
        }
        return null;
    }
    
    private String extractProgramOutput(String output) {
        // Extract program output between specific markers
        String startMarker = "=== PROGRAM OUTPUT ===";
        String endMarker = "=== RESOURCE USAGE ===";
        
        int startIndex = output.indexOf(startMarker);
        if (startIndex == -1) {
            return "";
        }
        
        startIndex += startMarker.length();
        int endIndex = output.indexOf(endMarker, startIndex);
        if (endIndex == -1) {
            endIndex = output.length();
        }
        
        return output.substring(startIndex, endIndex).trim();
    }
    
    private String extractErrorMessage(String output, String errorOutput) {
        // Try to extract meaningful error message from output
        if (output.contains("COMPILATION_ERROR")) {
            int index = output.indexOf("COMPILATION_ERROR");
            String remaining = output.substring(index);
            return remaining.substring(0, Math.min(remaining.length(), 500));
        }
        
        if (errorOutput != null && !errorOutput.trim().isEmpty()) {
            return errorOutput.trim().substring(0, Math.min(errorOutput.length(), 500));
        }
        
        return "Unknown error occurred";
    }
    
    private String normalizeOutput(String output) {
        if (output == null) {
            return "";
        }
        
        // Normalize line endings and trim whitespace
        return output.replaceAll("\\r\\n|\\r", "\n")
                    .trim()
                    .replaceAll("\\s+$", ""); // Remove trailing whitespace from each line
    }
}
