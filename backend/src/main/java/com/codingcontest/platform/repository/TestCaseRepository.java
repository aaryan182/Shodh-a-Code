package com.codingcontest.platform.repository;

import com.codingcontest.platform.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for TestCase entity
 * Provides CRUD operations and custom query methods for TestCase entities
 */
@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {

    /**
     * Finds all test cases for a specific problem
     * 
     * @param problemId the ID of the problem
     * @return List of test cases for the problem
     */
    List<TestCase> findByProblemId(Long problemId);

    /**
     * Finds test cases for a specific problem filtered by visibility
     * 
     * @param problemId the ID of the problem
     * @param isHidden whether to find hidden or visible test cases
     * @return List of test cases matching the visibility criteria
     */
    List<TestCase> findByProblemIdAndIsHidden(Long problemId, Boolean isHidden);
}
