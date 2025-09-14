'use client'

import React from 'react'
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react'

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const STATUS_CONFIG = {
  connected: {
    icon: Wifi,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: 'Connected',
    description: 'Real-time updates active',
  },
  connecting: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: 'Connecting',
    description: 'Establishing connection...',
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    label: 'Disconnected',
    description: 'Real-time updates paused',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: 'Connection Error',
    description: 'Failed to connect for updates',
  },
}

const SIZE_CONFIG = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    padding: 'px-2 py-1',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-3 py-1.5',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-4 py-2',
  },
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  className = '',
  showLabel = false,
  size = 'sm',
}) => {
  const config = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const StatusIcon = config.icon
  const isAnimated = status === 'connecting'

  if (!showLabel) {
    // Icon only version
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full ${config.bgColor} ${sizeConfig.padding} ${className}`}
        title={`${config.label}: ${config.description}`}
      >
        <StatusIcon
          className={`${sizeConfig.icon} ${config.color} ${isAnimated ? 'animate-spin' : ''}`}
        />
      </div>
    )
  }

  // Full version with label
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full ${config.bgColor} ${sizeConfig.padding} ${className}`}
      title={config.description}
    >
      <StatusIcon
        className={`${sizeConfig.icon} ${config.color} ${isAnimated ? 'animate-spin' : ''}`}
      />
      <span className={`${sizeConfig.text} font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  )
}

export default ConnectionStatus
