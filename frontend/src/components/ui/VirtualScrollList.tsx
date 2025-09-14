'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VirtualScrollListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  getItemKey: (item: T, index: number) => string | number
  className?: string
  overscan?: number
  onScroll?: (scrollTop: number) => void
  loading?: boolean
  loadingComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
}

/**
 * High-performance virtual scrolling component for large lists
 * Optimized for rendering thousands of items efficiently
 */
export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  getItemKey,
  className = '',
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Calculate visible range with memoization for performance
  const visibleRange = useMemo(() => {
    if (items.length === 0) return { start: 0, end: 0 }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(items.length, start + visibleCount + overscan * 2)

    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // Get visible items with memoization
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange.start, visibleRange.end])

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = event.currentTarget.scrollTop
      setScrollTop(newScrollTop)
      onScroll?.(newScrollTop)
    },
    [onScroll]
  )

  // Auto-scroll to item functionality
  const scrollToItem = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      if (scrollElementRef.current) {
        const targetScrollTop = index * itemHeight
        scrollElementRef.current.scrollTo({
          top: targetScrollTop,
          behavior,
        })
      }
    },
    [itemHeight]
  )

  // Expose scroll methods
  React.useImperativeHandle(
    React.forwardRef(() => null),
    () => ({
      scrollToItem,
      scrollToTop: () => scrollToItem(0),
      scrollToBottom: () => scrollToItem(items.length - 1),
    }),
    [scrollToItem, items.length]
  )

  // Loading state
  if (loading && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>
  }

  // Empty state
  if (items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>
  }

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, index) => {
              const actualIndex = visibleRange.start + index
              const key = getItemKey(item, actualIndex)

              return (
                <motion.div
                  key={key}
                  style={{ height: itemHeight }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeOut',
                    layout: { duration: 0.3 },
                  }}
                  layout
                >
                  {renderItem(item, actualIndex)}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Skeleton loading component for virtual lists
export const VirtualListSkeleton: React.FC<{
  itemHeight: number
  containerHeight: number
  itemCount?: number
  className?: string
}> = ({ itemHeight, containerHeight, itemCount = 10, className = '' }) => {
  const skeletonItems = Array.from({ length: itemCount }, (_, i) => i)

  return (
    <div
      className={`space-y-2 ${className}`}
      style={{ height: containerHeight }}
    >
      {skeletonItems.map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded bg-gray-200 dark:bg-gray-700"
          style={{ height: itemHeight - 8 }} // Account for spacing
        />
      ))}
    </div>
  )
}

// Hook for managing virtual scroll state
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    if (items.length === 0) return { start: 0, end: 0 }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(items.length, start + visibleCount + overscan * 2)

    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange.start, visibleRange.end])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  return {
    visibleRange,
    visibleItems,
    totalHeight,
    offsetY,
    scrollTop,
    setScrollTop,
  }
}

export default VirtualScrollList
