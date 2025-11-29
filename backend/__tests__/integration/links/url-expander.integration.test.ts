/**
 * Integration Tests for URL Expander
 * 
 * These tests verify URL expansion works with real:
 * - Shortened URLs (goo.gl, maps.app.goo.gl)
 * - Network redirects
 * - Real Google Maps URLs after expansion
 * 
 * Prerequisites:
 * - Network access (these tests make real HTTP requests)
 * 
 * Note: These tests may be slower and require network access.
 * They will skip gracefully if network is unavailable.
 * 
 * Warning: These tests use real shortened URLs which may:
 * - Change over time
 * - Have rate limits
 * - Require internet connection
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import {
  expandShortenedUrl,
  isShortenedUrl,
} from '../../../lib/links/url-expander'
import { skipIfNoNetwork } from '../helpers'

describe('URL Expander Integration', () => {
  beforeAll(() => {
    if (skipIfNoNetwork('URL Expander Integration')) {
      console.warn('⚠️  Skipping URL Expander integration tests: Network not available')
    }
  })
  
  describe('expandShortenedUrl with real URLs', () => {
    it('should identify shortened URLs correctly', () => {
      expect(isShortenedUrl('https://goo.gl/maps/abc123')).toBe(true)
      expect(isShortenedUrl('https://maps.app.goo.gl/xyz789')).toBe(true)
      expect(isShortenedUrl('https://bit.ly/example')).toBe(true)
      expect(isShortenedUrl('https://t.co/abc')).toBe(true)
      expect(isShortenedUrl('https://maps.google.com/maps/place/Test')).toBe(false)
    })
    
    it('should expand goo.gl link to full Google Maps URL', async () => {
      if (skipIfNoNetwork()) return
      
      // Note: Replace with a real goo.gl link if you have one
      // This test will fail if the URL doesn't exist
      const shortenedUrl = 'https://goo.gl/maps/example' // Replace with real URL
      
      // Skip if using placeholder
      if (shortenedUrl.includes('example')) {
        console.warn('⚠️  Skipping: Using placeholder URL. Replace with real goo.gl link.')
        return
      }
      
      const expanded = await expandShortenedUrl(shortenedUrl)
      
      expect(expanded).not.toBe(shortenedUrl)
      expect(expanded).toContain('maps.google.com')
      expect(isShortenedUrl(expanded)).toBe(false)
    }, 30000) // 30 second timeout for network requests
    
    it('should handle non-shortened URLs gracefully', async () => {
      if (skipIfNoNetwork()) return
      
      const regularUrl = 'https://maps.google.com/maps/place/Senso-ji+Temple'
      const expanded = await expandShortenedUrl(regularUrl)
      
      // Should return original URL (no expansion needed)
      expect(expanded).toBe(regularUrl)
    })
    
    it('should return original URL on expansion failure', async () => {
      if (skipIfNoNetwork()) return
      
      // Use an invalid shortened URL (404 or network error)
      const invalidUrl = 'https://goo.gl/maps/invalid12345'
      
      // Suppress console.error for this test (expected error)
      const originalError = console.error
      console.error = jest.fn()
      
      try {
        const expanded = await expandShortenedUrl(invalidUrl)
        
        // Should return original URL on failure (graceful degradation)
        expect(expanded).toBe(invalidUrl)
      } finally {
        console.error = originalError
      }
    }, 30000)
  })
  
  describe('Real-world shortened URL patterns', () => {
    it('should identify maps.app.goo.gl URLs', () => {
      expect(isShortenedUrl('https://maps.app.goo.gl/abc123')).toBe(true)
      expect(isShortenedUrl('https://maps.app.goo.gl/xyz789')).toBe(true)
    })
    
    it('should handle case-insensitive hostnames', () => {
      expect(isShortenedUrl('https://GOO.GL/maps/abc')).toBe(true)
      expect(isShortenedUrl('https://Goo.Gl/maps/abc')).toBe(true)
    })
  })
})

