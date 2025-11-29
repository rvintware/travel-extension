/**
 * Performance Benchmarks for Google Places Search
 * 
 * These tests measure latency and performance characteristics of Google Places API calls.
 * 
 * Prerequisites:
 * - GOOGLE_PLACES_API_KEY environment variable must be set
 * 
 * Note: These tests make real API calls and consume quota.
 * Run sparingly, typically:
 * - During development (to verify performance)
 * - Before releases (to catch regressions)
 * - Not on every commit (to save quota)
 * 
 * To run these tests:
 * ```bash
 * GOOGLE_PLACES_API_KEY=your_key pnpm test:performance
 * ```
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import {
  searchGooglePlacesByPlaceId,
  searchGooglePlacesByCoordinates,
} from '../../lib/places/search'
import {
  REAL_PLACE_IDS,
  REAL_COORDINATES,
} from '../integration/test-data'

describe('Google Places Performance Benchmarks', () => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const shouldSkip = !apiKey
  
  beforeAll(() => {
    if (shouldSkip) {
      console.warn('⚠️  Skipping performance benchmarks: API key not set')
      console.warn('   Set GOOGLE_PLACES_API_KEY environment variable to run these tests')
    }
  })
  
  describe('Place ID Lookup Performance', () => {
    it('should complete Place ID lookup within 500ms target', async () => {
      if (shouldSkip) return
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const startTime = Date.now()
      
      const place = await searchGooglePlacesByPlaceId(placeId)
      
      const duration = Date.now() - startTime
      
      expect(place).not.toBeNull()
      // Target: <500ms
      expect(duration).toBeLessThan(500)
      
      console.log(`[Benchmark] Place ID lookup: ${duration}ms (target: <500ms)`)
    }, 10000)
    
    it('should measure average latency across multiple calls', async () => {
      if (shouldSkip) return
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const iterations = 3
      const durations: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        await searchGooglePlacesByPlaceId(placeId)
        durations.push(Date.now() - startTime)
      }
      
      const average = durations.reduce((a, b) => a + b, 0) / durations.length
      const max = Math.max(...durations)
      const min = Math.min(...durations)
      
      console.log(`[Benchmark] Place ID lookup (${iterations} iterations):`)
      console.log(`  Average: ${average.toFixed(2)}ms`)
      console.log(`  Min: ${min}ms`)
      console.log(`  Max: ${max}ms`)
      
      // Average should be reasonable
      expect(average).toBeLessThan(1000)
    }, 30000)
  })
  
  describe('Coordinate Lookup Performance', () => {
    it('should complete coordinate lookup within 1000ms target', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const startTime = Date.now()
      
      const place = await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      const duration = Date.now() - startTime
      
      expect(place).not.toBeNull()
      // Target: <1000ms (includes nearby search + place details)
      expect(duration).toBeLessThan(1000)
      
      console.log(`[Benchmark] Coordinate lookup: ${duration}ms (target: <1000ms)`)
    }, 10000)
    
    it('should measure average latency across multiple calls', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const iterations = 3
      const durations: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
        durations.push(Date.now() - startTime)
      }
      
      const average = durations.reduce((a, b) => a + b, 0) / durations.length
      const max = Math.max(...durations)
      const min = Math.min(...durations)
      
      console.log(`[Benchmark] Coordinate lookup (${iterations} iterations):`)
      console.log(`  Average: ${average.toFixed(2)}ms`)
      console.log(`  Min: ${min}ms`)
      console.log(`  Max: ${max}ms`)
      
      // Average should be reasonable
      expect(average).toBeLessThan(2000)
    }, 30000)
  })
  
  describe('API Call Overhead', () => {
    it('should measure overhead of Place ID lookup', async () => {
      if (shouldSkip) return
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const startTime = process.hrtime.bigint()
      
      await searchGooglePlacesByPlaceId(placeId)
      
      const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000 // Convert to ms
      
      console.log(`[Benchmark] Place ID lookup overhead: ${duration.toFixed(2)}ms`)
      
      // Should complete reasonably quickly
      expect(duration).toBeLessThan(2000)
    }, 10000)
    
    it('should measure overhead of coordinate lookup', async () => {
      if (shouldSkip) return
      
      const coords = REAL_COORDINATES.SENS0JI_TEMPLE
      const startTime = process.hrtime.bigint()
      
      await searchGooglePlacesByCoordinates(coords.lat, coords.lng)
      
      const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000 // Convert to ms
      
      console.log(`[Benchmark] Coordinate lookup overhead: ${duration.toFixed(2)}ms`)
      
      // Should complete reasonably quickly
      expect(duration).toBeLessThan(3000)
    }, 10000)
  })
  
  describe('Memory Usage', () => {
    it('should not leak memory on repeated Place ID lookups', async () => {
      if (shouldSkip) return
      
      const placeId = REAL_PLACE_IDS.SENS0JI_TEMPLE
      const initialMemory = process.memoryUsage().heapUsed
      
      // Perform multiple lookups
      for (let i = 0; i < 5; i++) {
        await searchGooglePlacesByPlaceId(placeId)
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      console.log(`[Benchmark] Memory increase after 5 lookups: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
      
      // Memory increase should be reasonable (<10MB for 5 calls)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    }, 30000)
  })
})

