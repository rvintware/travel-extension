import type { SavedCapture, Settings } from "./types"

// Storage keys
export const STORAGE_KEYS = {
  CAPTURES: 'captures',          // Phase 0.1 legacy
  USER_ID: 'userId',
  SETTINGS: 'settings',          // Phase 0.2
  CACHED_COUNTRIES: 'cachedCountries',
  CACHED_TRIPS: 'cachedTrips',
} as const

/**
 * Get all saved captures from chrome.storage.local
 */
export async function getCaptures(): Promise<SavedCapture[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CAPTURES)
  return result[STORAGE_KEYS.CAPTURES] || []
}

/**
 * Save a new capture to chrome.storage.local
 */
export async function saveCapture(capture: SavedCapture): Promise<void> {
  const captures = await getCaptures()
  // Add to the beginning (most recent first)
  captures.unshift(capture)
  await chrome.storage.local.set({ [STORAGE_KEYS.CAPTURES]: captures })
}

/**
 * Delete a capture by ID
 */
export async function deleteCapture(captureId: string): Promise<void> {
  const captures = await getCaptures()
  const updated = captures.filter(c => c.id !== captureId)
  await chrome.storage.local.set({ [STORAGE_KEYS.CAPTURES]: updated })
}

/**
 * Get or create user ID
 */
export async function getUserId(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USER_ID)
  
  if (result[STORAGE_KEYS.USER_ID]) {
    return result[STORAGE_KEYS.USER_ID]
  }
  
  // Generate new user ID
  const userId = crypto.randomUUID()
  await chrome.storage.local.set({ [STORAGE_KEYS.USER_ID]: userId })
  return userId
}

/**
 * Clear all captures (for testing/development)
 */
export async function clearAllCaptures(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.CAPTURES]: [] })
}

// ============================================================================
// PHASE 0.2: Settings Management
// ============================================================================

/**
 * Get user settings
 */
export async function getSettings(): Promise<Settings | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
  return result[STORAGE_KEYS.SETTINGS] || null
}

/**
 * Save user settings
 */
export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings })
}

/**
 * Get default country ID
 */
export async function getDefaultCountry(): Promise<string | null> {
  const settings = await getSettings()
  return settings?.defaultCountryId || null
}

/**
 * Set default country ID
 */
export async function setDefaultCountry(countryId: string): Promise<void> {
  const settings = await getSettings() || {
    defaultCountryId: countryId,
    defaultView: 'trips',
    rememberLastTab: false,
  }
  settings.defaultCountryId = countryId
  await saveSettings(settings)
}

/**
 * Get default trip ID
 */
export async function getDefaultTrip(): Promise<string | null> {
  const settings = await getSettings()
  return settings?.defaultTripId || null
}

/**
 * Set default trip ID
 */
export async function setDefaultTrip(tripId: string | null): Promise<void> {
  const settings = await getSettings() || {
    defaultCountryId: '',
    defaultView: 'trips',
    rememberLastTab: false,
  }
  settings.defaultTripId = tripId || undefined
  await saveSettings(settings)
}

