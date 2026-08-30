import { apiRequest, hasBackend } from '../api/httpClient'

export async function submitSupportReport(payload) {
  if (!hasBackend) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { ok: true, mode: 'mock', payload }
  }

  return apiRequest('/support/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
