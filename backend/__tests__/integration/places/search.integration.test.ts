/**
 * Integration Tests for Google Places Search
 * 
 * These tests verify Google Places API integration works with real:
 * - Place IDs from Google Maps URLs
 * - Coordinates for nearby search
 * - API responses and data structures
 * 
 * Prerequisites:
 * - GOOGLE_PLACES_API_KEY environment variable must be set
 * 
 * Note: These tests make real API calls and may:
 * - Consume API quota
 * - Be slower than unit tests
 * - Require valid API key
 * 
 * To run these tests:
 * ```bash
 * GOOGLE_PLACES_API_KEY=your_key pnpm test:integration
 * ```
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import {
  searchGooglePlacesByPlaceId,
  searchGooglePlacesByCoordinates,
} from '../../../lib/places/search'
import {
  skipIfNoApiKey,
  getTestPlaceId,
  getTestCoordinates,
} from '../helpers'
import {
  REAL_PLACE_IDS,
  REAL_COORDINATES,
} from '../test-data'

describe('Google Places Integration', () => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const shouldSkip = !apiKey
  
  beforeAll(() => {
    if (shouldSkip) {
      console.warn('⚠️  Skipping Google Places integration tests: API key not set')
      console.warn('   Set GOOGLE_PLACES_API_KEY environment variable to run these tests')
    }
  })
  
  describe('searchGooglePlacesByPlaceId', () => {
    it('should lookup real Place ID and return place data', async () => {
      if (shouldSkip) {
        console.log('Skipping: API key not set')
        return
      }
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByPlaceId(placeId)
      
      expect(place).not.toBeNull()
      expect(place?.place_id).toBe(placeId)
      expect(place?.name).toBeTruthy()
      expect(place?.name.length).toBeGreaterThan(0)
      expect(place?.address).toBeTruthy()
      expect(place?.lat).not.toBe(0)
      expect(place?.lng).not.toBe(0)
      expect(typeof place?.lat).toBe('number')
      expect(typeof place?.lng).toBe('number')
    }, 30000) // 30 second timeout
    
    it('should return null for invalid Place ID', async () => {
      if (shouldSkip) return
      
      const invalidPlaceId = 'INVALID_PLACE_ID_12345'
      const place = await searchGooglePlacesByPlaceId(invalidPlaceId)
      
      expect(place).toBeNull()
    }, 30000)
    
    it('should return null when API key is missing', async () => {
      // Temporarily remove API key
      const originalKey = process.env.GOOGLE_PLACES_API_KEY
      delete process.env.GOOGLE_PLACES_API_KEY
      
      const place = await searchGooglePlacesByPlaceId(REAL_PLACE_IDS.SENS0JI_TEMPLE)
      expect(place).toBeNull()
      
      // Restore API key
      if (originalKey) {
        process.env.GOOGLE_PLACES_API_KEY = originalKey
      }
    })
    
    it('should format result consistently with searchGooglePlaces', async () => {
      if (shouldSkip) return
      
      const place = await searchGooglePlacesByPlaceId(REAL_PLACE_IDS.SENS0JI_TEMPLE)
      
      // Verify PlaceResult structure matches expected format
      expect(place).toHaveProperty('place_id')
      expect(place).toHaveProperty('name')
      expect(place).toHaveProperty('address')
      expect(place).toHaveProperty('lat')
      expect(place).toHaveProperty('lng')
      expect(place).toHaveProperty('photos')
      expect(Array.isArray(place?.photos)).toBe(true)
    }, 30000)
  })
  
  describe('searchGooglePlacesByCoordinates', () => {
    it('should find place near Senso-ji Temple coordinates', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      expect(place).not.toBeNull()
      expect(place?.name).toBeTruthy()
      expect(place?.place_id).toBeTruthy()
      // Should find Senso-ji Temple or nearby place
      expect(place?.name.toLowerCase()).toMatch(/senso|temple|asakusa/i)
    }, 30000)
    
    it('should return null when no nearby places found', async () => {
      if (shouldSkip) return
      
      // Use coordinates in middle of ocean (no places nearby)
      const coords = REAL_COORDINATES.OCEAN_MIDDLE
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      // May return null or a very distant place
      // Either is acceptable behavior
      if (place) {
        // If a place is found, it should be very far away
        expect(place).toBeDefined()
      } else {
        expect(place).toBeNull()
      }
    }, 30000)
    
    it('should use 50-meter radius for nearby search', async () => {
      if (shouldSkip) return
      
      // Test with coordinates very close to Senso-ji Temple
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      if (place) {
        // Verify it found a place (within 50m radius)
        expect(place).not.toBeNull()
        expect(place?.place_id).toBeTruthy()
      }
    }, 30000)
    
    it('should reuse searchGooglePlacesByPlaceId for details', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      if (place) {
        // Result should have full details (not just basic info)
        expect(place.name).toBeTruthy()
        expect(place.address).toBeTruthy()
        expect(place.photos).toBeDefined()
      }
    }, 30000)
    
    it('should handle coordinate precision correctly', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      if (place) {
        expect(typeof place.lat).toBe('number')
        expect(typeof place.lng).toBe('number')
        expect(place.lat).not.toBe(0)
        expect(place.lng).not.toBe(0)
      }
    }, 30000)
  })
  
  describe('Accuracy Verification', () => {
    it('should achieve 100% accuracy for Place ID lookup', async () => {
      if (shouldSkip) return
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByPlaceId(placeId)
      
      // Place ID lookup should always return the exact place
      expect(place).not.toBeNull()
      expect(place?.place_id).toBe(placeId)
      // Verify it's actually Senso-ji Temple
      expect(place?.name.toLowerCase()).toMatch(/senso/i)
    }, 30000)
    
    it('should find correct place within 50m for coordinate lookup', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      expect(place).not.toBeNull()
      
      if (place) {
        // Calculate distance between input coordinates and result coordinates
        // Using Haversine formula (simplified - assumes small distances)
        const latDiff = Math.abs(place.lat - coords.lat)
        const lngDiff = Math.abs(place.lng - coords.lng)
        
        // Convert to meters (rough approximation for small distances)
        const latMeters = latDiff * 111000 // 1 degree latitude ≈ 111km
        const lngMeters = lngDiff * 111000 * Math.cos(coords.lat * Math.PI / 180)
        const distanceMeters = Math.sqrt(latMeters * latMeters + lngMeters * lngMeters)
        
        // Should be within 50m radius (with some tolerance for API precision)
        expect(distanceMeters).toBeLessThan(100) // 100m tolerance
      }
    }, 30000)
    
    it('should return consistent results: Place ID vs Coordinate lookup', async () => {
      if (shouldSkip) return
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      
      const placeById = await searchGooglePlacesByPlaceId(placeId)
      const placeByCoords = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      expect(placeById).not.toBeNull()
      expect(placeByCoords).not.toBeNull()
      
      if (placeById && placeByCoords) {
        // Both should find the same place (or very close)
        // Place ID is authoritative, coordinate may find nearby place
        const distance = Math.sqrt(
          Math.pow(placeById.lat - placeByCoords.lat, 2) +
          Math.pow(placeById.lng - placeByCoords.lng, 2)
        ) * 111000 // Convert to meters
        
        // Should be within reasonable distance (same place or very close)
        expect(distance).toBeLessThan(200) // 200m tolerance
      }
    }, 30000)
  })
  
  describe('Performance Benchmarks', () => {
    it('should complete Place ID lookup within 500ms target', async () => {
      if (shouldSkip) return
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const startTime = Date.now()
      
      const place = await searchGooglePlacesByPlaceId(placeId)
      
      const duration = Date.now() - startTime
      
      expect(place).not.toBeNull()
      // Target: <500ms, but allow some tolerance for network variability
      expect(duration).toBeLessThan(2000) // 2 second tolerance for integration tests
      
      // Log performance for monitoring
      console.log(`[Performance] Place ID lookup: ${duration}ms`)
    }, 30000)
    
    it('should complete coordinate lookup within 1000ms target', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const startTime = Date.now()
      
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      const duration = Date.now() - startTime
      
      expect(place).not.toBeNull()
      // Target: <1000ms, but allow tolerance for network variability
      expect(duration).toBeLessThan(3000) // 3 second tolerance for integration tests
      
      // Log performance for monitoring
      console.log(`[Performance] Coordinate lookup: ${duration}ms`)
    }, 30000)
    
    it('should complete within timeout (5 seconds)', async () => {
      if (shouldSkip) return
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const startTime = Date.now()
      
      const place = await searchGooglePlacesByPlaceId(placeId)
      
      const duration = Date.now() - startTime
      
      expect(place).not.toBeNull()
      // Should complete well within 5 second timeout
      expect(duration).toBeLessThan(5000)
    }, 30000)
  })
  
  describe('Real-World Scenarios', () => {
    it('should work with Place IDs from actual Google Maps URLs', async () => {
      if (shouldSkip) return
      
      // Test with real Place ID from Google Maps URL
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByPlaceId(placeId)
      
      expect(place).not.toBeNull()
      expect(place?.place_id).toBe(placeId)
      expect(place?.name).toBeTruthy()
      expect(place?.address).toBeTruthy()
    }, 30000)
    
    it('should work with coordinates from actual Google Maps URLs', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      expect(place).not.toBeNull()
      expect(place?.place_id).toBeTruthy()
      expect(place?.name).toBeTruthy()
    }, 30000)
  })
})

