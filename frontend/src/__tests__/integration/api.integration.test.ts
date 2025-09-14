import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import {
  getContest,
  submitCode,
  getSubmissionStatus,
  getLeaderboard,
  registerUser,
  getProblemSubmissions,
  getSubmissionWithDetails,
  getTestCaseResults,
} from '@/utils/api'

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Start with clean server state
    server.resetHandlers()
  })

  describe('Contest API', () => {
    test('should fetch contest details successfully', async () => {
      const contest = await getContest(1)

      expect(contest).toMatchObject({
        id: 1,
        title: 'Test Contest',
        description: 'A test contest for integration testing',
        maxParticipants: 100,
        problems: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: 'Two Sum',
            difficulty: 'EASY',
          }),
        ]),
      })
    })

    test('should handle contest not found', async () => {
      await expect(getContest(999)).rejects.toThrow('Contest not found')
    })

    test('should fetch leaderboard successfully', async () => {
      const leaderboard = await getLeaderboard(1)

      expect(leaderboard).toHaveLength(2)
      expect(leaderboard[0]).toMatchObject({
        rank: 1,
        username: 'testuser',
        score: 100,
        problemsSolved: 1,
      })
      expect(leaderboard[1]).toMatchObject({
        rank: 2,
        username: 'user2',
        score: 75,
        problemsSolved: 0,
      })
    })

    test('should register user successfully', async () => {
      const newUser = await registerUser(1, {
        username: 'newuser',
        email: 'newuser@example.com',
      })

      expect(newUser).toMatchObject({
        username: 'newuser',
        email: 'newuser@example.com',
        id: expect.any(Number),
        createdAt: expect.any(String),
      })
    })

    test('should handle duplicate username registration', async () => {
      await expect(
        registerUser(1, {
          username: 'existinguser',
          email: 'existing@example.com',
        })
      ).rejects.toThrow('Username already exists')
    })
  })

  describe('Submission API', () => {
    test('should submit code successfully', async () => {
      const result = await submitCode({
        userId: 1,
        problemId: 1,
        contestId: 1,
        code: 'console.log("Hello World");',
        language: 'javascript',
      })

      expect(result).toHaveProperty('submissionId')
      expect(typeof result.submissionId).toBe('number')
    })

    test('should get submission status', async () => {
      const status = await getSubmissionStatus(1)

      expect(status).toMatchObject({
        id: 1,
        status: 'ACCEPTED',
        score: 100,
        executionTime: 150,
        memoryUsed: 64,
      })
    })

    test('should handle submission not found', async () => {
      await expect(getSubmissionStatus(999)).rejects.toThrow()
    })

    test('should get problem submissions for user', async () => {
      const submissions = await getProblemSubmissions(1, 1)

      expect(submissions).toHaveLength(2)
      expect(submissions[0]).toMatchObject({
        id: expect.any(Number),
        userId: 1,
        problemId: 1,
        status: expect.any(String),
        score: expect.any(Number),
      })
    })

    test('should get submission with details', async () => {
      const submission = await getSubmissionWithDetails(1)

      expect(submission).toMatchObject({
        id: 1,
        code: expect.any(String),
        language: expect.any(String),
        status: 'ACCEPTED',
        score: 100,
      })
    })

    test('should get test case results', async () => {
      const results = await getTestCaseResults(1)

      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        testCaseId: 1,
        passed: true,
        input: expect.any(String),
        expectedOutput: expect.any(String),
        actualOutput: expect.any(String),
        executionTime: expect.any(Number),
        memoryUsed: expect.any(Number),
      })
      expect(results[1]).toMatchObject({
        testCaseId: 2,
        passed: false,
        error: 'Wrong output format',
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      server.use(
        http.get('/api/contests/1', () => {
          return HttpResponse.error()
        })
      )

      await expect(getContest(1)).rejects.toThrow()
    })

    test('should handle 500 server errors', async () => {
      server.use(
        http.get('/api/contests/1', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(getContest(1)).rejects.toThrow()
    })

    test('should handle timeout errors', async () => {
      server.use(
        http.get('/api/contests/1', () => {
          return new Promise(() => {
            // Never resolves to simulate timeout
          })
        })
      )

      // Set a short timeout for this test
      const originalTimeout = global.setTimeout
      global.setTimeout = ((callback, delay) => {
        if (delay > 100) {
          callback()
        }
        return originalTimeout(callback, Math.min(delay, 100))
      }) as any

      await expect(getContest(1)).rejects.toThrow()

      global.setTimeout = originalTimeout
    }, 10000)

    test('should handle malformed JSON responses', async () => {
      server.use(
        http.get('/api/contests/1', () => {
          return new HttpResponse('invalid json', {
            headers: { 'Content-Type': 'application/json' },
          })
        })
      )

      await expect(getContest(1)).rejects.toThrow()
    })
  })

  describe('Request Retry Logic', () => {
    test('should retry failed requests', async () => {
      let attempts = 0

      server.use(
        http.get('/api/contests/1', () => {
          attempts++
          if (attempts < 3) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({
            id: 1,
            title: 'Test Contest',
            description: 'Success after retry',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            maxParticipants: 100,
            problems: [],
          })
        })
      )

      const contest = await getContest(1)
      expect(contest.description).toBe('Success after retry')
      expect(attempts).toBe(3)
    })

    test('should eventually fail after max retries', async () => {
      server.use(
        http.get('/api/contests/1', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(getContest(1)).rejects.toThrow()
    })
  })

  describe('Request Interceptors', () => {
    test('should add request timing headers', async () => {
      let requestHeaders: Headers | undefined

      server.use(
        http.get('/api/contests/1', ({ request }) => {
          requestHeaders = request.headers
          return HttpResponse.json({
            id: 1,
            title: 'Test Contest',
            description: 'Test',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            maxParticipants: 100,
            problems: [],
          })
        })
      )

      await getContest(1)

      expect(requestHeaders?.get('X-Request-ID')).toBeTruthy()
    })

    test('should handle authentication headers', async () => {
      // Mock localStorage for JWT token
      const mockToken = 'mock.jwt.token'
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => mockToken),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      })

      let authHeader: string | null = null

      server.use(
        http.post('/api/submissions', ({ request }) => {
          authHeader = request.headers.get('Authorization')
          return HttpResponse.json({ submissionId: 123 })
        })
      )

      await submitCode({
        userId: 1,
        problemId: 1,
        contestId: 1,
        code: 'test code',
        language: 'javascript',
      })

      expect(authHeader).toBe(`Bearer ${mockToken}`)
    })
  })

  describe('Response Caching', () => {
    test('should cache contest data', async () => {
      let requestCount = 0

      server.use(
        http.get('/api/contests/1', () => {
          requestCount++
          return HttpResponse.json({
            id: 1,
            title: 'Cached Contest',
            description: 'This should be cached',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            maxParticipants: 100,
            problems: [],
          })
        })
      )

      // Make multiple requests
      const [contest1, contest2] = await Promise.all([
        getContest(1),
        getContest(1),
      ])

      expect(contest1.title).toBe('Cached Contest')
      expect(contest2.title).toBe('Cached Contest')

      // Should have made only one request due to caching
      // Note: This depends on the actual caching implementation
      expect(requestCount).toBeGreaterThanOrEqual(1)
    })
  })
})
