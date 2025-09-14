// Application constants

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',

  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,

  // Contests
  CONTESTS: '/contests',
  CONTEST_BY_ID: (id: string) => `/contests/${id}`,
  JOIN_CONTEST: (id: string) => `/contests/${id}/join`,
  LEAVE_CONTEST: (id: string) => `/contests/${id}/leave`,
  CONTEST_LEADERBOARD: (id: string) => `/contests/${id}/leaderboard`,

  // Problems
  PROBLEMS: '/problems',
  PROBLEM_BY_ID: (id: string) => `/problems/${id}`,
  CONTEST_PROBLEMS: (contestId: string) => `/contests/${contestId}/problems`,

  // Submissions
  SUBMISSIONS: '/submissions',
  SUBMISSION_BY_ID: (id: string) => `/submissions/${id}`,
  SUBMIT_SOLUTION: '/submissions/submit',
  USER_SUBMISSIONS: (userId: string) => `/users/${userId}/submissions`,
  PROBLEM_SUBMISSIONS: (problemId: string) => `/problems/${problemId}/submissions`,

  // Health
  HEALTH: '/health',
} as const;

export const PROGRAMMING_LANGUAGES = [
  { value: 'java', label: 'Java', extension: '.java' },
  { value: 'python', label: 'Python', extension: '.py' },
  { value: 'cpp', label: 'C++', extension: '.cpp' },
  { value: 'c', label: 'C', extension: '.c' },
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
  { value: 'typescript', label: 'TypeScript', extension: '.ts' },
  { value: 'go', label: 'Go', extension: '.go' },
  { value: 'rust', label: 'Rust', extension: '.rs' },
] as const;

export const DIFFICULTY_COLORS = {
  easy: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  medium: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
  hard: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
} as const;

export const STATUS_COLORS = {
  pending: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20',
  running: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
  accepted: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  wrong_answer: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
  time_limit_exceeded: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20',
  compilation_error: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
  runtime_error: 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/20',
} as const;

export const CONTEST_STATUS_COLORS = {
  upcoming: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
  active: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  ended: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20',
} as const;

export const DEFAULT_CODE_TEMPLATES = {
  java: `public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}`,
  python: `# Your code here
def main():
    pass

if __name__ == "__main__":
    main()`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`,
  javascript: `// Your code here
function main() {
    
}

main();`,
  typescript: `// Your code here
function main(): void {
    
}

main();`,
  go: `package main

import "fmt"

func main() {
    // Your code here
}`,
  rust: `fn main() {
    // Your code here
}`,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const VALIDATION = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_CODE_LENGTH: 50000,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE_PREFERENCE: 'language_preference',
} as const;
