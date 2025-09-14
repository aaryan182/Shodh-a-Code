package com.codingcontest.platform.repository;

import com.codingcontest.platform.entity.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Submission entity
 * Provides CRUD operations and custom query methods for Submission entities
 */
@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    /**
     * Finds all submissions by a specific user in a specific contest
     * 
     * @param userId the ID of the user
     * @param contestId the ID of the contest
     * @return List of submissions by the user in the contest
     */
    List<Submission> findByUserIdAndContestId(Long userId, Long contestId);

    /**
     * Finds all submissions in a contest ordered by score in descending order
     * This is useful for leaderboards and rankings
     * 
     * @param contestId the ID of the contest
     * @return List of submissions ordered by score (highest first)
     */
    List<Submission> findByContestIdOrderByScoreDesc(Long contestId);

    /**
     * Finds a submission by ID that belongs to a specific user
     * This ensures users can only access their own submissions
     * 
     * @param id the submission ID
     * @param userId the ID of the user
     * @return Optional containing the submission if found and belongs to user, empty otherwise
     */
    Optional<Submission> findByIdAndUserId(Long id, Long userId);
    
    /**
     * Finds all submissions for a specific contest and problem
     * 
     * @param contestId the ID of the contest
     * @param problemId the ID of the problem
     * @return List of submissions for the contest and problem
     */
    List<Submission> findByContestIdAndProblemId(Long contestId, Long problemId);
    
    /**
     * Finds all submissions by a specific user ordered by submission time descending
     * 
     * @param userId the ID of the user
     * @return List of submissions by the user ordered by most recent first
     */
    List<Submission> findByUserIdOrderBySubmittedAtDesc(Long userId);
    
    /**
     * Finds all submissions by a specific user
     * 
     * @param userId the ID of the user
     * @return List of submissions by the user
     */
    List<Submission> findByUserId(Long userId);
    
    // ===============================
    // OPTIMIZED QUERIES FOR PERFORMANCE
    // ===============================
    
    /**
     * Optimized leaderboard query that aggregates user scores per contest
     * Uses the performance indexes for fast execution
     */
    @Query("""
        SELECT s.userId, s.contestId, 
               SUM(CASE WHEN s.status = 'ACCEPTED' THEN 1 ELSE 0 END) as problemsSolved,
               COUNT(s.id) as totalSubmissions,
               MAX(s.score) as maxScore,
               SUM(s.score) as totalScore
        FROM Submission s 
        WHERE s.contestId = :contestId 
        GROUP BY s.userId, s.contestId
        ORDER BY totalScore DESC, problemsSolved DESC, totalSubmissions ASC
        """)
    List<Object[]> getLeaderboardData(@Param("contestId") Long contestId);
    
    /**
     * Get best submissions per user per problem for leaderboard calculation
     * This query is optimized with proper indexes
     */
    @Query("""
        SELECT s FROM Submission s 
        WHERE s.contestId = :contestId 
        AND s.score = (
            SELECT MAX(s2.score) 
            FROM Submission s2 
            WHERE s2.contestId = s.contestId 
            AND s2.userId = s.userId 
            AND s2.problemId = s.problemId
        )
        ORDER BY s.score DESC, s.submittedAt ASC
        """)
    List<Submission> getBestSubmissionsPerUserPerProblem(@Param("contestId") Long contestId);
    
    /**
     * Paginated submission history with filtering
     */
    @Query("""
        SELECT s FROM Submission s 
        WHERE (:userId IS NULL OR s.userId = :userId)
        AND (:contestId IS NULL OR s.contestId = :contestId)
        AND (:problemId IS NULL OR s.problemId = :problemId)
        AND (:status IS NULL OR s.status = :status)
        ORDER BY s.submittedAt DESC
        """)
    Page<Submission> findSubmissionsWithFilters(
        @Param("userId") Long userId,
        @Param("contestId") Long contestId, 
        @Param("problemId") Long problemId,
        @Param("status") Submission.SubmissionStatus status,
        Pageable pageable
    );
    
    /**
     * Get submission statistics for a problem
     */
    @Query("""
        SELECT s.status, COUNT(s.id) 
        FROM Submission s 
        WHERE s.problemId = :problemId 
        GROUP BY s.status
        """)
    List<Object[]> getProblemStatistics(@Param("problemId") Long problemId);
    
    /**
     * Get user's submission statistics for a contest
     */
    @Query("""
        SELECT COUNT(DISTINCT s.problemId) as problemsAttempted,
               SUM(CASE WHEN s.status = 'ACCEPTED' THEN 1 ELSE 0 END) as problemsSolved,
               COUNT(s.id) as totalSubmissions,
               MAX(s.score) as bestScore
        FROM Submission s 
        WHERE s.userId = :userId AND s.contestId = :contestId
        """)
    Object[] getUserContestStatistics(@Param("userId") Long userId, @Param("contestId") Long contestId);
    
    /**
     * Find submissions that are currently being processed (for monitoring)
     */
    @Query("""
        SELECT s FROM Submission s 
        WHERE s.status IN ('PENDING', 'QUEUED', 'RUNNING')
        ORDER BY s.submittedAt ASC
        """)
    List<Submission> findProcessingSubmissions();
    
    /**
     * Get recent submissions for a contest (for real-time updates)
     */
    @Query("""
        SELECT s FROM Submission s 
        WHERE s.contestId = :contestId 
        AND s.submittedAt >= :since
        ORDER BY s.submittedAt DESC
        """)
    List<Submission> getRecentSubmissions(
        @Param("contestId") Long contestId, 
        @Param("since") java.time.LocalDateTime since
    );
    
    /**
     * Count submissions by language for statistics
     */
    @Query("""
        SELECT s.language, COUNT(s.id) 
        FROM Submission s 
        WHERE s.contestId = :contestId 
        GROUP BY s.language 
        ORDER BY COUNT(s.id) DESC
        """)
    List<Object[]> getLanguageStatistics(@Param("contestId") Long contestId);
    
    /**
     * Find user's best submission for a specific problem
     */
    @Query("""
        SELECT s FROM Submission s 
        WHERE s.userId = :userId 
        AND s.problemId = :problemId 
        AND s.score = (
            SELECT MAX(s2.score) 
            FROM Submission s2 
            WHERE s2.userId = :userId AND s2.problemId = :problemId
        )
        ORDER BY s.submittedAt DESC
        LIMIT 1
        """)
    Optional<Submission> findBestUserSubmissionForProblem(
        @Param("userId") Long userId, 
        @Param("problemId") Long problemId
    );
}
