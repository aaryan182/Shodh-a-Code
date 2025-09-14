package com.codingcontest.platform.dto;

import java.util.List;

/**
 * Response DTO for contest leaderboard
 */
public class LeaderboardResponse {
    
    private Long contestId;
    private String contestName;
    private List<LeaderboardEntry> entries;
    private Integer totalParticipants;
    
    // Default constructor
    public LeaderboardResponse() {}
    
    // Constructor with all fields
    public LeaderboardResponse(Long contestId, String contestName, 
                             List<LeaderboardEntry> entries, Integer totalParticipants) {
        this.contestId = contestId;
        this.contestName = contestName;
        this.entries = entries;
        this.totalParticipants = totalParticipants;
    }
    
    // Getters and Setters
    public Long getContestId() {
        return contestId;
    }
    
    public void setContestId(Long contestId) {
        this.contestId = contestId;
    }
    
    public String getContestName() {
        return contestName;
    }
    
    public void setContestName(String contestName) {
        this.contestName = contestName;
    }
    
    public List<LeaderboardEntry> getEntries() {
        return entries;
    }
    
    public void setEntries(List<LeaderboardEntry> entries) {
        this.entries = entries;
    }
    
    public Integer getTotalParticipants() {
        return totalParticipants;
    }
    
    public void setTotalParticipants(Integer totalParticipants) {
        this.totalParticipants = totalParticipants;
    }
    
    /**
     * Inner class representing a single leaderboard entry
     */
    public static class LeaderboardEntry {
        private Integer rank;
        private Long userId;
        private String username;
        private Integer totalScore;
        private Integer problemsSolved;
        private Long totalSubmissions;
        
        // Default constructor
        public LeaderboardEntry() {}
        
        // Constructor with all fields
        public LeaderboardEntry(Integer rank, Long userId, String username, 
                              Integer totalScore, Integer problemsSolved, 
                              Long totalSubmissions) {
            this.rank = rank;
            this.userId = userId;
            this.username = username;
            this.totalScore = totalScore;
            this.problemsSolved = problemsSolved;
            this.totalSubmissions = totalSubmissions;
        }
        
        // Getters and Setters
        public Integer getRank() {
            return rank;
        }
        
        public void setRank(Integer rank) {
            this.rank = rank;
        }
        
        public Long getUserId() {
            return userId;
        }
        
        public void setUserId(Long userId) {
            this.userId = userId;
        }
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public Integer getTotalScore() {
            return totalScore;
        }
        
        public void setTotalScore(Integer totalScore) {
            this.totalScore = totalScore;
        }
        
        public Integer getProblemsSolved() {
            return problemsSolved;
        }
        
        public void setProblemsSolved(Integer problemsSolved) {
            this.problemsSolved = problemsSolved;
        }
        
        public Long getTotalSubmissions() {
            return totalSubmissions;
        }
        
        public void setTotalSubmissions(Long totalSubmissions) {
            this.totalSubmissions = totalSubmissions;
        }
    }
}
