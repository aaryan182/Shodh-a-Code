'use client'

import React, { useState, useEffect } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Code,
  Timer,
  Database,
  RefreshCw,
  Eye,
  X,
  Play,
  Pause,
} from 'lucide-react'
import {
  SubmissionResponse,
  SubmissionStatusResponse,
  SubmissionStatus,
} from '../../types'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ConnectionStatus } from '../ui/ConnectionStatus'
import { useSubmissionStatus } from '../../hooks/useSubmissionStatus'

interface SubmissionStatusProps {
  submissionId: number | null
  initialSubmission?: SubmissionResponse | SubmissionStatusResponse | null
  onStatusChange?: (status: SubmissionStatusResponse) => void
  onComplete?: (
    status: SubmissionStatusResponse | null,
    error: Error | null
  ) => void
  autoStart?: boolean
  className?: string
  showDetails?: boolean
  showControls?: boolean
}

interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  label: string
  description: string
}

const STATUS_CONFIG: Record<SubmissionStatus, StatusConfig> = {
  PENDING: {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    label: 'Pending',
    description: 'Submission received and waiting to be processed',
  },
  QUEUED: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    label: 'Queued',
    description: 'Submission is in the execution queue',
  },
  RUNNING: {
    icon: Loader2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    label: 'Running',
    description: 'Code is currently being executed and tested',
  },
  ACCEPTED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    label: 'Accepted',
    description: 'Solution passed all test cases successfully',
  },
  WRONG_ANSWER: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    label: 'Wrong Answer',
    description:
      'Solution produced incorrect output for one or more test cases',
  },
  TIME_LIMIT_EXCEEDED: {
    icon: Timer,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    label: 'Time Limit Exceeded',
    description: 'Solution took too long to execute',
  },
  MEMORY_LIMIT_EXCEEDED: {
    icon: Database,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    label: 'Memory Limit Exceeded',
    description: 'Solution used more memory than allowed',
  },
  RUNTIME_ERROR: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    label: 'Runtime Error',
    description: 'Solution crashed during execution',
  },
  COMPILATION_ERROR: {
    icon: Code,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    label: 'Compilation Error',
    description: 'Code failed to compile',
  },
  PRESENTATION_ERROR: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    label: 'Presentation Error',
    description: 'Output format is incorrect',
  },
  SYSTEM_ERROR: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    label: 'System Error',
    description: 'Internal system error occurred',
  },
}

