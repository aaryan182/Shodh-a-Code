-- V5: Create submissions table
-- This migration creates the submissions table with proper constraints, indexes, and foreign keys

CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    contest_id BIGINT NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    result VARCHAR(500),
    score INTEGER DEFAULT 0,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INTEGER,
    memory_used INTEGER,
    
    -- Constraints
    CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_contest FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    CONSTRAINT chk_submissions_code_length CHECK (LENGTH(code) >= 1 AND LENGTH(code) <= 50000),
    CONSTRAINT chk_submissions_language CHECK (language IN ('JAVA', 'PYTHON', 'CPP', 'C', 'JAVASCRIPT', 'GO', 'RUST')),
    CONSTRAINT chk_submissions_status CHECK (status IN ('PENDING', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'PRESENTATION_ERROR', 'SYSTEM_ERROR')),
    CONSTRAINT chk_submissions_result_length CHECK (result IS NULL OR LENGTH(result) <= 500),
    CONSTRAINT chk_submissions_score CHECK (score >= 0),
    CONSTRAINT chk_submissions_execution_time CHECK (execution_time IS NULL OR execution_time >= 0),
    CONSTRAINT chk_submissions_memory_used CHECK (memory_used IS NULL OR memory_used >= 0)
);

-- Indexes for performance
CREATE INDEX idx_submissions_user_id ON submissions (user_id);
CREATE INDEX idx_submissions_problem_id ON submissions (problem_id);
CREATE INDEX idx_submissions_contest_id ON submissions (contest_id);
CREATE INDEX idx_submissions_status ON submissions (status);
CREATE INDEX idx_submissions_language ON submissions (language);
CREATE INDEX idx_submissions_submitted_at ON submissions (submitted_at);
CREATE INDEX idx_submissions_score ON submissions (score);
CREATE INDEX idx_submissions_user_contest ON submissions (user_id, contest_id);
CREATE INDEX idx_submissions_user_problem ON submissions (user_id, problem_id);
CREATE INDEX idx_submissions_contest_problem ON submissions (contest_id, problem_id);
CREATE INDEX idx_submissions_user_status ON submissions (user_id, status);

-- Comments for documentation
COMMENT ON TABLE submissions IS 'Submissions table storing code submissions for problems';
COMMENT ON COLUMN submissions.id IS 'Primary key - auto-generated submission ID';
COMMENT ON COLUMN submissions.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN submissions.problem_id IS 'Foreign key reference to problems table';
COMMENT ON COLUMN submissions.contest_id IS 'Foreign key reference to contests table';
COMMENT ON COLUMN submissions.code IS 'Submitted code (1-50000 characters)';
COMMENT ON COLUMN submissions.language IS 'Programming language used';
COMMENT ON COLUMN submissions.status IS 'Submission status (default: PENDING)';
COMMENT ON COLUMN submissions.result IS 'Submission result message (up to 500 characters)';
COMMENT ON COLUMN submissions.score IS 'Score achieved (default: 0, minimum: 0)';
COMMENT ON COLUMN submissions.submitted_at IS 'Timestamp when the submission was made';
COMMENT ON COLUMN submissions.execution_time IS 'Execution time in milliseconds (minimum: 0)';
COMMENT ON COLUMN submissions.memory_used IS 'Memory used in KB (minimum: 0)';
