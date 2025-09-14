import { useState, useEffect, useRef, useCallback } from 'react'
import { SubmissionStatusResponse, SubmissionStatus } from '../types'
import { submissionAPI } from '../utils/api'

export interface UseSubmissionStatusOptions {
  /** Polling interval in milliseconds (default: 2500ms) */
  interval?: number
  /** Maximum number of polling attempts (default: 120 - 5 minutes at 2.5s intervals) */
  maxAttempts?: number
  /** Auto-start polling when hook is initialized (default: true) */
  autoStart?: boolean
  /** Callback when status changes */
  onStatusChange?: (status: SubmissionStatusResponse) => void
  /** Callback when polling completes (success or failure) */
  onComplete?: (
    status: SubmissionStatusResponse | null,
    error: Error | null
  ) => void
  /** Enable exponential backoff for failed requests (default: true) */
  enableBackoff?: boolean
  /** Base delay for exponential backoff in ms (default: 1000) */
  backoffBaseDelay?: number
  /** Maximum delay for exponential backoff in ms (default: 10000) */
  backoffMaxDelay?: number
}

export interface UseSubmissionStatusReturn {
  /** Current submission status data */
  status: SubmissionStatusResponse | null
  /** Loading state - true when actively polling */
  loading: boolean
  /** Error state */
  error: Error | null
  /** Whether submission is completed */
  isCompleted: boolean
  /** Whether polling is currently active */
  isPolling: boolean
  /** Connection status indicator */
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error'
  /** Start polling manually */
  startPolling: () => void
  /** Stop polling manually */
  stopPolling: () => void
  /** Pause polling temporarily */
  pausePolling: () => void
  /** Resume paused polling */
  resumePolling: () => void
  /** Retry failed request immediately */
  retry: () => void
  /** Reset all state */
  reset: () => void
}

const COMPLETED_STATUSES: SubmissionStatus[] = [
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'COMPILATION_ERROR',
  'PRESENTATION_ERROR',
  'SYSTEM_ERROR',
]

