'use client'

import React, { useState } from 'react'
import { useSubmissionStatus, useLeaderboard } from '../../hooks'
import { SubmissionStatus } from '../contest/SubmissionStatus'
import { Leaderboard } from '../contest/Leaderboard'
import { Button } from '../ui/Button'
import { ConnectionStatus } from '../ui/ConnectionStatus'

/**
 * Example component demonstrating how to use the real-time hooks
 */
export const HooksUsageExample: React.FC = () => {
  const [submissionId, setSubmissionId] = useState<number | null>(123)
  const [contestId] = useState<number>(1)

  // Example 1: Direct hook usage for submission status
  const submissionHook = useSubmissionStatus(submissionId, {
    interval: 3000, // 3 seconds
    autoStart: true,
    onStatusChange: (status) => {
      console.log('Submission status changed:', status)
    },
    onComplete: (status, error) => {
      if (error) {
        console.error('Submission polling failed:', error)
      } else {
        console.log('Submission completed:', status)
      }
    },
  })

  // Example 2: Direct hook usage for leaderboard
  const leaderboardHook = useLeaderboard(contestId, {
    interval: 15000, // 15 seconds
    autoStart: true,
    onUpdate: (data) => {
      console.log('Leaderboard updated:', data.entries.length, 'participants')
    },
    onError: (error) => {
      console.error('Leaderboard error:', error)
    },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Real-Time Hooks Demo
        </h1>
        <p className="text-gray-600">
          Demonstrating useSubmissionStatus and useLeaderboard hooks with
          real-time updates
        </p>
      </div>

      {/* Submission Status Example */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Submission Status Hook
          </h2>
          <div className="flex items-center gap-3">
            <ConnectionStatus
              status={submissionHook.connectionStatus}
              showLabel={true}
              size="md"
            />
            <span className="text-sm text-gray-500">
              Submission ID: {submissionId || 'None'}
            </span>
          </div>
        </div>

        {/* Hook Controls */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3">
          <Button
            variant={submissionHook.isPolling ? 'secondary' : 'primary'}
            size="sm"
            onClick={
              submissionHook.isPolling
                ? submissionHook.stopPolling
                : submissionHook.startPolling
            }
          >
            {submissionHook.isPolling ? 'Stop Polling' : 'Start Polling'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={submissionHook.pausePolling}
            disabled={!submissionHook.isPolling}
          >
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={submissionHook.resumePolling}
            disabled={!submissionHook.isPolling}
          >
            Resume
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={submissionHook.retry}
            disabled={submissionHook.loading}
          >
            Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={submissionHook.reset}>
            Reset
          </Button>
          <div className="ml-4 text-sm text-gray-600">
            Status: {submissionHook.status?.status || 'No data'} | Loading:{' '}
            {submissionHook.loading ? 'Yes' : 'No'} | Completed:{' '}
            {submissionHook.isCompleted ? 'Yes' : 'No'}
          </div>
        </div>

        {/* Component Usage */}
        <SubmissionStatus
          submissionId={submissionId}
          autoStart={false} // Controlled manually above
          showControls={false} // Hide controls since we show them above
        />
      </div>

      {/* Leaderboard Example */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Leaderboard Hook
          </h2>
          <div className="flex items-center gap-3">
            <ConnectionStatus
              status={leaderboardHook.connectionStatus}
              showLabel={true}
              size="md"
            />
            <span className="text-sm text-gray-500">
              Contest ID: {contestId}
            </span>
          </div>
        </div>

        {/* Hook Controls */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3">
          <Button
            variant={leaderboardHook.isPolling ? 'secondary' : 'primary'}
            size="sm"
            onClick={
              leaderboardHook.isPolling
                ? leaderboardHook.stopPolling
                : leaderboardHook.startPolling
            }
          >
            {leaderboardHook.isPolling ? 'Stop Polling' : 'Start Polling'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={leaderboardHook.pausePolling}
            disabled={!leaderboardHook.isPolling}
          >
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={leaderboardHook.resumePolling}
            disabled={!leaderboardHook.isPolling}
          >
            Resume
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={leaderboardHook.refresh}
            disabled={leaderboardHook.loading}
          >
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={leaderboardHook.clearCache}
          >
            Clear Cache
          </Button>
          <div className="ml-4 text-sm text-gray-600">
            Participants: {leaderboardHook.data?.totalParticipants || 0} | From
            Cache: {leaderboardHook.isFromCache ? 'Yes' : 'No'} | Last Updated:{' '}
            {leaderboardHook.lastUpdated?.toLocaleTimeString() || 'Never'}
          </div>
        </div>

        {/* Component Usage */}
        <Leaderboard
          contestId={contestId}
          currentUserId={1}
          autoStart={false} // Controlled manually above
          showControls={false} // Hide controls since we show them above
        />
      </div>

      {/* Hook Features Summary */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 text-lg font-semibold text-blue-900">
          🚀 Hook Features Implemented
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium text-blue-800">
              useSubmissionStatus
            </h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>✅ Polls every 2-3 seconds (configurable)</li>
              <li>✅ Auto-stops when submission completes</li>
              <li>✅ Exponential backoff for failed requests</li>
              <li>✅ Connection status indicator</li>
              <li>✅ Pause/resume functionality</li>
              <li>✅ Cleanup on component unmount</li>
              <li>✅ Manual retry and reset</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-blue-800">useLeaderboard</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>✅ Polls every 15-30 seconds (configurable)</li>
              <li>✅ Caches previous results</li>
              <li>✅ Shows loading states with cached data</li>
              <li>✅ Exponential backoff for failures</li>
              <li>✅ Connection status indicator</li>
              <li>✅ Pause/resume functionality</li>
              <li>✅ Manual refresh and cache management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export { HooksUsageExample }
export default HooksUsageExample
