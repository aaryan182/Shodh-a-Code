'use client'

import React, { useState, useMemo } from 'react'
import {
  Clock,
  Database,
  Code,
  Eye,
  RotateCcw,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react'
import {
  SubmissionHistoryProps,
  SubmissionResponse,
  SubmissionStatus,
  ProgrammingLanguage,
} from '../../types'
import { CodeViewer } from '../ui/CodeViewer'
import { Modal } from '../ui/Modal'

type StatusFilter = 'ALL' | SubmissionStatus

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  problemId,
  userId,
  submissions,
  loading = false,
  onViewCode,
  onResubmit,
  className = '',
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionResponse | null>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [sortBy, setSortBy] = useState<'submittedAt' | 'status' | 'score'>(
    'submittedAt'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort submissions
  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((sub) => sub.status === statusFilter)
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'submittedAt':
          aVal = new Date(a.submittedAt || 0).getTime()
          bVal = new Date(b.submittedAt || 0).getTime()
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'score':
          aVal = a.score || 0
          bVal = b.score || 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [submissions, statusFilter, sortBy, sortOrder])

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'WRONG_ANSWER':
      case 'TIME_LIMIT_EXCEEDED':
      case 'MEMORY_LIMIT_EXCEEDED':
      case 'RUNTIME_ERROR':
      case 'COMPILATION_ERROR':
      case 'PRESENTATION_ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'PENDING':
      case 'QUEUED':
      case 'RUNNING':
        return <Loader className="h-4 w-4 animate-spin text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return 'text-green-600 bg-green-50'
      case 'WRONG_ANSWER':
      case 'TIME_LIMIT_EXCEEDED':
      case 'MEMORY_LIMIT_EXCEEDED':
      case 'RUNTIME_ERROR':
      case 'COMPILATION_ERROR':
      case 'PRESENTATION_ERROR':
        return 'text-red-600 bg-red-50'
      case 'PENDING':
      case 'QUEUED':
      case 'RUNNING':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-yellow-600 bg-yellow-50'
    }
  }

  const formatStatus = (status: SubmissionStatus) => {
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatTime = (time?: number) => {
    if (!time) return 'N/A'
    if (time < 1000) return `${time}ms`
    return `${(time / 1000).toFixed(2)}s`
  }

  const formatMemory = (memory?: number) => {
    if (!memory) return 'N/A'
    if (memory < 1024) return `${memory}KB`
    return `${(memory / 1024).toFixed(2)}MB`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const handleViewCode = (submission: SubmissionResponse) => {
    setSelectedSubmission(submission)
    setShowCodeModal(true)
    onViewCode?.(submission)
  }

  const handleResubmit = (submission: SubmissionResponse) => {
    if (submission.code && onResubmit) {
      onResubmit(submission.code, submission.language || 'JAVA')
    }
  }

  const handleSort = (field: 'submittedAt' | 'status' | 'score') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: 'submittedAt' | 'status' | 'score') => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  if (loading) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/4 rounded bg-gray-200"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                <div className="h-4 flex-1 rounded bg-gray-200"></div>
                <div className="h-4 w-16 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Submission History
            </h3>
            <span className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-500">
              {filteredAndSortedSubmissions.length} submissions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                showFilters
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="ALL">All</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="WRONG_ANSWER">Wrong Answer</option>
                  <option value="TIME_LIMIT_EXCEEDED">
                    Time Limit Exceeded
                  </option>
                  <option value="MEMORY_LIMIT_EXCEEDED">
                    Memory Limit Exceeded
                  </option>
                  <option value="RUNTIME_ERROR">Runtime Error</option>
                  <option value="COMPILATION_ERROR">Compilation Error</option>
                  <option value="PENDING">Pending</option>
                  <option value="RUNNING">Running</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="divide-y divide-gray-200">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
          <div className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-3">
              <button
                onClick={() => handleSort('submittedAt')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Submitted At
                {getSortIcon('submittedAt')}
              </button>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('status')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Status
                {getSortIcon('status')}
              </button>
            </div>
            <div className="col-span-1">Language</div>
            <div className="col-span-1">
              <button
                onClick={() => handleSort('score')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Score
                {getSortIcon('score')}
              </button>
            </div>
            <div className="col-span-1">Time</div>
            <div className="col-span-1">Memory</div>
            <div className="col-span-3">Actions</div>
          </div>
        </div>

        {/* Submissions */}
        {filteredAndSortedSubmissions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Code className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-sm">
              {statusFilter === 'ALL'
                ? 'No submissions found'
                : `No ${formatStatus(statusFilter as SubmissionStatus).toLowerCase()} submissions`}
            </p>
          </div>
        ) : (
          filteredAndSortedSubmissions.map((submission) => (
            <div
              key={submission.submissionId}
              className="px-6 py-4 transition-colors hover:bg-gray-50"
            >
              <div className="grid grid-cols-12 items-center gap-4">
                {/* Submitted At */}
                <div className="col-span-3 text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(submission.submittedAt)}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission.status)}
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(submission.status)}`}
                    >
                      {formatStatus(submission.status)}
                    </span>
                  </div>
                </div>

                {/* Language */}
                <div className="col-span-1 text-sm text-gray-600">
                  {submission.language?.toLowerCase() || 'N/A'}
                </div>

                {/* Score */}
                <div className="col-span-1 text-sm font-medium text-gray-900">
                  {submission.score !== undefined ? submission.score : 'N/A'}
                </div>

                {/* Time */}
                <div className="col-span-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(submission.executionTime)}
                  </div>
                </div>

                {/* Memory */}
                <div className="col-span-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {formatMemory(submission.memoryUsed)}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-3 flex items-center gap-2">
                  <button
                    onClick={() => handleViewCode(submission)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-800"
                    title="View code"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>

                  {submission.code && onResubmit && (
                    <button
                      onClick={() => handleResubmit(submission)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-green-600 transition-colors hover:bg-green-50 hover:text-green-800"
                      title="Resubmit this solution"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Resubmit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Code Viewer Modal */}
      {showCodeModal && selectedSubmission && (
        <Modal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          title={`Submission #${selectedSubmission.submissionId} - ${formatStatus(selectedSubmission.status)}`}
          size="xl"
        >
          <div className="space-y-4">
            {/* Submission Details */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Submitted:</span>
                <span className="font-medium">
                  {formatDate(selectedSubmission.submittedAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Language:</span>
                <span className="font-medium">
                  {selectedSubmission.language?.toLowerCase()}
                </span>
              </div>
              {selectedSubmission.score !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-medium">
                    {selectedSubmission.score}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {formatTime(selectedSubmission.executionTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Memory:</span>
                <span className="font-medium">
                  {formatMemory(selectedSubmission.memoryUsed)}
                </span>
              </div>
            </div>

            {/* Code */}
            {selectedSubmission.code ? (
              <CodeViewer
                code={selectedSubmission.code}
                language={selectedSubmission.language || 'JAVA'}
                readOnly={true}
                showLineNumbers={true}
              />
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Code className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Code not available for this submission</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              {selectedSubmission.code && onResubmit && (
                <button
                  onClick={() => {
                    handleResubmit(selectedSubmission)
                    setShowCodeModal(false)
                  }}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resubmit This Solution
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SubmissionHistory
