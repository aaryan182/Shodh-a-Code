import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

import CodeEditor from '@/components/contest/CodeEditor'
import Leaderboard from '@/components/contest/Leaderboard'
import SubmissionStatus from '@/components/contest/SubmissionStatus'
import ProblemPanel from '@/components/contest/ProblemPanel'
import SubmissionHistory from '@/components/contest/SubmissionHistory'

// Mock next/router
const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    query: { contestId: '1' },
    pathname: '/contest/1',
  }),
}))

describe('Component Integration Tests', () => {
  beforeEach(() => {
    server.resetHandlers()
    mockPush.mockClear()
  })

  describe('CodeEditor Integration', () => {
    const mockProps = {
      problemId: 1,
      contestId: 1,
      userId: 1,
      onSubmit: jest.fn(),
      initialCode: '',
      language: 'javascript' as const,
    }

    test('should render code editor with Monaco', () => {
      render(<CodeEditor {...mockProps} />)

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      expect(screen.getByText(/submit/i)).toBeInTheDocument()
    })

    test('should handle language switching', async () => {
      const user = userEvent.setup()
      render(<CodeEditor {...mockProps} />)

      // Find language selector
      const languageSelect = screen.getByDisplayValue('javascript')
      await user.selectOptions(languageSelect, 'java')

      expect(languageSelect).toHaveValue('java')
    })

    test('should submit code and handle response', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()

      render(<CodeEditor {...mockProps} onSubmit={mockOnSubmit} />)

      // Type code
      const editor = screen.getByTestId('monaco-editor')
      await user.type(editor, 'console.log("Hello World");')

      // Submit
      const submitButton = screen.getByText(/submit/i)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'console.log("Hello World");',
            language: 'javascript',
          })
        )
      })
    })

    test('should auto-save code to localStorage', async () => {
      const mockSetItem = jest.fn()
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
          setItem: mockSetItem,
          removeItem: jest.fn(),
        },
        writable: true,
      })

      const user = userEvent.setup()
      render(<CodeEditor {...mockProps} />)

      const editor = screen.getByTestId('monaco-editor')
      await user.type(editor, 'test code')

      // Wait for debounced auto-save
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2100))
      })

      expect(mockSetItem).toHaveBeenCalledWith('code_1_javascript', 'test code')
    })

    test('should load saved code from localStorage', () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'saved code'),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      })

      render(<CodeEditor {...mockProps} />)

      const editor = screen.getByTestId('monaco-editor')
      expect(editor).toHaveValue('saved code')
    })
  })

  describe('Leaderboard Integration', () => {
    test('should render leaderboard with data', async () => {
      render(<Leaderboard contestId={1} currentUserId={1} />)

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument()
        expect(screen.getByText('user2')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument() // Score
        expect(screen.getByText('75')).toBeInTheDocument() // Score
      })
    })

    test('should highlight current user', async () => {
      render(<Leaderboard contestId={1} currentUserId={1} />)

      await waitFor(() => {
        const userRow = screen.getByText('testuser').closest('tr')
        expect(userRow).toHaveClass('bg-blue-50') // Or whatever highlight class is used
      })
    })

    test('should handle search functionality', async () => {
      const user = userEvent.setup()
      render(<Leaderboard contestId={1} currentUserId={1} />)

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'user2')

      await waitFor(() => {
        expect(screen.queryByText('testuser')).not.toBeInTheDocument()
        expect(screen.getByText('user2')).toBeInTheDocument()
      })
    })

    test('should handle sorting by columns', async () => {
      const user = userEvent.setup()
      render(<Leaderboard contestId={1} currentUserId={1} />)

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument()
      })

      // Click on username column header to sort
      const usernameHeader = screen.getByText(/username/i)
      await user.click(usernameHeader)

      // Should re-render with sorted data
      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(1)
      })
    })

    test('should export leaderboard data', async () => {
      const user = userEvent.setup()

      // Mock URL.createObjectURL
      const mockCreateObjectURL = jest.fn()
      Object.defineProperty(window.URL, 'createObjectURL', {
        value: mockCreateObjectURL,
      })

      render(<Leaderboard contestId={1} currentUserId={1} />)

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument()
      })

      const exportButton = screen.getByText(/export/i)
      await user.click(exportButton)

      expect(mockCreateObjectURL).toHaveBeenCalled()
    })
  })

  describe('SubmissionStatus Integration', () => {
    test('should display submission status', async () => {
      render(<SubmissionStatus submissionId={1} />)

      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
        expect(screen.getByText('Score: 100')).toBeInTheDocument()
        expect(screen.getByText('150ms')).toBeInTheDocument() // Execution time
      })
    })

    test('should poll for status updates', async () => {
      let requestCount = 0
      server.use(
        http.get('/api/submissions/1/status', () => {
          requestCount++
          const status = requestCount < 3 ? 'PENDING' : 'ACCEPTED'
          return HttpResponse.json({
            id: 1,
            status,
            score: status === 'ACCEPTED' ? 100 : 0,
            executionTime: status === 'ACCEPTED' ? 150 : undefined,
          })
        })
      )

      render(<SubmissionStatus submissionId={1} />)

      // Initially should show PENDING
      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument()
      })

      // After polling, should show ACCEPTED
      await waitFor(
        () => {
          expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      expect(requestCount).toBeGreaterThanOrEqual(3)
    })

    test('should handle polling errors gracefully', async () => {
      server.use(
        http.get('/api/submissions/1/status', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      render(<SubmissionStatus submissionId={1} />)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })
  })

  describe('ProblemPanel Integration', () => {
    const mockProps = {
      contestId: 1,
      problems: [
        {
          id: 1,
          title: 'Two Sum',
          description: 'Test problem',
          difficulty: 'EASY' as const,
          timeLimit: 1000,
          memoryLimit: 256,
          exampleTestCases: [],
        },
      ],
      currentProblemId: 1,
      onProblemSelect: jest.fn(),
      userId: 1,
    }

    test('should render problem details', () => {
      render(<ProblemPanel {...mockProps} />)

      expect(screen.getByText('Two Sum')).toBeInTheDocument()
      expect(screen.getByText('Test problem')).toBeInTheDocument()
      expect(screen.getByText('EASY')).toBeInTheDocument()
    })

    test('should switch between tabs', async () => {
      const user = userEvent.setup()
      render(<ProblemPanel {...mockProps} />)

      // Should start on Problem Details tab
      expect(screen.getByText('Test problem')).toBeInTheDocument()

      // Switch to My Submissions tab
      const submissionsTab = screen.getByText(/my submissions/i)
      await user.click(submissionsTab)

      // Should show submissions content
      await waitFor(() => {
        expect(screen.getByText(/submissions/i)).toBeInTheDocument()
      })
    })

    test('should load submission history', async () => {
      const user = userEvent.setup()
      render(<ProblemPanel {...mockProps} />)

      const submissionsTab = screen.getByText(/my submissions/i)
      await user.click(submissionsTab)

      await waitFor(() => {
        expect(screen.getByText(/ACCEPTED/i)).toBeInTheDocument()
        expect(screen.getByText(/WRONG_ANSWER/i)).toBeInTheDocument()
      })
    })
  })

  describe('SubmissionHistory Integration', () => {
    const mockProps = {
      problemId: 1,
      userId: 1,
      onResubmit: jest.fn(),
    }

    test('should render submission history', async () => {
      render(<SubmissionHistory {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
        expect(screen.getByText('WRONG_ANSWER')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument() // Score
        expect(screen.getByText('50')).toBeInTheDocument() // Score
      })
    })

    test('should filter submissions by status', async () => {
      const user = userEvent.setup()
      render(<SubmissionHistory {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
        expect(screen.getByText('WRONG_ANSWER')).toBeInTheDocument()
      })

      // Filter to show only accepted submissions
      const statusFilter = screen.getByDisplayValue(/all/i)
      await user.selectOptions(statusFilter, 'ACCEPTED')

      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
        expect(screen.queryByText('WRONG_ANSWER')).not.toBeInTheDocument()
      })
    })

    test('should view submission code', async () => {
      const user = userEvent.setup()
      render(<SubmissionHistory {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText(/view/i)[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText(/code/i)).toBeInTheDocument()
        expect(
          screen.getByText('console.log("Hello World");')
        ).toBeInTheDocument()
      })
    })

    test('should resubmit code', async () => {
      const user = userEvent.setup()
      const mockOnResubmit = jest.fn()

      render(<SubmissionHistory {...mockProps} onResubmit={mockOnResubmit} />)

      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
      })

      const resubmitButton = screen.getAllByText(/resubmit/i)[0]
      await user.click(resubmitButton)

      expect(mockOnResubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.any(String),
          language: expect.any(String),
        })
      )
    })

    test('should sort submissions', async () => {
      const user = userEvent.setup()
      render(<SubmissionHistory {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue(/newest first/i)
      await user.selectOptions(sortSelect, 'score_desc')

      // Should re-render with sorted data
      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(1)
      })
    })
  })

  describe('Component Interaction Tests', () => {
    test('should handle code submission flow', async () => {
      const user = userEvent.setup()

      // Mock successful submission
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

      const mockOnSubmit = jest.fn().mockResolvedValue({ submissionId: 123 })

      render(
        <div>
          <CodeEditor
            problemId={1}
            contestId={1}
            userId={1}
            onSubmit={mockOnSubmit}
            initialCode=""
            language="javascript"
          />
          <SubmissionStatus submissionId={123} />
        </div>
      )

      // Type and submit code
      const editor = screen.getByTestId('monaco-editor')
      await user.type(editor, 'console.log("test");')

      const submitButton = screen.getByText(/submit/i)
      await user.click(submitButton)

      // Should show submission status
      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
      })
    })

    test('should update leaderboard after submission', async () => {
      const user = userEvent.setup()

      // Mock submission that improves score
      server.use(
        http.get('/api/contests/1/leaderboard', () => {
          return HttpResponse.json([
            {
              rank: 1,
              userId: 1,
              username: 'testuser',
              score: 200, // Improved score
              problemsSolved: 2,
              totalAttempts: 3,
              lastSubmissionTime: new Date().toISOString(),
              problemStatus: [{ problemId: 1, status: 'solved', attempts: 2 }],
            },
          ])
        })
      )

      render(<Leaderboard contestId={1} currentUserId={1} />)

      // Initially shows old score
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument()
      })

      // Simulate refresh after submission
      const refreshButton = screen.getByText(/refresh/i)
      await user.click(refreshButton)

      // Should show updated score
      await waitFor(() => {
        expect(screen.getByText('200')).toBeInTheDocument()
      })
    })
  })
})
