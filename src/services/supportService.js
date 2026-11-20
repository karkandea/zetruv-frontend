import { apiRequest } from '../api/httpClient'

export async function submitSupportReport(payload) {
  const receipt = await apiRequest('/support/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (receipt?.id !== payload.requestId) throw new Error('The report receipt could not be confirmed.')
  return receipt
}
