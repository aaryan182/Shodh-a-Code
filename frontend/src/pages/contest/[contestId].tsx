'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { 
  Split, 
  Maximize2, 
  Minimize2, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { 
  Contest, 
  User, 
  ProblemSummaryResponse, 
  ProblemDetailResponse, 
  SubmissionResponse,
  ProgrammingLanguage,
  SubmissionRequest,
  SubmissionStatus,
  LeaderboardResponse,
  ApiError
} from '../../types';
import { contestAPI, submissionAPI, apiUtils } from '../../utils/api';
import { ContestHeader } from '../../components/contest/ContestHeader';
import { ProblemPanel } from '../../components/contest/ProblemPanel';
import { CodeEditor } from '../../components/contest/CodeEditor';
import { Leaderboard } from '../../components/contest/Leaderboard';
import { SubmissionStatus as SubmissionStatusComponent } from '../../components/contest/SubmissionStatus';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingButton } from '../../components/ui/LoadingButton';

interface ContestPageState {
  contest: Contest | null;
  problems: ProblemSummaryResponse[];
  selectedProblem: ProblemDetailResponse | null;
  selectedProblemId: number | null;
  currentSubmission: SubmissionResponse | null;
  code: string;
  language: ProgrammingLanguage;
  user: User | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  solvedProblems: Set<number>;
  attemptedProblems: Set<number>;
}

interface LayoutState {
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  bottomPanelCollapsed: boolean;
  mobileMenuOpen: boolean;
  isMobile: boolean;
}

