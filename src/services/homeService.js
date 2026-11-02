import { apiRequest, hasBackend } from '../api/httpClient'
import { adaptHomepageResponse } from './homeAdapter'

async function getDevelopmentHomepageMock() {
  if (!import.meta.env.DEV) {
    throw new Error('Homepage mock data is development-only')
  }

  const { homepageMock } = await import('../data/mockData')
  return homepageMock
}

export async function getHomepageData() {
  if (!hasBackend) {
    return getDevelopmentHomepageMock()
  }

  try {
    const result = await apiRequest('/homepage')
    return adaptHomepageResponse(result)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Homepage API unavailable, using frontend mock data.', error)
      return getDevelopmentHomepageMock()
    }
    throw error
  }
}

export function getPersonalHomepage(token) {
  return apiRequest('/homepage/personal', {
    cache: 'no-store', headers: { Authorization: `Bearer ${token}` },
  }).then(adaptHomepageResponse)
}
