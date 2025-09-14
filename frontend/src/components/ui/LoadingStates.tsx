import React from 'react'
import { Button } from './Button'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  className?: string
}

interface LoadingSkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  rounded?: boolean
}

interface LoadingStateProps {
  loading: boolean
  error?: string | null
  onRetry?: () => void
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  isEmpty?: boolean
  retryText?: string
  className?: string
}

/**
 * Loading spinner component with different sizes and colors
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  }

  return (
    <div
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    >
      <svg fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

/**
 * Skeleton loading component for placeholder content
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = false,
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
    />
  )
}

/**
 * Comprehensive loading state manager component
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = false,
  retryText = 'Try Again',
  className = '',
}) => {
  // Error state
  if (error) {
    if (errorComponent) {
      return <div className={className}>{errorComponent}</div>
    }

    return (
      <div className={`px-4 py-8 text-center ${className}`}>
        <div className="mx-auto mb-4 h-12 w-12 text-red-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Something went wrong
        </h3>
        <p className="mb-4 text-sm text-gray-600">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary" size="sm">
            {retryText}
          </Button>
        )}
      </div>
    )
  }

  // Loading state
  if (loading) {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>
    }

    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (isEmpty) {
    if (emptyComponent) {
      return <div className={className}>{emptyComponent}</div>
    }

    return (
      <div className={`px-4 py-8 text-center ${className}`}>
        <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No data available
        </h3>
        <p className="text-sm text-gray-600">
          There's nothing to show here yet.
        </p>
      </div>
    )
  }

  // Success state - show children
  return <div className={className}>{children}</div>
}

/**
 * Card skeleton for loading states
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    className={`space-y-3 rounded-lg border border-gray-200 p-4 ${className}`}
  >
    <LoadingSkeleton height="1.5rem" width="70%" />
    <LoadingSkeleton height="1rem" width="100%" />
    <LoadingSkeleton height="1rem" width="85%" />
    <div className="flex space-x-2 pt-2">
      <LoadingSkeleton height="2rem" width="5rem" rounded />
      <LoadingSkeleton height="2rem" width="5rem" rounded />
    </div>
  </div>
)

/**
 * Table skeleton for loading states
 */
export const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {/* Header */}
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <LoadingSkeleton key={i} height="1.5rem" width="80%" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-4 gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <LoadingSkeleton key={colIndex} height="1rem" width="90%" />
        ))}
      </div>
    ))}
  </div>
)

/**
 * List skeleton for loading states
 */
export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <LoadingSkeleton width="3rem" height="3rem" rounded />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton height="1rem" width="60%" />
          <LoadingSkeleton height="0.75rem" width="40%" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * Button with loading state
 */
interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const isDisabled = disabled || loading

  return (
    <Button
      {...props}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={`${loading ? 'cursor-not-allowed' : ''} ${className}`}
    >
      {loading && (
        <LoadingSpinner
          size="sm"
          color={variant === 'primary' ? 'white' : 'primary'}
          className="mr-2"
        />
      )}
      {loading ? loadingText || 'Loading...' : children}
    </Button>
  )
}

/**
 * Higher-order component for adding loading states
 */
export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  config?: {
    loadingComponent?: React.ReactNode
    errorComponent?: React.ReactNode
    emptyComponent?: React.ReactNode
  }
) {
  const WrappedComponent = (
    props: P & {
      loading?: boolean
      error?: string | null
      isEmpty?: boolean
      onRetry?: () => void
    }
  ) => {
    const { loading, error, isEmpty, onRetry, ...componentProps } = props

    return (
      <LoadingState
        loading={loading || false}
        error={error}
        isEmpty={isEmpty}
        onRetry={onRetry}
        loadingComponent={config?.loadingComponent}
        errorComponent={config?.errorComponent}
        emptyComponent={config?.emptyComponent}
      >
        <Component {...(componentProps as P)} />
      </LoadingState>
    )
  }

  WrappedComponent.displayName = `withLoadingState(${Component.displayName || Component.name})`

  return WrappedComponent
}
