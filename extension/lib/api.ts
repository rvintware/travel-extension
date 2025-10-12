// API client for backend communication

const API_URL = process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'

// Types matching backend responses
interface ApiResponse<T> {
  data?: T
  error?: string
}

/**
 * Handle API errors consistently
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  
  if (response.status === 204) {
    return {} as T
  }
  
  return response.json()
}

/**
 * Get all countries
 */
export async function getCountries() {
  const response = await fetch(`${API_URL}/api/countries`)
  const data = await handleResponse<{ countries: any[] }>(response)
  return data.countries
}

/**
 * Create a new location in the pool
 */
export async function saveLocation(data: {
  userId: string
  countryId: string
  name: string
  originalText: string
  sourceUrl: string
  pageTitle?: string
  category?: string
  screenshot?: string  // Phase 0.3: Screenshot for AI vision processing
}) {
  console.log('[API Client] Saving location...')
  console.log('[API Client] URL:', `${API_URL}/api/locations`)
  console.log('[API Client] Data keys:', Object.keys(data))
  console.log('[API Client] Has screenshot:', !!data.screenshot)
  
  try {
    const response = await fetch(`${API_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    console.log('[API Client] Response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[API Client] API error:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    const result = await handleResponse<{ location: any }>(response)
    console.log('[API Client] ✅ Success - Location ID:', result.location.id)
    console.log('[API Client] Processing status:', result.location.processing_status)
    
    return result.location
  } catch (error) {
    console.error('[API Client] ❌ Request failed:', error)
    throw error
  }
}

/**
 * Get locations for a user, optionally filtered by country
 */
export async function getLocations(userId: string, countryId?: string) {
  const url = new URL(`${API_URL}/api/locations`)
  url.searchParams.set('userId', userId)
  if (countryId) {
    url.searchParams.set('countryId', countryId)
  }
  
  const response = await fetch(url.toString())
  const data = await handleResponse<{ locations: any[] }>(response)
  return data.locations
}

/**
 * Get a single location
 */
export async function getLocation(locationId: string) {
  const response = await fetch(`${API_URL}/api/locations/${locationId}`)
  const data = await handleResponse<{ location: any }>(response)
  return data.location
}

/**
 * Update a location
 */
export async function updateLocation(locationId: string, updates: {
  name?: string
  category?: string
  summary?: string
  userNotes?: string
  userRating?: number
  isFavorite?: boolean
}) {
  const response = await fetch(`${API_URL}/api/locations/${locationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  const data = await handleResponse<{ location: any }>(response)
  return data.location
}

/**
 * Delete a location permanently (from pool and all trips)
 */
export async function deleteLocation(locationId: string) {
  const response = await fetch(`${API_URL}/api/locations/${locationId}`, {
    method: 'DELETE'
  })
  await handleResponse(response)
}

/**
 * Create a new trip
 */
export async function createTrip(data: {
  userId: string
  countryId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  durationDays?: number
}) {
  const response = await fetch(`${API_URL}/api/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const result = await handleResponse<{ trip: any }>(response)
  return result.trip
}

/**
 * Get all trips for a user
 */
export async function getTrips(userId: string) {
  const response = await fetch(`${API_URL}/api/trips?userId=${userId}`)
  const data = await handleResponse<{ trips: any[] }>(response)
  return data.trips
}

/**
 * Get a single trip
 */
export async function getTrip(tripId: string) {
  const response = await fetch(`${API_URL}/api/trips/${tripId}`)
  const data = await handleResponse<{ trip: any }>(response)
  return data.trip
}

/**
 * Update a trip
 */
export async function updateTrip(tripId: string, updates: {
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  durationDays?: number
  isActive?: boolean
  isArchived?: boolean
}) {
  const response = await fetch(`${API_URL}/api/trips/${tripId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  const data = await handleResponse<{ trip: any }>(response)
  return data.trip
}

/**
 * Delete a trip (locations remain in pool)
 */
export async function deleteTrip(tripId: string) {
  const response = await fetch(`${API_URL}/api/trips/${tripId}`, {
    method: 'DELETE'
  })
  await handleResponse(response)
}

/**
 * Get all locations in a trip, organized by day
 */
export async function getTripLocations(tripId: string) {
  const response = await fetch(`${API_URL}/api/trips/${tripId}/locations`)
  const data = await handleResponse<{ 
    tripId: string
    locations: any[]
    byDay: Record<string | number, any[]>
    count: number
  }>(response)
  return data
}

/**
 * Link a location to a trip
 */
export async function linkLocationToTrip(data: {
  tripId: string
  locationId: string
  dayNumber?: number
  displayOrder?: number
  timeOfDay?: string
  suggestedTime?: string
  estimatedDurationMinutes?: number
  notes?: string
  priority?: 'must_see' | 'normal' | 'optional'
}) {
  const response = await fetch(`${API_URL}/api/trip-locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const result = await handleResponse<{ tripLocation: any }>(response)
  return result.tripLocation
}

/**
 * Remove a location from a trip (keeps in library)
 */
export async function removeFromTrip(tripId: string, locationId: string) {
  const response = await fetch(
    `${API_URL}/api/trip-locations?tripId=${tripId}&locationId=${locationId}`,
    { method: 'DELETE' }
  )
  await handleResponse(response)
}

/**
 * Helper: Extract simple name from highlighted text
 */
export function extractNameFromText(text: string): string {
  // Take first sentence or first 50 chars
  const firstSentence = text.split(/[.!?]/)[0]
  return firstSentence.length > 50 
    ? firstSentence.substring(0, 50).trim() + '...'
    : firstSentence.trim()
}

// Note: Country detection removed - we now always respect the user's default country setting
// This ensures saves go to the country the user explicitly chose in settings