export function useSubmissionStatus(
  submissionId: number | null,
  options: UseSubmissionStatusOptions = {}
): UseSubmissionStatusReturn {
  const {
    interval = 2500,
    maxAttempts = 120,
    autoStart = true,
    onStatusChange,
    onComplete,
    enableBackoff = true,
    backoffBaseDelay = 1000,
    backoffMaxDelay = 10000,
  } = options

  // State
  const [status, setStatus] = useState<SubmissionStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected' | 'error'
  >('disconnected')

  // Refs for cleanup and state management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const attemptCountRef = useRef(0)
  const failureCountRef = useRef(0)
  const mountedRef = useRef(true)

  // Computed state
  const isCompleted = status
    ? COMPLETED_STATUSES.includes(status.status)
    : false

  // Clear timeout helper
  const clearPollingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Calculate backoff delay
  const getBackoffDelay = useCallback(
    (failureCount: number): number => {
      if (!enableBackoff) return interval
      const delay = Math.min(
        backoffBaseDelay * Math.pow(2, failureCount),
        backoffMaxDelay
      )
      return Math.max(delay, interval)
    },
    [enableBackoff, backoffBaseDelay, backoffMaxDelay, interval]
  )

  // Single poll attempt
  const pollOnce = useCallback(async (): Promise<void> => {
    if (!submissionId || !mountedRef.current) return

    try {
      setConnectionStatus('connecting')
      setError(null)

      const newStatus = await submissionAPI.getSubmissionStatus(submissionId)

      if (!mountedRef.current) return

      setStatus(newStatus)
      setConnectionStatus('connected')
      failureCountRef.current = 0 // Reset failure count on success

      // Call status change callback
      if (onStatusChange) {
        onStatusChange(newStatus)
      }

      // Check if completed
      if (COMPLETED_STATUSES.includes(newStatus.status)) {
        setIsPolling(false)
        setLoading(false)
        if (onComplete) {
          onComplete(newStatus, null)
        }
        return
      }
    } catch (err) {
      if (!mountedRef.current) return

      const error =
        err instanceof Error
          ? err
          : new Error('Failed to fetch submission status')
      setError(error)
      setConnectionStatus('error')
      failureCountRef.current += 1

      // If we've exceeded max attempts, stop polling
      if (attemptCountRef.current >= maxAttempts) {
        setIsPolling(false)
        setLoading(false)
        if (onComplete) {
          onComplete(null, error)
        }
        return
      }
    }
  }, [submissionId, onStatusChange, onComplete, maxAttempts])

  // Main polling function
  const poll = useCallback(async (): Promise<void> => {
    if (!submissionId || !isPolling || isPaused || !mountedRef.current) return

    attemptCountRef.current += 1

    await pollOnce()

    // Continue polling if not completed and within limits
    if (
      mountedRef.current &&
      isPolling &&
      !isPaused &&
      attemptCountRef.current < maxAttempts &&
      (!status || !COMPLETED_STATUSES.includes(status.status))
    ) {
      const delay =
        failureCountRef.current > 0
          ? getBackoffDelay(failureCountRef.current)
          : interval

      timeoutRef.current = setTimeout(poll, delay)
    } else if (attemptCountRef.current >= maxAttempts) {
      // Max attempts reached
      setIsPolling(false)
      setLoading(false)
      setConnectionStatus('error')
      const timeoutError = new Error('Polling timeout exceeded')
      setError(timeoutError)
      if (onComplete) {
        onComplete(null, timeoutError)
      }
    }
  }, [
    submissionId,
    isPolling,
    isPaused,
    status,
    maxAttempts,
    pollOnce,
    getBackoffDelay,
    interval,
    onComplete,
  ])

  // Control functions
  const startPolling = useCallback(() => {
    if (!submissionId) return

    clearPollingTimeout()
    setIsPolling(true)
    setLoading(true)
    setIsPaused(false)
    setError(null)
    attemptCountRef.current = 0
    failureCountRef.current = 0
    setConnectionStatus('connecting')

    // Start polling immediately
    poll()
  }, [submissionId, poll, clearPollingTimeout])

  const stopPolling = useCallback(() => {
    clearPollingTimeout()
    setIsPolling(false)
    setLoading(false)
    setIsPaused(false)
    setConnectionStatus('disconnected')
  }, [clearPollingTimeout])

  const pausePolling = useCallback(() => {
    clearPollingTimeout()
    setIsPaused(true)
    setLoading(false)
  }, [clearPollingTimeout])

  const resumePolling = useCallback(() => {
    if (isPolling) {
      setIsPaused(false)
      setLoading(true)
      poll()
    }
  }, [isPolling, poll])

  const retry = useCallback(() => {
    if (!submissionId) return

    setError(null)
    failureCountRef.current = 0
    pollOnce()
  }, [submissionId, pollOnce])

  const reset = useCallback(() => {
    clearPollingTimeout()
    setStatus(null)
    setLoading(false)
    setError(null)
    setIsPolling(false)
    setIsPaused(false)
    setConnectionStatus('disconnected')
    attemptCountRef.current = 0
    failureCountRef.current = 0
  }, [clearPollingTimeout])

  // Auto-start effect
  useEffect(() => {
    if (submissionId && autoStart && !isCompleted) {
      startPolling()
    }

    return () => {
      clearPollingTimeout()
    }
  }, [submissionId, autoStart, isCompleted, startPolling, clearPollingTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      clearPollingTimeout()
    }
  }, [clearPollingTimeout])

  // Auto-stop when completed
  useEffect(() => {
    if (isCompleted && isPolling) {
      stopPolling()
    }
  }, [isCompleted, isPolling, stopPolling])

  return {
    status,
    loading,
    error,
    isCompleted,
    isPolling,
    connectionStatus,
    startPolling,
    stopPolling,
    pausePolling,
    resumePolling,
    retry,
    reset,
  }
}
