import { useState, useEffect, useRef, useCallback } from 'react'
import { LeaderboardResponse } from '../types'
import { contestAPI } from '../utils/api'

export interface UseLeaderboardOptions {
  /** Polling interval in milliseconds (default: 20000ms - 20 seconds) */
  interval?: number
  /** Auto-start polling when hook is initialized (default: true) */
  autoStart?: boolean
  /** Callback when leaderboard data changes */
  onUpdate?: (leaderboard: LeaderboardResponse) => void
  /** Callback when polling encounters an error */
  onError?: (error: Error) => void
  /** Enable exponential backoff for failed requests (default: true) */
  enableBackoff?: boolean
  /** Base delay for exponential backoff in ms (default: 2000) */
  backoffBaseDelay?: number
  /** Maximum delay for exponential backoff in ms (default: 60000) */
  backoffMaxDelay?: number
  /** Maximum number of consecutive failures before stopping (default: 5) */
  maxFailures?: number
  /** Cache duration in milliseconds (default: 10000ms - 10 seconds) */
  cacheDuration?: number
}

export interface UseLeaderboardReturn {
  /** Current leaderboard data */
  data: LeaderboardResponse | null
  /** Loading state - true when fetching data */
  loading: boolean
  /** Error state */
  error: Error | null
  /** Whether polling is currently active */
  isPolling: boolean
  /** Whether polling is paused */
  isPaused: boolean
  /** Last updated timestamp */
  lastUpdated: Date | null
  /** Connection status indicator */
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error'
  /** Cached data (previous results) */
  cachedData: LeaderboardResponse | null
  /** Whether current data is from cache */
  isFromCache: boolean
  /** Start polling manually */
  startPolling: () => void
  /** Stop polling manually */
  stopPolling: () => void
  /** Pause polling temporarily */
  pausePolling: () => void
  /** Resume paused polling */
  resumePolling: () => void
  /** Refresh leaderboard immediately */
  refresh: () => Promise<void>
  /** Retry failed request immediately */
  retry: () => void
  /** Reset all state */
  reset: () => void
  /** Clear cache */
  clearCache: () => void
}

interface CacheEntry {
  data: LeaderboardResponse
  timestamp: Date
}

