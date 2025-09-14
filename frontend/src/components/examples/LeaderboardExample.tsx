'use client'

import React from 'react'
import { Leaderboard } from '../contest/Leaderboard'

/**
 * Example usage of the enhanced Leaderboard component
 * 
 * This component demonstrates all the features of the Leaderboard:
 * - Real-time updates with polling
 * - Search and filtering capabilities
 * - Sorting functionality
 * - Export feature
 * - Problem status visualization
 * - Responsive design
 * - Smooth animations
 */

export const LeaderboardExample: React.FC = () => {
  const contestId = 1
  const currentUserId = 2 // Bob's user ID for demonstration

  // Mock problems data for problem status visualization
  const problems = [
    { id: 1, title: 'Two Sum' },
    { id: 2, title: 'Reverse String' },
    { id: 3, title: 'Binary Search' },
    { id: 4, title: 'Merge Sort' },
    { id: 5, title: 'Graph Traversal' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Enhanced Leaderboard Demo
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive leaderboard with real-time updates, search, filtering, and animations
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <Leaderboard
              contestId={contestId}
              currentUserId={currentUserId}
              className="h-[800px]"
              autoStart={true}
              showControls={true}
              showProblemStatus={true}
              problems={problems}
              interval={15000} // 15 seconds for demo
            />
          </div>

          {/* Compact Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Leaderboard
                contestId={contestId}
                currentUserId={currentUserId}
                compact={true}
                autoStart={true}
                showControls={false}
                interval={20000}
              />

              {/* Feature List */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 font-semibold text-gray-900">Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Real-time updates
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    Search participants
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    Filter by score/solved
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    Sort by any column
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    Export to CSV
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    Problem status icons
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                    Auto-scroll to user
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                    Smooth animations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                    Responsive design
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                    Connection status
                  </li>
                </ul>
              </div>

              {/* Usage Tips */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 font-semibold text-gray-900">Usage Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use search to find specific participants</li>
                  <li>• Click column headers to sort</li>
                  <li>• Toggle filters for advanced filtering</li>
                  <li>• Click "My Rank" to focus on your position</li>
                  <li>• Export button downloads CSV file</li>
                  <li>• Problem icons show attempt status</li>
                  <li>• Auto-refresh can be paused/resumed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardExample
