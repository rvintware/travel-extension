import type { SavedCapture, StorageData } from "./types"

// Storage keys
export const STORAGE_KEYS = {
  CAPTURES: 'captures',
  USER_ID: 'userId',
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

