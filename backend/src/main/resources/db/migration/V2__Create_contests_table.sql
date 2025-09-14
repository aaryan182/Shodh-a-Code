-- V2: Create contests table
-- This migration creates the contests table with proper constraints and indexes

CREATE TABLE contests (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_contests_name_length CHECK (LENGTH(name) >= 1),
    CONSTRAINT chk_contests_description_length CHECK (description IS NULL OR LENGTH(description) <= 5000),
    CONSTRAINT chk_contests_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_contests_start_time_future CHECK (start_time >= created_at)
);

-- Indexes for performance
CREATE INDEX idx_contests_name ON contests (name);
CREATE INDEX idx_contests_start_time ON contests (start_time);
CREATE INDEX idx_contests_end_time ON contests (end_time);
CREATE INDEX idx_contests_created_at ON contests (created_at);
CREATE INDEX idx_contests_active ON contests (start_time, end_time) WHERE start_time <= CURRENT_TIMESTAMP AND end_time >= CURRENT_TIMESTAMP;

-- Comments for documentation
COMMENT ON TABLE contests IS 'Contests table storing coding contest information';
COMMENT ON COLUMN contests.id IS 'Primary key - auto-generated contest ID';
COMMENT ON COLUMN contests.name IS 'Contest name (1-100 characters)';
COMMENT ON COLUMN contests.description IS 'Contest description (up to 5000 characters)';
COMMENT ON COLUMN contests.start_time IS 'Contest start timestamp';
COMMENT ON COLUMN contests.end_time IS 'Contest end timestamp (must be after start_time)';
COMMENT ON COLUMN contests.created_at IS 'Timestamp when the contest was created';
