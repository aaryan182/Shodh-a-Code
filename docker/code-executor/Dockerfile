# Multi-stage build for code execution environment
# Base stage with common tools
FROM ubuntu:22.04 AS base

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Update and install basic tools
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    vim \
    nano \
    htop \
    tree \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Java Development Kit (OpenJDK 17)
FROM base AS java-stage
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    maven \
    gradle \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# Python environment
FROM java-stage AS python-stage
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for python command
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install common Python packages
RUN pip3 install --no-cache-dir \
    numpy \
    pandas \
    requests \
    flask \
    django \
    fastapi \
    pytest \
    black \
    flake8 \
    mypy

# Node.js environment
FROM python-stage AS nodejs-stage
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    typescript \
    ts-node \
    nodemon \
    eslint \
    prettier \
    jest \
    webpack \
    webpack-cli

# C/C++ environment
FROM nodejs-stage AS cpp-stage
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    gdb \
    cmake \
    make \
    valgrind \
    && rm -rf /var/lib/apt/lists/*

# Go environment
FROM cpp-stage AS go-stage
RUN wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz \
    && rm go1.21.5.linux-amd64.tar.gz

ENV PATH=$PATH:/usr/local/go/bin
ENV GOPATH=/go
ENV GOBIN=$GOPATH/bin
RUN mkdir -p $GOPATH/src $GOPATH/bin

# Rust environment
FROM go-stage AS rust-stage
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Final stage - code executor
FROM rust-stage AS executor

# Create execution user for security
RUN groupadd -r coderunner && useradd -r -g coderunner coderunner

# Create directories for code execution
RUN mkdir -p /app/workspace /app/submissions /app/results \
    && chown -R coderunner:coderunner /app

# Create temporary execution directory
RUN mkdir -p /tmp/code-execution \
    && chown -R coderunner:coderunner /tmp/code-execution

# Install additional security tools
RUN apt-get update && apt-get install -y \
    firejail \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy execution scripts
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh \
    && chown -R coderunner:coderunner /app/scripts

# Environment variables for language versions
ENV JAVA_VERSION=17
ENV PYTHON_VERSION=3.10
ENV NODE_VERSION=18
ENV GO_VERSION=1.21.5

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python3 --version && java --version && node --version && go version || exit 1

# Switch to non-root user
USER coderunner

# Default command
CMD ["/bin/bash"]
