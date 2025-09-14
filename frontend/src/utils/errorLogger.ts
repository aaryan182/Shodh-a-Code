interface ErrorLogEntry {
  id: string
  message: string
  stack?: string
  componentStack?: string
  url: string
  userAgent: string
  timestamp: string
  userId?: string
  sessionId: string
  level: 'error' | 'warn' | 'info'
  category: 'javascript' | 'network' | 'api' | 'user' | 'performance'
  context?: Record<string, any>
  breadcrumbs?: Breadcrumb[]
}

interface Breadcrumb {
  timestamp: string
  category: string
  message: string
  level: 'error' | 'warn' | 'info' | 'debug'
  data?: Record<string, any>
}

interface ErrorLoggerConfig {
  apiEndpoint?: string
  maxBreadcrumbs?: number
  enableConsoleLogging?: boolean
  enableLocalStorage?: boolean
  localStorageKey?: string
  sampleRate?: number
  enableNetworkLogging?: boolean
  enablePerformanceLogging?: boolean
}

/**
 * Comprehensive error logging service for frontend applications
 */
class ErrorLogger {
  private config: Required<ErrorLoggerConfig>
  private sessionId: string
  private breadcrumbs: Breadcrumb[] = []
  private logQueue: ErrorLogEntry[] = []
  private isOnline: boolean = navigator.onLine

  constructor(config: ErrorLoggerConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/errors',
      maxBreadcrumbs: config.maxBreadcrumbs || 50,
      enableConsoleLogging: config.enableConsoleLogging ?? true,
      enableLocalStorage: config.enableLocalStorage ?? true,
      localStorageKey: config.localStorageKey || 'error_logs',
      sampleRate: config.sampleRate || 1.0,
      enableNetworkLogging: config.enableNetworkLogging ?? true,
      enablePerformanceLogging: config.enablePerformanceLogging ?? true,
    }

