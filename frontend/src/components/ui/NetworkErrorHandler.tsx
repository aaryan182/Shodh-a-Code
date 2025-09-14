import React, { useState, useCallback, useEffect } from 'react'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'

interface NetworkError {
  message: string
  code?: string
  status?: number
  retry?: () => Promise<void>
  timestamp: Date
}

interface NetworkErrorHandlerProps {
  children: React.ReactNode
  maxRetries?: number
  retryDelay?: number
  showOfflineIndicator?: boolean
  onError?: (error: NetworkError) => void
  onRetry?: (attempt: number) => void
  onOfflineChange?: (isOffline: boolean) => void
}

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

/**
 * Network error handler component with retry logic and offline detection
 */
export const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  showOfflineIndicator = true,
  onError,
  onRetry,
  onOfflineChange,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [networkError, setNetworkError] = useState<NetworkError | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  // Default retry configuration
  const retryConfig: RetryConfig = {
    maxAttempts: maxRetries,
    baseDelay: retryDelay,
    maxDelay: 30000, // 30 seconds max delay
    backoffFactor: 2,
  }

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setNetworkError(null)
      setRetryAttempt(0)
      onOfflineChange?.(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      onOfflineChange?.(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onOfflineChange])

  // Calculate retry delay with exponential backoff
  const calculateRetryDelay = useCallback(
    (attempt: number): number => {
      const delay =
        retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt)
      return Math.min(delay, retryConfig.maxDelay)
    },
    [retryConfig]
  )

  // Handle network errors
  const handleNetworkError = useCallback(
    (error: any, retryFn?: () => Promise<void>) => {
      const networkError: NetworkError = {
        message: getErrorMessage(error),
        code: error.code,
        status: error.response?.status,
        retry: retryFn,
        timestamp: new Date(),
      }

      setNetworkError(networkError)
      onError?.(networkError)
    },
    [onError]
  )

  // Retry logic with exponential backoff
  const retryRequest = useCallback(
    async (retryFn: () => Promise<void>) => {
      if (retryAttempt >= retryConfig.maxAttempts) {
        return
      }

      setIsRetrying(true)
      const delay = calculateRetryDelay(retryAttempt)

      try {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Attempt retry
        await retryFn()

        // Success - reset error state
        setNetworkError(null)
        setRetryAttempt(0)
        onRetry?.(retryAttempt + 1)
      } catch (error) {
        const newAttempt = retryAttempt + 1
        setRetryAttempt(newAttempt)

        if (newAttempt >= retryConfig.maxAttempts) {
          handleNetworkError(error, retryFn)
        } else {
          // Continue retrying
          setTimeout(
            () => retryRequest(retryFn),
            calculateRetryDelay(newAttempt)
          )
        }
      } finally {
        setIsRetrying(false)
      }
    },
    [
      retryAttempt,
      retryConfig.maxAttempts,
      calculateRetryDelay,
      handleNetworkError,
      onRetry,
    ]
  )

  // Manual retry function
  const handleManualRetry = useCallback(() => {
    if (networkError?.retry) {
      setRetryAttempt(0)
      retryRequest(networkError.retry)
    }
  }, [networkError, retryRequest])

  // Clear error
  const clearError = useCallback(() => {
    setNetworkError(null)
    setRetryAttempt(0)
  }, [])

  // Render offline indicator
  const renderOfflineIndicator = () => {
    if (!showOfflineIndicator || isOnline) return null

    return (
      <div className="fixed left-0 right-0 top-0 z-50 bg-red-600 px-4 py-2 text-center text-white">
        <div className="flex items-center justify-center space-x-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium">You're currently offline</span>
        </div>
      </div>
    )
  }

  // Render network error
  const renderNetworkError = () => {
    if (!networkError) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Network Error
            </h3>
            <p className="mb-4 text-sm text-gray-600">{networkError.message}</p>

            {retryAttempt > 0 && (
              <p className="mb-4 text-xs text-gray-500">
                Retry attempt: {retryAttempt}/{retryConfig.maxAttempts}
              </p>
            )}

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
              <Button
                onClick={handleManualRetry}
                disabled={isRetrying || retryAttempt >= retryConfig.maxAttempts}
                className="w-full sm:w-auto"
                variant="primary"
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
              <Button
                onClick={clearError}
                className="w-full sm:w-auto"
                variant="secondary"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {renderOfflineIndicator()}
      {renderNetworkError()}
      {children}
    </>
  )
}

// Utility function to extract error message
function getErrorMessage(error: any): string {
  if (error.response) {
    // Server responded with error status
    return (
      error.response.data?.message || `Server error (${error.response.status})`
    )
  } else if (error.request) {
    // Network error
    return 'Network error - please check your connection'
  } else {
    // Other error
    return error.message || 'An unexpected error occurred'
  }
}

// Hook for using network error handling
export const useNetworkErrorHandler = (
  config?: Partial<NetworkErrorHandlerProps>
) => {
  const [error, setError] = useState<NetworkError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleError = useCallback(
    (error: any, retryFn?: () => Promise<void>) => {
      const networkError: NetworkError = {
        message: getErrorMessage(error),
        code: error.code,
        status: error.response?.status,
        retry: retryFn,
        timestamp: new Date(),
      }

      setError(networkError)
      config?.onError?.(networkError)
    },
    [config]
  )

  const retry = useCallback(async () => {
    if (!error?.retry) return

    setIsRetrying(true)
    try {
      await error.retry()
      setError(null)
    } catch (retryError) {
      handleError(retryError, error.retry)
    } finally {
      setIsRetrying(false)
    }
  }, [error, handleError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    isRetrying,
    handleError,
    retry,
    clearError,
  }
}