export function useLeaderboard(
  contestId: number | null,
  options: UseLeaderboardOptions = {}
): UseLeaderboardReturn {
  const {
    interval = 20000, // 20 seconds
    autoStart = true,
    onUpdate,
    onError,
    enableBackoff = true,
    backoffBaseDelay = 2000,
    backoffMaxDelay = 60000,
    maxFailures = 5,
    cacheDuration = 10000, // 10 seconds
  } = options

  // State
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected' | 'error'
  >('disconnected')
  const [cachedData, setCachedData] = useState<LeaderboardResponse | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  // Refs for cleanup and state management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const failureCountRef = useRef(0)
  const mountedRef = useRef(true)
  const cacheRef = useRef<Map<number, CacheEntry>>(new Map())

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

  // Get cached data
  const getCachedData = useCallback(
    (contestId: number): LeaderboardResponse | null => {
      const cached = cacheRef.current.get(contestId)
      if (!cached) return null

      const age = new Date().getTime() - cached.timestamp.getTime()
      if (age > cacheDuration) {
        cacheRef.current.delete(contestId)
        return null
      }

      return cached.data
    },
    [cacheDuration]
  )

  // Set cached data
  const setCacheData = useCallback(
    (contestId: number, leaderboardData: LeaderboardResponse) => {
      cacheRef.current.set(contestId, {
        data: leaderboardData,
        timestamp: new Date(),
      })
      setCachedData(leaderboardData)
    },
    []
  )

  // Single fetch attempt
  const fetchOnce = useCallback(
    async (showLoading = true): Promise<void> => {
      if (!contestId || !mountedRef.current) return

      try {
        if (showLoading) {
          setLoading(true)
        }
        setConnectionStatus('connecting')
        setError(null)
        setIsFromCache(false)

        // Check cache first
        const cached = getCachedData(contestId)
        if (cached && !showLoading) {
          setData(cached)
          setIsFromCache(true)
          setConnectionStatus('connected')
          if (showLoading) {
            setLoading(false)
          }
          return
        }

        const newData = await contestAPI.getLeaderboard(contestId)

        if (!mountedRef.current) return

        setData(newData)
        setCacheData(contestId, newData)
        setLastUpdated(new Date())
        setConnectionStatus('connected')
        failureCountRef.current = 0 // Reset failure count on success
        setIsFromCache(false)

        // Call update callback
        if (onUpdate) {
          onUpdate(newData)
        }
      } catch (err) {
        if (!mountedRef.current) return

        const error =
          err instanceof Error ? err : new Error('Failed to fetch leaderboard')
        setError(error)
        setConnectionStatus('error')
        failureCountRef.current += 1

        // Try to show cached data on error
        if (contestId) {
          const cached = getCachedData(contestId)
          if (cached && !data) {
            setData(cached)
            setIsFromCache(true)
          }
        }

        // Call error callback
        if (onError) {
          onError(error)
        }

        // Stop polling if max failures reached
        if (failureCountRef.current >= maxFailures) {
          setIsPolling(false)
          if (showLoading) {
            setLoading(false)
          }
          return
        }
      } finally {
        if (mountedRef.current && showLoading) {
          setLoading(false)
        }
      }
    },
    [
      contestId,
      getCachedData,
      setCacheData,
      onUpdate,
      onError,
      maxFailures,
      data,
    ]
  )

  // Main polling function
  const poll = useCallback(async (): Promise<void> => {
    if (!contestId || !isPolling || isPaused || !mountedRef.current) return

    await fetchOnce(false) // Don't show loading for polling updates

    // Continue polling if not paused and within failure limits
    if (
      mountedRef.current &&
      isPolling &&
      !isPaused &&
      failureCountRef.current < maxFailures
    ) {
      const delay =
        failureCountRef.current > 0
          ? getBackoffDelay(failureCountRef.current)
          : interval

      timeoutRef.current = setTimeout(poll, delay)
    } else if (failureCountRef.current >= maxFailures) {
      // Max failures reached
      setIsPolling(false)
      setConnectionStatus('error')
    }
  }, [
    contestId,
    isPolling,
    isPaused,
    maxFailures,
    fetchOnce,
    getBackoffDelay,
    interval,
  ])

  // Control functions
  const startPolling = useCallback(() => {
    if (!contestId) return

    clearPollingTimeout()
    setIsPolling(true)
    setIsPaused(false)
    setError(null)
    failureCountRef.current = 0
    setConnectionStatus('connecting')

    // Start with immediate fetch, then continue polling
    fetchOnce(true).then(() => {
      if (mountedRef.current && isPolling && !isPaused) {
        timeoutRef.current = setTimeout(poll, interval)
      }
    })
  }, [contestId, fetchOnce, poll, interval, clearPollingTimeout])

  const stopPolling = useCallback(() => {
    clearPollingTimeout()
    setIsPolling(false)
    setIsPaused(false)
    setConnectionStatus('disconnected')
  }, [clearPollingTimeout])

  const pausePolling = useCallback(() => {
    clearPollingTimeout()
    setIsPaused(true)
  }, [clearPollingTimeout])

  const resumePolling = useCallback(() => {
    if (isPolling) {
      setIsPaused(false)
      poll()
    }
  }, [isPolling, poll])

  const refresh = useCallback(async (): Promise<void> => {
    if (!contestId) return

    setError(null)
    failureCountRef.current = 0
    await fetchOnce(true)
  }, [contestId, fetchOnce])

  const retry = useCallback(() => {
    if (!contestId) return

    setError(null)
    failureCountRef.current = 0
    fetchOnce(true)
  }, [contestId, fetchOnce])

  const reset = useCallback(() => {
    clearPollingTimeout()
    setData(null)
    setLoading(false)
    setError(null)
    setIsPolling(false)
    setIsPaused(false)
    setLastUpdated(null)
    setConnectionStatus('disconnected')
    setCachedData(null)
    setIsFromCache(false)
    failureCountRef.current = 0
  }, [clearPollingTimeout])

  const clearCache = useCallback(() => {
    if (contestId) {
      cacheRef.current.delete(contestId)
    }
    setCachedData(null)
    setIsFromCache(false)
  }, [contestId])

  // Auto-start effect
  useEffect(() => {
    if (contestId && autoStart) {
      startPolling()
    }

    return () => {
      clearPollingTimeout()
    }
  }, [contestId, autoStart, startPolling, clearPollingTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      clearPollingTimeout()
    }
  }, [clearPollingTimeout])

  // Reset when contestId changes
  useEffect(() => {
    if (contestId) {
      reset()
      if (autoStart) {
        startPolling()
      }
    }
  }, [contestId, autoStart, reset, startPolling])

  return {
    data,
    loading,
    error,
    isPolling,
    isPaused,
    lastUpdated,
    connectionStatus,
    cachedData,
    isFromCache,
    startPolling,
    stopPolling,
    pausePolling,
    resumePolling,
    refresh,
    retry,
    reset,
    clearCache,
  }
}
