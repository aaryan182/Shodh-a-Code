import { http, HttpResponse } from 'msw'
import {
  Contest,
  Problem,
  Submission,
  User,
  LeaderboardEntry,
  TestCaseResult,
} from '@/types'

// Mock data
const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  createdAt: new Date().toISOString(),
}

const mockContest: Contest = {
  id: 1,
  title: 'Test Contest',
  description: 'A test contest for integration testing',
  startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
  maxParticipants: 100,
  problems: [
    {
      id: 1,
      title: 'Two Sum',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
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

const mockSubmissions: Submission[] = [
  {
    id: 1,
    userId: 1,
    problemId: 1,
    contestId: 1,
    code: 'console.log("Hello World");',
    language: 'javascript',
    status: 'ACCEPTED',
    score: 100,
    submissionTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    executionTime: 150,
    memoryUsed: 64,
  },
  {
    id: 2,
    userId: 1,
    problemId: 1,
    contestId: 1,
    code: 'console.log("Wrong answer");',
    language: 'javascript',
    status: 'WRONG_ANSWER',
    score: 50,
    submissionTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    executionTime: 120,
    memoryUsed: 48,
  },
]

const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 1,
    username: 'testuser',
    score: 100,
    problemsSolved: 1,
    totalAttempts: 2,
    lastSubmissionTime: new Date(Date.now() - 1800000).toISOString(),
    problemStatus: [{ problemId: 1, status: 'solved', attempts: 2 }],
  },
  {
    rank: 2,
    userId: 2,
    username: 'user2',
    score: 75,
    problemsSolved: 0,
    totalAttempts: 3,
    lastSubmissionTime: new Date(Date.now() - 2400000).toISOString(),
    problemStatus: [{ problemId: 1, status: 'failed', attempts: 3 }],
  },
]

const mockTestCaseResults: TestCaseResult[] = [
  {
    testCaseId: 1,
    passed: true,
    input: '[2,7,11,15]\n9',
    expectedOutput: '[0,1]',
    actualOutput: '[0,1]',
    executionTime: 150,
    memoryUsed: 64,
  },
  {
    testCaseId: 2,
    passed: false,
    input: '[3,2,4]\n6',
    expectedOutput: '[1,2]',
    actualOutput: '[2,1]',
    executionTime: 140,
    memoryUsed: 60,
    error: 'Wrong output format',
  },
]

export const handlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
    })
  }),

  // Contest endpoints
  http.get('/api/contests/:contestId', ({ params }) => {
    const { contestId } = params
    if (contestId === '1') {
      return HttpResponse.json(mockContest)
    }
    return new HttpResponse(null, { status: 404 })
  }),

  http.get('/api/contests/:contestId/leaderboard', ({ params }) => {
    const { contestId } = params
    if (contestId === '1') {
      return HttpResponse.json(mockLeaderboard)
    }
    return HttpResponse.json([])
  }),

  http.post('/api/contests/:contestId/register', async ({ request }) => {
    const body = (await request.json()) as { username: string; email: string }

    if (body.username === 'existinguser') {
      return HttpResponse.json(
        { message: 'Username already exists' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      id: 2,
      username: body.username,
      email: body.email,
      createdAt: new Date().toISOString(),
    })
  }),

  http.get('/api/contests/:contestId/problems/:problemId', ({ params }) => {
    const { contestId, problemId } = params
    if (contestId === '1' && problemId === '1') {
      return HttpResponse.json(mockContest.problems[0])
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Submission endpoints
  http.post('/api/submissions', async ({ request }) => {
    const body = (await request.json()) as {
      userId: number
      problemId: number
      contestId: number
      code: string
      language: string
    }

    const newSubmission: Submission = {
      id: Date.now(),
      ...body,
      status: 'PENDING',
      score: 0,
      submissionTime: new Date().toISOString(),
    }

    // Simulate async processing
    setTimeout(() => {
      newSubmission.status = body.code.includes('error')
        ? 'COMPILATION_ERROR'
        : 'ACCEPTED'
      newSubmission.score = body.code.includes('error') ? 0 : 100
      newSubmission.executionTime = 150
      newSubmission.memoryUsed = 64
    }, 1000)

    return HttpResponse.json({ submissionId: newSubmission.id })
  }),

  http.get('/api/submissions/:submissionId', ({ params }) => {
    const { submissionId } = params
    const submission = mockSubmissions.find(
      (s) => s.id === parseInt(submissionId as string)
    )

    if (submission) {
      return HttpResponse.json(submission)
    }
    return new HttpResponse(null, { status: 404 })
  }),

  http.get('/api/submissions/:submissionId/status', ({ params }) => {
    const { submissionId } = params
    const submission = mockSubmissions.find(
      (s) => s.id === parseInt(submissionId as string)
    )

    if (submission) {
      return HttpResponse.json({
        id: submission.id,
        status: submission.status,
        score: submission.score,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        errorMessage:
          submission.status === 'COMPILATION_ERROR'
            ? 'Syntax error'
            : undefined,
      })
    }
    return new HttpResponse(null, { status: 404 })
  }),

  http.get('/api/problems/:problemId/submissions', ({ params, request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const { problemId } = params

    const filtered = mockSubmissions.filter(
      (s) =>
        s.problemId === parseInt(problemId as string) &&
        (!userId || s.userId === parseInt(userId))
    )

    return HttpResponse.json(filtered)
  }),

  http.get('/api/submissions/:submissionId/test-results', ({ params }) => {
    const { submissionId } = params
    const submission = mockSubmissions.find(
      (s) => s.id === parseInt(submissionId as string)
    )

    if (submission) {
      return HttpResponse.json(mockTestCaseResults)
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // User endpoints
  http.get('/api/users/:userId', ({ params }) => {
    const { userId } = params
    if (userId === '1') {
      return HttpResponse.json(mockUser)
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Error simulation endpoints
  http.get('/api/error/500', () => {
    return new HttpResponse(null, { status: 500 })
  }),

  http.get('/api/error/timeout', () => {
    return new Promise(() => {
      // Never resolves to simulate timeout
    })
  }),
]
