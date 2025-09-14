import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios'
import {
  errorLogger,
  logApiError,
  logNetworkError,
  addBreadcrumb,
} from './errorLogger'

interface RetryConfig {
  maxRetries: number
  retryDelay: number
  retryCondition?: (error: AxiosError) => boolean
  exponentialBackoff?: boolean
}

interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  retryConfig?: RetryConfig
  enableLogging?: boolean
  enableNetworkErrorHandling?: boolean
}

interface RequestMetadata {
  startTime: Date
  retryCount: number
  requestId: string
}

declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: RequestMetadata
    skipRetry?: boolean
    customTimeout?: number
  }
}

/**
 * Enhanced API client with comprehensive error handling, retry logic, and monitoring
 */
export class EnhancedApiClient {
  private api: AxiosInstance
  private retryConfig: RetryConfig
  private enableLogging: boolean

  constructor(config: ApiClientConfig = {}) {
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      retryCondition: this.defaultRetryCondition,
      ...config.retryConfig,
    }

    this.enableLogging =
      config.enableLogging ?? process.env.NODE_ENV === 'development'

    this.api = axios.create({
      baseURL:
        config.baseURL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:8080/api',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('auth_token')
            : null
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request metadata
        config.metadata = {
          startTime: new Date(),
          retryCount: 0,
          requestId: this.generateRequestId(),
        }

        // Add breadcrumb
        addBreadcrumb(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`,
          'api',
          'info',
          { method: config.method, url: config.url }
        )

        // Log request
        if (this.enableLogging) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
            requestId: config.metadata.requestId,
          })
        }

        return config
      },
      (error) => {
        logApiError('request_interceptor', 'UNKNOWN', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => this.handleSuccessResponse(response),
      (error) => this.handleErrorResponse(error)
    )
  }

  private handleSuccessResponse(response: AxiosResponse): AxiosResponse {
    const duration = this.calculateDuration(response.config.metadata?.startTime)
    const requestId = response.config.metadata?.requestId

    // Add breadcrumb
    addBreadcrumb(
      `API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`,
      'api',
      'info',
      {
        status: response.status,
        duration,
        requestId,
      }
    )

    // Log successful response
    if (this.enableLogging) {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`,
        {
          status: response.status,
          requestId,
          data: response.data,
        }
      )
    }

    return response
  }

  private async handleErrorResponse(error: AxiosError): Promise<never> {
    const config = error.config
    const duration = this.calculateDuration(config?.metadata?.startTime)
    const requestId = config?.metadata?.requestId

    // Log error
    if (config) {
      logApiError(
        config.url || 'unknown',
        config.method?.toUpperCase() || 'UNKNOWN',
        error,
        config.data
      )
    }

    // Add error breadcrumb
    addBreadcrumb(
      `API Error: ${config?.method?.toUpperCase()} ${config?.url}`,
      'api',
      'error',
      {
        status: error.response?.status,
        message: error.message,
        duration,
        requestId,
      }
    )

    // Log error details
    if (this.enableLogging) {
      console.error(
        `❌ ${config?.method?.toUpperCase()} ${config?.url} (${duration}ms)`,
        {
          status: error.response?.status,
          message: error.message,
          requestId,
          response: error.response?.data,
        }
      )
    }

    // Check if we should retry
    if (this.shouldRetry(error)) {
      return this.retryRequest(error)
    }

    // Transform and throw error
    throw this.transformError(error)
  }

  private shouldRetry(error: AxiosError): boolean {
    const config = error.config

    if (!config || config.skipRetry) {
      return false
    }

    const retryCount = config.metadata?.retryCount || 0

    if (retryCount >= this.retryConfig.maxRetries) {
      return false
    }

    return this.retryConfig.retryCondition
      ? this.retryConfig.retryCondition(error)
      : true
  }

  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config!
    const retryCount = (config.metadata?.retryCount || 0) + 1

    // Calculate delay
    let delay = this.retryConfig.retryDelay
    if (this.retryConfig.exponentialBackoff) {
      delay = delay * Math.pow(2, retryCount - 1)
    }

    // Add jitter to prevent thundering herd
    delay += Math.random() * 1000

    // Update metadata
    config.metadata = {
      ...config.metadata!,
      retryCount,
    }

    // Log retry attempt
    if (this.enableLogging) {
      console.log(
        `🔄 Retrying request (attempt ${retryCount}/${this.retryConfig.maxRetries}) in ${delay}ms`,
        {
          url: config.url,
          method: config.method,
          requestId: config.metadata.requestId,
        }
      )
    }

    addBreadcrumb(
      `API Retry: ${config.method?.toUpperCase()} ${config.url} (attempt ${retryCount})`,
      'api',
      'warn',
      { retryCount, delay, requestId: config.metadata.requestId }
    )

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Retry the request
    return this.api.request(config)
  }

  private defaultRetryCondition(error: AxiosError): boolean {
    // Retry on network errors
    if (!error.response) {
      return true
    }

    // Retry on server errors (5xx) and some client errors
    const status = error.response.status
    return status >= 500 || status === 408 || status === 429
  }

  private transformError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data = error.response.data as any

      return new ApiError(
        data?.message || `Server error (${status})`,
        status,
        data?.error || 'SERVER_ERROR',
        data
      )
    } else if (error.request) {
      // Network error
      return new NetworkError(
        'Network error - please check your connection',
        'NETWORK_ERROR'
      )
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred')
    }
  }

  private calculateDuration(startTime?: Date): number {
    return startTime ? new Date().getTime() - startTime.getTime() : 0
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public methods for making requests
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config)
    return response.data
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.post<T>(url, data, config)
    return response.data
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.put<T>(url, data, config)
    return response.data
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.patch<T>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config)
    return response.data
  }

  // Method to configure retry for specific requests
  withRetry(retryConfig: Partial<RetryConfig>) {
    return {
      get: <T = any>(url: string, config?: AxiosRequestConfig) =>
        this.get<T>(url, {
          ...config,
          metadata: { ...config?.metadata, ...retryConfig },
        }),
      post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        this.post<T>(url, data, {
          ...config,
          metadata: { ...config?.metadata, ...retryConfig },
        }),
      put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        this.put<T>(url, data, {
          ...config,
          metadata: { ...config?.metadata, ...retryConfig },
        }),
      patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        this.patch<T>(url, data, {
          ...config,
          metadata: { ...config?.metadata, ...retryConfig },
        }),
      delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
        this.delete<T>(url, {
          ...config,
          metadata: { ...config?.metadata, ...retryConfig },
        }),
    }
  }

  // Method to skip retry for specific requests
  withoutRetry() {
    return {
      get: <T = any>(url: string, config?: AxiosRequestConfig) =>
        this.get<T>(url, { ...config, skipRetry: true }),
      post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        this.post<T>(url, data, { ...config, skipRetry: true }),
      put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        this.put<T>(url, data, { ...config, skipRetry: true }),
      patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        this.patch<T>(url, data, { ...config, skipRetry: true }),
      delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
        this.delete<T>(url, { ...config, skipRetry: true }),
    }
  }
}

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Create singleton instance
export const enhancedApi = new EnhancedApiClient({
  enableLogging: process.env.NODE_ENV === 'development',
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
  },
})

export default enhancedApi
