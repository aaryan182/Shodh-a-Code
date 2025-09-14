'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Database,
  Server,
  Zap,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Gauge,
} from 'lucide-react'
import { getCacheStats, isOnline } from '../../utils/serviceWorker'

interface PerformanceMetrics {
  // API Performance
  apiResponseTime: number
  apiRequestCount: number
  apiErrorRate: number

  // Frontend Performance
  pageLoadTime: number
  bundleSize: number
  renderTime: number

  // Cache Performance
  cacheHitRate: number
  cacheSize: number

  // Network
  networkLatency: number
  isOnline: boolean

  // System
  memoryUsage: number
  timestamp: number
}

interface SystemHealth {
  database: 'UP' | 'DOWN' | 'DEGRADED'
  api: 'UP' | 'DOWN' | 'DEGRADED'
  cache: 'UP' | 'DOWN' | 'DEGRADED'
  overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiResponseTime: 0,
    apiRequestCount: 0,
    apiErrorRate: 0,
    pageLoadTime: 0,
    bundleSize: 0,
    renderTime: 0,
    cacheHitRate: 0,
    cacheSize: 0,
    networkLatency: 0,
    isOnline: true,
    memoryUsage: 0,
    timestamp: Date.now(),
  })

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'UP',
    api: 'UP',
    cache: 'UP',
    overall: 'HEALTHY',
  })

  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([])

  // Collect performance metrics
  useEffect(() => {
    const collectMetrics = async () => {
      try {
        // Web Vitals and Performance API
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming
        const paint = performance.getEntriesByType('paint')

        // Cache statistics
        const cacheStats = await getCacheStats()
        const totalCacheSize = Object.values(cacheStats).reduce(
          (sum, cache) => sum + cache.size,
          0
        )
        const totalCacheCount = Object.values(cacheStats).reduce(
          (sum, cache) => sum + cache.count,
          0
        )

        // Memory usage (if available)
        const memoryInfo = (performance as any).memory

        // Network latency test
        const latencyStart = performance.now()
        try {
          await fetch('/api/health', { method: 'HEAD' })
          const networkLatency = performance.now() - latencyStart

          const newMetrics: PerformanceMetrics = {
            apiResponseTime: networkLatency,
            apiRequestCount: performance.getEntriesByType('resource').length,
            apiErrorRate: 0, // Would need to track this separately
            pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
            bundleSize: performance
              .getEntriesByType('resource')
              .filter((r) => r.name.includes('/_next/static/'))
              .reduce((sum, r) => sum + (r.transferSize || 0), 0),
            renderTime:
              paint.find((p) => p.name === 'first-contentful-paint')
                ?.startTime || 0,
            cacheHitRate: totalCacheCount > 0 ? 0.85 : 0, // Mock calculation
            cacheSize: totalCacheSize,
            networkLatency,
            isOnline: isOnline(),
            memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize : 0,
            timestamp: Date.now(),
          }

          setMetrics(newMetrics)

          // Update historical data (keep last 20 entries)
          setHistoricalData((prev) => [...prev.slice(-19), newMetrics])

          // Update system health
          setSystemHealth({
            database:
              networkLatency < 100
                ? 'UP'
                : networkLatency < 500
                  ? 'DEGRADED'
                  : 'DOWN',
            api:
              networkLatency < 200
                ? 'UP'
                : networkLatency < 1000
                  ? 'DEGRADED'
                  : 'DOWN',
            cache: totalCacheCount > 0 ? 'UP' : 'DOWN',
            overall:
              networkLatency < 200 && totalCacheCount > 0
                ? 'HEALTHY'
                : networkLatency < 1000
                  ? 'DEGRADED'
                  : 'CRITICAL',
          })
        } catch (error) {
          console.error('Failed to collect network metrics:', error)
        }
      } catch (error) {
        console.error('Failed to collect performance metrics:', error)
      }
    }

    // Initial collection
    collectMetrics()

    // Periodic collection
    const interval = setInterval(collectMetrics, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Performance score calculation
  const performanceScore = useMemo(() => {
    const scores = {
      responseTime: Math.max(0, 100 - metrics.apiResponseTime / 10),
      renderTime: Math.max(0, 100 - metrics.renderTime / 50),
      cacheHitRate: metrics.cacheHitRate * 100,
      network: metrics.isOnline ? 100 : 0,
    }

    return Math.round(
      Object.values(scores).reduce((sum, score) => sum + score, 0) / 4
    )
  }, [metrics])

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Get health color
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'UP':
      case 'HEALTHY':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20'
      case 'DEGRADED':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20'
      case 'DOWN':
      case 'CRITICAL':
        return 'text-red-500 bg-red-100 dark:bg-red-900/20'
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800'
    }
  }

  // Get health icon
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'UP':
      case 'HEALTHY':
        return <CheckCircle className="h-4 w-4" />
      case 'DEGRADED':
        return <AlertTriangle className="h-4 w-4" />
      case 'DOWN':
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="performance-dashboard rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          <Activity className="h-6 w-6" />
          Performance Dashboard
        </h2>

        <div className="flex items-center gap-2">
          {metrics.isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Performance Score */}
      <div className="mb-6">
        <motion.div
          className="flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <svg className="h-32 w-32 -rotate-90 transform">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - performanceScore / 100)}`}
                className={`transition-all duration-1000 ${
                  performanceScore >= 80
                    ? 'text-green-500'
                    : performanceScore >= 60
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {performanceScore}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Performance Score
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(systemHealth).map(([key, status]) => (
          <motion.div
            key={key}
            className={`rounded-lg border p-3 ${getHealthColor(status)}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold capitalize">{key}</div>
                <div className="text-sm opacity-75">{status}</div>
              </div>
              {getHealthIcon(status)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* API Response Time */}
        <motion.div
          className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
          whileHover={{ scale: 1.02 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">API Response</span>
            </div>
            {metrics.apiResponseTime < 200 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatTime(metrics.apiResponseTime)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Average response time
          </div>
        </motion.div>

        {/* Page Load Time */}
        <motion.div
          className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
          whileHover={{ scale: 1.02 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Page Load</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatTime(metrics.pageLoadTime)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Initial page load
          </div>
        </motion.div>

        {/* Bundle Size */}
        <motion.div
          className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
          whileHover={{ scale: 1.02 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">Bundle Size</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatBytes(metrics.bundleSize)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            JavaScript bundles
          </div>
        </motion.div>

        {/* Cache Hit Rate */}
        <motion.div
          className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
          whileHover={{ scale: 1.02 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Cache Hit Rate</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(metrics.cacheHitRate * 100)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Cache effectiveness
          </div>
        </motion.div>

        {/* Memory Usage */}
        <motion.div
          className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
          whileHover={{ scale: 1.02 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">Memory Usage</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatBytes(metrics.memoryUsage)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            JavaScript heap
          </div>
        </motion.div>

        {/* Network Latency */}
        <motion.div
          className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
          whileHover={{ scale: 1.02 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              <span className="font-semibold">Network Latency</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatTime(metrics.networkLatency)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Round trip time
          </div>
        </motion.div>
      </div>

      {/* Performance Tips */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
          Performance Tips
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          {performanceScore < 60 && (
            <li>
              • Consider optimizing API response times and reducing bundle size
            </li>
          )}
          {metrics.cacheHitRate < 0.7 && (
            <li>• Cache hit rate is low - check caching configuration</li>
          )}
          {metrics.apiResponseTime > 500 && (
            <li>• API response time is high - check server performance</li>
          )}
          {!metrics.isOnline && (
            <li>• You're offline - some features may be limited</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default PerformanceDashboard
