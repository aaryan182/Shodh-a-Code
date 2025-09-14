'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Medal,
  Award,
  User,
  RefreshCw,
  Clock,
  Target,
  Play,
  Pause,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Timer,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import {
  LeaderboardEntry,
  LeaderboardResponse,
  ProblemStatus,
} from '../../types'
import { Button } from '../ui/Button'
import { ConnectionStatus } from '../ui/ConnectionStatus'
import { useLeaderboard } from '../../hooks/useLeaderboard'

interface LeaderboardProps {
  contestId: number
  currentUserId?: number
  className?: string
  compact?: boolean
  autoStart?: boolean
  showControls?: boolean
  interval?: number // in milliseconds
  showProblemStatus?: boolean
  problems?: Array<{ id: number; title: string }>
}

type SortField =
  | 'rank'
  | 'username'
  | 'score'
  | 'solved'
  | 'submissions'
  | 'lastSubmission'
type SortDirection = 'asc' | 'desc'

export const Leaderboard: React.FC<LeaderboardProps> = ({
  contestId,
  currentUserId,
  className = '',
  compact = false,
  autoStart = true,
  showControls = true,
  interval = 20000, // 20 seconds
  showProblemStatus = true,
  problems = [],
}) => {
  // State for enhanced features
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [minScore, setMinScore] = useState<number | ''>('')
  const [maxScore, setMaxScore] = useState<number | ''>('')
  const [minSolved, setMinSolved] = useState<number | ''>('')
  const [maxSolved, setMaxSolved] = useState<number | ''>('')
  const [previousData, setPreviousData] = useState<LeaderboardEntry[]>([])
  const [showMyRank, setShowMyRank] = useState(false)

  // Refs
  const currentUserRowRef = useRef<HTMLDivElement>(null)
  const leaderboardRef = useRef<HTMLDivElement>(null)

  // Use the custom hook for real-time updates
  const {
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
    clearCache,
  } = useLeaderboard(contestId, {
    interval,
    autoStart,
    onUpdate: (leaderboard) => {
      console.log('Leaderboard updated:', leaderboard)
    },
    onError: (err) => {
      console.error('Leaderboard error:', err)
    },
  })

  // Enhanced mock data with problem status
  const mockLeaderboardData: LeaderboardResponse = {
    contestId,
    contestName: 'Sample Contest',
    entries: [
      {
        rank: 1,
        userId: 1,
        username: 'alice_coder',
        totalScore: 2850,
        problemsSolved: 5,
        totalSubmissions: 8,
        lastSubmissionTime: '2024-01-15T10:30:00Z',
        problemStatus: [
          {
            problemId: 1,
            status: 'solved',
            attempts: 2,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T09:15:00Z',
          },
          {
            problemId: 2,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T09:45:00Z',
          },
          {
            problemId: 3,
            status: 'solved',
            attempts: 3,
            bestScore: 85,
            lastAttemptTime: '2024-01-15T10:00:00Z',
          },
          {
            problemId: 4,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T10:15:00Z',
          },
          {
            problemId: 5,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T10:30:00Z',
          },
        ],
      },
      {
        rank: 2,
        userId: 2,
        username: 'bob_dev',
        totalScore: 2720,
        problemsSolved: 4,
        totalSubmissions: 6,
        lastSubmissionTime: '2024-01-15T10:25:00Z',
        problemStatus: [
          {
            problemId: 1,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T09:20:00Z',
          },
          {
            problemId: 2,
            status: 'solved',
            attempts: 2,
            bestScore: 90,
            lastAttemptTime: '2024-01-15T09:50:00Z',
          },
          {
            problemId: 3,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T10:05:00Z',
          },
          {
            problemId: 4,
            status: 'solved',
            attempts: 2,
            bestScore: 80,
            lastAttemptTime: '2024-01-15T10:25:00Z',
          },
          {
            problemId: 5,
            status: 'failed',
            attempts: 3,
            lastAttemptTime: '2024-01-15T10:20:00Z',
          },
        ],
      },
      {
        rank: 3,
        userId: 3,
        username: 'charlie_prog',
        totalScore: 2650,
        problemsSolved: 4,
        totalSubmissions: 7,
        lastSubmissionTime: '2024-01-15T10:20:00Z',
        problemStatus: [
          {
            problemId: 1,
            status: 'solved',
            attempts: 3,
            bestScore: 75,
            lastAttemptTime: '2024-01-15T09:25:00Z',
          },
          {
            problemId: 2,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T09:55:00Z',
          },
          {
            problemId: 3,
            status: 'solved',
            attempts: 2,
            bestScore: 95,
            lastAttemptTime: '2024-01-15T10:10:00Z',
          },
          {
            problemId: 4,
            status: 'failed',
            attempts: 1,
            lastAttemptTime: '2024-01-15T10:15:00Z',
          },
          {
            problemId: 5,
            status: 'pending',
            attempts: 1,
            lastAttemptTime: '2024-01-15T10:20:00Z',
          },
        ],
      },
      {
        rank: 4,
        userId: 4,
        username: 'diana_code',
        totalScore: 2400,
        problemsSolved: 3,
        totalSubmissions: 5,
        lastSubmissionTime: '2024-01-15T10:10:00Z',
        problemStatus: [
          {
            problemId: 1,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T09:30:00Z',
          },
          {
            problemId: 2,
            status: 'solved',
            attempts: 2,
            bestScore: 85,
            lastAttemptTime: '2024-01-15T10:00:00Z',
          },
          {
            problemId: 3,
            status: 'solved',
            attempts: 2,
            bestScore: 90,
            lastAttemptTime: '2024-01-15T10:10:00Z',
          },
          { problemId: 4, status: 'not_attempted', attempts: 0 },
          { problemId: 5, status: 'not_attempted', attempts: 0 },
        ],
      },
      {
        rank: 5,
        userId: 5,
        username: 'eve_script',
        totalScore: 2200,
        problemsSolved: 3,
        totalSubmissions: 4,
        lastSubmissionTime: '2024-01-15T10:05:00Z',
        problemStatus: [
          {
            problemId: 1,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T09:35:00Z',
          },
          {
            problemId: 2,
            status: 'solved',
            attempts: 1,
            bestScore: 100,
            lastAttemptTime: '2024-01-15T09:50:00Z',
          },
          {
            problemId: 3,
            status: 'solved',
            attempts: 2,
            bestScore: 70,
            lastAttemptTime: '2024-01-15T10:05:00Z',
          },
          { problemId: 4, status: 'not_attempted', attempts: 0 },
          { problemId: 5, status: 'not_attempted', attempts: 0 },
        ],
      },
    ],
    totalParticipants: 42,
  }

  // Use hook data, cached data, or fall back to mock data
  const leaderboardData = data || cachedData || mockLeaderboardData

  // Track rank changes for animations
  useEffect(() => {
    if (leaderboardData?.entries && previousData.length > 0) {
      // Compare with previous data to detect rank changes
      // This would trigger animations for rank changes
    }
    setPreviousData(leaderboardData?.entries || [])
  }, [leaderboardData?.entries, previousData.length])

  // Auto-scroll to current user
  useEffect(() => {
    if (currentUserId && currentUserRowRef.current && !showMyRank) {
      const timer = setTimeout(() => {
        currentUserRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentUserId, leaderboardData, showMyRank])

  // Filtering and sorting logic
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = leaderboardData?.entries || []

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((entry) =>
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Score range filter
    if (minScore !== '') {
      filtered = filtered.filter((entry) => entry.totalScore >= minScore)
    }
    if (maxScore !== '') {
      filtered = filtered.filter((entry) => entry.totalScore <= maxScore)
    }

    // Problems solved filter
    if (minSolved !== '') {
      filtered = filtered.filter((entry) => entry.problemsSolved >= minSolved)
    }
    if (maxSolved !== '') {
      filtered = filtered.filter((entry) => entry.problemsSolved <= maxSolved)
    }

    // Show only current user
    if (showMyRank && currentUserId) {
      filtered = filtered.filter((entry) => entry.userId === currentUserId)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof LeaderboardEntry]
      let bValue: any = b[sortField as keyof LeaderboardEntry]

      if (sortField === 'lastSubmission') {
        aValue = a.lastSubmissionTime
          ? new Date(a.lastSubmissionTime).getTime()
          : 0
        bValue = b.lastSubmissionTime
          ? new Date(b.lastSubmissionTime).getTime()
          : 0
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [
    leaderboardData?.entries,
    searchQuery,
    minScore,
    maxScore,
    minSolved,
    maxSolved,
    showMyRank,
    currentUserId,
    sortField,
    sortDirection,
  ])

  // Utility functions
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center text-sm font-semibold text-gray-600">
            {rank}
          </span>
        )
    }
  }

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    let baseStyle = 'transition-all duration-300 '

    if (isCurrentUser) {
      baseStyle += 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-200 '
    } else {
      baseStyle += 'hover:bg-gray-50 '
    }

    switch (rank) {
      case 1:
        return (
          baseStyle +
          'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
        )
      case 2:
        return (
          baseStyle +
          'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
        )
      case 3:
        return (
          baseStyle +
          'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200'
        )
      default:
        return baseStyle + 'border-gray-200'
    }
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    }
  }

  const formatLastSubmission = (timestamp?: string) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getProblemStatusIcon = (status: ProblemStatus['status']) => {
    switch (status) {
      case 'solved':
        return <CheckCircle className="h-4 w-4 text-green-500" title="Solved" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" title="Failed" />
      case 'pending':
        return <Timer className="h-4 w-4 text-yellow-500" title="Pending" />
      default:
        return <Minus className="h-4 w-4 text-gray-300" title="Not attempted" />
    }
  }

  const calculateSuccessRate = (entry: LeaderboardEntry) => {
    if (entry.totalSubmissions === 0) return 0
    return Math.round((entry.problemsSolved / entry.totalSubmissions) * 100)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const exportLeaderboard = () => {
    const csvContent = [
      [
        'Rank',
        'Username',
        'Score',
        'Problems Solved',
        'Total Submissions',
        'Success Rate',
        'Last Submission',
      ],
      ...filteredAndSortedEntries.map((entry) => [
        entry.rank,
        entry.username,
        entry.totalScore,
        entry.problemsSolved,
        entry.totalSubmissions,
        `${calculateSuccessRate(entry)}%`,
        formatLastSubmission(entry.lastSubmissionTime),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leaderboard-contest-${contestId}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  // Compact view
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Trophy className="h-4 w-4" />
            Top 5
          </h3>
          <div className="flex items-center gap-2">
            <ConnectionStatus
              status={connectionStatus}
              size="sm"
              showLabel={false}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
              loading={loading}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Compact List */}
        <div className="p-2">
          <AnimatePresence>
            {filteredAndSortedEntries.slice(0, 5).map((entry, index) => {
              const isCurrentUser = currentUserId === entry.userId
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between rounded border p-2 text-sm ${getRankStyle(entry.rank, isCurrentUser)}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {getRankIcon(entry.rank)}
                    <span
                      className={`truncate font-medium ${isCurrentUser ? 'text-indigo-900' : 'text-gray-900'}`}
                    >
                      {entry.username}
                    </span>
                    {isCurrentUser && (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-800">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {entry.totalScore}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.problemsSolved} solved
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
      ref={leaderboardRef}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {leaderboardData.totalParticipants} participants •{' '}
              {filteredAndSortedEntries.length} shown
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <ConnectionStatus
              status={connectionStatus}
              size="sm"
              showLabel={false}
            />

            {/* Cache indicator */}
            {isFromCache && (
              <span className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-600">
                Cached
              </span>
            )}

            {/* Controls */}
            {showControls && (
              <>
                {isPolling && !isPaused ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={pausePolling}
                    title="Pause auto-refresh"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isPolling ? resumePolling : startPolling}
                    className={isPolling ? 'text-green-600' : 'text-gray-400'}
                    title={
                      isPolling ? 'Resume auto-refresh' : 'Start auto-refresh'
                    }
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refresh}
                  disabled={loading}
                  loading={loading}
                  title="Refresh now"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportLeaderboard}
                  title="Export CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filters"
                  className={showFilters ? 'text-indigo-600' : ''}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mt-3 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMyRank(!showMyRank)}
              className={showMyRank ? 'text-indigo-600' : ''}
            >
              {showMyRank ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="ml-1">
                {showMyRank ? 'Show All' : 'My Rank'}
              </span>
            </Button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-3 md:grid-cols-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Min Score
                  </label>
                  <input
                    type="number"
                    value={minScore}
                    onChange={(e) =>
                      setMinScore(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Max Score
                  </label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) =>
                      setMaxScore(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="∞"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Min Solved
                  </label>
                  <input
                    type="number"
                    value={minSolved}
                    onChange={(e) =>
                      setMinSolved(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Max Solved
                  </label>
                  <input
                    type="number"
                    value={maxSolved}
                    onChange={(e) =>
                      setMaxSolved(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="∞"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Info */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {isPolling && !isPaused && (
              <span className="flex items-center gap-1">
                <div className="h-1 w-1 animate-pulse rounded-full bg-green-500"></div>
                Auto-refresh active
              </span>
            )}
            {isPaused && <span className="text-amber-600">Paused</span>}
          </div>

          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Last updated {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600">{error.message}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={retry}
              className="text-red-600 hover:text-red-700"
            >
              Retry
            </Button>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Table Header */}
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            <div className="grid grid-cols-12 items-center gap-4">
              <button
                className="col-span-1 flex items-center transition-colors hover:text-gray-700"
                onClick={() => handleSort('rank')}
              >
                Rank
                {getSortIcon('rank')}
              </button>
              <button
                className="col-span-3 flex items-center transition-colors hover:text-gray-700"
                onClick={() => handleSort('username')}
              >
                Participant
                {getSortIcon('username')}
              </button>
              <button
                className="col-span-2 flex items-center justify-center transition-colors hover:text-gray-700"
                onClick={() => handleSort('score')}
              >
                Score
                {getSortIcon('score')}
              </button>
              <button
                className="col-span-1 flex items-center justify-center transition-colors hover:text-gray-700"
                onClick={() => handleSort('solved')}
              >
                Solved
                {getSortIcon('solved')}
              </button>
              <button
                className="col-span-1 flex items-center justify-center transition-colors hover:text-gray-700"
                onClick={() => handleSort('submissions')}
              >
                Attempts
                {getSortIcon('submissions')}
              </button>
              <button
                className="col-span-2 flex items-center justify-center transition-colors hover:text-gray-700"
                onClick={() => handleSort('lastSubmission')}
              >
                Last Submission
                {getSortIcon('lastSubmission')}
              </button>
              {showProblemStatus && problems.length > 0 && (
                <div className="col-span-2 text-center">Problems</div>
              )}
            </div>
          </div>

          {/* Table Body */}
          <AnimatePresence>
            {filteredAndSortedEntries.map((entry, index) => {
              const isCurrentUser = currentUserId === entry.userId
              const successRate = calculateSuccessRate(entry)

              return (
                <motion.div
                  key={entry.userId}
                  ref={isCurrentUser ? currentUserRowRef : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.02 }}
                  layout
                  className={`border-b border-l-4 border-gray-100 px-4 py-3 ${getRankStyle(entry.rank, isCurrentUser)} ${
                    isCurrentUser
                      ? 'border-l-indigo-500'
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="grid grid-cols-12 items-center gap-4">
                    {/* Rank */}
                    <div className="col-span-1 flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {getRankIcon(entry.rank)}
                      </motion.div>
                    </div>

                    {/* Participant */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <div
                            className={`truncate font-medium ${isCurrentUser ? 'text-indigo-900' : 'text-gray-900'}`}
                          >
                            {entry.username}
                            {isCurrentUser && (
                              <span className="ml-2 rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-800">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="col-span-2 text-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="font-semibold text-gray-900"
                      >
                        {entry.totalScore}
                      </motion.div>
                      <div className="text-xs text-gray-500">
                        {successRate}% success
                      </div>
                    </div>

                    {/* Problems Solved */}
                    <div className="col-span-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="h-3 w-3 text-green-500" />
                        <span className="font-medium text-gray-900">
                          {entry.problemsSolved}
                        </span>
                      </div>
                    </div>

                    {/* Total Submissions */}
                    <div className="col-span-1 text-center">
                      <span className="text-gray-600">
                        {entry.totalSubmissions}
                      </span>
                    </div>

                    {/* Last Submission */}
                    <div className="col-span-2 text-center">
                      <div className="text-sm text-gray-600">
                        {formatLastSubmission(entry.lastSubmissionTime)}
                      </div>
                    </div>

                    {/* Problem Status */}
                    {showProblemStatus && problems.length > 0 && (
                      <div className="col-span-2 flex flex-wrap justify-center gap-1">
                        {problems.slice(0, 5).map((problem) => {
                          const status = entry.problemStatus?.find(
                            (ps) => ps.problemId === problem.id
                          )
                          return (
                            <motion.div
                              key={problem.id}
                              whileHover={{ scale: 1.2 }}
                              title={`${problem.title}: ${status?.status || 'not attempted'}`}
                            >
                              {getProblemStatusIcon(
                                status?.status || 'not_attempted'
                              )}
                            </motion.div>
                          )
                        })}
                        {problems.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{problems.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedEntries.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-1 items-center justify-center p-8"
        >
          <div className="text-center text-gray-500">
            <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
            {searchQuery || showFilters ? (
              <div>
                <p className="text-sm font-medium">
                  No participants match your filters
                </p>
                <p className="mt-1 text-xs">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <p className="text-sm">No participants yet</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && filteredAndSortedEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-1 items-center justify-center p-8"
        >
          <div className="text-center text-gray-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="mx-auto mb-4 h-8 w-8" />
            </motion.div>
            <p className="text-sm">Loading leaderboard...</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Leaderboard
