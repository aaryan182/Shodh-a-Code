import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios'
import {
  ApiResponse,
  ApiError,
  ContestDetailsResponse,
  LeaderboardResponse,
  ProblemDetailResponse,
  SubmissionRequest,
  SubmissionResponse,
  SubmissionStatusResponse,
  TestCaseResult,
  UserRegistrationRequest,
  UserResponse,
} from '../types'

// Extend AxiosRequestConfig to include metadata for request timing
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
  }
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 30000, // Increased timeout for code execution
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      })
    }

    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const duration = response.config.metadata?.startTime
      ? new Date().getTime() - response.config.metadata.startTime.getTime()
      : 0

    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`,
        {
          status: response.status,
          data: response.data,
        }
      )
    }

    return response
  },
  (error: AxiosError) => {
    // Calculate request duration
    const duration = error.config?.metadata?.startTime
      ? new Date().getTime() - error.config.metadata.startTime.getTime()
      : 0

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`,
        {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
        }
      )
    }

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// Error transformation utility
const transformError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    return {
      message:
        error.response.data?.message ||
        error.response.statusText ||
        'Server error',
      status: error.response.status,
      code: error.response.data?.code,
      details: error.response.data,
    }
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error - please check your connection',
      status: 0,
      code: 'NETWORK_ERROR',
    }
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    }
  }
}

// Response transformation utility
const transformResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data
}

// Generic API methods
export const apiClient = {
  get: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    try {
      const response = await api.get<T>(url, config)
      return transformResponse(response)
    } catch (error: any) {
      throw transformError(error)
    }
  },

  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    try {
      const response = await api.post<T>(url, data, config)
      return transformResponse(response)
    } catch (error: any) {
      throw transformError(error)
    }
  },

  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    try {
      const response = await api.put<T>(url, data, config)
      return transformResponse(response)
    } catch (error: any) {
      throw transformError(error)
    }
  },

  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    try {
      const response = await api.patch<T>(url, data, config)
      return transformResponse(response)
    } catch (error: any) {
      throw transformError(error)
    }
  },

  delete: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    try {
      const response = await api.delete<T>(url, config)
      return transformResponse(response)
    } catch (error: any) {
      throw transformError(error)
    }
  },
}

// Specific API methods based on backend endpoints
export const contestAPI = {
  /**
   * Get contest details with problems
   */
  getContest: async (contestId: number): Promise<ContestDetailsResponse> => {
    return apiClient.get<ContestDetailsResponse>(`/contests/${contestId}`)
  },

  /**
   * Get contest problems
   */
  getContestProblems: async (
    contestId: number
  ): Promise<ProblemDetailResponse[]> => {
    return apiClient.get<ProblemDetailResponse[]>(
      `/contests/${contestId}/problems`
    )
  },

  /**
   * Get contest leaderboard
   */
  getLeaderboard: async (contestId: number): Promise<LeaderboardResponse> => {
    return apiClient.get<LeaderboardResponse>(
      `/contests/${contestId}/leaderboard`
    )
  },

  /**
   * Join a contest
   */
  joinContest: async (
    contestId: number,
    userId: number
  ): Promise<UserResponse> => {
    return apiClient.post<UserResponse>(`/contests/${contestId}/join`, null, {
      params: { userId },
    })
  },
}

