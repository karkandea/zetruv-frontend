// Frontend-only browser E2E. All auth HTTP calls are synthetic and intercepted.
// This NEVER sends an email, resets a real account or writes real customer data.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const origin = 'http://127.0.0.1:4178'
const resetToken = 'synthetic-reset-token-not-a-credential'

const json = (route, status, data) => route.fulfill({
  status, contentType: 'application/json',
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
  body: JSON.stringify(data),
})

try {
  for (const [name, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const requests = []
    let failRequest = true
    let rejectToken = true
    await page.route('**/api/v1/**', async route => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      if (request.method() === 'OPTIONS') return route.fulfill({
        status: 204, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
      })
      if (path.endsWith('/auth/forgot-password') && request.method() === 'POST') {
        const body = request.postDataJSON()
        requests.push({ path, body })
        assert.deepEqual(body, { email: 'member@example.test' })
        return failRequest ? json(route, 503, { message: 'Mail service unavailable' })
          : json(route, 202, { resendAfterSeconds: 45, linkExpiresInMinutes: 15 })
      }
      if (path.endsWith('/auth/reset-password') && request.method() === 'POST') {
        const body = request.postDataJSON()
        requests.push({ path, body })
        assert.equal(body.token, resetToken)
        assert.equal(body.newPassword, 'SafePassword2026!')
        assert.equal(body.confirmPassword, body.newPassword)
        return rejectToken ? json(route, 400, { code: 'RESET_LINK_EXPIRED', message: 'expired' })
          : json(route, 200, { message: 'Password updated' })
      }
      return json(route, 404, { message: 'Unrelated synthetic API unavailable' })
    })
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Login', exact: true }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Login' })
    await dialog.waitFor()
    // Keyboard-only users must be able to navigate to Forgot Password.
    const forgotLink = dialog.getByRole('button', { name: 'Forget password?' })
    await forgotLink.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog', { name: 'Forgot password' }).waitFor()
    const email = page.locator('input[name="reset-email"]')
    assert.equal(await email.getAttribute('required'), '')
    await email.fill('not-an-email')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    assert.equal(requests.length, 0, 'invalid email should never reach backend')
    await email.fill(' member@example.test ')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await page.getByRole('alert').getByText(/Mail service unavailable|Permintaan reset/).waitFor()
    assert.equal(requests.length, 1)
    failRequest = false
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await page.getByRole('heading', { name: 'Check your email' }).waitFor()
    assert.equal(requests.length, 2)
    await page.goto(origin + '/auth/reset-password')
    await page.getByText('Tautan reset tidak ditemukan').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Reset password' }).isDisabled(), true)
    assert.equal(requests.length, 2, 'missing token cannot reset password')

    await page.goto(origin + '/auth/reset-password?token=' + encodeURIComponent(resetToken))
    await page.getByRole('heading', { name: 'Create a new password' }).waitFor()
    await page.locator('input[name="new-password"]').fill('SafePassword2026!')
    await page.locator('input[name="confirm-new-password"]').fill('Different2026!')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await page.getByRole('alert').getByText(/Konfirmasi password belum sama/).waitFor()
    assert.equal(requests.length, 2, 'invalid password confirmation cannot reach backend')
    await page.locator('input[name="confirm-new-password"]').fill('SafePassword2026!')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await page.getByRole('alert').getByText(/expired/).waitFor()
    assert.equal(requests.length, 3)
    assert.ok(page.url().includes('token='), 'failed request should keep token for retries')
    rejectToken = false
    await page.getByRole('button', { name: 'Reset password' }).click()
    await page.getByRole('heading', { name: 'Password updated' }).waitFor()
    assert.equal(page.url(), origin + '/', 'reset token removed from address bar')
    assert.equal(requests.length, 4, 'success only after actual mocked API 200')
    const storage = await page.evaluate(() => JSON.stringify({
      local: { ...localStorage }, session: { ...sessionStorage },
    }))
    assert.equal(storage.includes(resetToken), false)
    assert.equal(storage.includes('SafePassword2026!'), false)
    console.log('PASS', name, 'keyboard reset, validation, backend 503/202/400/200, token cleanup')
    await context.close()
  }
} finally {
  await browser.close()
}
