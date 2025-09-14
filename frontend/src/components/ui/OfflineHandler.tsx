import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react'
import { Button } from './Button'

interface OfflineAction {
  id: string
  type: string
  data: any
  timestamp: Date
  retry: () => Promise<void>
}

interface OfflineContextType {
  isOnline: boolean
  pendingActions: OfflineAction[]
  addPendingAction: (action: Omit<OfflineAction, 'id' | 'timestamp'>) => void
  removePendingAction: (id: string) => void
  retryPendingActions: () => Promise<void>
  clearPendingActions: () => void
}

const OfflineContext = createContext<OfflineContextType | null>(null)

interface OfflineProviderProps {
  children: React.ReactNode
  onStatusChange?: (isOnline: boolean) => void
  storageKey?: string
}

/**
 * Offline context provider for managing offline state and pending actions
 */
export const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children,
  onStatusChange,
  storageKey = 'offline_pending_actions',
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([])

  // Load pending actions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const actions = JSON.parse(stored).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }))
        setPendingActions(actions)
      }
    } catch (error) {
      console.warn('Failed to load pending actions from storage:', error)
    }
  }, [storageKey])

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(pendingActions))
    } catch (error) {
      console.warn('Failed to save pending actions to storage:', error)
    }
  }, [pendingActions, storageKey])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      onStatusChange?.(true)

      // Automatically retry pending actions when coming back online
      if (pendingActions.length > 0) {
        retryPendingActions()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      onStatusChange?.(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pendingActions.length, onStatusChange])

  const addPendingAction = useCallback(
    (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
      const newAction: OfflineAction = {
        ...action,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      }

      setPendingActions((prev) => [...prev, newAction])
    },
    []
  )

  const removePendingAction = useCallback((id: string) => {
    setPendingActions((prev) => prev.filter((action) => action.id !== id))
  }, [])

  const retryPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return

    const actionsToRetry = [...pendingActions]

    for (const action of actionsToRetry) {
      try {
        await action.retry()
        removePendingAction(action.id)
      } catch (error) {
        console.warn(`Failed to retry action ${action.id}:`, error)
        // Keep the action in pending state for manual retry
      }
    }
  }, [isOnline, pendingActions, removePendingAction])

  const clearPendingActions = useCallback(() => {
    setPendingActions([])
  }, [])

  const contextValue: OfflineContextType = {
    isOnline,
    pendingActions,
    addPendingAction,
    removePendingAction,
    retryPendingActions,
    clearPendingActions,
  }

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  )
}

/**
 * Hook to access offline context
 */
export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}

interface OfflineIndicatorProps {
  className?: string
  showPendingCount?: boolean
  position?: 'top' | 'bottom'
}

/**
 * Offline status indicator component
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showPendingCount = true,
  position = 'top',
}) => {
  const { isOnline, pendingActions, retryPendingActions } = useOffline()

  if (isOnline && pendingActions.length === 0) return null

  const positionClasses =
    position === 'top' ? 'top-0 border-b' : 'bottom-0 border-t'

  return (
    <div
      className={`fixed left-0 right-0 z-50 ${positionClasses} ${className}`}
    >
      {!isOnline && (
        <div className="bg-red-600 px-4 py-2 text-center text-white">
          <div className="flex items-center justify-center space-x-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">
              You're currently offline
            </span>
            {showPendingCount && pendingActions.length > 0 && (
              <span className="text-sm">
                ({pendingActions.length} action
                {pendingActions.length !== 1 ? 's' : ''} pending)
              </span>
            )}
          </div>
        </div>
      )}

      {isOnline && pendingActions.length > 0 && (
        <div className="bg-yellow-600 px-4 py-2 text-center text-white">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">
                {pendingActions.length} pending action
                {pendingActions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Button
              onClick={retryPendingActions}
              className="bg-yellow-700 px-2 py-1 text-xs hover:bg-yellow-800"
              size="sm"
            >
              Retry All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface OfflineFallbackProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showRetry?: boolean
  message?: string
}

/**
 * Component that shows fallback content when offline
 */
export const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  children,
  fallback,
  showRetry = true,
  message = 'This feature is not available offline',
}) => {
  const { isOnline, retryPendingActions } = useOffline()

  if (isOnline) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="px-4 py-8 text-center">
      <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">Offline Mode</h3>
      <p className="mb-4 text-sm text-gray-600">{message}</p>
      {showRetry && (
        <Button onClick={retryPendingActions} variant="secondary" size="sm">
          Retry When Online
        </Button>
      )}
    </div>
  )
}

/**
 * Higher-order component for offline-aware components
 */
export function withOfflineSupport<P extends object>(
  Component: React.ComponentType<P>,
  config?: {
    fallback?: React.ReactNode
    message?: string
    showRetry?: boolean
  }
) {
  const WrappedComponent = (props: P) => (
    <OfflineFallback
      fallback={config?.fallback}
      message={config?.message}
      showRetry={config?.showRetry}
    >
      <Component {...props} />
    </OfflineFallback>
  )

  WrappedComponent.displayName = `withOfflineSupport(${Component.displayName || Component.name})`

  return WrappedComponent
}
