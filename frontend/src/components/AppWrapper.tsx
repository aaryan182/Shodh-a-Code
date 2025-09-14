import React from 'react'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { NetworkErrorHandler } from './ui/NetworkErrorHandler'
import { OfflineProvider, OfflineIndicator } from './ui/OfflineHandler'
import { errorLogger, logError, logInfo } from '../utils/errorLogger'

interface AppWrapperProps {
  children: React.ReactNode
}

/**
 * Comprehensive app wrapper that provides error handling, offline support, and monitoring
 */
export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  // Handle global error logging
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logError(
      error,
      'javascript',
      {
        errorInfo: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      errorInfo.componentStack
    )
  }

  // Handle network status changes
  const handleOfflineChange = (isOffline: boolean) => {
    if (isOffline) {
      logInfo('Application went offline', 'network')
    } else {
      logInfo('Application came back online', 'network')
    }
  }

  // Handle network errors
  const handleNetworkError = (error: any) => {
    logError(error.message || 'Network error occurred', 'network', {
      code: error.code,
      status: error.status,
      timestamp: error.timestamp,
    })
  }

  return (
    <ErrorBoundary
      onError={handleError}
      showErrorDetails={process.env.NODE_ENV === 'development'}
      resetOnPropsChange={true}
      resetKeys={[window.location.pathname]}
    >
      <OfflineProvider
        onStatusChange={handleOfflineChange}
        storageKey="app_offline_actions"
      >
        <NetworkErrorHandler
          maxRetries={3}
          retryDelay={1000}
          showOfflineIndicator={true}
          onError={handleNetworkError}
          onOfflineChange={handleOfflineChange}
        >
          {/* Global offline indicator */}
          <OfflineIndicator
            position="top"
            showPendingCount={true}
            className="z-50"
          />

          {/* Main app content */}
          <div className="min-h-screen bg-gray-50">{children}</div>
        </NetworkErrorHandler>
      </OfflineProvider>
    </ErrorBoundary>
  )
}

export default AppWrapper