export default function ContestPage() {
  const router = useRouter();
  const { contestId } = router.query;

  const [state, setState] = useState<ContestPageState>({
    contest: null,
    problems: [],
    selectedProblem: null,
    selectedProblemId: null,
    currentSubmission: null,
    code: '',
    language: 'JAVA',
    user: null,
    loading: true,
    error: null,
    submitting: false,
    solvedProblems: new Set(),
    attemptedProblems: new Set(),
  });

  const [layout, setLayout] = useState<LayoutState>({
    leftPanelCollapsed: false,
    rightPanelCollapsed: false,
    bottomPanelCollapsed: false,
    mobileMenuOpen: false,
    isMobile: false,
  });

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      setLayout(prev => ({
        ...prev,
        isMobile,
        leftPanelCollapsed: isMobile,
        rightPanelCollapsed: isMobile,
        bottomPanelCollapsed: isMobile,
      }));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load contest data
  useEffect(() => {
    if (!contestId || typeof contestId !== 'string') return;

    const loadContestData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const [contestData, problemsData] = await Promise.all([
          contestAPI.getContest(Number(contestId)),
          contestAPI.getContestProblems(Number(contestId))
        ]);

        // Mock user data - in real app this would come from auth context
        const mockUser: User = {
          id: 1,
          username: 'current_user',
          email: 'user@example.com',
          createdAt: new Date().toISOString(),
        };

        setState(prev => ({
          ...prev,
          contest: contestData,
          problems: contestData.problems || [],
          user: mockUser,
          loading: false,
        }));

        // Auto-select first problem
        if (contestData.problems && contestData.problems.length > 0) {
          handleProblemSelect(contestData.problems[0].id);
        }
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to load contest data',
        }));
      }
    };

    loadContestData();
  }, [contestId]);

  const handleProblemSelect = async (problemId: number) => {
    try {
      setState(prev => ({
        ...prev,
        selectedProblemId: problemId,
        selectedProblem: null,
      }));

      // In a real app, you would fetch problem details from API
      const problemDetail: ProblemDetailResponse = {
        id: problemId,
        title: `Problem ${problemId}`,
        description: `This is the description for problem ${problemId}. It includes the problem statement, constraints, and examples.`,
        difficulty: 'MEDIUM',
        timeLimit: 2,
        memoryLimit: 256,
        inputFormat: 'First line contains an integer N...',
        outputFormat: 'Print the result...',
        constraints: '1 ≤ N ≤ 10^5',
        totalSubmissions: 100,
        acceptedSubmissions: 45,
      };

      setState(prev => ({
        ...prev,
        selectedProblem: problemDetail,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load problem details',
      }));
    }
  };

  const handleCodeSubmit = async () => {
    if (!state.user || !state.selectedProblemId || !state.code.trim() || !contestId) {
      return;
    }

    try {
      setState(prev => ({ ...prev, submitting: true }));

      const submissionData: SubmissionRequest = {
        userId: state.user.id,
        problemId: state.selectedProblemId,
        contestId: Number(contestId),
        code: state.code,
        language: state.language,
      };

      const submission = await submissionAPI.submitCode(submissionData);
      
      setState(prev => ({
        ...prev,
        currentSubmission: submission,
        submitting: false,
        attemptedProblems: new Set([...prev.attemptedProblems, state.selectedProblemId!]),
      }));

      // Start polling for submission status
      pollSubmissionStatus(submission.submissionId);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        submitting: false,
        error: error.message || 'Failed to submit code',
      }));
    }
  };

  const pollSubmissionStatus = async (submissionId: number) => {
    try {
      await apiUtils.pollSubmissionStatus(submissionId, {
        interval: 2000,
        maxAttempts: 30,
        onUpdate: (status) => {
          setState(prev => ({
            ...prev,
            currentSubmission: prev.currentSubmission ? {
              ...prev.currentSubmission,
              status: status.status,
              result: status.result,
            } : null,
          }));

          // Update solved problems if accepted
          if (status.status === 'ACCEPTED' && state.selectedProblemId) {
            setState(prev => ({
              ...prev,
              solvedProblems: new Set([...prev.solvedProblems, state.selectedProblemId!]),
            }));
          }
        },
      });
    } catch (error) {
      console.error('Polling failed:', error);
    }
  };

  const handleRefreshSubmissionStatus = async () => {
    if (!state.currentSubmission) return;
    
    try {
      const status = await submissionAPI.getSubmissionStatus(state.currentSubmission.submissionId);
      setState(prev => ({
        ...prev,
        currentSubmission: prev.currentSubmission ? {
          ...prev.currentSubmission,
          status: status.status,
          result: status.result,
        } : null,
      }));
    } catch (error: any) {
      console.error('Failed to refresh submission status:', error);
    }
  };

  const handleRefreshLeaderboard = async () => {
    if (!contestId) return;
    try {
      await contestAPI.getLeaderboard(Number(contestId));
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
    }
  };

  const togglePanel = (panel: 'left' | 'right' | 'bottom') => {
    setLayout(prev => ({
      ...prev,
      [`${panel}PanelCollapsed`]: !prev[`${panel}PanelCollapsed` as keyof LayoutState],
    }));
  };

  const toggleMobileMenu = () => {
    setLayout(prev => ({
      ...prev,
      mobileMenuOpen: !prev.mobileMenuOpen,
    }));
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            message={state.error}
            onDismiss={() => setState(prev => ({ ...prev, error: null }))}
          />
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!state.contest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Contest not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Contest Header */}
      <ContestHeader contest={state.contest} user={state.user} />

      {/* Mobile Controls */}
      {layout.isMobile && (
        <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between lg:hidden">
          <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
            <Menu className="h-4 w-4" />
            <span className="ml-1">Menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel('left')}
              className={layout.leftPanelCollapsed ? 'text-gray-400' : 'text-indigo-600'}
            >
              Problems
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel('right')}
              className={layout.rightPanelCollapsed ? 'text-gray-400' : 'text-indigo-600'}
            >
              Leaderboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel('bottom')}
              className={layout.bottomPanelCollapsed ? 'text-gray-400' : 'text-indigo-600'}
            >
              Status
            </Button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problems */}
        {!layout.leftPanelCollapsed && (
          <div className={`bg-white border-r border-gray-200 ${
            layout.isMobile 
              ? 'absolute inset-y-0 left-0 z-20 w-80' 
              : 'w-80 flex-shrink-0'
          }`}>
            {layout.isMobile && (
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Problems</h2>
                <Button variant="ghost" size="sm" onClick={() => togglePanel('left')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <ProblemPanel
              problems={state.problems}
              selectedProblemId={state.selectedProblemId}
              onProblemSelect={handleProblemSelect}
              problemDetails={state.selectedProblem}
              solvedProblems={state.solvedProblems}
              attemptedProblems={state.attemptedProblems}
              className="h-full"
            />
          </div>
        )}

        {/* Center Panel - Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Panel Controls */}
          {!layout.isMobile && (
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanel('left')}
                  title="Toggle problems panel"
                >
                  {layout.leftPanelCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-gray-600">
                  {state.selectedProblem?.title || 'Select a problem'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanel('right')}
                  title="Toggle leaderboard panel"
                >
                  {layout.rightPanelCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Code Editor */}
          <div className="flex-1 p-4">
            <CodeEditor
              value={state.code}
              onChange={(code) => setState(prev => ({ ...prev, code }))}
              language={state.language}
              onLanguageChange={(language) => setState(prev => ({ ...prev, language }))}
              onSubmit={async (code, language) => {
                if (!state.user || !state.selectedProblemId || !contestId) {
                  return;
                }

                const submissionData: SubmissionRequest = {
                  userId: state.user.id,
                  problemId: state.selectedProblemId,
                  contestId: Number(contestId),
                  code: code,
                  language: language,
                };

                const submission = await submissionAPI.submitCode(submissionData);
                
                setState(prev => ({
                  ...prev,
                  currentSubmission: submission,
                  attemptedProblems: new Set([...prev.attemptedProblems, state.selectedProblemId!]),
                }));

                return { submissionId: submission.submissionId };
              }}
              isSubmitting={state.submitting}
              problemId={state.selectedProblemId}
              contestId={Number(contestId)}
              userId={state.user?.id}
              autoSave={true}
              showSubmissionStatus={true}
              className="h-full"
              height="100%"
            />
          </div>

          {/* Bottom Panel - Submission Status */}
          {!layout.bottomPanelCollapsed && (
            <div className="border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Submission Status</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanel('bottom')}
                  title="Toggle status panel"
                >
                  {layout.bottomPanelCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <SubmissionStatusComponent
                  submission={state.currentSubmission}
                  onRefresh={handleRefreshSubmissionStatus}
                  autoRefresh={true}
                  showDetails={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Leaderboard */}
        {!layout.rightPanelCollapsed && (
          <div className={`bg-white border-l border-gray-200 ${
            layout.isMobile 
              ? 'absolute inset-y-0 right-0 z-20 w-80' 
              : 'w-80 flex-shrink-0'
          }`}>
            {layout.isMobile && (
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Leaderboard</h2>
                <Button variant="ghost" size="sm" onClick={() => togglePanel('right')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Leaderboard
              contestId={Number(contestId)}
              currentUserId={state.user?.id}
              onRefresh={handleRefreshLeaderboard}
              autoRefreshInterval={30}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {layout.isMobile && (layout.leftPanelCollapsed === false || layout.rightPanelCollapsed === false) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setLayout(prev => ({
            ...prev,
            leftPanelCollapsed: true,
            rightPanelCollapsed: true,
          }))}
        />
      )}

      {/* Error Display */}
      {state.error && (
        <div className="fixed bottom-4 right-4 z-50">
          <ErrorMessage
            message={state.error}
            onDismiss={() => setState(prev => ({ ...prev, error: null }))}
          />
        </div>
      )}
    </div>
  );
}
