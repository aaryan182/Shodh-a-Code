'use client'

import React, { useState, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Medal,
  Award,
  User,
  RefreshCw,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Timer,
  Minus,
} from 'lucide-react'
import {
  LeaderboardEntry,
  LeaderboardResponse,
  ProblemStatus,
} from '../../types'
import { Button } from '../ui/Button'
import { ConnectionStatus } from '../ui/ConnectionStatus'
import { VirtualScrollList } from '../ui/VirtualScrollList'
import { useLeaderboard } from '../../hooks/useLeaderboard'

interface OptimizedLeaderboardProps {
  contestId: number
  currentUserId?: number
  className?: string
  compact?: boolean
  autoStart?: boolean
  showControls?: boolean
  interval?: number
  showProblemStatus?: boolean
  problems?: Array<{ id: number; title: string }>
  maxHeight?: number
}

type SortField =
  | 'rank'
  | 'username'
  | 'score'
  | 'problemsSolved'
  | 'totalSubmissions'
  | 'lastSubmissionTime'
type SortDirection = 'asc' | 'desc'

interface FilterState {
  search: string
  minScore: number
  maxScore: number
  minProblems: number
  maxProblems: number
  showOnlyCurrentUser: boolean
}

// Memoized individual leaderboard row component
const LeaderboardRow = memo<{
  entry: LeaderboardEntry
  isCurrentUser: boolean
  compact: boolean
  showProblemStatus: boolean
  problems?: Array<{ id: number; title: string }>
  index: number
}>(({ entry, isCurrentUser, compact, showProblemStatus, problems, index }) => {
  // Memoize rank styling
  const rankStyling = useMemo(() => {
    if (entry.rank === 1)
      return {
        icon: Trophy,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      }
    if (entry.rank === 2)
      return {
        icon: Medal,
        color: 'text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-800/20',
      }
    if (entry.rank === 3)
      return {
        icon: Award,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
      }
    return { icon: User, color: 'text-gray-600', bg: '' }
  }, [entry.rank])

  // Memoize problem status icons
  const problemStatusIcons = useMemo(() => {
    if (!showProblemStatus || !entry.problemStatus || !problems) return null

    return problems.map((problem) => {
      const status = entry.problemStatus?.[problem.id] || 'not_attempted'
      const getStatusIcon = () => {
        switch (status) {
          case 'solved':
            return <CheckCircle className="h-3 w-3 text-green-500" />
          case 'failed':
            return <XCircle className="h-3 w-3 text-red-500" />
          case 'pending':
            return <Timer className="h-3 w-3 text-yellow-500" />
          default:
            return <Minus className="h-3 w-3 text-gray-400" />
        }
      }

      return (
        <div
          key={problem.id}
          title={`${problem.title}: ${status}`}
          className="inline-block"
        >
          {getStatusIcon()}
        </div>
      )
    })
  }, [showProblemStatus, entry.problemStatus, problems])

  const { icon: RankIcon, color, bg } = rankStyling

  return (
    <motion.div
      className={`
        flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:shadow-md
        ${
          isCurrentUser
            ? 'border-blue-200 bg-blue-50 ring-2 ring-blue-200 dark:border-blue-800 dark:bg-blue-900/20 dark:ring-blue-800'
            : `dark:hover:bg-gray-750 border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 ${bg}`
        }
        ${compact ? 'py-2' : 'py-3'}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      {/* Rank */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${bg}`}
      >
        <RankIcon className={`h-5 w-5 ${color}`} />
        <span className={`ml-1 text-xs font-bold ${color}`}>{entry.rank}</span>
      </div>

      {/* Username */}
      <div className="min-w-0 flex-1">
        <div
          className={`truncate font-semibold ${isCurrentUser ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}
        >
          {entry.username}
        </div>
        {!compact && entry.lastSubmissionTime && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last: {new Date(entry.lastSubmissionTime).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {entry.totalScore}
        </div>
        {!compact && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {entry.problemsSolved} solved
          </div>
        )}
      </div>

      {/* Problems Solved */}
      <div className="min-w-[60px] text-center">
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          {entry.problemsSolved}
        </div>
        {!compact && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            / {entry.totalSubmissions}
          </div>
        )}
      </div>

      {/* Problem Status Icons */}
      {showProblemStatus && !compact && (
        <div className="flex min-w-[100px] gap-1">{problemStatusIcons}</div>
      )}
    </motion.div>
  )
})

LeaderboardRow.displayName = 'LeaderboardRow'

// Main optimized leaderboard component
export const OptimizedLeaderboard: React.FC<OptimizedLeaderboardProps> = memo(
  ({
    contestId,
    currentUserId,
    className = '',
    compact = false,
    autoStart = true,
    showControls = true,
    interval = 20000,
    showProblemStatus = false,
    problems = [],
    maxHeight = 600,
  }) => {
    // State management
    const [sortField, setSortField] = useState<SortField>('rank')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [filters, setFilters] = useState<FilterState>({
      search: '',
      minScore: 0,
      maxScore: Infinity,
      minProblems: 0,
      maxProblems: Infinity,
      showOnlyCurrentUser: false,
    })

    // Use the leaderboard hook
    const {
      data,
      loading,
      error,
      connectionStatus,
      isPolling,
      startPolling,
      stopPolling,
      refresh,
      clearCache,
    } = useLeaderboard(contestId, {
      interval,
      autoStart,
    })

    // Memoized sorting function
    const sortEntries = useCallback(
      (entries: LeaderboardEntry[]) => {
        return [...entries].sort((a, b) => {
          let aValue: any = a[sortField]
          let bValue: any = b[sortField]

          // Handle special cases
          if (sortField === 'lastSubmissionTime') {
            aValue = aValue ? new Date(aValue).getTime() : 0
            bValue = bValue ? new Date(bValue).getTime() : 0
          }

          if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
          }

          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
          return sortDirection === 'asc' ? comparison : -comparison
        })
      },
      [sortField, sortDirection]
    )

    // Memoized filtering function
    const filterEntries = useCallback(
      (entries: LeaderboardEntry[]) => {
        return entries.filter((entry) => {
          // Search filter
          if (
            filters.search &&
            !entry.username.toLowerCase().includes(filters.search.toLowerCase())
          ) {
            return false
          }

          // Score range filter
          if (
            entry.totalScore < filters.minScore ||
            entry.totalScore > filters.maxScore
          ) {
            return false
          }

          // Problems solved range filter
          if (
            entry.problemsSolved < filters.minProblems ||
            entry.problemsSolved > filters.maxProblems
          ) {
            return false
          }

          // Current user filter
          if (filters.showOnlyCurrentUser && entry.userId !== currentUserId) {
            return false
          }

          return true
        })
      },
      [filters, currentUserId]
    )

    // Memoized processed entries
    const processedEntries = useMemo(() => {
      if (!data?.entries) return []

      const filtered = filterEntries(data.entries)
      const sorted = sortEntries(filtered)

      return sorted
    }, [data?.entries, filterEntries, sortEntries])

    // Memoized render item function for virtual scrolling
    const renderLeaderboardItem = useCallback(
      (entry: LeaderboardEntry, index: number) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          isCurrentUser={entry.userId === currentUserId}
          compact={compact}
          showProblemStatus={showProblemStatus}
          problems={problems}
          index={index}
        />
      ),
      [currentUserId, compact, showProblemStatus, problems]
    )

    // Memoized get item key function
    const getItemKey = useCallback(
      (entry: LeaderboardEntry) => entry.userId,
      []
    )

    // Memoized export function
    const exportToCsv = useCallback(() => {
      if (!processedEntries.length) return

      const headers = [
        'Rank',
        'Username',
        'Total Score',
        'Problems Solved',
        'Total Submissions',
      ]
      const csvContent = [
        headers.join(','),
        ...processedEntries.map((entry) =>
          [
            entry.rank,
            entry.username,
            entry.totalScore,
            entry.problemsSolved,
            entry.totalSubmissions,
          ].join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contest-${contestId}-leaderboard.csv`
      a.click()
      URL.revokeObjectURL(url)
    }, [processedEntries, contestId])

    // Calculate item height based on compact mode
    const itemHeight = compact ? 60 : 80

    // Loading skeleton
    if (loading && !data) {
      return (
        <div className={`leaderboard-container ${className}`}>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>
      )
    }

    // Error state
    if (error) {
      return (
        <div className={`leaderboard-container ${className}`}>
          <div className="py-8 text-center">
            <p className="mb-4 text-red-600 dark:text-red-400">
              Failed to load leaderboard: {error.message}
            </p>
            <Button onClick={refresh} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className={`leaderboard-container ${className}`}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Leaderboard
            </h2>
            <ConnectionStatus status={connectionStatus} size="sm" />
            {data && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {processedEntries.length} participants
              </span>
            )}
          </div>

          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                onClick={isPolling ? stopPolling : startPolling}
                variant="outline"
                size="sm"
              >
                {isPolling ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={refresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={exportToCsv} variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search participants..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Virtual Scrolled Leaderboard */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          {processedEntries.length > 0 ? (
            <VirtualScrollList
              items={processedEntries}
              itemHeight={itemHeight}
              containerHeight={maxHeight}
              renderItem={renderLeaderboardItem}
              getItemKey={getItemKey}
              className="space-y-2 p-2"
              overscan={3}
              loading={loading}
            />
          ) : (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No participants found</p>
            </div>
          )}
        </div>
      </div>
    )
  }
)

OptimizedLeaderboard.displayName = 'OptimizedLeaderboard'

export default OptimizedLeaderboard
