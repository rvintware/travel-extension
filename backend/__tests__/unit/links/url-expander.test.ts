import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import axios from 'axios'
import {
  expandShortenedUrl,
  isShortenedUrl
} from '../../../lib/links/url-expander'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('URL Expander', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('expandShortenedUrl', () => {
    it('should expand goo.gl URL to maps.google.com', async () => {
      const shortenedUrl = 'https://goo.gl/maps/abc123'
      const expandedUrl = 'https://maps.google.com/maps/place/Senso-ji+Temple'
      
      mockedAxios.get.mockResolvedValue({
        request: {
          res: {
            responseUrl: expandedUrl
          }
        }
      } as any)
      
      const result = await expandShortenedUrl(shortenedUrl)
      
      expect(result).toBe(expandedUrl)
      expect(mockedAxios.get).toHaveBeenCalledWith(shortenedUrl, expect.objectContaining({
        maxRedirects: 5,
        timeout: 5000,
        responseType: 'text'
      }))
    })
    
    it('should handle multiple redirects', async () => {
      const shortenedUrl = 'https://goo.gl/maps/abc123'
      const finalUrl = 'https://maps.google.com/maps/place/Final+Location'
      
      mockedAxios.get.mockResolvedValue({
        request: {
          res: {
            responseUrl: finalUrl
          }
        }
      } as any)
      
      const result = await expandShortenedUrl(shortenedUrl)
      
      expect(result).toBe(finalUrl)
    })
    
    it('should return original URL on timeout', async () => {
      const url = 'https://goo.gl/maps/abc123'
      
      mockedAxios.get.mockRejectedValue(new Error('timeout'))
      
      const result = await expandShortenedUrl(url)
      
      expect(result).toBe(url) // Should return original URL on failure
    })
    
    it('should return original URL on network error', async () => {
      const url = 'https://goo.gl/maps/abc123'
      
      mockedAxios.get.mockRejectedValue(new Error('Network error'))
      
      const result = await expandShortenedUrl(url)
      
      expect(result).toBe(url) // Should return original URL on failure
    })
    
    it('should return original URL if no redirect URL in response', async () => {
      const url = 'https://goo.gl/maps/abc123'
      
      mockedAxios.get.mockResolvedValue({
        request: {
          res: {} // No responseUrl
        },
        config: {
          url: url
        }
      } as any)
      
      const result = await expandShortenedUrl(url)
      
      expect(result).toBe(url) // Should return original URL
    })
    
    it('should return original URL immediately for non-shortened URLs', async () => {
      const url = 'https://maps.google.com/maps/place/Test'
      
      const result = await expandShortenedUrl(url)
      
      expect(result).toBe(url)
      expect(mockedAxios.get).not.toHaveBeenCalled() // Should not make HTTP request
    })
    
    it('should use GET request (not HEAD) for reliability', async () => {
      const url = 'https://goo.gl/maps/abc123'
      
      mockedAxios.get.mockResolvedValue({
        request: {
          res: {
            responseUrl: 'https://maps.google.com/maps/place/Test'
          }
        }
      } as any)
      
      await expandShortenedUrl(url)
      
      expect(mockedAxios.get).toHaveBeenCalled()
      expect(mockedAxios.head).not.toHaveBeenCalled()
    })
  })
  
  describe('isShortenedUrl', () => {
    it('should identify goo.gl URLs', () => {
      expect(isShortenedUrl('https://goo.gl/maps/abc123')).toBe(true)
      expect(isShortenedUrl('http://goo.gl/maps/xyz')).toBe(true)
    })
    
    it('should identify maps.app.goo.gl URLs', () => {
      expect(isShortenedUrl('https://maps.app.goo.gl/abc123')).toBe(true)
      expect(isShortenedUrl('https://maps.app.goo.gl/xyz')).toBe(true)
    })
    
    it('should identify bit.ly URLs', () => {
      expect(isShortenedUrl('https://bit.ly/abc123')).toBe(true)
    })
    
    it('should identify t.co URLs', () => {
      expect(isShortenedUrl('https://t.co/abc123')).toBe(true)
    })
    
    it('should reject non-shortened URLs', () => {
      expect(isShortenedUrl('https://maps.google.com/maps/place/Test')).toBe(false)
      expect(isShortenedUrl('https://example.com')).toBe(false)
      expect(isShortenedUrl('https://reddit.com/r/travel')).toBe(false)
    })
    
    it('should handle invalid URLs gracefully', () => {
      expect(isShortenedUrl('not-a-url')).toBe(false)
      expect(isShortenedUrl('')).toBe(false)
      expect(isShortenedUrl('://invalid')).toBe(false)
    })
    
    it('should be case-insensitive for hostname', () => {
      expect(isShortenedUrl('https://GOO.GL/maps/abc')).toBe(true)
      expect(isShortenedUrl('https://Goo.Gl/maps/abc')).toBe(true)
    })
  })
})

