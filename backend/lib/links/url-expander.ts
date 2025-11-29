/**
 * URL Expander Module
 * 
 * Expands shortened URLs (goo.gl, bit.ly, etc.) by following redirects
 * to get the final destination URL.
 */

import axios from 'axios'

/**
 * Expand shortened URL by following redirects
 * 
 * Uses HTTP GET request to reliably capture redirect URLs.
 * Follows up to 5 redirects with a 5-second timeout.
 * 
 * @param url - Shortened URL to expand
 * @returns Final URL after all redirects, or original URL on failure
 * 
 * @example
 * ```typescript
 * const expanded = await expandShortenedUrl('https://goo.gl/maps/abc123')
 * // Returns: 'https://maps.google.com/maps/place/...'
 * ```
 */
export async function expandShortenedUrl(url: string): Promise<string> {
  // Early return for non-shortened URLs (no HTTP request needed)
  if (!isShortenedUrl(url)) {
    return url
  }
  
  try {
    console.log('[URL Expander] Expanding:', url)
    
    // Use GET request - HEAD requests don't reliably capture redirect URLs in Node.js
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
      timeout: 5000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    // Extract final URL after redirects
    // axios automatically follows redirects, final URL is in response.request.res.responseUrl
    const finalUrl = response.request?.res?.responseUrl || 
                     response.request?.path ||
                     response.config?.url ||
                     url
    
    console.log('[URL Expander] Expanded to:', finalUrl)
    return finalUrl
    
  } catch (error: any) {
    console.error('[URL Expander] Failed to expand:', url, error)
    
    // Try to extract Location header from redirect responses
    if (error.response?.status >= 300 && error.response?.status < 400) {
      const location = error.response.headers?.location
      if (location) {
        try {
          const resolvedUrl = new URL(location, url).href
          console.log('[URL Expander] Found redirect location:', resolvedUrl)
          return resolvedUrl
        } catch {
          return location.startsWith('http') ? location : url
        }
      }
    }
    
    // Return original URL if expansion fails (graceful degradation)
    return url
  }
}

/**
 * Check if URL needs expansion (is shortened)
 * 
 * @param url - URL to check
 * @returns true if URL is a known shortened URL service
 * 
 * @example
 * ```typescript
 * isShortenedUrl('https://goo.gl/maps/abc') // true
 * isShortenedUrl('https://maps.google.com/...') // false
 * ```
 */
export function isShortenedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    
    return (
      host === 'goo.gl' ||
      host.endsWith('maps.app.goo.gl') ||
      host === 'maps.app.goo.gl' ||
      host.endsWith('bit.ly') ||
      host === 'bit.ly' ||
      host.endsWith('t.co') ||
      host === 't.co'
    )
  } catch {
    // Invalid URL - not shortened
    return false
  }
}

