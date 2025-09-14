package com.codingcontest.platform.service;

import com.codingcontest.platform.dto.*;
import com.codingcontest.platform.entity.Contest;
import com.codingcontest.platform.entity.Problem;
import com.codingcontest.platform.entity.Submission;
import com.codingcontest.platform.entity.User;
import com.codingcontest.platform.exception.ContestNotFoundException;
import com.codingcontest.platform.repository.ContestRepository;
import com.codingcontest.platform.repository.ProblemRepository;
import com.codingcontest.platform.repository.SubmissionRepository;
import com.codingcontest.platform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.codingcontest.platform.config.CacheConfig.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service class for Contest-related business logic
 */
@Service
@Transactional(readOnly = true)
public class ContestService {
    
    private static final Logger logger = LoggerFactory.getLogger(ContestService.class);
    
    private final ContestRepository contestRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public ContestService(ContestRepository contestRepository,
                         ProblemRepository problemRepository,
                         SubmissionRepository submissionRepository,
                         UserRepository userRepository) {
        this.contestRepository = contestRepository;
        this.problemRepository = problemRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Get contest details with problems (with caching)
     * 
     * @param contestId the ID of the contest
     * @return ContestDetailsResponse with contest and problem information
     * @throws ContestNotFoundException if contest is not found
     */
    @Cacheable(value = CONTEST_DETAILS_CACHE, key = "#contestId", unless = "#result == null")
    public ContestDetailsResponse getContestDetails(Long contestId) {
        logger.debug("Fetching contest details for contest ID: {}", contestId);
        
        Contest contest = contestRepository.findById(contestId)
            .orElseThrow(() -> new ContestNotFoundException(contestId));
        
        List<Problem> problems = problemRepository.findByContestIdOrderByDifficulty(contestId);
        List<ProblemSummaryResponse> problemSummaries = problems.stream()
            .map(this::convertToProblemSummary)
            .collect(Collectors.toList());
        
        ContestDetailsResponse.ContestStatus status = determineContestStatus(contest);
        
        return new ContestDetailsResponse(
            contest.getId(),
            contest.getName(),
            contest.getDescription(),
            contest.getStartTime(),
            contest.getEndTime(),
            contest.getCreatedAt(),
            problemSummaries,
            status
        );
    }
    
    /**
     * Get problems for a specific contest
     * 
     * @param contestId the ID of the contest
     * @return List of detailed problem information
     * @throws ContestNotFoundException if contest is not found
     */
    public List<ProblemDetailResponse> getContestProblems(Long contestId) {
        logger.debug("Fetching problems for contest ID: {}", contestId);
        
        // Verify contest exists
        if (!contestRepository.existsById(contestId)) {
            throw new ContestNotFoundException(contestId);
        }
        
        List<Problem> problems = problemRepository.findByContestIdOrderByDifficulty(contestId);
        
        return problems.stream()
            .map(this::convertToProblemDetail)
            .collect(Collectors.toList());
    }
    
    /**
     * Get leaderboard for a specific contest (with caching)
     * 
     * @param contestId the ID of the contest
     * @return LeaderboardResponse with rankings
     * @throws ContestNotFoundException if contest is not found
     */
    @Cacheable(value = LEADERBOARD_CACHE, key = "#contestId", unless = "#result == null")
    public LeaderboardResponse getContestLeaderboard(Long contestId) {
        logger.debug("Fetching leaderboard for contest ID: {}", contestId);
        
        Contest contest = contestRepository.findById(contestId)
            .orElseThrow(() -> new ContestNotFoundException(contestId));
        
        // Get all submissions for the contest
        List<Submission> submissions = submissionRepository.findByContestIdOrderByScoreDesc(contestId);
        
        // Group submissions by user and calculate scores
        Map<Long, UserStats> userStatsMap = new HashMap<>();
        
        for (Submission submission : submissions) {
            Long userId = submission.getUserId();
            UserStats stats = userStatsMap.computeIfAbsent(userId, k -> new UserStats());
            
            stats.totalSubmissions++;
            
            // Only count the highest score per problem
            Integer currentScore = stats.problemScores.getOrDefault(submission.getProblemId(), 0);
            if (submission.getScore() != null && submission.getScore() > currentScore) {
                stats.problemScores.put(submission.getProblemId(), submission.getScore());
            }
            
            // Count accepted submissions
            if (Submission.SubmissionStatus.ACCEPTED.equals(submission.getStatus())) {
                stats.acceptedProblems.add(submission.getProblemId());
            }
        }
        
        // Convert to leaderboard entries and sort by total score
        List<LeaderboardResponse.LeaderboardEntry> entries = userStatsMap.entrySet().stream()
            .map(entry -> {
                Long userId = entry.getKey();
                UserStats stats = entry.getValue();
                
                // Get user information
                Optional<User> userOpt = userRepository.findById(userId);
                String username = userOpt.map(User::getUsername).orElse("Unknown");
                
                int totalScore = stats.problemScores.values().stream()
                    .mapToInt(Integer::intValue)
                    .sum();
                
                return new LeaderboardResponse.LeaderboardEntry(
                    0, // rank will be set later
                    userId,
                    username,
                    totalScore,
                    stats.acceptedProblems.size(),
                    (long) stats.totalSubmissions
                );
            })
            .sorted((a, b) -> {
                // Sort by total score descending, then by problems solved descending,
                // then by total submissions ascending (fewer attempts is better)
                int scoreComparison = Integer.compare(b.getTotalScore(), a.getTotalScore());
                if (scoreComparison != 0) return scoreComparison;
                
                int problemsComparison = Integer.compare(b.getProblemsSolved(), a.getProblemsSolved());
                if (problemsComparison != 0) return problemsComparison;
                
                return Long.compare(a.getTotalSubmissions(), b.getTotalSubmissions());
            })
            .collect(Collectors.toList());
        
        // Assign ranks
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }
        
        return new LeaderboardResponse(
            contest.getId(),
            contest.getName(),
            entries,
            entries.size()
        );
    }
    
