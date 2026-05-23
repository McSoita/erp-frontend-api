import { expect, test } from '@playwright/test'

const testUsername = 'junior_rep'
const testPassword = process.env.E2E_TEST_PASSWORD ?? 'hashed_password_placeholder'
const useRealBackend = process.env.E2E_USE_REAL_BACKEND === 'true'

test('Authentication Flow and Protected Routes', async ({ page }) => {
  if (!useRealBackend) {
    await page.route('http://localhost:3000/api/hr/login', async (route) => {
      const requestBody = route.request().postDataJSON()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 1,
            username: requestBody.username,
            name: 'ERP Administrator',
          },
        }),
      })
    })
  }

  await page.goto('/')
  await expect(page).toHaveURL('http://127.0.0.1:5173/login')

  await page.getByLabel('Username').fill(testUsername)
  await page.getByLabel('Password').fill(testPassword)
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await expect(page.getByText('Welcome to the ERP')).toBeVisible()
})