export const submissionAPI = {
  /**
   * Submit code for evaluation
   */
  submitCode: async (
    submissionData: SubmissionRequest
  ): Promise<SubmissionResponse> => {
    return apiClient.post<SubmissionResponse>('/submissions', submissionData)
  },

  /**
   * Get submission status
   */
  getSubmissionStatus: async (
    submissionId: number
  ): Promise<SubmissionStatusResponse> => {
    return apiClient.get<SubmissionStatusResponse>(
      `/submissions/${submissionId}`
    )
  },

  /**
   * Get detailed submission information
   */
  getSubmissionDetails: async (
    submissionId: number
  ): Promise<SubmissionResponse> => {
    return apiClient.get<SubmissionResponse>(
      `/submissions/${submissionId}/details`
    )
  },

  /**
   * Get user's submission history
   */
  getUserSubmissions: async (userId: number): Promise<SubmissionResponse[]> => {
    return apiClient.get<SubmissionResponse[]>(`/users/${userId}/submissions`)
  },

  /**
   * Get submission history for a specific problem
   */
  getProblemSubmissions: async (
    problemId: number,
    userId?: number
  ): Promise<SubmissionResponse[]> => {
    const params = userId ? { userId } : {}
    return apiClient.get<SubmissionResponse[]>(
      `/problems/${problemId}/submissions`,
      { params }
    )
  },

  /**
   * Get submission with full details including code and test results
   */
  getSubmissionWithDetails: async (
    submissionId: number
  ): Promise<SubmissionResponse> => {
    return apiClient.get<SubmissionResponse>(
      `/submissions/${submissionId}/full`
    )
  },

  /**
   * Get test case results for a submission
   */
  getTestCaseResults: async (
    submissionId: number
  ): Promise<TestCaseResult[]> => {
    return apiClient.get<TestCaseResult[]>(
      `/submissions/${submissionId}/test-results`
    )
  },
}

export const userAPI = {
  /**
   * Register a new user
   */
  registerUser: async (
    userData: UserRegistrationRequest
  ): Promise<UserResponse> => {
    return apiClient.post<UserResponse>('/users/register', userData)
  },

  /**
   * Get user profile
   */
  getUserProfile: async (userId: number): Promise<UserResponse> => {
    return apiClient.get<UserResponse>(`/users/${userId}`)
  },

  /**
   * Authenticate user (simple prototype)
   */
  authenticateUser: async (username: string): Promise<UserResponse> => {
    return apiClient.post<UserResponse>('/users/auth', null, {
      params: { username },
    })
  },
}

// Health check utilities
export const healthAPI = {
  /**
   * Check API health
   */
  checkHealth: async (): Promise<string> => {
    return apiClient.get<string>('/health')
  },

  /**
   * Check contest controller health
   */
  checkContestHealth: async (): Promise<string> => {
    return apiClient.get<string>('/contests/health')
  },

  /**
   * Check submission controller health
   */
  checkSubmissionHealth: async (): Promise<string> => {
    return apiClient.get<string>('/submissions/health')
  },

  /**
   * Check user controller health
   */
  checkUserHealth: async (): Promise<string> => {
    return apiClient.get<string>('/users/health')
  },
}

// Utility functions for common patterns
export const apiUtils = {
  /**
   * Poll submission status until completion
   */
  pollSubmissionStatus: async (
    submissionId: number,
    options: {
      interval?: number
      maxAttempts?: number
      onUpdate?: (status: SubmissionStatusResponse) => void
    } = {}
  ): Promise<SubmissionStatusResponse> => {
    const { interval = 2000, maxAttempts = 30, onUpdate } = options
    let attempts = 0

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++
          const status = await submissionAPI.getSubmissionStatus(submissionId)

          if (onUpdate) {
            onUpdate(status)
          }

          // Check if submission is complete
          const completedStatuses = [
            'ACCEPTED',
            'WRONG_ANSWER',
            'TIME_LIMIT_EXCEEDED',
            'MEMORY_LIMIT_EXCEEDED',
            'RUNTIME_ERROR',
            'COMPILATION_ERROR',
            'PRESENTATION_ERROR',
            'SYSTEM_ERROR',
          ]

          if (completedStatuses.includes(status.status)) {
            resolve(status)
            return
          }

          // Check if we've exceeded max attempts
          if (attempts >= maxAttempts) {
            reject(new Error('Polling timeout exceeded'))
            return
          }

          // Schedule next poll
          setTimeout(poll, interval)
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  },

  /**
   * Retry failed requests with exponential backoff
   */
  retryRequest: async <T>(
    requestFn: () => Promise<T>,
    options: {
      maxRetries?: number
      baseDelay?: number
      maxDelay?: number
    } = {}
  ): Promise<T> => {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error: any) {
        lastError = error

        // Don't retry on 4xx errors (client errors)
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error
        }

        if (attempt === maxRetries) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError
  },
}

// Export the configured axios instance for advanced use cases
export { api as axiosInstance }

export default api