    /**
     * Convert Problem entity to ProblemSummaryResponse
     */
    private ProblemSummaryResponse convertToProblemSummary(Problem problem) {
        // Get submission statistics for this problem
        List<Submission> problemSubmissions = submissionRepository
            .findByContestIdOrderByScoreDesc(problem.getContestId())
            .stream()
            .filter(s -> s.getProblemId().equals(problem.getId()))
            .collect(Collectors.toList());
        
        int totalSubmissions = problemSubmissions.size();
        int acceptedSubmissions = (int) problemSubmissions.stream()
            .filter(s -> Submission.SubmissionStatus.ACCEPTED.equals(s.getStatus()))
            .count();
        
        return new ProblemSummaryResponse(
            problem.getId(),
            problem.getTitle(),
            problem.getDifficulty(),
            problem.getTimeLimit(),
            problem.getMemoryLimit(),
            totalSubmissions,
            acceptedSubmissions
        );
    }
    
    /**
     * Convert Problem entity to ProblemDetailResponse
     */
    private ProblemDetailResponse convertToProblemDetail(Problem problem) {
        // Get submission statistics for this problem
        List<Submission> problemSubmissions = submissionRepository
            .findByContestIdOrderByScoreDesc(problem.getContestId())
            .stream()
            .filter(s -> s.getProblemId().equals(problem.getId()))
            .collect(Collectors.toList());
        
        int totalSubmissions = problemSubmissions.size();
        int acceptedSubmissions = (int) problemSubmissions.stream()
            .filter(s -> Submission.SubmissionStatus.ACCEPTED.equals(s.getStatus()))
            .count();
        
        return new ProblemDetailResponse(
            problem.getId(),
            problem.getTitle(),
            problem.getDescription(),
            problem.getDifficulty(),
            problem.getTimeLimit(),
            problem.getMemoryLimit(),
            problem.getInputFormat(),
            problem.getOutputFormat(),
            problem.getConstraints(),
            totalSubmissions,
            acceptedSubmissions
        );
    }
    
    /**
     * Determine the current status of a contest
     */
    private ContestDetailsResponse.ContestStatus determineContestStatus(Contest contest) {
        LocalDateTime now = LocalDateTime.now();
        
        if (now.isBefore(contest.getStartTime())) {
            return ContestDetailsResponse.ContestStatus.UPCOMING;
        } else if (now.isAfter(contest.getEndTime())) {
            return ContestDetailsResponse.ContestStatus.ENDED;
        } else {
            return ContestDetailsResponse.ContestStatus.ACTIVE;
        }
    }
    
    /**
     * Helper class to track user statistics for leaderboard calculation
     */
    private static class UserStats {
        int totalSubmissions = 0;
        Map<Long, Integer> problemScores = new HashMap<>(); // problemId -> best score
        Set<Long> acceptedProblems = new HashSet<>();
    }
}
