#!/bin/bash

# C++ Code Execution Script
# Usage: run_cpp.sh <source_file> <input_file> <timeout_seconds> <memory_limit_mb>

set -e
set -o pipefail

# Script parameters
SOURCE_FILE="$1"
INPUT_FILE="$2"
TIMEOUT="${3:-5}"
MEMORY_LIMIT_MB="${4:-128}"

# Validation
if [[ -z "$SOURCE_FILE" ]]; then
    echo "ERROR: Source file not specified"
    exit 1
fi

if [[ ! -f "$SOURCE_FILE" ]]; then
    echo "ERROR: Source file '$SOURCE_FILE' not found"
    exit 1
fi

if [[ ! "$SOURCE_FILE" =~ \.(cpp|cc|cxx|c)$ ]]; then
    echo "ERROR: Source file must have .cpp, .cc, .cxx, or .c extension"
    exit 1
fi

# Determine if it's C or C++
if [[ "$SOURCE_FILE" =~ \.c$ ]]; then
    COMPILER="gcc"
    STANDARD="-std=c11"
    LANGUAGE="C"
else
    COMPILER="g++"
    STANDARD="-std=c++17"
    LANGUAGE="C++"
fi

# Extract executable name from filename
EXEC_NAME=$(basename "$SOURCE_FILE" | sed 's/\.[^.]*$//')
EXEC_DIR=$(dirname "$SOURCE_FILE")

# Create temporary directory for compilation and execution
TEMP_DIR=$(mktemp -d -p /tmp execution.XXXXXX)
trap "rm -rf $TEMP_DIR" EXIT

# Copy source file to temp directory
cp "$SOURCE_FILE" "$TEMP_DIR/"
cd "$TEMP_DIR"

SOURCE_BASENAME=$(basename "$SOURCE_FILE")

# Compilation phase
echo "=== COMPILATION ==="
START_TIME=$(date +%s.%N)

# Compile with timeout and resource limits
timeout 30s bash -c "
    ulimit -v $((MEMORY_LIMIT_MB * 1024))
    ulimit -t 30
    ulimit -f 1024
    
    $COMPILER $STANDARD -Wall -Wextra -O2 -static \
        -fno-stack-protector \
        -fPIC \
        -o '$EXEC_NAME' '$SOURCE_BASENAME' \
        -lm 2>&1
" > compile.out 2>&1

COMPILE_EXIT_CODE=$?
END_TIME=$(date +%s.%N)
COMPILE_TIME=$(echo "$END_TIME - $START_TIME" | bc 2>/dev/null || echo "0")

if [[ $COMPILE_EXIT_CODE -ne 0 ]]; then
    echo "COMPILATION_ERROR"
    echo "Exit Code: $COMPILE_EXIT_CODE"
    echo "Compile Time: ${COMPILE_TIME}s"
    echo "Language: $LANGUAGE"
    echo "=== COMPILER OUTPUT ==="
    cat compile.out 2>/dev/null || echo "No compiler output"
    exit 1
fi

echo "SUCCESS"
echo "Compile Time: ${COMPILE_TIME}s"
echo "Language: $LANGUAGE"

# Check if executable was created
if [[ ! -f "$EXEC_NAME" ]]; then
    echo "ERROR: Executable '$EXEC_NAME' was not created"
    exit 1
fi

# Make executable runnable
chmod +x "$EXEC_NAME"

# Execution phase
echo "=== EXECUTION ==="
START_TIME=$(date +%s.%N)

# Prepare input redirection
INPUT_REDIRECT=""
if [[ -n "$INPUT_FILE" ]] && [[ -f "$INPUT_FILE" ]]; then
    INPUT_REDIRECT="< '$INPUT_FILE'"
fi

# Execute with comprehensive limits
timeout "${TIMEOUT}s" bash -c "
    ulimit -v $((MEMORY_LIMIT_MB * 1024))  # Virtual memory limit
    ulimit -m $((MEMORY_LIMIT_MB * 1024))  # Physical memory limit
    ulimit -t $TIMEOUT                      # CPU time limit
    ulimit -f 1024                          # File size limit (1MB)
    ulimit -u 32                            # Process limit
    ulimit -n 64                            # File descriptor limit
    ulimit -c 0                             # Core dump size limit
    
    # Execute the compiled program
    ./'$EXEC_NAME' $INPUT_REDIRECT 2>&1
" > execution.out 2>&1

EXECUTION_EXIT_CODE=$?
END_TIME=$(date +%s.%N)
EXECUTION_TIME=$(echo "$END_TIME - $START_TIME" | bc 2>/dev/null || echo "0")

# Determine execution result
case $EXECUTION_EXIT_CODE in
    0)
        echo "SUCCESS"
        ;;
    124)
        echo "TIME_LIMIT_EXCEEDED"
        ;;
    137)
        echo "MEMORY_LIMIT_EXCEEDED"
        ;;
    139)
        echo "SEGMENTATION_FAULT"
        ;;
    134)
        echo "ABORTED"
        ;;
    136)
        echo "FLOATING_POINT_ERROR"
        ;;
    *)
        echo "RUNTIME_ERROR"
        ;;
esac

echo "Exit Code: $EXECUTION_EXIT_CODE"
echo "Execution Time: ${EXECUTION_TIME}s"

# Output program results
echo "=== PROGRAM OUTPUT ==="
if [[ -f execution.out ]]; then
    # Limit output size to prevent abuse
    head -c 4096 execution.out 2>/dev/null || echo "No output or output too large"
else
    echo "No output file generated"
fi

# Check for common runtime issues
if [[ $EXECUTION_EXIT_CODE -eq 139 ]]; then
    echo "=== DEBUG INFO ==="
    echo "Segmentation fault detected. Possible causes:"
    echo "- Array index out of bounds"
    echo "- Null pointer dereference"
    echo "- Stack overflow"
    echo "- Memory corruption"
elif [[ $EXECUTION_EXIT_CODE -eq 134 ]]; then
    echo "=== DEBUG INFO ==="
    echo "Program aborted. Possible causes:"
    echo "- Assertion failure"
    echo "- Memory allocation failure"
    echo "- Uncaught exception"
elif [[ $EXECUTION_EXIT_CODE -eq 136 ]]; then
    echo "=== DEBUG INFO ==="
    echo "Floating point error. Possible causes:"
    echo "- Division by zero"
    echo "- Invalid floating point operation"
    echo "- Overflow/underflow"
fi

# Resource usage information
echo "=== RESOURCE USAGE ==="
echo "Memory Limit: ${MEMORY_LIMIT_MB}MB"
echo "Time Limit: ${TIMEOUT}s"
echo "Compiler: $COMPILER"
echo "Standard: $STANDARD"

exit $EXECUTION_EXIT_CODE
