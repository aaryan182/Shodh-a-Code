import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Mock pages for testing
import JoinPage from '@/pages/join'
import ContestPage from '@/pages/contest/[contestId]'

// Mock next/router with proper implementation
const mockPush = jest.fn()
const mockQuery = { contestId: '1' }
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    query: mockQuery,
    pathname: '/contest/1',
    asPath: '/contest/1',
    replace: jest.fn(),
    back: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}))

// Mock React Query for data fetching
jest.mock('react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

describe('User Journey Integration Tests', () => {
  beforeEach(() => {
    server.resetHandlers()
    mockPush.mockClear()

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  describe('Contest Registration Journey', () => {
    test('should complete full registration flow', async () => {
      const user = userEvent.setup()

      render(<JoinPage />)

      // Should see registration form
      expect(screen.getByText(/join contest/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()

      // Fill out form
      await user.type(screen.getByLabelText(/username/i), 'newuser')
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /join/i })
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText(/joining/i)).toBeInTheDocument()

      // Should redirect to contest page after successful registration
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/contest/1')
      })
    })

    test('should handle registration validation errors', async () => {
      const user = userEvent.setup()

      render(<JoinPage />)

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /join/i })
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    test('should handle duplicate username error', async () => {
      const user = userEvent.setup()

      render(<JoinPage />)

      // Fill form with existing username
      await user.type(screen.getByLabelText(/username/i), 'existinguser')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /join/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/username already exists/i)).toBeInTheDocument()
      })

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled()
    })

    test('should handle network errors during registration', async () => {
      const user = userEvent.setup()

      // Mock network error
      server.use(
        http.post('/api/contests/1/register', () => {
          return HttpResponse.error()
        })
      )

      render(<JoinPage />)

      await user.type(screen.getByLabelText(/username/i), 'testuser')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /join/i })
      await user.click(submitButton)

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Contest Participation Journey', () => {
    const mockContestData = {
      id: 1,
      title: 'Test Contest',
      description: 'Contest description',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      maxParticipants: 100,
      problems: [
        {
          id: 1,
          title: 'Two Sum',
          description: 'Find two numbers that add up to target',
          difficulty: 'EASY',
          timeLimit: 1000,
          memoryLimit: 256,
          exampleTestCases: [
            {
              id: 1,
              input: '[2,7,11,15]\n9',
              expectedOutput: '[0,1]',
              isExample: true,
            },
          ],
        },
      ],
    }

    beforeEach(() => {
      // Mock contest data
      server.use(
        http.get('/api/contests/1', () => {
          return HttpResponse.json(mockContestData)
        })
      )
    })

    test('should load contest page and display problems', async () => {
      render(<ContestPage />)

      // Should load contest data
      await waitFor(() => {
        expect(screen.getByText('Test Contest')).toBeInTheDocument()
        expect(screen.getByText('Two Sum')).toBeInTheDocument()
      })
    })

    test('should complete full submission journey', async () => {
      const user = userEvent.setup()

      // Mock submission endpoints
      server.use(
        http.post('/api/submissions', () => {
          return HttpResponse.json({ submissionId: 123 })
        }),
        http.get('/api/submissions/123/status', () => {
          return HttpResponse.json({
            id: 123,
            status: 'ACCEPTED',
            score: 100,
            executionTime: 150,
            memoryUsed: 64,
          })
        })
      )

      render(<ContestPage />)

      // Wait for contest to load
      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument()
      })

      // Write code
      const editor = screen.getByTestId('monaco-editor')
      await user.clear(editor)
      await user.type(
        editor,
        'function twoSum(nums, target) { return [0, 1]; }'
      )

      // Submit code
      const submitButton = screen.getByText(/submit/i)
      await user.click(submitButton)

      // Should show submission status
      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
        expect(screen.getByText('Score: 100')).toBeInTheDocument()
      })
    })

    test('should handle code compilation errors', async () => {
      const user = userEvent.setup()

      // Mock compilation error
      server.use(
        http.post('/api/submissions', () => {
          return HttpResponse.json({ submissionId: 124 })
        }),
        http.get('/api/submissions/124/status', () => {
          return HttpResponse.json({
            id: 124,
            status: 'COMPILATION_ERROR',
            score: 0,
            errorMessage: 'Syntax error: unexpected token',
          })
        })
      )

      render(<ContestPage />)

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument()
      })

      // Write invalid code
      const editor = screen.getByTestId('monaco-editor')
      await user.clear(editor)
      await user.type(editor, 'invalid code syntax {')

      const submitButton = screen.getByText(/submit/i)
      await user.click(submitButton)

      // Should show compilation error
      await waitFor(() => {
        expect(screen.getByText('COMPILATION_ERROR')).toBeInTheDocument()
        expect(screen.getByText(/syntax error/i)).toBeInTheDocument()
      })
    })

    test('should switch between problems', async () => {
      const user = userEvent.setup()

      // Add second problem to contest
      const contestWithMultipleProblems = {
        ...mockContestData,
        problems: [
          ...mockContestData.problems,
          {
            id: 2,
            title: 'Three Sum',
            description: 'Find three numbers that add up to target',
            difficulty: 'MEDIUM',
            timeLimit: 2000,
            memoryLimit: 512,
            exampleTestCases: [],
          },
        ],
      }

      server.use(
        http.get('/api/contests/1', () => {
          return HttpResponse.json(contestWithMultipleProblems)
        })
      )

      render(<ContestPage />)

      // Should show first problem by default
      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument()
        expect(screen.getByText('Find two numbers')).toBeInTheDocument()
      })

      // Switch to second problem
      const problemSelector = screen.getByText('Three Sum')
      await user.click(problemSelector)

      // Should show second problem
      await waitFor(() => {
        expect(screen.getByText('Find three numbers')).toBeInTheDocument()
        expect(screen.getByText('MEDIUM')).toBeInTheDocument()
      })
    })

    test('should view submission history', async () => {
      const user = userEvent.setup()

      render(<ContestPage />)

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument()
      })

      // Navigate to submissions tab
      const submissionsTab = screen.getByText(/my submissions/i)
      await user.click(submissionsTab)

      // Should show submission history
      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
        expect(screen.getByText('WRONG_ANSWER')).toBeInTheDocument()
      })
    })

    test('should view and interact with leaderboard', async () => {
      const user = userEvent.setup()

      render(<ContestPage />)

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument()
      })

      // Should see leaderboard
      expect(screen.getByText('testuser')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()

      // Search leaderboard
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'testuser')

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument()
        expect(screen.queryByText('user2')).not.toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates Journey', () => {
    test('should receive real-time leaderboard updates', async () => {
      const user = userEvent.setup()

      let leaderboardData = [
        {
          rank: 1,
          userId: 1,
          username: 'testuser',
          score: 100,
          problemsSolved: 1,
          totalAttempts: 2,
          lastSubmissionTime: new Date().toISOString(),
          problemStatus: [],
        },
      ]

      // Mock changing leaderboard data
      server.use(
        http.get('/api/contests/1/leaderboard', () => {
          return HttpResponse.json(leaderboardData)
        })
      )

      render(<ContestPage />)

      // Initial leaderboard
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument()
      })

      // Update leaderboard data
      leaderboardData[0].score = 200

      // Trigger refresh
      const refreshButton = screen.getByText(/refresh/i)
      await user.click(refreshButton)

      // Should show updated score
      await waitFor(() => {
        expect(screen.getByText('200')).toBeInTheDocument()
      })
    })

    test('should handle real-time submission status updates', async () => {
      const user = userEvent.setup()

      let submissionStatus = 'PENDING'

      server.use(
        http.post('/api/submissions', () => {
          return HttpResponse.json({ submissionId: 125 })
        }),
        http.get('/api/submissions/125/status', () => {
          return HttpResponse.json({
            id: 125,
            status: submissionStatus,
            score: submissionStatus === 'ACCEPTED' ? 100 : 0,
            executionTime: submissionStatus === 'ACCEPTED' ? 150 : undefined,
          })
        })
      )

      render(<ContestPage />)

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument()
      })

      // Submit code
      const editor = screen.getByTestId('monaco-editor')
      await user.type(editor, 'solution code')

      const submitButton = screen.getByText(/submit/i)
      await user.click(submitButton)

      // Should show pending status
      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument()
      })

      // Update status
      submissionStatus = 'ACCEPTED'

      // Should automatically update to accepted (due to polling)
      await waitFor(
        () => {
          expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    })
  })

  describe('Error Recovery Journey', () => {
    test('should recover from network errors', async () => {
      const user = userEvent.setup()

      // Start with network error
      server.use(
        http.get('/api/contests/1', () => {
          return HttpResponse.error()
        })
      )

      render(<ContestPage />)

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Fix network and retry
      server.use(
        http.get('/api/contests/1', () => {
          return HttpResponse.json({
            id: 1,
            title: 'Recovered Contest',
            description: 'Contest after recovery',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            maxParticipants: 100,
            problems: [],
          })
        })
      )

      const retryButton = screen.getByText(/retry/i)
      await user.click(retryButton)

      // Should show recovered data
      await waitFor(() => {
        expect(screen.getByText('Recovered Contest')).toBeInTheDocument()
      })
    })

    test('should handle session timeout gracefully', async () => {
      const user = userEvent.setup()

      // Mock session timeout
      server.use(
        http.post('/api/submissions', () => {
          return new HttpResponse(null, { status: 401 })
        })
      )

      render(<ContestPage />)

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument()
      })

      // Try to submit
      const editor = screen.getByTestId('monaco-editor')
      await user.type(editor, 'test code')

      const submitButton = screen.getByText(/submit/i)
      await user.click(submitButton)

      // Should show authentication error
      await waitFor(() => {
        expect(screen.getByText(/authentication/i)).toBeInTheDocument()
      })

      // Should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  describe('Performance and Loading States', () => {
    test('should show loading states during data fetching', async () => {
      // Mock slow response
      server.use(
        http.get('/api/contests/1', () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                HttpResponse.json({
                  id: 1,
                  title: 'Slow Contest',
                  description: 'Takes time to load',
                  startTime: new Date().toISOString(),
                  endTime: new Date().toISOString(),
                  maxParticipants: 100,
                  problems: [],
                })
              )
            }, 1000)
          })
        })
      )

      render(<ContestPage />)

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // Should eventually load data
      await waitFor(
        () => {
          expect(screen.getByText('Slow Contest')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })

    test('should handle large datasets efficiently', async () => {
      // Mock large leaderboard
      const largeLeaderboard = Array.from({ length: 1000 }, (_, i) => ({
        rank: i + 1,
        userId: i + 1,
        username: `user${i + 1}`,
        score: 1000 - i,
        problemsSolved: Math.floor(Math.random() * 5),
        totalAttempts: Math.floor(Math.random() * 10),
        lastSubmissionTime: new Date().toISOString(),
        problemStatus: [],
      }))

      server.use(
        http.get('/api/contests/1/leaderboard', () => {
          return HttpResponse.json(largeLeaderboard)
        })
      )

      const startTime = performance.now()
      render(<ContestPage />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(5000)
    })
  })
})
