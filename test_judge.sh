#!/bin/bash

# Test script for the judge system
# This script creates sample code files and tests the execution scripts

set -e

echo "=== Judge System Test Suite ==="
echo

# Create test directory
TEST_DIR="judge_test_$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Test Java
echo "Testing Java execution..."
cat > HelloWorld.java << 'EOF'
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Java test successful");
    }
}
EOF

echo "Running Java test..."
../run_java.sh HelloWorld.java "" 5 128
echo "Java test completed."
echo

# Test Python
echo "Testing Python execution..."
cat > hello.py << 'EOF'
print("Hello, World!")
print("Python test successful")

# Test basic input/output
import sys
for line in sys.stdin:
    print(f"Echo: {line.strip()}")
    break
EOF

echo "test input" > input.txt
echo "Running Python test..."
../run_python.sh hello.py input.txt 5 128
echo "Python test completed."
echo

# Test C++
echo "Testing C++ execution..."
cat > hello.cpp << 'EOF'
#include <iostream>
#include <string>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "C++ test successful" << endl;
    
    string input;
    if (getline(cin, input)) {
        cout << "Echo: " << input << endl;
    }
    
    return 0;
}
EOF

echo "Running C++ test..."
../run_cpp.sh hello.cpp input.txt 5 128
echo "C++ test completed."
echo

# Test C
echo "Testing C execution..."
cat > hello.c << 'EOF'
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    printf("C test successful\n");
    
    char input[100];
    if (fgets(input, sizeof(input), stdin)) {
        printf("Echo: %s", input);
    }
    
    return 0;
}
EOF

echo "Running C test..."
../run_cpp.sh hello.c input.txt 5 128
echo "C test completed."
echo

# Test error conditions
echo "Testing error conditions..."

# Java compilation error
cat > BadJava.java << 'EOF'
public class BadJava {
    public static void main(String[] args) {
        System.out.println("Missing semicolon")
        // This should cause a compilation error
    }
}
EOF

echo "Testing Java compilation error..."
../run_java.sh BadJava.java "" 5 128 || echo "Java compilation error test passed."
echo

# Python syntax error
cat > bad_python.py << 'EOF'
print("Missing closing quote)
# This should cause a syntax error
EOF

echo "Testing Python syntax error..."
../run_python.sh bad_python.py "" 5 128 || echo "Python syntax error test passed."
echo

# C++ compilation error
cat > bad_cpp.cpp << 'EOF'
#include <iostream>
using namespace std;

int main() {
    cout << "Missing semicolon"
    // This should cause a compilation error
    return 0;
}
EOF

echo "Testing C++ compilation error..."
../run_cpp.sh bad_cpp.cpp "" 5 128 || echo "C++ compilation error test passed."
echo

# Cleanup
cd ..
rm -rf "$TEST_DIR"

echo "=== All tests completed successfully! ==="
echo
echo "To build and test the Docker image:"
echo "1. docker build -f Dockerfile.judge -t judge-executor:latest ."
echo "2. docker run --rm judge-executor:latest java -version"
echo "3. docker run --rm judge-executor:latest python3 --version"
echo "4. docker run --rm judge-executor:latest gcc --version"
