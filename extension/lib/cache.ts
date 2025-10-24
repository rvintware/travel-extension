import type { Country, Trip } from './types'

// Cache keys
const CACHE_KEYS = {
  COUNTRIES: 'cache_countries',
  COUNTRIES_TIMESTAMP: 'cache_countries_timestamp',
  TRIPS: 'cache_trips',
  TRIPS_TIMESTAMP: 'cache_trips_timestamp',
  LAST_TAB: 'cache_last_tab',
} as const

// Time to live (TTL) values
const TTL = {
  COUNTRIES: Infinity,           // Never expires (countries rarely change)
  TRIPS: 5 * 60 * 1000,         // 5 minutes
} as const

/**
 * Caching utility for extension data
 * Implements TTL-based caching with automatic invalidation
 */
export class Cache {
  /**
   * Get cached countries (permanent cache)
   */
  static async getCountries(): Promise<{ data: Country[] | null; fresh: boolean }> {
    const result = await chrome.storage.local.get(CACHE_KEYS.COUNTRIES)
    const data = result[CACHE_KEYS.COUNTRIES] || null
    return { data, fresh: data !== null }
  }

  /**
   * Set countries cache
   */
  static async setCountries(countries: Country[]): Promise<void> {
    await chrome.storage.local.set({
      [CACHE_KEYS.COUNTRIES]: countries,
      [CACHE_KEYS.COUNTRIES_TIMESTAMP]: Date.now(),
    })
  }

  /**
   * Get cached trips (5-minute TTL)
   */
  static async getTrips(): Promise<{ data: Trip[] | null; fresh: boolean }> {
    const result = await chrome.storage.local.get([
      CACHE_KEYS.TRIPS,
      CACHE_KEYS.TRIPS_TIMESTAMP,
    ])

    const data = result[CACHE_KEYS.TRIPS] || null
    const timestamp = result[CACHE_KEYS.TRIPS_TIMESTAMP] || 0

    if (!data) {
      return { data: null, fresh: false }
    }

    // Check if cache is still fresh
    const age = Date.now() - timestamp
    const isFresh = age < TTL.TRIPS

    return { data, fresh: isFresh }
  }

  /**
   * Set trips cache
   */
  static async setTrips(trips: Trip[]): Promise<void> {
    await chrome.storage.local.set({
      [CACHE_KEYS.TRIPS]: trips,
      [CACHE_KEYS.TRIPS_TIMESTAMP]: Date.now(),
    })
  }

  /**
   * Invalidate trips cache (force refresh on next load)
   */
  static async invalidateTrips(): Promise<void> {
    await chrome.storage.local.remove([
      CACHE_KEYS.TRIPS,
      CACHE_KEYS.TRIPS_TIMESTAMP,
    ])
  }

  /**
   * Get last opened tab
   */
  static async getLastTab(): Promise<'locations' | 'trips' | null> {
    const result = await chrome.storage.local.get(CACHE_KEYS.LAST_TAB)
    return result[CACHE_KEYS.LAST_TAB] || null
  }

  /**
   * Set last opened tab
   */
  static async setLastTab(tab: 'locations' | 'trips'): Promise<void> {
    await chrome.storage.local.set({ [CACHE_KEYS.LAST_TAB]: tab })
  }

  /**
   * Get cached locations (5-minute TTL)
   */
  static async getLocations(): Promise<{ data: any[] | null; fresh: boolean }> {
    const result = await chrome.storage.local.get([
      'cache_locations',
      'cache_locations_timestamp',
    ])

    const data = result.cache_locations || null
    const timestamp = result.cache_locations_timestamp || 0

    if (!data) {
      return { data: null, fresh: false }
    }

    // Check if cache is still fresh
    const age = Date.now() - timestamp
    const isFresh = age < TTL.TRIPS // 5 minutes

    return { data, fresh: isFresh }
  }

  /**
   * Set locations cache
   */
  static async setLocations(locations: any[]): Promise<void> {
    await chrome.storage.local.set({
      cache_locations: locations,
      cache_locations_timestamp: Date.now(),
    })
  }

  /**
   * Invalidate locations cache
   */
  static async invalidateLocations(): Promise<void> {
    await chrome.storage.local.remove([
      'cache_locations',
      'cache_locations_timestamp',
    ])
  }

  /**
   * Clear all caches (for manual refresh)
   */
  static async clearAll(): Promise<void> {
    await chrome.storage.local.remove([
      CACHE_KEYS.COUNTRIES,
      CACHE_KEYS.COUNTRIES_TIMESTAMP,
      CACHE_KEYS.TRIPS,
      CACHE_KEYS.TRIPS_TIMESTAMP,
      'cache_locations',
      'cache_locations_timestamp',
    ])
  }

  /**
   * Clear trips cache only
   */
  static async clearTrips(): Promise<void> {
    await chrome.storage.local.remove([
      CACHE_KEYS.TRIPS,
      CACHE_KEYS.TRIPS_TIMESTAMP,
    ])
  }
}

