// API client for backend communication

export const API_URL = process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'

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
  countryId?: string | null  // Optional - backend AI will detect country
  name: string
  originalText: string
  sourceUrl: string
  pageTitle?: string
  category?: string
  screenshot?: string  // Phase 0.3: Screenshot for AI vision processing
  tripId?: string      // Phase 0.3: For linking multiple locations to trip
}) {
  console.log('[API Client] Saving location...')
  console.log('[API Client] URL:', `${API_URL}/api/locations`)
  console.log('[API Client] Data keys:', Object.keys(data))
  console.log('[API Client] Has screenshot:', !!data.screenshot)
  
  // BYOK: Get user's API key from settings
  const settings = await chrome.storage.local.get(['useOwnApiKey', 'openaiApiKey'])
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  // Add user's API key if they opted in
  if (settings.useOwnApiKey && settings.openaiApiKey) {
    headers['X-User-OpenAI-Key'] = settings.openaiApiKey
    console.log('[API Client] Including user API key')
  }
  
  try {
    const response = await fetch(`${API_URL}/api/locations`, {
      method: 'POST',
      headers,
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
 * Create a new trip (supports multiple countries)
 */
export async function createTrip(data: {
  userId: string
  name: string
  countryIds: string[]  // Array of country IDs
  startDate?: string  // ISO date string (YYYY-MM-DD)
  endDate?: string    // ISO date string (YYYY-MM-DD)
  durationDays?: number
  isActive?: boolean
  description?: string
}) {
  console.log('[API Client] Creating trip with', data.countryIds.length, 'countries')
  
  const response = await fetch(`${API_URL}/api/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const result = await handleResponse<{ trip: any }>(response)
  console.log('[API Client] ✅ Trip created:', result.trip.id)
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

/**
 * Delete all locations and trips for a user
 * DANGEROUS: Cannot be undone!
 */
export async function deleteAllUserData(userId: string): Promise<boolean> {
  console.log('[API Client] Deleting all user data...')
  
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/data`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[API Client] Delete error:', error)
      throw new Error(error.error || `HTTP ${response.status}`)
    }
    
    console.log('[API Client] ✅ All data deleted')
    return true
  } catch (error) {
    console.error('[API Client] ❌ Delete failed:', error)
    throw error
  }
}

/**
 * Validate OpenAI API key
 * POST /api/validate-openai-key
 */
export async function validateOpenAIKey(apiKey: string): Promise<{
  valid: boolean
  error?: string
  code?: string
}> {
  console.log('[API] Validating OpenAI key...')
  
  const response = await fetch(`${API_URL}/api/validate-openai-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  })
  
  const data = await response.json()
  console.log('[API] Validation result:', data.valid ? 'Valid' : 'Invalid')
  
  return data
}

/**
 * Export trip as formatted text file
 * GET /api/trips/:id/export
 */
export async function exportTrip(tripId: string): Promise<{
  exportText: string
  filename: string
}> {
  console.log('[API] Exporting trip:', tripId)
  
  const response = await fetch(`${API_URL}/api/trips/${tripId}/export`)
  const data = await handleResponse<{
    exportText: string
    filename: string
  }>(response)
  
  console.log('[API] Export successful, filename:', data.filename)
  return data
}

/**
 * Update a trip location (assign day, edit notes)
 * PATCH /api/trip-locations/:id
 */
export async function updateTripLocation(
  tripLocationId: string,
  updates: { dayNumber?: number | null; notes?: string }
) {
  console.log('[API] Updating trip location:', tripLocationId, updates)
  
  const response = await fetch(`${API_URL}/api/trip-locations/${tripLocationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dayNumber: updates.dayNumber,
      notes: updates.notes,
    })
  })
  const data = await handleResponse<{ tripLocation: any }>(response)
  console.log('[API] Trip location updated:', data.tripLocation.id)
  return data.tripLocation
}

/**
 * Unschedule locations on days beyond the new duration
 * POST /api/trips/:id/unschedule-days
 */
export async function unscheduleDays(tripId: string, newDuration: number): Promise<{
  unscheduledCount: number
  unscheduledLocationIds: string[]
}> {
  console.log('[API] Unscheduling days beyond', newDuration, 'for trip:', tripId)
  
  const response = await fetch(
    `${API_URL}/api/trips/${tripId}/unschedule-days`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDuration })
    }
  )
  const data = await handleResponse<{
    unscheduledCount: number
    unscheduledLocationIds: string[]
  }>(response)
  
  console.log('[API] Unscheduled', data.unscheduledCount, 'locations')
  return data
}

// Note: Country detection removed - we now always respect the user's default country setting
// This ensures saves go to the country the user explicitly chose in settings


