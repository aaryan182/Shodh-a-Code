#!/bin/bash

# Code execution script for multiple languages
# Usage: ./execute.sh <language> <filename> <timeout_seconds>

set -e

LANGUAGE=$1
FILENAME=$2
TIMEOUT=${3:-10}
WORKSPACE_DIR="/tmp/code-execution/$(date +%s)-$$"

# Create isolated workspace
mkdir -p "$WORKSPACE_DIR"
cd "$WORKSPACE_DIR"

# Copy the code file to workspace
cp "/app/submissions/$FILENAME" "$WORKSPACE_DIR/"

# Function to cleanup
cleanup() {
    cd /
    rm -rf "$WORKSPACE_DIR"
}
trap cleanup EXIT

# Function to run with timeout and resource limits
run_with_limits() {
    timeout "$TIMEOUT" firejail \
        --noprofile \
        --seccomp \
        --private="$WORKSPACE_DIR" \
        --private-tmp \
        --nonetwork \
        --rlimit-cpu="$TIMEOUT" \
        --rlimit-as=128000000 \
        --quiet \
        "$@"
}

case "$LANGUAGE" in
    "java")
        # Extract class name from filename
        CLASS_NAME=$(basename "$FILENAME" .java)
        
        echo "Compiling Java code..."
        javac "$FILENAME" || { echo "Compilation failed"; exit 1; }
        
        echo "Executing Java code..."
        run_with_limits java "$CLASS_NAME"
        ;;
        
    "python" | "python3")
        echo "Executing Python code..."
        run_with_limits python3 "$FILENAME"
        ;;
        
    "javascript" | "node")
        echo "Executing JavaScript code..."
        run_with_limits node "$FILENAME"
        ;;
        
    "cpp" | "c++")
        # Extract executable name
        EXEC_NAME=$(basename "$FILENAME" .cpp)
        
        echo "Compiling C++ code..."
        g++ -o "$EXEC_NAME" "$FILENAME" -std=c++17 -O2 || { echo "Compilation failed"; exit 1; }
        
        echo "Executing C++ code..."
        run_with_limits "./$EXEC_NAME"
        ;;
        
    "c")
        # Extract executable name
        EXEC_NAME=$(basename "$FILENAME" .c)
        
        echo "Compiling C code..."
        gcc -o "$EXEC_NAME" "$FILENAME" -std=c11 -O2 || { echo "Compilation failed"; exit 1; }
        
        echo "Executing C code..."
        run_with_limits "./$EXEC_NAME"
        ;;
        
    "go")
        echo "Executing Go code..."
        run_with_limits go run "$FILENAME"
        ;;
        
    "rust")
        # Extract executable name
        EXEC_NAME=$(basename "$FILENAME" .rs)
        
        echo "Compiling Rust code..."
        rustc -o "$EXEC_NAME" "$FILENAME" -O || { echo "Compilation failed"; exit 1; }
        
        echo "Executing Rust code..."
        run_with_limits "./$EXEC_NAME"
        ;;
        
    *)
        echo "Unsupported language: $LANGUAGE"
        exit 1
        ;;
esac
