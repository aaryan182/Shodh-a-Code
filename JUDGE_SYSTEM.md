# Secure Code Execution Judge System

This document describes the secure Docker-based code execution system for the coding contest platform.

## Overview

The judge system consists of:

- `Dockerfile.judge`: A secure Ubuntu 20.04-based Docker image
- Language-specific execution scripts: `run_java.sh`, `run_python.sh`, `run_cpp.sh`
- Comprehensive security measures and resource limits

## Architecture

### Security Features

1. **Non-root execution**: All code runs under the `coderunner` user with limited privileges
2. **Resource limits**: Memory, CPU time, file size, and process limits
3. **Network isolation**: No network access during code execution
4. **File system restrictions**: Limited file access and creation
5. **Dangerous command removal**: Security-sensitive binaries are removed
6. **Module restrictions**: Python dangerous modules are blocked

### Supported Languages

- **Java**: OpenJDK 11 with security manager
- **Python**: Python 3 with module restrictions and sandboxing
- **C/C++**: GCC/G++ with static compilation

## Building the Docker Image

```bash
# Build the judge Docker image
docker build -f Dockerfile.judge -t judge-executor:latest .

# Verify the build
docker run --rm judge-executor:latest java -version
docker run --rm judge-executor:latest python3 --version
docker run --rm judge-executor:latest gcc --version
```

## Usage

### Script Parameters

All execution scripts follow the same parameter pattern:

```bash
./run_<language>.sh <source_file> <input_file> <timeout_seconds> <memory_limit_mb>
```

**Parameters:**

- `source_file`: Path to the source code file (required)
- `input_file`: Path to input file for stdin (optional)
- `timeout_seconds`: Maximum execution time in seconds (default: 5)
- `memory_limit_mb`: Memory limit in megabytes (default: 128)

### Examples

#### Java Execution

```bash
# Basic execution
./run_java.sh Solution.java input.txt 10 256

# With custom limits
./run_java.sh HelloWorld.java "" 5 128
```

#### Python Execution

```bash
# Basic execution
./run_python.sh solution.py input.txt 5 128

# No input file
./run_python.sh hello.py "" 3 64
```

#### C++ Execution

```bash
# C++ execution
./run_cpp.sh solution.cpp input.txt 10 256

# C execution
./run_cpp.sh solution.c input.txt 5 128
```

### Docker Integration

```bash
# Run code in the judge container
docker run --rm \
    -v /path/to/code:/tmp/execution \
    -u coderunner \
    --memory=256m \
    --cpus=1.0 \
    --network=none \
    judge-executor:latest \
    /usr/local/bin/judge/run_java.sh /tmp/execution/Solution.java /tmp/execution/input.txt 10 128
```

## Output Format

Each script provides structured output:

```
=== COMPILATION === (for compiled languages)
SUCCESS/COMPILATION_ERROR
Compile Time: X.XXs

=== EXECUTION ===
SUCCESS/TIME_LIMIT_EXCEEDED/MEMORY_LIMIT_EXCEEDED/RUNTIME_ERROR/SYNTAX_ERROR
Exit Code: X
Execution Time: X.XXs

=== PROGRAM OUTPUT ===
[Program stdout/stderr output, limited to 4KB]

=== RESOURCE USAGE ===
Memory Limit: XMB
Time Limit: Xs
[Additional language-specific info]
```

## Security Measures

### System-Level Security

1. **User Isolation**: Code runs as `coderunner` user with no sudo privileges
2. **Resource Limits**: Enforced via `ulimit` and container constraints
3. **File System**: Limited to `/tmp/execution` working directory
4. **Network**: Completely disabled during execution
5. **Process Limits**: Maximum 32-64 processes per execution

### Language-Specific Security

#### Java Security

- Security manager enabled with restrictive policy
- Limited heap and metaspace memory
- Headless mode enforced
- File encoding locked to UTF-8

#### Python Security

- Restricted import system blocking dangerous modules
- Disabled `eval`, `exec`, `compile`, and `open` builtins
- Module whitelist enforcement
- Syntax validation before execution

#### C/C++ Security

- Static compilation to prevent dynamic loading
- Stack protection disabled for consistent behavior
- Limited standard library access
- Core dumps disabled

### Resource Limits

| Resource         | Default Limit | Configurable |
| ---------------- | ------------- | ------------ |
| Memory           | 128MB         | Yes          |
| CPU Time         | 5 seconds     | Yes          |
| File Size        | 1MB           | No           |
| Processes        | 32            | No           |
| File Descriptors | 64            | No           |
| Network          | Disabled      | No           |

## Error Handling

### Exit Codes

- `0`: Success
- `1`: Compilation error / Syntax error
- `124`: Time limit exceeded
- `137`: Memory limit exceeded (SIGKILL)
- `139`: Segmentation fault (C/C++)
- `134`: Aborted (C/C++)
- `136`: Floating point error (C/C++)

### Common Issues

1. **Compilation Errors**: Check compiler output in the compilation section
2. **Time Limit Exceeded**: Optimize algorithm or increase timeout
3. **Memory Limit Exceeded**: Reduce memory usage or increase limit
4. **Runtime Errors**: Check for array bounds, null pointers, etc.

## Integration with Contest Platform

The judge system integrates with the main platform through:

1. **Submission Processing**: Code files are written to temporary directories
2. **Execution**: Docker containers are spawned with appropriate scripts
3. **Result Parsing**: Output is parsed to determine submission status
4. **Cleanup**: Temporary files and containers are removed after execution

### Example Integration Code

```java
// Java service integration example
public class JudgeService {

    public SubmissionResult executeCode(Submission submission) {
        // Write code to temporary file
        Path codeFile = writeCodeToFile(submission);
        Path inputFile = writeInputToFile(submission.getTestCase());

        // Execute in Docker container
        String[] command = {
            "docker", "run", "--rm",
            "-v", codeFile.getParent() + ":/tmp/execution",
            "-u", "coderunner",
            "--memory=256m",
            "--cpus=1.0",
            "--network=none",
            "judge-executor:latest",
            getExecutionScript(submission.getLanguage()),
            "/tmp/execution/" + codeFile.getFileName(),
            "/tmp/execution/input.txt",
            String.valueOf(submission.getTimeLimit()),
            String.valueOf(submission.getMemoryLimit())
        };

        ProcessResult result = executeCommand(command);
        return parseResult(result.getOutput());
    }
}
```

## Monitoring and Logging

- All execution attempts are logged with timestamps
- Resource usage is tracked and reported
- Security violations are logged and flagged
- Performance metrics are collected for optimization

## Maintenance

### Regular Tasks

1. **Image Updates**: Rebuild with latest security patches
2. **Log Rotation**: Clean up execution logs
3. **Performance Monitoring**: Track execution times and resource usage
4. **Security Audits**: Review and update security measures

### Troubleshooting

1. **Container Issues**: Check Docker daemon and image integrity
2. **Permission Problems**: Verify file permissions and user setup
3. **Resource Exhaustion**: Monitor system resources and adjust limits
4. **Security Alerts**: Investigate unusual execution patterns

## Future Enhancements

1. **Additional Languages**: Support for more programming languages
2. **Advanced Sandboxing**: Integration with advanced sandboxing technologies
3. **Performance Optimization**: Faster compilation and execution
4. **Enhanced Monitoring**: Real-time resource usage tracking
5. **Distributed Execution**: Multi-node judge system support