export const SubmissionStatus: React.FC<SubmissionStatusProps> = ({
  submissionId,
  initialSubmission = null,
  onStatusChange,
  onComplete,
  autoStart = true,
  className = '',
  showDetails = true,
  showControls = true,
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Use the custom hook for real-time updates
  const {
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
  } = useSubmissionStatus(submissionId, {
    autoStart,
    onStatusChange,
    onComplete,
    interval: 2500,
    maxAttempts: 120,
  })

  // Use hook status or fall back to initial submission
  const submission = status || initialSubmission

  const formatExecutionTime = (time?: number) => {
    if (time === undefined || time === null) return 'N/A'
    if (time < 1000) return `${time}ms`
    return `${(time / 1000).toFixed(2)}s`
  }

  const formatMemoryUsage = (memory?: number) => {
    if (memory === undefined || memory === null) return 'N/A'
    if (memory < 1024) return `${memory}KB`
    return `${(memory / 1024).toFixed(2)}MB`
  }

  if (!submission) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}
      >
        <div className="text-center text-gray-500">
          <Code className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No submission yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Submit your code to see status
          </p>
          {submissionId && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={startPolling}
                disabled={loading}
              >
                Start Monitoring
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const config = STATUS_CONFIG[submission.status]
  const StatusIcon = config.icon
  const isAnimated = ['QUEUED', 'RUNNING'].includes(submission.status)

  return (
    <>
      <div
        className={`rounded-lg border border-gray-200 bg-white ${className}`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Submission Status
            </h3>
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <ConnectionStatus
                status={connectionStatus}
                size="sm"
                showLabel={false}
              />

              {/* Controls */}
              {showControls && (
                <div className="flex items-center gap-1">
                  {isPolling ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={pausePolling}
                      title="Pause polling"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startPolling}
                      disabled={isCompleted}
                      title="Start polling"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={retry}
                    disabled={loading}
                    loading={loading}
                    title="Retry now"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    title="Reset status"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Status Info */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {isPolling && (
                <span className="flex items-center gap-1">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-green-500"></div>
                  Polling active
                </span>
              )}
              {isCompleted && <span className="text-green-600">Completed</span>}
            </div>

            {error && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {error.message}
              </div>
            )}
          </div>
        </div>

        {/* Status Content */}
        <div className="p-4">
          {/* Main Status */}
          <div className={`rounded-lg border p-4 ${config.bgColor}`}>
            <div className="flex items-center gap-3">
              <StatusIcon
                className={`h-6 w-6 ${config.color} ${isAnimated ? 'animate-spin' : ''}`}
              />
              <div className="min-w-0 flex-1">
                <h4 className={`font-semibold ${config.color}`}>
                  {config.label}
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  {config.description}
                </p>
              </div>
              {showDetails && 'id' in submission && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(true)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Additional Status Info */}
            {submission.result && (
              <div className="mt-3 rounded border bg-white bg-opacity-50 p-3">
                <p className="mb-1 text-sm font-medium text-gray-700">
                  Result:
                </p>
                <p className="font-mono text-sm text-gray-600">
                  {submission.result}
                </p>
              </div>
            )}
          </div>

          {/* Execution Metrics */}
          {'executionTime' in submission &&
            (submission.executionTime !== undefined ||
              submission.memoryUsed !== undefined ||
              submission.score !== undefined) && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {submission.executionTime !== undefined && (
                  <div className="rounded-lg border bg-gray-50 p-3 text-center">
                    <Timer className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                    <div className="text-sm font-semibold text-gray-900">
                      {formatExecutionTime(submission.executionTime)}
                    </div>
                    <div className="text-xs text-gray-500">Execution Time</div>
                  </div>
                )}

                {submission.memoryUsed !== undefined && (
                  <div className="rounded-lg border bg-gray-50 p-3 text-center">
                    <Database className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                    <div className="text-sm font-semibold text-gray-900">
                      {formatMemoryUsage(submission.memoryUsed)}
                    </div>
                    <div className="text-xs text-gray-500">Memory Used</div>
                  </div>
                )}

                {submission.score !== undefined && (
                  <div className="rounded-lg border bg-gray-50 p-3 text-center">
                    <CheckCircle className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                    <div className="text-sm font-semibold text-gray-900">
                      {submission.score}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                )}
              </div>
            )}

          {/* Submission Info */}
          {'submittedAt' in submission && submission.submittedAt && (
            <div className="mt-4 rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Submitted:</span>
                <time className="font-medium text-gray-900">
                  {new Date(submission.submittedAt).toLocaleString()}
                </time>
              </div>
              {'language' in submission && submission.language && (
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium text-gray-900">
                    {submission.language}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && 'id' in submission && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Submission Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Submission ID
                </label>
                <p className="font-mono text-sm text-gray-900">
                  {submission.id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <p className={`text-sm font-medium ${config.color}`}>
                  {config.label}
                </p>
              </div>
            </div>

            {'language' in submission && submission.language && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Language
                </label>
                <p className="text-sm text-gray-900">{submission.language}</p>
              </div>
            )}

            {submission.result && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Result Details
                </label>
                <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-3 font-mono text-sm text-gray-900">
                  {submission.result}
                </pre>
              </div>
            )}

            {'code' in submission && submission.code && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Submitted Code
                </label>
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded border bg-gray-50 p-3 font-mono text-sm text-gray-900">
                  {submission.code}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

export default SubmissionStatus
