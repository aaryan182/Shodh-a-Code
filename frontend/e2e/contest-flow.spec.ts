import { test, expect } from '@playwright/test'

test.describe('Contest Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for E2E tests
    await page.route('**/api/contests/1', async (route) => {
      await route.fulfill({
        json: {
          id: 1,
          title: 'E2E Test Contest',
          description: 'End-to-end testing contest',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
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
        },
      })
    })

    await page.route('**/api/contests/1/leaderboard', async (route) => {
      await route.fulfill({
        json: [
          {
            rank: 1,
            userId: 1,
            username: 'e2euser',
            score: 100,
            problemsSolved: 1,
            totalAttempts: 2,
            lastSubmissionTime: new Date().toISOString(),
            problemStatus: [{ problemId: 1, status: 'solved', attempts: 2 }],
          },
        ],
      })
    })
  })

  test('should complete full contest registration flow', async ({ page }) => {
    // Mock registration endpoint
    await page.route('**/api/contests/1/register', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      if (postData.username === 'e2euser') {
        await route.fulfill({
          json: {
            id: 1,
            username: 'e2euser',
            email: 'e2e@example.com',
            createdAt: new Date().toISOString(),
          },
        })
      } else {
        await route.fulfill({
          status: 400,
          json: { message: 'Username already exists' },
        })
      }
    })

    // Go to join page
    await page.goto('/join')

    // Fill registration form
    await page.fill('[data-testid="username-input"]', 'e2euser')
    await page.fill('[data-testid="email-input"]', 'e2e@example.com')

    // Submit form
    await page.click('[data-testid="join-button"]')

    // Should redirect to contest page
    await expect(page).toHaveURL('/contest/1')
    await expect(page.locator('text=E2E Test Contest')).toBeVisible()
  })

  test('should handle registration validation errors', async ({ page }) => {
    await page.goto('/join')

    // Try to submit empty form
    await page.click('[data-testid="join-button"]')

    // Should show validation errors
    await expect(page.locator('text=Username is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
  })

  test('should complete code submission flow', async ({ page }) => {
    let submissionId = 123

    // Mock submission endpoints
    await page.route('**/api/submissions', async (route) => {
      await route.fulfill({
        json: { submissionId },
      })
    })

    await page.route(
      `**/api/submissions/${submissionId}/status`,
      async (route) => {
        await route.fulfill({
          json: {
            id: submissionId,
            status: 'ACCEPTED',
            score: 100,
            executionTime: 150,
            memoryUsed: 64,
          },
        })
      }
    )

    // Go to contest page
    await page.goto('/contest/1')

    // Wait for contest to load
    await expect(page.locator('text=Two Sum')).toBeVisible()

    // Write code in editor
    const editor = page.locator('[data-testid="monaco-editor"]')
    await editor.fill('function twoSum(nums, target) {\n  return [0, 1];\n}')

    // Submit code
    await page.click('[data-testid="submit-button"]')

    // Should show submission status
    await expect(page.locator('text=ACCEPTED')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Score: 100')).toBeVisible()
  })

  test('should handle code compilation errors', async ({ page }) => {
    let submissionId = 124

    await page.route('**/api/submissions', async (route) => {
      await route.fulfill({
        json: { submissionId },
      })
    })

    await page.route(
      `**/api/submissions/${submissionId}/status`,
      async (route) => {
        await route.fulfill({
          json: {
            id: submissionId,
            status: 'COMPILATION_ERROR',
            score: 0,
            errorMessage: 'Syntax error: unexpected token',
          },
        })
      }
    )

    await page.goto('/contest/1')
    await expect(page.locator('text=Two Sum')).toBeVisible()

    // Write invalid code
    const editor = page.locator('[data-testid="monaco-editor"]')
    await editor.fill('invalid syntax {')

    await page.click('[data-testid="submit-button"]')

    // Should show compilation error
    await expect(page.locator('text=COMPILATION_ERROR')).toBeVisible({
      timeout: 10000,
    })
    await expect(page.locator('text=Syntax error')).toBeVisible()
  })

  test('should switch between programming languages', async ({ page }) => {
    await page.goto('/contest/1')
    await expect(page.locator('text=Two Sum')).toBeVisible()

    // Should start with JavaScript
    const languageSelect = page.locator('[data-testid="language-select"]')
    await expect(languageSelect).toHaveValue('javascript')

    // Switch to Java
    await languageSelect.selectOption('java')
    await expect(languageSelect).toHaveValue('java')

    // Editor should update with Java template
    const editor = page.locator('[data-testid="monaco-editor"]')
    const editorContent = await editor.inputValue()
    expect(editorContent).toContain('public class')
    expect(editorContent).toContain('public static void main')
  })

  test('should interact with leaderboard', async ({ page }) => {
    await page.goto('/contest/1')
    await expect(page.locator('text=E2E Test Contest')).toBeVisible()

    // Should see leaderboard
    await expect(page.locator('text=e2euser')).toBeVisible()
    await expect(page.locator('text=100').first()).toBeVisible()

    // Search leaderboard
    const searchInput = page.locator('[data-testid="leaderboard-search"]')
    await searchInput.fill('e2euser')

    // Should filter results
    await expect(page.locator('text=e2euser')).toBeVisible()

    // Clear search
    await searchInput.fill('')
    await expect(page.locator('text=e2euser')).toBeVisible()
  })

  test('should navigate between problem tabs', async ({ page }) => {
    // Mock submission history
    await page.route('**/api/problems/1/submissions*', async (route) => {
      await route.fulfill({
        json: [
          {
            id: 1,
            userId: 1,
            problemId: 1,
            contestId: 1,
            code: 'function solution() { return [0, 1]; }',
            language: 'javascript',
            status: 'ACCEPTED',
            score: 100,
            submissionTime: new Date().toISOString(),
            executionTime: 150,
            memoryUsed: 64,
          },
        ],
      })
    })

    await page.goto('/contest/1')
    await expect(page.locator('text=Two Sum')).toBeVisible()

    // Should start on Problem Details tab
    await expect(page.locator('text=Given an array of integers')).toBeVisible()

    // Switch to My Submissions tab
    await page.click('text=My Submissions')

    // Should show submission history
    await expect(page.locator('text=ACCEPTED')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=100').first()).toBeVisible()

    // Switch to Test Results tab
    await page.click('text=Test Results')

    // Should show test results section
    await expect(
      page.locator('text=Test Results') || page.locator('text=No results')
    ).toBeVisible()
  })

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/contest/1')
    await expect(page.locator('text=E2E Test Contest')).toBeVisible()

    // Should have mobile-friendly layout
    const container = page.locator('[data-testid="contest-container"]')
    await expect(container).toBeVisible()

    // Code editor should be responsive
    const editor = page.locator('[data-testid="monaco-editor"]')
    await expect(editor).toBeVisible()

    // Mobile menu should work if present
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    }
  })

  test('should persist code in localStorage', async ({ page }) => {
    await page.goto('/contest/1')
    await expect(page.locator('text=Two Sum')).toBeVisible()

    // Write code
    const editor = page.locator('[data-testid="monaco-editor"]')
    const testCode = 'function testPersistence() { return "saved"; }'
    await editor.fill(testCode)

    // Wait for auto-save
    await page.waitForTimeout(3000)

    // Reload page
    await page.reload()
    await expect(page.locator('text=Two Sum')).toBeVisible()

    // Code should be restored
    const restoredContent = await editor.inputValue()
    expect(restoredContent).toContain('testPersistence')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error for contest data
    await page.route('**/api/contests/1', async (route) => {
      await route.abort('failed')
    })

    await page.goto('/contest/1')

    // Should show error state
    await expect(
      page.locator('text=Error') || page.locator('text=Failed to load')
    ).toBeVisible({ timeout: 10000 })

    // Should have retry option
    const retryButton =
      page.locator('text=Retry') || page.locator('[data-testid="retry-button"]')
    if (await retryButton.isVisible()) {
      // Fix network and retry
      await page.route('**/api/contests/1', async (route) => {
        await route.fulfill({
          json: {
            id: 1,
            title: 'Recovered Contest',
            description: 'Contest after network recovery',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            maxParticipants: 100,
            problems: [],
          },
        })
      })

      await retryButton.click()
      await expect(page.locator('text=Recovered Contest')).toBeVisible()
    }
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/contest/1')
    await expect(page.locator('text=Two Sum')).toBeVisible()

    const editor = page.locator('[data-testid="monaco-editor"]')
    await editor.fill('function test() { console.log("test"); }')

    // Test Ctrl+S for submit
    await page.keyboard.press('Control+KeyS')

    // Should trigger submit (if implemented)
    // This depends on the actual implementation of keyboard shortcuts

    // Test other shortcuts if implemented
    await page.keyboard.press('Control+Shift+KeyF') // Format code
    await page.keyboard.press('F11') // Full screen (if implemented)
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Mock user session
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock.jwt.token')
      localStorage.setItem('user_id', '1')
    })

    await page.goto('/contest/1')
    await expect(page.locator('text=E2E Test Contest')).toBeVisible()

    // Refresh page
    await page.reload()

    // Should still be authenticated and show contest
    await expect(page.locator('text=E2E Test Contest')).toBeVisible()

    // Should not redirect to login page
    expect(page.url()).toContain('/contest/1')
  })
})
