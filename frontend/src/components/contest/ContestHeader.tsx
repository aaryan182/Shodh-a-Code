'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, Trophy, Calendar } from 'lucide-react';
import { Contest, User as UserType } from '../../types';

interface ContestHeaderProps {
  contest: Contest;
  user?: UserType | null;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const ContestHeader: React.FC<ContestHeaderProps> = ({
  contest,
  user,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [contestStatus, setContestStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');

  const calculateTimeRemaining = (targetTime: string): TimeRemaining => {
    const now = new Date().getTime();
    const target = new Date(targetTime).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const updateContestStatus = () => {
    const now = new Date().getTime();
    const startTime = new Date(contest.startTime).getTime();
    const endTime = new Date(contest.endTime).getTime();

    if (now < startTime) {
      setContestStatus('upcoming');
      setTimeRemaining(calculateTimeRemaining(contest.startTime));
    } else if (now >= startTime && now < endTime) {
      setContestStatus('active');
      setTimeRemaining(calculateTimeRemaining(contest.endTime));
    } else {
      setContestStatus('ended');
      setTimeRemaining(null);
    }
  };

  useEffect(() => {
    updateContestStatus();
    const interval = setInterval(updateContestStatus, 1000);
    return () => clearInterval(interval);
  }, [contest.startTime, contest.endTime]);

  const formatTime = (time: TimeRemaining): string => {
    const parts = [];
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0) parts.push(`${time.hours}h`);
    if (time.minutes > 0) parts.push(`${time.minutes}m`);
    if (time.seconds > 0) parts.push(`${time.seconds}s`);
    return parts.join(' ') || '0s';
  };

  const getStatusColor = () => {
    switch (contestStatus) {
      case 'upcoming':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'ended':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (contestStatus) {
      case 'upcoming':
        return 'Starts in';
      case 'active':
        return 'Ends in';
      case 'ended':
        return 'Contest Ended';
      default:
        return 'Contest';
    }
  };

  return (
    <div className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          {/* Main Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Contest Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {contest.name}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}
                >
                  {contestStatus.toUpperCase()}
                </span>
              </div>
              {contest.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {contest.description}
                </p>
              )}
            </div>

            {/* Timer and User Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Contest Timer */}
              {timeRemaining && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 border">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">{getStatusText()}: </span>
                    <span className="font-mono font-semibold text-gray-900">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>
              )}

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-4 py-2 border border-indigo-200">
                  <User className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900">
                    {user.username}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contest Schedule */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Start:</span>
              <time dateTime={contest.startTime}>
                {new Date(contest.startTime).toLocaleString()}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">End:</span>
              <time dateTime={contest.endTime}>
                {new Date(contest.endTime).toLocaleString()}
              </time>
            </div>
            {contest.problems && (
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span className="font-medium">Problems:</span>
                <span>{contest.problems.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestHeader;
