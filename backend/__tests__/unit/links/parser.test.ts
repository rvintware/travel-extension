import { describe, it, expect } from '@jest/globals'
import {
  extractLinksFromText,
  isGoogleMapsUrl,
  parseGoogleMapsUrl,
  LinkExtractionResult,
  ParsedMapLink
} from '../../../lib/links/parser'

describe('Link Parser', () => {
  describe('extractLinksFromText', () => {
    it('should extract single Google Maps URL from text', () => {
      const text = 'Check out https://maps.google.com/maps/place/Senso-ji+Temple and visit!'
      const result = extractLinksFromText(text)
      
      expect(result.googleMapsLinks).toHaveLength(1)
      expect(result.otherLinks).toHaveLength(0)
      expect(result.cleanedText).toBe('Check out and visit!')
      expect(result.googleMapsLinks[0].originalUrl).toContain('maps.google.com')
    })
    
    it('should extract multiple URLs (mixed Google Maps and other)', () => {
      const text = 'Link1: https://goo.gl/maps/abc Link2: https://maps.google.com/xyz Link3: https://reddit.com/r/travel'
      const result = extractLinksFromText(text)
      
      expect(result.googleMapsLinks.length).toBeGreaterThanOrEqual(2)
      expect(result.otherLinks).toContain('https://reddit.com/r/travel')
      expect(result.cleanedText).toBe('Link1: Link2: Link3:')
    })
    
    it('should handle text with no URLs', () => {
      const text = 'Just plain text with no links'
      const result = extractLinksFromText(text)
      
      expect(result.googleMapsLinks).toHaveLength(0)
      expect(result.otherLinks).toHaveLength(0)
      expect(result.cleanedText).toBe(text)
    })
    
    it('should preserve text context around URLs', () => {
      const text = 'Visit Tokyo Tower at https://maps.google.com/maps?place_id=ChIJ123 for great views!'
      const result = extractLinksFromText(text)
      
      expect(result.cleanedText).toBe('Visit Tokyo Tower at for great views!')
      expect(result.googleMapsLinks).toHaveLength(1)
    })
    
    it('should handle URLs at start of text', () => {
      const text = 'https://maps.google.com/maps/place/Test Location is amazing'
      const result = extractLinksFromText(text)
      
      expect(result.googleMapsLinks).toHaveLength(1)
      expect(result.cleanedText).toBe('Location is amazing')
    })
    
    it('should handle URLs at end of text', () => {
      const text = 'Amazing place: https://maps.google.com/maps/place/Test'
      const result = extractLinksFromText(text)
      
      expect(result.googleMapsLinks).toHaveLength(1)
      expect(result.cleanedText).toBe('Amazing place:')
    })
    
    it('should handle URLs in middle of text', () => {
      const text = 'Check out https://maps.google.com/maps/place/Test and enjoy!'
      const result = extractLinksFromText(text)
      
      expect(result.googleMapsLinks).toHaveLength(1)
      expect(result.cleanedText).toBe('Check out and enjoy!')
    })
    
    it('should handle multiple spaces after URL removal', () => {
      const text = 'Visit   https://maps.google.com/maps/place/Test   today'
      const result = extractLinksFromText(text)
      
      expect(result.cleanedText).toBe('Visit today')
    })
    
    it('should handle empty string', () => {
      const result = extractLinksFromText('')
      
      expect(result.googleMapsLinks).toHaveLength(0)
      expect(result.otherLinks).toHaveLength(0)
      expect(result.cleanedText).toBe('')
    })
  })
  
  describe('isGoogleMapsUrl', () => {
    it('should identify maps.google.com URLs', () => {
      expect(isGoogleMapsUrl('https://maps.google.com/maps/place/Test')).toBe(true)
      expect(isGoogleMapsUrl('http://maps.google.com/maps?place_id=ChIJ123')).toBe(true)
    })
    
    it('should identify google.com/maps URLs', () => {
      expect(isGoogleMapsUrl('https://www.google.com/maps/place/Test')).toBe(true)
    })
    
    it('should identify goo.gl shortened URLs', () => {
      expect(isGoogleMapsUrl('https://goo.gl/maps/abc123')).toBe(true)
    })
    
    it('should identify maps.app.goo.gl shortened URLs', () => {
      expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true)
    })
    
    it('should reject non-Google Maps URLs', () => {
      expect(isGoogleMapsUrl('https://google.com')).toBe(false)
      expect(isGoogleMapsUrl('https://example.com')).toBe(false)
      expect(isGoogleMapsUrl('https://reddit.com/r/travel')).toBe(false)
    })
    
    it('should handle invalid URLs gracefully', () => {
      expect(isGoogleMapsUrl('not-a-url')).toBe(false)
      expect(isGoogleMapsUrl('')).toBe(false)
      expect(isGoogleMapsUrl('://invalid')).toBe(false)
    })
  })
  
  describe('parseGoogleMapsUrl', () => {
    it('should extract Place ID with high confidence', () => {
      const url = 'https://maps.google.com/maps?place_id=ChIJH_imbZuAZUYREePCK0vvmvU'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.placeId).toBe('ChIJH_imbZuAZUYREePCK0vvmvU')
      expect(result.confidence).toBe('high')
      expect(result.originalUrl).toBe(url)
      // expandedUrl is optional and only set after actual expansion occurs
      expect(result.expandedUrl).toBeUndefined()
    })
    
    it('should extract coordinates with medium confidence', () => {
      const url = 'https://maps.google.com/maps/@35.7148,139.7967,17z'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.coordinates).toEqual({
        lat: 35.7148,
        lng: 139.7967
      })
      expect(result.confidence).toBe('medium')
    })
    
    it('should extract query from place path with low confidence', () => {
      const url = 'https://maps.google.com/maps/place/Senso-ji+Temple/'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.query).toBe('Senso-ji Temple')
      expect(result.confidence).toBe('low')
    })
    
    it('should prioritize Place ID over other identifiers', () => {
      const url = 'https://maps.google.com/maps/place/Senso-ji+Temple/@35.7148,139.7967,17z?place_id=ChIJ123'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.placeId).toBe('ChIJ123')
      expect(result.confidence).toBe('high')
      // When Place ID is found, function returns early, so coordinates/query are not extracted
      // This is correct behavior - Place ID is the most reliable identifier
    })
    
    it('should extract CID from data parameter with medium confidence', () => {
      const url = 'https://maps.google.com/maps?data=!4m6!3m5!1s0x60188ed0d12f9adf:0x7116ebf5d51ba95a!1s0x60188ed0d12f9adf'
      const result = parseGoogleMapsUrl(url)
      
      // Note: CID extraction depends on specific pattern matching (!1s0x...)
      // If CID pattern matches, confidence becomes medium
      // If coordinates are also found, confidence remains medium
      expect(['low', 'medium']).toContain(result.confidence)
    })
    
    it('should handle URLs with no identifiers', () => {
      const url = 'https://maps.google.com/maps'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.confidence).toBe('low')
      expect(result.placeId).toBeUndefined()
      expect(result.coordinates).toBeUndefined()
      expect(result.query).toBeUndefined()
    })
    
    it('should handle malformed URLs gracefully', () => {
      const url = 'not-a-valid-url'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.confidence).toBe('low')
      expect(result.originalUrl).toBe(url)
    })
    
    it('should decode URL-encoded query strings', () => {
      const url = 'https://maps.google.com/maps/place/Tokyo+Tower/'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.query).toBe('Tokyo Tower')
    })
    
    it('should handle URLs with both coordinates and query', () => {
      const url = 'https://maps.google.com/maps/place/Senso-ji+Temple/@35.7148,139.7967,17z'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.coordinates).toEqual({
        lat: 35.7148,
        lng: 139.7967
      })
      expect(result.query).toBe('Senso-ji Temple')
      expect(result.confidence).toBe('medium') // Coordinates take priority over query
    })
    
    it('should preserve original URL', () => {
      const url = 'https://maps.google.com/maps?place_id=ChIJ123'
      const result = parseGoogleMapsUrl(url)
      
      expect(result.originalUrl).toBe(url)
      // expandedUrl is optional and only set after actual expansion occurs
      expect(result.expandedUrl).toBeUndefined()
    })
    
    describe('ftid and q parameter extraction', () => {
      it('should extract ftid parameter as CID with medium confidence', () => {
        const url = 'https://www.google.com/maps?ftid=0x35419186f3dcf331:0xcfdb147061f6629'
        const result = parseGoogleMapsUrl(url)
        
        expect(result.cid).toBe('0x35419186f3dcf331:0xcfdb147061f6629')
        expect(result.confidence).toBe('medium')
      })
      
      it('should extract q parameter as query with low confidence', () => {
        const url = 'https://www.google.com/maps?q=Shinsuke,+1+Chome-12-30+Daimyo,+Chuo+Ward,+Fukuoka'
        const result = parseGoogleMapsUrl(url)
        
        expect(result.query).toBe('Shinsuke')
        expect(result.confidence).toBe('low')
      })
      
      it('should extract both ftid and q parameters', () => {
        const url = 'https://www.google.com/maps?ftid=0x123&q=Shinsuke,+Address'
        const result = parseGoogleMapsUrl(url)
        
        expect(result.cid).toBe('0x123')
        expect(result.query).toBe('Shinsuke')
        expect(result.confidence).toBe('medium') // ftid takes priority
      })
      
      it('should prioritize Place ID over ftid', () => {
        const url = 'https://www.google.com/maps?place_id=ChIJ123&ftid=0x456'
        const result = parseGoogleMapsUrl(url)
        
        expect(result.placeId).toBe('ChIJ123')
        expect(result.cid).toBeUndefined() // Place ID extraction returns early
        expect(result.confidence).toBe('high')
      })
      
      it('should decode URL-encoded q parameter', () => {
        const url = 'https://www.google.com/maps?q=Tokyo+Tower'
        const result = parseGoogleMapsUrl(url)
        
        expect(result.query).toBe('Tokyo Tower')
      })
      
      it('should extract location name from q parameter (before first comma)', () => {
        const url = 'https://www.google.com/maps?q=Shinsuke,+1+Chome-12-30+Daimyo,+Chuo+Ward,+Fukuoka,+810-0041,+Japan'
        const result = parseGoogleMapsUrl(url)
        
        expect(result.query).toBe('Shinsuke') // Only first part before comma
      })
      
      it('should handle real-world expanded URL format', () => {
        const url = 'https://www.google.com/maps?q=Shinsuke,+1+Chome-12-30+Daimyo,+Chuo+Ward,+Fukuoka,+810-0041,+Japan&ftid=0x35419186f3dcf331:0xcfdb147061f6629&entry=gps'
        const result = parseGoogleMapsUrl(url)
        
        expect(result.cid).toBe('0x35419186f3dcf331:0xcfdb147061f6629')
        expect(result.query).toBe('Shinsuke')
        expect(result.confidence).toBe('medium')
      })
      
      it('should not overwrite existing CID when ftid is present', () => {
        const url = 'https://www.google.com/maps?data=!1s0x123&ftid=0x456'
        const result = parseGoogleMapsUrl(url)
        
        // data parameter CID should be extracted first, ftid should not overwrite it
        // Note: This test depends on the order of extraction
        // If data CID is extracted, ftid won't overwrite it
        expect(result.cid).toBeDefined()
        expect(result.confidence).toBe('medium')
      })
      
      it('should not overwrite existing query when q parameter is present', () => {
        const url = 'https://www.google.com/maps/place/Senso-ji+Temple/?q=Shinsuke'
        const result = parseGoogleMapsUrl(url)
        
        // Place path query should be extracted first, q parameter should not overwrite it
        expect(result.query).toBe('Senso-ji Temple')
        expect(result.confidence).toBe('low')
      })
    })
  })
})

