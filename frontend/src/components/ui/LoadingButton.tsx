'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white border-primary-600 focus:ring-primary-500',
  secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-900 border-secondary-200 focus:ring-secondary-500 dark:bg-secondary-800 dark:hover:bg-secondary-700 dark:text-secondary-100 dark:border-secondary-700',
  outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white bg-transparent focus:ring-primary-500',
  ghost: 'hover:bg-secondary-100 text-secondary-700 focus:ring-secondary-500 dark:hover:bg-secondary-800 dark:text-secondary-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 focus:ring-red-500',
};

const sizeVariants = {
  sm: 'px-3 py-2 text-sm h-9',
  md: 'px-6 py-3 text-base h-12',
  lg: 'px-8 py-4 text-lg h-14',
};

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    loadingText,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <motion.div
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        className="w-full"
      >
        <button
          ref={ref}
          className={cn(
            'w-full inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
            buttonVariants[variant],
            sizeVariants[size],
            loading && 'cursor-wait',
            className
          )}
          disabled={isDisabled}
          {...props}
        >
          {loading && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mr-3"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </motion.div>
          )}
          <span className={cn(loading && 'opacity-80')}>
            {loading && loadingText ? loadingText : children}
          </span>
        </button>
      </motion.div>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
