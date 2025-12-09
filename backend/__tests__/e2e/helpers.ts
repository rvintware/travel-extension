/**
 * End-to-End Test Helpers
 * 
 * Helper functions for E2E tests including:
 * - Mock Inngest event creation
 * - Job completion polling
 * - Database verification
 * - Performance measurement
 * - Cost metrics extraction
 */

import { inngest } from '@/lib/inngest'
import { E2E_TEST_URLS, E2E_TEST_TEXT, TEST_USER_IDS, TEST_TRIP_IDS, TEST_COUNTRY_IDS, TEST_PAGE_DATA, MOCK_SCREENSHOT } from './test-data'

/**
 * Lazy import for supabase client
 * This prevents module load errors when environment variables are not set
 */
async function getSupabase() {
  const { supabase } = await import('@/lib/supabase')
  return supabase
}

/**
 * Inngest event payload structure
 */
export interface LocationCreatedEventData {
  locationId: string
  screenshot: string | null
  selectedText: string
  linkUrl: string | null
  url: string
  pageTitle: string
  userId: string
  countryId?: string | null
  tripId?: string | null
  userApiKey?: string | null
}

/**
 * Create a mock Inngest event payload for testing
 * 
 * @param overrides - Partial event data to override defaults
 * @returns Complete event payload
 */
