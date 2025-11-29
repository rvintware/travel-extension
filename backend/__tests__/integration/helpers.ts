/**
 * Integration Test Helpers
 * 
 * Shared utilities for integration tests to handle:
 * - API key checks
 * - Network availability
 * - Test skipping
 * - Common assertions
 */

/**
 * Skip test if API key is not set
 * 
 * @param keyName - Name of environment variable to check
 * @param testName - Optional test name for skip message
 * @returns true if test should be skipped, false otherwise
 * 
 * @example
 * ```typescript
 * if (skipIfNoApiKey('GOOGLE_PLACES_API_KEY')) {
 *   return // Skip this test
 * }
 * ```
 */
export function skipIfNoApiKey(keyName: string, testName?: string): boolean {
  if (!process.env[keyName]) {
    const message = testName 
      ? `Skipping ${testName}: ${keyName} not set`
      : `Skipping: ${keyName} not set`
    console.warn(`⚠️  ${message}`)
    return true
  }
  return false
}

/**
 * Check if network is available
 * Simple check - can be enhanced with actual network test
 * 
 * @returns true if network appears available
 */
export function isNetworkAvailable(): boolean {
  // In Node.js, we assume network is available
  // Could enhance with actual network check if needed
  return true
}

/**
 * Skip test if network is not available
 * 
 * @param testName - Optional test name for skip message
 * @returns true if test should be skipped
 */
export function skipIfNoNetwork(testName?: string): boolean {
  if (!isNetworkAvailable()) {
    const message = testName
      ? `Skipping ${testName}: Network not available`
      : 'Skipping: Network not available'
    console.warn(`⚠️  ${message}`)
    return true
  }
  return false
}

/**
 * Get a known valid Place ID for testing
 * 
 * @returns A verified Place ID
 */
export function getTestPlaceId(): string {
  return 'ChIJH_imbZuAZUYREePCK0vvmvU' // Senso-ji Temple
}

/**
 * Get known coordinates for testing
 * 
 * @returns Coordinates for Senso-ji Temple, Tokyo
 */
export function getTestCoordinates(): { lat: number; lng: number } {
  return { lat: 35.7148, lng: 139.7967 }
}

/**
 * Wait for a specified time (useful for rate limiting)
 * 
 * @param ms - Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelay - Initial delay in milliseconds
 * @returns Result of function or throws error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await wait(delay)
      }
    }
  }
  
  throw lastError || new Error('Retry failed')
}

