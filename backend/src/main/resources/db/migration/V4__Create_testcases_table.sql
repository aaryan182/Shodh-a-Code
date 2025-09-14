-- V4: Create test_cases table
-- This migration creates the test_cases table with proper constraints, indexes, and foreign keys

CREATE TABLE test_cases (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT NOT NULL,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT fk_test_cases_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    CONSTRAINT chk_test_cases_input_length CHECK (LENGTH(input) <= 10000),
    CONSTRAINT chk_test_cases_output_length CHECK (LENGTH(expected_output) <= 10000)
);

-- Indexes for performance
CREATE INDEX idx_test_cases_problem_id ON test_cases (problem_id);
CREATE INDEX idx_test_cases_is_hidden ON test_cases (is_hidden);
CREATE INDEX idx_test_cases_problem_hidden ON test_cases (problem_id, is_hidden);

-- Comments for documentation
COMMENT ON TABLE test_cases IS 'Test cases table storing input/output test cases for problems';
COMMENT ON COLUMN test_cases.id IS 'Primary key - auto-generated test case ID';
COMMENT ON COLUMN test_cases.problem_id IS 'Foreign key reference to problems table';
COMMENT ON COLUMN test_cases.input IS 'Test case input data (up to 10000 characters)';
COMMENT ON COLUMN test_cases.expected_output IS 'Expected output for the test case (up to 10000 characters)';
COMMENT ON COLUMN test_cases.is_hidden IS 'Whether this test case is hidden from users (default: false)';
