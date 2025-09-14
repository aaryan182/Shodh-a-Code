-- V3: Create problems table
-- This migration creates the problems table with proper constraints, indexes, and foreign keys

CREATE TABLE problems (
    id BIGSERIAL PRIMARY KEY,
    contest_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(10) NOT NULL,
    time_limit INTEGER NOT NULL,
    memory_limit INTEGER NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    
    -- Constraints
    CONSTRAINT fk_problems_contest FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    CONSTRAINT chk_problems_title_length CHECK (LENGTH(title) >= 1),
    CONSTRAINT chk_problems_description_length CHECK (LENGTH(description) >= 1 AND LENGTH(description) <= 10000),
    CONSTRAINT chk_problems_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    CONSTRAINT chk_problems_time_limit CHECK (time_limit >= 1),
    CONSTRAINT chk_problems_memory_limit CHECK (memory_limit >= 1),
    CONSTRAINT chk_problems_input_format_length CHECK (input_format IS NULL OR LENGTH(input_format) <= 2000),
    CONSTRAINT chk_problems_output_format_length CHECK (output_format IS NULL OR LENGTH(output_format) <= 2000),
    CONSTRAINT chk_problems_constraints_length CHECK (constraints IS NULL OR LENGTH(constraints) <= 2000)
);

-- Indexes for performance
CREATE INDEX idx_problems_contest_id ON problems (contest_id);
CREATE INDEX idx_problems_title ON problems (title);
CREATE INDEX idx_problems_difficulty ON problems (difficulty);
CREATE INDEX idx_problems_time_limit ON problems (time_limit);
CREATE INDEX idx_problems_memory_limit ON problems (memory_limit);
CREATE INDEX idx_problems_contest_difficulty ON problems (contest_id, difficulty);

-- Comments for documentation
COMMENT ON TABLE problems IS 'Problems table storing coding problems for contests';
COMMENT ON COLUMN problems.id IS 'Primary key - auto-generated problem ID';
COMMENT ON COLUMN problems.contest_id IS 'Foreign key reference to contests table';
COMMENT ON COLUMN problems.title IS 'Problem title (1-200 characters)';
COMMENT ON COLUMN problems.description IS 'Problem description (1-10000 characters)';
COMMENT ON COLUMN problems.difficulty IS 'Problem difficulty level (EASY, MEDIUM, HARD)';
COMMENT ON COLUMN problems.time_limit IS 'Time limit in seconds (minimum 1)';
COMMENT ON COLUMN problems.memory_limit IS 'Memory limit in MB (minimum 1)';
COMMENT ON COLUMN problems.input_format IS 'Input format description (up to 2000 characters)';
COMMENT ON COLUMN problems.output_format IS 'Output format description (up to 2000 characters)';
COMMENT ON COLUMN problems.constraints IS 'Problem constraints description (up to 2000 characters)';
