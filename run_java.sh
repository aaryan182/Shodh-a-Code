#!/bin/bash

# Java Code Execution Script
# Usage: run_java.sh <source_file> <input_file> <timeout_seconds> <memory_limit_mb>

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

if [[ ! "$SOURCE_FILE" =~ \.java$ ]]; then
    echo "ERROR: Source file must have .java extension"
    exit 1
fi

# Extract class name from filename
CLASS_NAME=$(basename "$SOURCE_FILE" .java)
EXEC_DIR=$(dirname "$SOURCE_FILE")

# Create temporary directory for compilation
TEMP_DIR=$(mktemp -d -p /tmp execution.XXXXXX)
trap "rm -rf $TEMP_DIR" EXIT

# Copy source file to temp directory
cp "$SOURCE_FILE" "$TEMP_DIR/"
cd "$TEMP_DIR"

# Compilation phase
echo "=== COMPILATION ==="
START_TIME=$(date +%s.%N)

# Compile with timeout and resource limits
timeout 30s bash -c "
    ulimit -v $((MEMORY_LIMIT_MB * 1024))
    ulimit -t 30
    ulimit -f 1024
    javac -cp . '$CLASS_NAME.java' 2>&1
" > compile.out 2>&1

COMPILE_EXIT_CODE=$?
END_TIME=$(date +%s.%N)
COMPILE_TIME=$(echo "$END_TIME - $START_TIME" | bc 2>/dev/null || echo "0")

if [[ $COMPILE_EXIT_CODE -ne 0 ]]; then
    echo "COMPILATION_ERROR"
    echo "Exit Code: $COMPILE_EXIT_CODE"
    echo "Compile Time: ${COMPILE_TIME}s"
    echo "=== COMPILER OUTPUT ==="
    cat compile.out 2>/dev/null || echo "No compiler output"
    exit 1
fi

echo "SUCCESS"
echo "Compile Time: ${COMPILE_TIME}s"

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
    
    # Additional Java-specific memory settings
    java -Xmx${MEMORY_LIMIT_MB}m -Xms${MEMORY_LIMIT_MB}m \
         -XX:+UseSerialGC \
         -XX:MaxMetaspaceSize=64m \
         -Djava.security.manager \
         -Djava.security.policy==/dev/null \
         -Djava.awt.headless=true \
         -Dfile.encoding=UTF-8 \
         -cp . '$CLASS_NAME' $INPUT_REDIRECT 2>&1
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

# Memory usage information (if available)
echo "=== RESOURCE USAGE ==="
echo "Memory Limit: ${MEMORY_LIMIT_MB}MB"
echo "Time Limit: ${TIMEOUT}s"

exit $EXECUTION_EXIT_CODE