    this.sessionId = this.generateSessionId()
    this.setupGlobalErrorHandlers()
    this.setupNetworkMonitoring()
    this.loadStoredLogs()
  }

  /**
   * Log an error with context
   */
  logError(
    error: Error | string,
    category: ErrorLogEntry['category'] = 'javascript',
    context?: Record<string, any>,
    componentStack?: string
  ): void {
    if (Math.random() > this.config.sampleRate) {
      return // Skip logging based on sample rate
    }

    const errorEntry: ErrorLogEntry = {
      id: this.generateId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      level: 'error',
      category,
      context,
      breadcrumbs: [...this.breadcrumbs],
    }

    this.processLogEntry(errorEntry)
  }

  /**
   * Log a warning
   */
  logWarning(
    message: string,
    category: ErrorLogEntry['category'] = 'javascript',
    context?: Record<string, any>
  ): void {
    const errorEntry: ErrorLogEntry = {
      id: this.generateId(),
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      level: 'warn',
      category,
      context,
      breadcrumbs: [...this.breadcrumbs],
    }

    this.processLogEntry(errorEntry)
  }

  /**
   * Log an info message
   */
  logInfo(
    message: string,
    category: ErrorLogEntry['category'] = 'user',
    context?: Record<string, any>
  ): void {
    const errorEntry: ErrorLogEntry = {
      id: this.generateId(),
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      level: 'info',
      category,
      context,
      breadcrumbs: [...this.breadcrumbs],
    }

    this.processLogEntry(errorEntry)
  }

  /**
   * Add a breadcrumb for context tracking
   */
  addBreadcrumb(
    message: string,
    category: string = 'navigation',
    level: Breadcrumb['level'] = 'info',
    data?: Record<string, any>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      data,
    }

    this.breadcrumbs.push(breadcrumb)

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs)
    }
  }

  /**
   * Log network errors
   */
  logNetworkError(
    url: string,
    method: string,
    status?: number,
    statusText?: string,
    responseTime?: number
  ): void {
    this.logError(
      `Network error: ${method} ${url} - ${status} ${statusText}`,
      'network',
      {
        url,
        method,
        status,
        statusText,
        responseTime,
      }
    )
  }

  /**
   * Log API errors
   */
  logApiError(
    endpoint: string,
    method: string,
    error: any,
    requestData?: any
  ): void {
    this.logError(
      `API error: ${method} ${endpoint} - ${error.message || error}`,
      'api',
      {
        endpoint,
        method,
        error: error.response?.data || error.message || String(error),
        status: error.response?.status,
        requestData,
      }
    )
  }

  /**
   * Log performance issues
   */
  logPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    context?: Record<string, any>
  ): void {
    if (!this.config.enablePerformanceLogging) return

    this.logWarning(
      `Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`,
      'performance',
      {
        metric,
        value,
        threshold,
        ...context,
      }
    )
  }

  /**
   * Get stored error logs
   */
  getStoredLogs(): ErrorLogEntry[] {
    if (!this.config.enableLocalStorage) return []

    try {
      const stored = localStorage.getItem(this.config.localStorageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to retrieve stored error logs:', error)
      return []
    }
  }

  /**
   * Clear stored error logs
   */
  clearStoredLogs(): void {
    if (!this.config.enableLocalStorage) return

    try {
      localStorage.removeItem(this.config.localStorageKey)
      this.logQueue = []
    } catch (error) {
      console.warn('Failed to clear stored error logs:', error)
    }
  }

  /**
   * Flush queued logs to server
   */
  async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0 || !this.isOnline) return

    const logsToSend = [...this.logQueue]
    this.logQueue = []

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
      })

      // Remove successfully sent logs from local storage
      this.updateStoredLogs()
    } catch (error) {
      // Re-queue logs if sending failed
      this.logQueue.unshift(...logsToSend)
      console.warn('Failed to send error logs to server:', error)
    }
  }

  private processLogEntry(entry: ErrorLogEntry): void {
    // Console logging
    if (this.config.enableConsoleLogging) {
      const logMethod =
        entry.level === 'error'
          ? console.error
          : entry.level === 'warn'
            ? console.warn
            : console.log
      logMethod(
        `[${entry.category.toUpperCase()}]`,
        entry.message,
        entry.context
      )
    }

    // Add to queue
    this.logQueue.push(entry)

    // Store locally
    if (this.config.enableLocalStorage) {
      this.updateStoredLogs()
    }

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushLogs().catch(console.warn)
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || event.message, 'javascript', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, 'javascript', {
        type: 'unhandledrejection',
        promise: String(event.promise),
      })
    })

    // Handle online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.addBreadcrumb('Connection restored', 'network')
      this.flushLogs().catch(console.warn)
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.addBreadcrumb('Connection lost', 'network', 'warn')
    })
  }

  private setupNetworkMonitoring(): void {
    if (!this.config.enableNetworkLogging) return

    // Monitor fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = typeof args[0] === 'string' ? args[0] : args[0].url
      const method = args[1]?.method || 'GET'

      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        const responseTime = endTime - startTime

        this.addBreadcrumb(
          `${method} ${url} - ${response.status}`,
          'network',
          response.ok ? 'info' : 'warn',
          { method, url, status: response.status, responseTime }
        )

        if (!response.ok) {
          this.logNetworkError(
            url,
            method,
            response.status,
            response.statusText,
            responseTime
          )
        }

        return response
      } catch (error) {
        const endTime = performance.now()
        const responseTime = endTime - startTime

        this.logNetworkError(
          url,
          method,
          undefined,
          String(error),
          responseTime
        )
        throw error
      }
    }
  }

  private loadStoredLogs(): void {
    if (!this.config.enableLocalStorage) return

    try {
      const stored = localStorage.getItem(this.config.localStorageKey)
      if (stored) {
        this.logQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load stored error logs:', error)
    }
  }

  private updateStoredLogs(): void {
    if (!this.config.enableLocalStorage) return

    try {
      localStorage.setItem(
        this.config.localStorageKey,
        JSON.stringify(this.logQueue)
      )
    } catch (error) {
      console.warn('Failed to store error logs:', error)
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      // From localStorage
      const token = localStorage.getItem('auth_token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.sub || payload.userId
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return undefined
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger({
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableLocalStorage: true,
  enableNetworkLogging: true,
  enablePerformanceLogging: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // Sample 10% in production
})

// Export utility functions
export const logError = errorLogger.logError.bind(errorLogger)
export const logWarning = errorLogger.logWarning.bind(errorLogger)
export const logInfo = errorLogger.logInfo.bind(errorLogger)
export const addBreadcrumb = errorLogger.addBreadcrumb.bind(errorLogger)
export const logNetworkError = errorLogger.logNetworkError.bind(errorLogger)
export const logApiError = errorLogger.logApiError.bind(errorLogger)
export const logPerformanceIssue =
  errorLogger.logPerformanceIssue.bind(errorLogger)

export default errorLogger
