'use client'

import React, { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Code,
} from 'lucide-react'
import { TestCaseResultsProps, TestCaseResult } from '../../types'

export const TestCaseResults: React.FC<TestCaseResultsProps> = ({
  testCaseResults,
  loading = false,
  showDetails = true,
  className = '',
}) => {
  const [expandedTestCase, setExpandedTestCase] = useState<number | null>(null)

  if (loading) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                <div className="h-4 flex-1 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!testCaseResults || testCaseResults.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
      >
        <div className="text-center text-gray-500">
          <Code className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No test case results available</p>
        </div>
      </div>
    )
  }

  const passedCount = testCaseResults.filter((tc) => tc.passed).length
  const totalCount = testCaseResults.length
  const passRate = totalCount > 0 ? (passedCount / totalCount) * 100 : 0

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

  const toggleTestCase = (index: number) => {
    setExpandedTestCase(expandedTestCase === index ? null : index)
  }

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600'
  }

  const getStatusBg = (passed: boolean) => {
    return passed ? 'bg-green-50' : 'bg-red-50'
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Test Case Results
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span
                className={
                  passedCount === totalCount ? 'font-medium text-green-600' : ''
                }
              >
                {passedCount}/{totalCount} passed
              </span>
              <span className="ml-2 text-gray-400">
                ({passRate.toFixed(1)}%)
              </span>
            </div>
            <div
              className={`rounded px-2 py-1 text-xs font-medium ${
                passedCount === totalCount
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {passedCount === totalCount ? 'All Passed' : 'Some Failed'}
            </div>
          </div>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="divide-y divide-gray-200">
        {testCaseResults.map((testCase, index) => {
          const isExpanded = expandedTestCase === index
          const StatusIcon = testCase.passed ? CheckCircle : XCircle

          return (
            <div
              key={testCase.testCaseId || index}
              className={`${getStatusBg(testCase.passed)}`}
            >
              {/* Test Case Header */}
              <button
                onClick={() => toggleTestCase(index)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-opacity-80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon
                      className={`h-5 w-5 ${getStatusColor(testCase.passed)}`}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        Test Case {index + 1}
                      </div>
                      {testCase.error && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Error occurred</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Performance Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(testCase.executionTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        <span>{formatMemory(testCase.memoryUsed)}</span>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    {showDetails && (
                      <div className="text-gray-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Test Case Details */}
              {isExpanded && showDetails && (
                <div className="space-y-3 px-4 pb-4">
                  {/* Input */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Input
                    </label>
                    <pre className="overflow-x-auto rounded border border-gray-200 bg-gray-100 p-2 text-sm">
                      {testCase.input || 'No input'}
                    </pre>
                  </div>

                  {/* Expected Output */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Expected Output
                    </label>
                    <pre className="overflow-x-auto rounded border border-gray-200 bg-gray-100 p-2 text-sm">
                      {testCase.expectedOutput}
                    </pre>
                  </div>

                  {/* Actual Output */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Your Output
                    </label>
                    <pre
                      className={`overflow-x-auto rounded border p-2 text-sm ${
                        testCase.passed
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      {testCase.actualOutput || 'No output'}
                    </pre>
                  </div>

                  {/* Error Message */}
                  {testCase.error && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-red-700">
                        Error
                      </label>
                      <pre className="overflow-x-auto rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                        {testCase.error}
                      </pre>
                    </div>
                  )}

                  {/* Performance Details */}
                  <div className="flex items-center gap-6 border-t border-gray-200 pt-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Execution Time:</span>{' '}
                      {formatTime(testCase.executionTime)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Memory Used:</span>{' '}
                      {formatMemory(testCase.memoryUsed)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TestCaseResults
