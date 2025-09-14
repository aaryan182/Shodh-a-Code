'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Clock,
  Database,
  CheckCircle,
  Circle,
  ChevronRight,
  AlertCircle,
  Code,
  History,
  TestTube,
  User,
} from 'lucide-react'
import {
  ProblemSummaryResponse,
  ProblemDetailResponse,
  ProblemDifficulty,
  SubmissionResponse,
  TestCaseResult,
} from '../../types'
import { SubmissionHistory } from './SubmissionHistory'
import { TestCaseResults } from '../ui/TestCaseResults'
import { submissionAPI } from '../../utils/api'

interface ProblemPanelProps {
  problems: ProblemSummaryResponse[]
  selectedProblemId?: number
  onProblemSelect: (problemId: number) => void
  problemDetails?: ProblemDetailResponse | null
  solvedProblems?: Set<number>
  attemptedProblems?: Set<number>
  currentUserId?: number
  onResubmit?: (code: string, language: any) => void
  className?: string
}

export const ProblemPanel: React.FC<ProblemPanelProps> = ({
  problems,
  selectedProblemId,
  onProblemSelect,
  problemDetails,
  solvedProblems = new Set(),
  attemptedProblems = new Set(),
  currentUserId,
  onResubmit,
  className = '',
}) => {
  const [expandedProblem, setExpandedProblem] = useState<number | null>(
    selectedProblemId || null
  )
  const [activeTab, setActiveTab] = useState<
    'details' | 'submissions' | 'testcases'
  >('details')
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([])
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [loadingTestCases, setLoadingTestCases] = useState(false)

  // Load submissions when problem is selected
  useEffect(() => {
    if (selectedProblemId && currentUserId) {
      loadSubmissions()
    }
  }, [selectedProblemId, currentUserId])

  const loadSubmissions = async () => {
    if (!selectedProblemId || !currentUserId) return

    setLoadingSubmissions(true)
    try {
      const problemSubmissions = await submissionAPI.getProblemSubmissions(
        selectedProblemId,
        currentUserId
      )
      setSubmissions(problemSubmissions)
    } catch (error) {
      console.error('Failed to load submissions:', error)
      setSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const loadTestCaseResults = async (submissionId: number) => {
    setLoadingTestCases(true)
    try {
      const results = await submissionAPI.getTestCaseResults(submissionId)
      setTestCaseResults(results)
    } catch (error) {
      console.error('Failed to load test case results:', error)
      setTestCaseResults([])
    } finally {
      setLoadingTestCases(false)
    }
  }

  const getDifficultyColor = (difficulty: ProblemDifficulty) => {
    switch (difficulty) {
      case 'EASY':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'HARD':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getProblemStatus = (problemId: number) => {
    if (solvedProblems.has(problemId)) {
      return { icon: CheckCircle, color: 'text-green-500', label: 'Solved' }
    } else if (attemptedProblems.has(problemId)) {
      return { icon: AlertCircle, color: 'text-yellow-500', label: 'Attempted' }
    } else {
      return { icon: Circle, color: 'text-gray-400', label: 'Not attempted' }
    }
  }

  const handleProblemClick = (problemId: number) => {
    onProblemSelect(problemId)
    setExpandedProblem(problemId)
  }

  const formatTimeLimit = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`
    }
    return `${seconds}s`
  }

  const formatMemoryLimit = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)}GB`
    }
    return `${mb}MB`
  }

  return (
    <div
      className={`flex h-full flex-col border-r border-gray-200 bg-white ${className}`}
    >
      {/* Problems List Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <FileText className="h-5 w-5" />
          Problems ({problems.length})
        </h2>
      </div>

      {/* Problems List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {problems.map((problem, index) => {
            const status = getProblemStatus(problem.id)
            const StatusIcon = status.icon
            const isSelected = selectedProblemId === problem.id
            const isExpanded = expandedProblem === problem.id

            return (
              <div key={problem.id} className="relative">
                {/* Problem Item */}
                <button
                  onClick={() => handleProblemClick(problem.id)}
                  className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                    isSelected
                      ? 'border-r-2 border-indigo-500 bg-indigo-50'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {/* Problem Index */}
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {String.fromCharCode(65 + index)}
                      </span>

                      {/* Problem Info */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="truncate font-medium text-gray-900">
                            {problem.title}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getDifficultyColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty}
                          </span>
                        </div>

                        {/* Problem Stats */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeLimit(problem.timeLimit)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            <span>
                              {formatMemoryLimit(problem.memoryLimit)}
                            </span>
                          </div>
                          {problem.totalSubmissions !== undefined && (
                            <div className="flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              <span>
                                {problem.acceptedSubmissions || 0}/
                                {problem.totalSubmissions}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status and Expand */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <StatusIcon
                        className={`h-4 w-4 ${status.color}`}
                        title={status.label}
                      />
                      <ChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90 transform' : ''
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Problem Details (Expanded) */}
                {isExpanded &&
                  problemDetails &&
                  problemDetails.id === problem.id && (
                    <div className="border-t border-gray-100 bg-white">
                      {/* Tab Navigation */}
                      <div className="flex border-b border-gray-200 bg-gray-50">
                        <button
                          onClick={() => setActiveTab('details')}
                          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'details'
                              ? 'border-b-2 border-indigo-600 bg-white text-indigo-600'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                          Problem Details
                        </button>

                        {currentUserId && (
                          <>
                            <button
                              onClick={() => setActiveTab('submissions')}
                              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'submissions'
                                  ? 'border-b-2 border-indigo-600 bg-white text-indigo-600'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                              }`}
                            >
                              <History className="h-4 w-4" />
                              My Submissions
                              {submissions.length > 0 && (
                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                                  {submissions.length}
                                </span>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setActiveTab('testcases')
                                // Load test case results for the most recent submission
                                const recentSubmission = submissions.find(
                                  (s) => s.testCaseResults?.length
                                )
                                if (
                                  recentSubmission &&
                                  recentSubmission.testCaseResults
                                ) {
                                  setTestCaseResults(
                                    recentSubmission.testCaseResults
                                  )
                                } else if (submissions.length > 0) {
                                  loadTestCaseResults(
                                    submissions[0].submissionId
                                  )
                                }
                              }}
                              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'testcases'
                                  ? 'border-b-2 border-indigo-600 bg-white text-indigo-600'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                              }`}
                            >
                              <TestTube className="h-4 w-4" />
                              Test Results
                            </button>
                          </>
                        )}
                      </div>

                      {/* Tab Content */}
                      <div className="p-4">
                        {activeTab === 'details' && (
                          <div className="space-y-4">
                            {/* Description */}
                            <div>
                              <h4 className="mb-2 text-sm font-medium text-gray-900">
                                Description
                              </h4>
                              <div className="prose prose-sm max-w-none text-sm text-gray-700">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: problemDetails.description.replace(
                                      /\n/g,
                                      '<br />'
                                    ),
                                  }}
                                />
                              </div>
                            </div>

                            {/* Input/Output Format */}
                            {(problemDetails.inputFormat ||
                              problemDetails.outputFormat) && (
                              <div className="grid grid-cols-1 gap-3">
                                {problemDetails.inputFormat && (
                                  <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-900">
                                      Input Format
                                    </h4>
                                    <p className="rounded border bg-gray-50 p-2 font-mono text-sm text-gray-600">
                                      {problemDetails.inputFormat}
                                    </p>
                                  </div>
                                )}
                                {problemDetails.outputFormat && (
                                  <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-900">
                                      Output Format
                                    </h4>
                                    <p className="rounded border bg-gray-50 p-2 font-mono text-sm text-gray-600">
                                      {problemDetails.outputFormat}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Constraints */}
                            {problemDetails.constraints && (
                              <div>
                                <h4 className="mb-1 text-sm font-medium text-gray-900">
                                  Constraints
                                </h4>
                                <p className="rounded border bg-gray-50 p-2 font-mono text-sm text-gray-600">
                                  {problemDetails.constraints}
                                </p>
                              </div>
                            )}

                            {/* Limits Summary */}
                            <div className="flex items-center justify-between rounded border bg-gray-50 p-3">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Time:{' '}
                                    {formatTimeLimit(problemDetails.timeLimit)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Database className="h-4 w-4" />
                                  <span>
                                    Memory:{' '}
                                    {formatMemoryLimit(
                                      problemDetails.memoryLimit
                                    )}
                                  </span>
                                </div>
                              </div>
                              {problemDetails.totalSubmissions !==
                                undefined && (
                                <div className="text-sm text-gray-500">
                                  Success Rate:{' '}
                                  {problemDetails.totalSubmissions > 0
                                    ? Math.round(
                                        ((problemDetails.acceptedSubmissions ||
                                          0) /
                                          problemDetails.totalSubmissions) *
                                          100
                                      )
                                    : 0}
                                  %
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {activeTab === 'submissions' && currentUserId && (
                          <SubmissionHistory
                            problemId={selectedProblemId}
                            userId={currentUserId}
                            submissions={submissions}
                            loading={loadingSubmissions}
                            onResubmit={onResubmit}
                            className="border-0 bg-transparent"
                          />
                        )}

                        {activeTab === 'testcases' && (
                          <TestCaseResults
                            testCaseResults={testCaseResults}
                            loading={loadingTestCases}
                            showDetails={true}
                            className="border-0 bg-transparent"
                          />
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty State */}
      {problems.length === 0 && (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-sm">No problems available</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProblemPanel
