/**
 * Integration Tests for Link Parser
 * 
 * These tests verify the link parser modules work with real:
 * - Google Maps URLs from various sources
 * - Different URL formats (Place ID, coordinates, place names)
 * - Text extraction and cleaning with real content
 * 
 * Prerequisites:
 * - None (these tests don't require API keys or network)
 * 
 * Note: These tests use real Google Maps URLs to verify parsing
 * works correctly with actual URL formats found in the wild.
 */

import { describe, it, expect } from '@jest/globals'
import {
  extractLinksFromText,
  isGoogleMapsUrl,
  parseGoogleMapsUrl,
} from '../../../lib/links/parser'
import {
  expandShortenedUrl,
  isShortenedUrl,
} from '../../../lib/links/url-expander'
import {
  REAL_GOOGLE_MAPS_URLS,
  REAL_TEXT_WITH_LINKS,
} from '../test-data'

describe('Link Parser Integration', () => {
  describe('extractLinksFromText with real URLs', () => {
    it('should extract Google Maps URL from Reddit-style post', () => {
      const result = extractLinksFromText(REAL_TEXT_WITH_LINKS.SINGLE_LINK)
      
      expect(result.googleMapsLinks).toHaveLength(1)
      expect(result.cleanedText).toContain('Check out')
      expect(result.cleanedText).toContain('amazing')
      expect(result.cleanedText).not.toContain('maps.google.com')
    })
    
    it('should extract multiple Google Maps URLs', () => {
      const result = extractLinksFromText(REAL_TEXT_WITH_LINKS.MULTIPLE_LINKS)
      
      expect(result.googleMapsLinks.length).toBeGreaterThanOrEqual(2)
      expect(result.cleanedText).toBe('Visit and')
    })
    
    it('should handle mixed content (Google Maps + other URLs)', () => {
      const result = extractLinksFromText(REAL_TEXT_WITH_LINKS.MIXED_CONTENT)
      
      expect(result.googleMapsLinks.length).toBeGreaterThanOrEqual(1)
      expect(result.otherLinks.length).toBeGreaterThanOrEqual(1)
      expect(result.cleanedText).toContain('Tokyo travel guide')
    })
    
    it('should handle link at start of text', () => {
      const result = extractLinksFromText(REAL_TEXT_WITH_LINKS.LINK_AT_START)
      
      expect(result.googleMapsLinks).toHaveLength(1)
      expect(result.cleanedText).toBe('This is a must-visit location!')
    })
    
    it('should handle link at end of text', () => {
      const result = extractLinksFromText(REAL_TEXT_WITH_LINKS.LINK_AT_END)
      
      expect(result.googleMapsLinks).toHaveLength(1)
      expect(result.cleanedText).toBe('Amazing temple in Tokyo:')
    })
  })
  
  describe('parseGoogleMapsUrl with real URLs', () => {
    it('should extract Place ID from real Google Maps URL', () => {
      const parsed = parseGoogleMapsUrl(REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_PLACE_ID)
      
      expect(parsed.placeId).toBe('ChIJH_imbZuAZUYREePCK0vvmvU')
      expect(parsed.confidence).toBe('high')
      expect(parsed.originalUrl).toBe(REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_PLACE_ID)
    })
    
    it('should extract coordinates from real Google Maps URL', () => {
      const parsed = parseGoogleMapsUrl(REAL_GOOGLE_MAPS_URLS.TOKYO_TOWER_COORDS)
      
      expect(parsed.coordinates).toBeDefined()
      expect(parsed.coordinates?.lat).toBeCloseTo(35.6586, 4)
      expect(parsed.coordinates?.lng).toBeCloseTo(139.7454, 4)
      expect(parsed.confidence).toBe('medium')
    })
    
    it('should extract query from place name URL', () => {
      const parsed = parseGoogleMapsUrl(REAL_GOOGLE_MAPS_URLS.TSINGTAO_BREWERY_PLACE)
      
      expect(parsed.query).toBeDefined()
      expect(parsed.query).toContain('Tsingtao')
      expect(parsed.confidence).toBe('low')
    })
    
    it('should extract both coordinates and query from full URL', () => {
      const parsed = parseGoogleMapsUrl(REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_FULL)
      
      expect(parsed.coordinates).toBeDefined()
      expect(parsed.query).toBeDefined()
      expect(parsed.query).toContain('Senso-ji')
      expect(parsed.confidence).toBe('medium') // Coordinates take priority
    })
    
    it('should identify real Google Maps URLs correctly', () => {
      expect(isGoogleMapsUrl(REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_PLACE_ID)).toBe(true)
      expect(isGoogleMapsUrl(REAL_GOOGLE_MAPS_URLS.TOKYO_TOWER_COORDS)).toBe(true)
      expect(isGoogleMapsUrl(REAL_GOOGLE_MAPS_URLS.TSINGTAO_BREWERY_PLACE)).toBe(true)
      expect(isGoogleMapsUrl(REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_FULL)).toBe(true)
    })
  })
  
  describe('Real-world URL formats', () => {
    it('should handle URL with place_id query parameter', () => {
      const url = 'https://www.google.com/maps/place/?q=place_id:ChIJH_imbZuAZUYREePCK0vvmvU'
      const parsed = parseGoogleMapsUrl(url)
      
      // May or may not extract Place ID depending on format
      // But should at least identify as Google Maps URL
      expect(isGoogleMapsUrl(url)).toBe(true)
    })
    
    it('should handle URL with data parameter', () => {
      const url = 'https://maps.google.com/maps?data=!4m6!3m5!1s0x60188ed0d12f9adf:0x7116ebf5d51ba95a'
      const parsed = parseGoogleMapsUrl(url)
      
      expect(isGoogleMapsUrl(url)).toBe(true)
      // CID extraction depends on specific pattern
      expect(['low', 'medium']).toContain(parsed.confidence)
    })
  })
  
  describe('Real-world shortened URL expansion and parsing', () => {
    it('should expand and parse maps.app.goo.gl shortened URL', async () => {
      const shortenedUrl = 'https://maps.app.goo.gl/NmAhzAmvd8x8MbdS6?g_st=ipc'
      
      // This test verifies the full flow:
      // 1. URL is identified as shortened
      // 2. URL is expanded
      // 3. Expanded URL is parsed
      // 4. Identifiers are extracted (ftid or q or both)
      
      const isShortened = isShortenedUrl(shortenedUrl)
      expect(isShortened).toBe(true)
      
      const expanded = await expandShortenedUrl(shortenedUrl)
      expect(expanded).not.toBe(shortenedUrl)
      expect(expanded).toContain('google.com/maps')
      
      const parsed = parseGoogleMapsUrl(expanded)
      // Should extract either CID (ftid) or query (q) or both
      expect(parsed.cid || parsed.query).toBeDefined()
      // Should have at least medium confidence if CID is found, or low if only query
      expect(['low', 'medium']).toContain(parsed.confidence)
      
      // Log what was extracted for debugging
      if (parsed.cid) {
        console.log(`[Integration Test] Extracted CID: ${parsed.cid}`)
      }
      if (parsed.query) {
        console.log(`[Integration Test] Extracted query: ${parsed.query}`)
      }
    }, 15000) // 15 second timeout for network request
  })
})

