#!/bin/bash

# Health check script for code executor
# Verifies all required languages and tools are available

set -e

echo "Checking code execution environment..."

# Check Java
echo -n "Java: "
java --version | head -n 1

# Check Python
echo -n "Python: "
python3 --version

# Check Node.js
echo -n "Node.js: "
node --version

# Check Go
echo -n "Go: "
go version

# Check Rust
echo -n "Rust: "
rustc --version

# Check C/C++ compilers
echo -n "GCC: "
gcc --version | head -n 1

echo -n "G++: "
g++ --version | head -n 1

# Check security tools
echo -n "Firejail: "
firejail --version | head -n 1

echo "All language environments are ready!"
exit 0
