#!/bin/bash

# Python Code Execution Script
# Usage: run_python.sh <source_file> <input_file> <timeout_seconds> <memory_limit_mb>

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

if [[ ! "$SOURCE_FILE" =~ \.py$ ]]; then
    echo "ERROR: Source file must have .py extension"
    exit 1
fi

# Create temporary directory for execution
TEMP_DIR=$(mktemp -d -p /tmp execution.XXXXXX)
trap "rm -rf $TEMP_DIR" EXIT

# Copy source file to temp directory
cp "$SOURCE_FILE" "$TEMP_DIR/"
cd "$TEMP_DIR"

SOURCE_BASENAME=$(basename "$SOURCE_FILE")

# Syntax check phase
echo "=== SYNTAX CHECK ==="
START_TIME=$(date +%s.%N)

# Check Python syntax
timeout 10s python3 -m py_compile "$SOURCE_BASENAME" 2> syntax.out

SYNTAX_EXIT_CODE=$?
END_TIME=$(date +%s.%N)
SYNTAX_TIME=$(echo "$END_TIME - $START_TIME" | bc 2>/dev/null || echo "0")

if [[ $SYNTAX_EXIT_CODE -ne 0 ]]; then
    echo "SYNTAX_ERROR"
    echo "Exit Code: $SYNTAX_EXIT_CODE"
    echo "Syntax Check Time: ${SYNTAX_TIME}s"
    echo "=== SYNTAX ERROR OUTPUT ==="
    cat syntax.out 2>/dev/null || echo "No syntax error output"
    exit 1
fi

echo "SUCCESS"
echo "Syntax Check Time: ${SYNTAX_TIME}s"

# Execution phase
echo "=== EXECUTION ==="
START_TIME=$(date +%s.%N)

# Prepare input redirection
INPUT_REDIRECT=""
if [[ -n "$INPUT_FILE" ]] && [[ -f "$INPUT_FILE" ]]; then
    INPUT_REDIRECT="< '$INPUT_FILE'"
fi

# Create a resource-limited Python execution environment
timeout "${TIMEOUT}s" bash -c "
    ulimit -v $((MEMORY_LIMIT_MB * 1024))  # Virtual memory limit
    ulimit -m $((MEMORY_LIMIT_MB * 1024))  # Physical memory limit
    ulimit -t $TIMEOUT                      # CPU time limit
    ulimit -f 1024                          # File size limit (1MB)
    ulimit -u 32                            # Process limit
    ulimit -n 64                            # File descriptor limit
    
    # Execute Python with restricted environment
    python3 -B -S -s -I \
        -c \"
import sys
import os
import resource

# Set memory limit
try:
    resource.setrlimit(resource.RLIMIT_AS, ($((MEMORY_LIMIT_MB * 1024 * 1024)), $((MEMORY_LIMIT_MB * 1024 * 1024))))
except:
    pass

# Set CPU time limit
try:
    resource.setrlimit(resource.RLIMIT_CPU, ($TIMEOUT, $TIMEOUT))
except:
    pass

# Restrict dangerous modules
restricted_modules = {
    'os', 'subprocess', 'multiprocessing', 'threading', 'socket', 'urllib',
    'http', 'ftplib', 'smtplib', 'telnetlib', 'webbrowser', 'tkinter',
    'turtle', 'ctypes', '__import__', 'eval', 'exec', 'compile', 'open'
}

class RestrictedImport:
    def __init__(self, restricted_modules):
        self.restricted_modules = restricted_modules
        self.original_import = __builtins__['__import__']
    
    def __call__(self, name, *args, **kwargs):
        if name in self.restricted_modules or any(name.startswith(mod + '.') for mod in self.restricted_modules):
            raise ImportError(f'Import of {name} is restricted')
        return self.original_import(name, *args, **kwargs)

# Override import function
__builtins__['__import__'] = RestrictedImport(restricted_modules)

# Override dangerous builtins
__builtins__['open'] = lambda *args, **kwargs: None
__builtins__['eval'] = lambda *args, **kwargs: None
__builtins__['exec'] = lambda *args, **kwargs: None
__builtins__['compile'] = lambda *args, **kwargs: None

# Execute the user code
try:
    with open('$SOURCE_BASENAME', 'r') as f:
        code = f.read()
    
    # Create a restricted global namespace
    restricted_globals = {
        '__builtins__': __builtins__,
        '__name__': '__main__',
        '__file__': '$SOURCE_BASENAME',
        '__doc__': None,
        '__package__': None
    }
    
    exec(compile(code, '$SOURCE_BASENAME', 'exec'), restricted_globals)
except SystemExit as e:
    sys.exit(e.code if e.code is not None else 0)
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
\" $INPUT_REDIRECT 2>&1
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

# Resource usage information
echo "=== RESOURCE USAGE ==="
echo "Memory Limit: ${MEMORY_LIMIT_MB}MB"
echo "Time Limit: ${TIMEOUT}s"

exit $EXECUTION_EXIT_CODE
