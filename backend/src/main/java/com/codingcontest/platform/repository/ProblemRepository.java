package com.codingcontest.platform.repository;

import com.codingcontest.platform.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Problem entity
 * Provides CRUD operations and custom query methods for Problem entities
 */
@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {

    /**
     * Finds all problems belonging to a specific contest
     * 
     * @param contestId the ID of the contest
     * @return List of problems in the contest
     */
    List<Problem> findByContestId(Long contestId);

    /**
     * Finds all problems belonging to a specific contest ordered by difficulty
     * Order: EASY, MEDIUM, HARD (based on enum ordinal)
     * 
     * @param contestId the ID of the contest
     * @return List of problems in the contest ordered by difficulty
     */
    List<Problem> findByContestIdOrderByDifficulty(Long contestId);
}
