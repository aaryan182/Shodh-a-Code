'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface ErrorMessageProps {
  message?: string;
  title?: string;
  variant?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    message: 'text-red-700 dark:text-red-400',
    button: 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    icon: 'text-yellow-500 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-300',
    message: 'text-yellow-700 dark:text-yellow-400',
    button: 'text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    message: 'text-blue-700 dark:text-blue-400',
    button: 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
  },
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title,
  variant = 'error',
  dismissible = false,
  onDismiss,
  className,
  children,
}) => {
  const styles = variantStyles[variant];
  
  if (!message && !children && !title) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-lg border p-4 shadow-sm',
          styles.container,
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className={cn('h-5 w-5', styles.icon)} />
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={cn('text-sm font-semibold mb-1', styles.title)}>
                {title}
              </h3>
            )}
            {message && (
              <p className={cn('text-sm', styles.message)}>
                {message}
              </p>
            )}
            {children && (
              <div className={cn('text-sm', styles.message)}>
                {children}
              </div>
            )}
          </div>
          {dismissible && onDismiss && (
            <div className="ml-auto pl-3">
              <button
                type="button"
                className={cn(
                  'inline-flex rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                  styles.button,
                  variant === 'error' && 'focus:ring-red-500',
                  variant === 'warning' && 'focus:ring-yellow-500',
                  variant === 'info' && 'focus:ring-blue-500'
                )}
                onClick={onDismiss}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

ErrorMessage.displayName = 'ErrorMessage';