export function createMockInngestEvent(
  overrides: Partial<LocationCreatedEventData> = {}
): { name: string; data: LocationCreatedEventData } {
  const defaultEvent: LocationCreatedEventData = {
    locationId: `test-location-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    screenshot: MOCK_SCREENSHOT,
    selectedText: E2E_TEST_TEXT.TEXT_ONLY,
    linkUrl: null,
    url: TEST_PAGE_DATA.REDDIT_POST.url,
    pageTitle: TEST_PAGE_DATA.REDDIT_POST.title,
    userId: TEST_USER_IDS.DEFAULT,
    countryId: TEST_COUNTRY_IDS.JAPAN,
    tripId: null,
    userApiKey: null,
  }

  return {
    name: 'location/created',
    data: { ...defaultEvent, ...overrides },
  }
}

/**
 * Wait for Inngest job completion by polling database
 * 
 * Note: This requires the job to update the location's processing_status
 * 
 * @param locationId - Location ID to check
 * @param timeoutMs - Maximum time to wait (default: 60 seconds)
 * @param pollIntervalMs - How often to check (default: 1 second)
 * @returns Final processing status
 */
export async function waitForJobCompletion(
  locationId: string,
  timeoutMs: number = 60000,
  pollIntervalMs: number = 1000
): Promise<'pending' | 'processing' | 'complete' | 'error' | 'timeout'> {
  const supabase = await getSupabase()
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const { data, error } = await supabase
      .from('locations')
      .select('processing_status')
      .eq('id', locationId)
      .single()

    if (error) {
      console.error('[E2E Helper] Error checking job status:', error)
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
      continue
    }

    const status = data?.processing_status

    if (status === 'complete' || status === 'error') {
      return status
    }

    // Still processing, wait and check again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }

  return 'timeout'
}

/**
 * Verify location exists in database with expected fields
 * 
 * @param locationId - Location ID to verify
 * @param expectedFields - Expected field values to check
 * @returns Verification result with details
 */
export async function verifyLocationInDatabase(
  locationId: string,
  expectedFields?: {
    place_id?: string
    link_url?: string | null
    name?: string
    processing_status?: string
  }
): Promise<{
  exists: boolean
  location: any | null
  errors: string[]
}> {
  const supabase = await getSupabase()
  const errors: string[] = []

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single()

  if (error || !data) {
    return {
      exists: false,
      location: null,
      errors: [error?.message || 'Location not found'],
    }
  }

  // Verify expected fields if provided
  if (expectedFields) {
    if (expectedFields.place_id !== undefined && data.place_id !== expectedFields.place_id) {
      errors.push(`Expected place_id ${expectedFields.place_id}, got ${data.place_id}`)
    }

    if (expectedFields.link_url !== undefined && data.link_url !== expectedFields.link_url) {
      errors.push(`Expected link_url ${expectedFields.link_url}, got ${data.link_url}`)
    }

    if (expectedFields.name !== undefined && data.name !== expectedFields.name) {
      errors.push(`Expected name ${expectedFields.name}, got ${data.name}`)
    }

    if (expectedFields.processing_status !== undefined && data.processing_status !== expectedFields.processing_status) {
      errors.push(`Expected processing_status ${expectedFields.processing_status}, got ${data.processing_status}`)
    }
  }

  return {
    exists: true,
    location: data,
    errors,
  }
}

/**
 * Measure job execution duration
 * 
 * @param event - Inngest event to trigger
 * @returns Duration in milliseconds and job result
 */
export async function measureJobDuration(
  event: { name: string; data: LocationCreatedEventData }
): Promise<{
  durationMs: number
  locationId: string
  status: string
}> {
  const startTime = performance.now()

  // Trigger the job by sending event
  // Note: In real E2E tests, this would use Inngest dev server
  // For now, we'll simulate by creating location and waiting
  const locationId = event.data.locationId

  // Send event to Inngest (requires dev server running)
  try {
    await inngest.send(event)
  } catch (error) {
    console.warn('[E2E Helper] Inngest send failed (dev server may not be running):', error)
    // Continue anyway for testing
  }

  // Wait for job completion
  const status = await waitForJobCompletion(locationId)

  const endTime = performance.now()
  const durationMs = endTime - startTime

  return {
    durationMs,
    locationId,
    status,
  }
}

/**
 * Extract cost metrics from job execution
 * 
 * Note: This is a placeholder - actual implementation would require
 * intercepting API calls or parsing logs
 * 
 * @param locationId - Location ID to analyze
 * @returns Cost metrics estimate
 */
export async function extractCostMetrics(
  locationId: string
): Promise<{
  openaiTokens?: number
  googleApiCalls?: number
  estimatedCost?: number
}> {
  // TODO: Implement actual cost extraction
  // This would require:
  // 1. Mocking OpenAI client to capture token usage
  // 2. Mocking Google Places client to count API calls
  // 3. Calculating costs based on current pricing

  return {
    openaiTokens: undefined,
    googleApiCalls: undefined,
    estimatedCost: undefined,
  }
}

/**
 * Clean up test data from database
 * 
 * @param locationId - Location ID to delete
 */
export async function cleanupTestLocation(locationId: string): Promise<void> {
  try {
    const supabase = await getSupabase()
    await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
  } catch (error) {
    console.warn('[E2E Helper] Failed to cleanup location:', error)
  }
}

/**
 * Create a test location in database (placeholder for job processing)
 * 
 * @param eventData - Event data containing location info
 * @returns Created location ID
 */
export async function createTestLocation(
  eventData: LocationCreatedEventData
): Promise<string> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('locations')
    .insert({
      id: eventData.locationId,
      user_id: eventData.userId,
      country_id: eventData.countryId,
      name: 'Test Location',
      original_text: eventData.selectedText,
      link_url: eventData.linkUrl,
      source_url: eventData.url,
      page_title: eventData.pageTitle,
      processing_status: 'pending',
      location_verified: false,
      is_from_itinerary: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test location: ${error.message}`)
  }

  return data.id
}

/**
 * Calculate statistics from an array of measurements
 * 
 * @param measurements - Array of numeric measurements
 * @returns Statistics object
 */
export function calculateStatistics(measurements: number[]): {
  mean: number
  median: number
  min: number
  max: number
  p95: number
  p99: number
} {
  if (measurements.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      p95: 0,
      p99: 0,
    }
  }

  const sorted = [...measurements].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)

  return {
    mean: sum / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  }
}

