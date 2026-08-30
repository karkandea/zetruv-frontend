import { apiRequest, hasBackend } from '../api/httpClient'
import { homepageMock } from '../data/mockData'

export async function getHomepageData() {
  if (!hasBackend) return homepageMock

  try {
    return await apiRequest('/homepage')
  } catch (error) {
    console.warn('Homepage API unavailable, using frontend mock data.', error)
    return homepageMock
  }
}
