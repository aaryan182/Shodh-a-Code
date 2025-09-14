package com.codingcontest.platform.repository;

import com.codingcontest.platform.entity.Contest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Contest entity
 * Provides CRUD operations and custom query methods for Contest entities
 */
@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {

    /**
     * Finds a contest by ID where the start time is before the specified time
     * This is useful for checking if a contest has already started
     * 
     * @param id the contest ID
     * @param currentTime the time to compare against start time
     * @return Optional containing the contest if found and started, empty otherwise
     */
    Optional<Contest> findByIdAndStartTimeBefore(Long id, LocalDateTime currentTime);

    /**
     * Finds all active contests (contests that have started but not ended)
     * 
     * @param currentTime the current time to compare against start and end times
     * @return List of active contests
     */
    @Query("SELECT c FROM Contest c WHERE c.startTime <= :currentTime AND c.endTime >= :currentTime")
    List<Contest> findActiveContests(@Param("currentTime") LocalDateTime currentTime);
}
