-- V7: Add performance indexes for optimized queries
-- This migration adds additional indexes to improve query performance for frequently accessed data

-- Leaderboard query optimization indexes
-- These indexes support the complex leaderboard queries that group by user and calculate scores
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_contest_user_score ON submissions (contest_id, user_id, score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_contest_problem_user ON submissions (contest_id, problem_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_contest_status ON submissions (user_id, contest_id, status);

-- Submission history and filtering indexes
-- Support filtering by user, problem, and status combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_submitted_at ON submissions (user_id, submitted_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_problem_submitted_at ON submissions (problem_id, submitted_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_contest_status_submitted_at ON submissions (contest_id, status, submitted_at DESC);

-- Contest and problem query optimization
-- Support active contest queries and problem lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_status_start_end ON contests (start_time, end_time) WHERE start_time <= CURRENT_TIMESTAMP AND end_time >= CURRENT_TIMESTAMP;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_contest_id ON problems (contest_id);

-- Performance metrics indexes
-- Support execution time and memory usage analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_execution_metrics ON submissions (execution_time, memory_used) WHERE execution_time IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_language_status ON submissions (language, status);

-- User activity indexes
-- Support user statistics and activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_username ON users (created_at DESC, username);

-- Test case optimization
-- Support test case retrieval for problems
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testcases_problem_id_order ON testcases (problem_id, id);

-- Composite indexes for complex queries
-- These support the most common query patterns in the application
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_leaderboard_query ON submissions (contest_id, status, score DESC, user_id, problem_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_activity ON submissions (user_id, status, submitted_at DESC, contest_id);

-- Partial indexes for specific use cases
-- Only index accepted submissions for performance statistics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_accepted_only ON submissions (contest_id, problem_id, user_id, score) WHERE status = 'ACCEPTED';

-- Index for pending/running submissions (real-time status updates)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_processing ON submissions (status, submitted_at) WHERE status IN ('PENDING', 'QUEUED', 'RUNNING');

-- Comments for documentation
COMMENT ON INDEX idx_submissions_contest_user_score IS 'Optimizes leaderboard queries by contest and user with score ordering';
COMMENT ON INDEX idx_submissions_contest_problem_user IS 'Supports problem-specific user submission lookups';
COMMENT ON INDEX idx_submissions_user_contest_status IS 'Optimizes user submission history with status filtering';
COMMENT ON INDEX idx_submissions_user_submitted_at IS 'Supports user submission timeline queries';
COMMENT ON INDEX idx_submissions_problem_submitted_at IS 'Optimizes problem submission history';
COMMENT ON INDEX idx_submissions_contest_status_submitted_at IS 'Supports contest submission filtering with time ordering';
COMMENT ON INDEX idx_contests_status_start_end IS 'Optimizes active contest queries';
COMMENT ON INDEX idx_problems_contest_id IS 'Supports problem lookups by contest';
COMMENT ON INDEX idx_submissions_execution_metrics IS 'Optimizes performance analysis queries';
COMMENT ON INDEX idx_submissions_language_status IS 'Supports language-specific statistics';
COMMENT ON INDEX idx_users_created_at_username IS 'Optimizes user listing with creation time ordering';
COMMENT ON INDEX idx_testcases_problem_id_order IS 'Optimizes test case retrieval for problems';
COMMENT ON INDEX idx_submissions_leaderboard_query IS 'Composite index for complex leaderboard calculations';
COMMENT ON INDEX idx_submissions_user_activity IS 'Optimizes user activity and history queries';
COMMENT ON INDEX idx_submissions_accepted_only IS 'Partial index for accepted submissions only';
COMMENT ON INDEX idx_submissions_processing IS 'Partial index for real-time submission status tracking';
