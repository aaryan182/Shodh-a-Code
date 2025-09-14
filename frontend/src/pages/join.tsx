'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock } from 'lucide-react';
import { InputField } from '../components/ui/InputField';
import { LoadingButton } from '../components/ui/LoadingButton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { userAPI, contestAPI } from '../utils/api';
import { JoinContestForm, ApiError } from '../types';

// Form validation schema
const joinContestSchema = z.object({
  contestId: z
    .string()
    .min(1, 'Contest ID is required')
    .regex(/^\d+$/, 'Contest ID must be a number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
});

type FormData = z.infer<typeof joinContestSchema>;

export default function JoinContestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(joinContestSchema),
    defaultValues: {
      contestId: '',
      username: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const contestId = parseInt(data.contestId);
      
      // Step 1: Register the user
      const userResponse = await userAPI.registerUser({
        username: data.username,
        email: `${data.username}@contest.local`, // Temporary email for contest participation
      });

      // Step 2: Join the contest
      await contestAPI.joinContest(contestId, userResponse.id);

      // Success! Show success state briefly then redirect
      setSuccess(true);
      
      // Store user info in localStorage for session
      localStorage.setItem('contest_user', JSON.stringify(userResponse));
      localStorage.setItem('current_contest_id', contestId.toString());

      // Redirect to contest page after a brief delay
      setTimeout(() => {
        router.push(`/contests/${contestId}`);
      }, 1500);

    } catch (err: any) {
      console.error('Join contest error:', err);
      
      // Handle different types of errors
      if (err.status === 404) {
        setError('Contest not found. Please check the Contest ID and try again.');
      } else if (err.status === 409) {
        setError('Username is already taken. Please choose a different username.');
      } else if (err.status === 400) {
        setError('Invalid request. Please check your input and try again.');
      } else if (err.message?.includes('Network error')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setError(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-primary-950 dark:to-secondary-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Welcome to the Contest!
          </h1>
          
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">
            You have successfully joined the contest. Redirecting you to the contest page...
          </p>
          
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-primary-950 dark:to-secondary-900 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Trophy className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Join Contest
          </h1>
          
          <p className="text-secondary-600 dark:text-secondary-400">
            Enter your details to participate in the coding contest
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">Compete</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">Win</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">Real-time</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              variant="error"
              dismissible
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <InputField
            {...register('contestId')}
            id="contestId"
            label="Contest ID"
            placeholder="Enter contest ID (e.g., 12345)"
            error={errors.contestId?.message}
            helperText="You can find this ID in the contest invitation or URL"
            required
            disabled={isLoading}
          />

          <InputField
            {...register('username')}
            id="username"
            label="Username"
            placeholder="Choose your username"
            error={errors.username?.message}
            helperText="3-50 characters, letters, numbers, hyphens, and underscores only"
            required
            disabled={isLoading}
          />

          <div className="space-y-4">
            <LoadingButton
              type="submit"
              loading={isLoading}
              loadingText="Joining Contest..."
              disabled={isSubmitting}
              variant="primary"
              size="lg"
            >
              Join Contest
            </LoadingButton>

            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="w-full text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 transition-colors disabled:opacity-50"
            >
              Clear Form
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700">
          <p className="text-xs text-center text-secondary-500 dark:text-secondary-400">
            By joining, you agree to follow the contest rules and guidelines.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
