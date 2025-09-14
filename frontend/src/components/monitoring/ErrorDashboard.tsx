import React, { useState, useEffect } from 'react'
import { errorLogger } from '../../utils/errorLogger'
import { Button } from '../ui/Button'
import { LoadingState, CardSkeleton } from '../ui/LoadingStates'

interface ErrorLog {
  id: string
  message: string
  level: 'error' | 'warn' | 'info'
  category: string
  timestamp: string
  url: string
  userId?: string
  context?: any
}

interface ErrorStats {
  totalErrors: number
  errorsByCategory: Record<string, number>
  errorsByLevel: Record<string, number>
  recentErrors: ErrorLog[]
}

/**
 * Error monitoring dashboard component
 */
export const ErrorDashboard: React.FC = () => {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  useEffect(() => {
    loadErrorStats()
  }, [])

  const loadErrorStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get stored error logs
      const storedLogs = errorLogger.getStoredLogs()

      // Calculate statistics
      const stats: ErrorStats = {
        totalErrors: storedLogs.length,
        errorsByCategory: {},
        errorsByLevel: {},
        recentErrors: storedLogs
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 50), // Last 50 errors
      }

      // Group by category and level
      storedLogs.forEach((log) => {
        stats.errorsByCategory[log.category] =
          (stats.errorsByCategory[log.category] || 0) + 1
        stats.errorsByLevel[log.level] =
          (stats.errorsByLevel[log.level] || 0) + 1
      })

      setErrorStats(stats)
    } catch (err) {
      setError('Failed to load error statistics')
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearErrorLogs = () => {
    if (window.confirm('Are you sure you want to clear all error logs?')) {
      errorLogger.clearStoredLogs()
      loadErrorStats()
    }
  }

  const exportErrorLogs = () => {
    const logs = errorLogger.getStoredLogs()
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const filteredErrors =
    errorStats?.recentErrors.filter((log) => {
      const categoryMatch =
        selectedCategory === 'all' || log.category === selectedCategory
      const levelMatch = selectedLevel === 'all' || log.level === selectedLevel
      return categoryMatch && levelMatch
    }) || []

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'warn':
        return 'text-yellow-600 bg-yellow-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'javascript':
        return 'text-purple-600 bg-purple-100'
      case 'network':
        return 'text-green-600 bg-green-100'
      case 'api':
        return 'text-blue-600 bg-blue-100'
      case 'user':
        return 'text-indigo-600 bg-indigo-100'
      case 'performance':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Error Dashboard</h1>
        <div className="flex space-x-3">
          <Button onClick={loadErrorStats} variant="secondary" size="sm">
            Refresh
          </Button>
          <Button onClick={exportErrorLogs} variant="secondary" size="sm">
            Export Logs
          </Button>
          <Button onClick={clearErrorLogs} variant="danger" size="sm">
            Clear Logs
          </Button>
        </div>
      </div>

      <LoadingState
        loading={loading}
        error={error}
        onRetry={loadErrorStats}
        loadingComponent={<CardSkeleton />}
      >
        {errorStats && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Total Errors
                </h3>
                <p className="text-3xl font-bold text-red-600">
                  {errorStats.totalErrors}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  By Level
                </h3>
                <div className="space-y-2">
                  {Object.entries(errorStats.errorsByLevel).map(
                    ([level, count]) => (
                      <div key={level} className="flex justify-between">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${getLevelColor(level)}`}
                        >
                          {level.toUpperCase()}
                        </span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  By Category
                </h3>
                <div className="space-y-2">
                  {Object.entries(errorStats.errorsByCategory).map(
                    ([category, count]) => (
                      <div key={category} className="flex justify-between">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${getCategoryColor(category)}`}
                        >
                          {category.toUpperCase()}
                        </span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Filters
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(errorStats.errorsByCategory).map(
                      (category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="all">All Levels</option>
                    {Object.keys(errorStats.errorsByLevel).map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Error List */}
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Errors ({filteredErrors.length})
                </h3>
              </div>
              <div className="max-h-96 divide-y divide-gray-200 overflow-y-auto">
                {filteredErrors.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No errors found matching the selected filters.
                  </div>
                ) : (
                  filteredErrors.map((log) => (
                    <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center space-x-2">
                            <span
                              className={`rounded px-2 py-1 text-xs font-medium ${getLevelColor(log.level)}`}
                            >
                              {log.level.toUpperCase()}
                            </span>
                            <span
                              className={`rounded px-2 py-1 text-xs font-medium ${getCategoryColor(log.category)}`}
                            >
                              {log.category.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="mb-1 text-sm font-medium text-gray-900">
                            {log.message}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {log.url}
                          </p>
                          {log.context && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-blue-600">
                                Show Context
                              </summary>
                              <pre className="mt-1 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-600">
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </LoadingState>
    </div>
  )
}
