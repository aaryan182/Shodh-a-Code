-- V1: Create users table
-- This migration creates the users table with proper constraints and indexes

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT chk_users_username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
    CONSTRAINT chk_users_email_format CHECK (email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_created_at ON users (created_at);

-- Comments for documentation
COMMENT ON TABLE users IS 'Users table storing user account information';
COMMENT ON COLUMN users.id IS 'Primary key - auto-generated user ID';
COMMENT ON COLUMN users.username IS 'Unique username (3-50 characters, alphanumeric and underscore only)';
COMMENT ON COLUMN users.email IS 'Unique email address';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';
