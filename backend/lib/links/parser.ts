/**
 * Link Parser Module
 * 
 * Extracts and parses Google Maps URLs from text, identifying Place IDs,
 * coordinates, and location queries for direct Google Places API lookups.
 */

/**
 * Result of extracting links from text
 */
export interface LinkExtractionResult {
  googleMapsLinks: ParsedMapLink[]
  otherLinks: string[]
  cleanedText: string
}

/**
 * Parsed Google Maps link with extracted identifiers
 */
export interface ParsedMapLink {
  originalUrl: string
  expandedUrl?: string  // Optional - only present after URL expansion
  placeId?: string
  cid?: string
  coordinates?: {
    lat: number
    lng: number
  }
  query?: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Extract all links from text and categorize them
 * 
 * @param text - Text containing URLs
 * @returns Object with categorized links and cleaned text
 * 
 * @example
 * ```typescript
 * const result = extractLinksFromText('Check out https://maps.google.com/... and visit!')
 * // Returns: { googleMapsLinks: [...], otherLinks: [], cleanedText: 'Check out and visit!' }
 * ```
 */
export function extractLinksFromText(text: string): LinkExtractionResult {
  // Regex to match URLs (http/https)
  const urlRegex = /https?:\/\/[^\s<>"]+/gi
  const matches = text.match(urlRegex) || []
  
  const googleMapsLinks: ParsedMapLink[] = []
  const otherLinks: string[] = []
  
  // Categorize URLs
  for (const url of matches) {
    if (isGoogleMapsUrl(url)) {
      googleMapsLinks.push(parseGoogleMapsUrl(url))
    } else {
      otherLinks.push(url)
    }
  }
  
  // Remove URLs from text (keep everything else)
  const cleanedText = text.replace(urlRegex, '').replace(/\s+/g, ' ').trim()
  
  return {
    googleMapsLinks,
    otherLinks,
    cleanedText
  }
}

/**
 * Check if URL is a Google Maps URL
 * 
 * Supports:
 * - maps.google.com
 * - google.com/maps
 * - goo.gl (shortened)
 * - maps.app.goo.gl (shortened)
 * 
 * @param url - URL to check
 * @returns true if URL is a Google Maps URL
 */
export function isGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const pathname = parsed.pathname.toLowerCase()
    
    return (
      host.includes('maps.google') ||
      (host.includes('google.com') && pathname.includes('/maps')) ||
      host === 'goo.gl' ||
      host.includes('maps.app.goo.gl')
    )
  } catch {
    // Invalid URL - not a Google Maps URL
    return false
  }
}

/**
 * Parse Google Maps URL to extract identifiers
 * 
 * Extraction priority (highest to lowest confidence):
 * 1. Place ID from query params (?place_id=ChIJ...) → 'high'
 * 2. CID from ftid parameter (?ftid=0x...) → 'medium'
 * 3. CID from data parameter (?data=...!1s0x...) → 'medium'
 * 4. Coordinates from pathname (/@lat,lng,zoom) → 'medium'
 * 5. Query from q parameter (?q=Location Name,...) → 'low'
 * 6. Query from place path (/place/Name/) → 'low'
 * 
 * @param url - Google Maps URL to parse
 * @returns ParsedMapLink with extracted identifiers and confidence level
 * 
 * @example
 * ```typescript
 * const parsed = parseGoogleMapsUrl('https://maps.google.com/maps?place_id=ChIJ123')
 * // Returns: { placeId: 'ChIJ123', confidence: 'high', ... }
 * 
 * const parsed2 = parseGoogleMapsUrl('https://www.google.com/maps?ftid=0x123&q=Shinsuke')
 * // Returns: { cid: '0x123', query: 'Shinsuke', confidence: 'medium', ... }
 * ```
 */
export function parseGoogleMapsUrl(url: string): ParsedMapLink {
  const result: ParsedMapLink = {
    originalUrl: url,
    // Don't set expandedUrl here - it will be set during expansion if needed
    confidence: 'low'
  }
  
  try {
    const parsed = new URL(url)
    
    // HIGH CONFIDENCE: Extract Place ID from query params
    const placeId = parsed.searchParams.get('place_id')
    if (placeId && placeId.startsWith('ChIJ')) {
      result.placeId = placeId
      result.confidence = 'high'
      return result
    }
    
    // MEDIUM CONFIDENCE: Extract ftid parameter (CID-like identifier)
    // ftid appears in expanded Google Maps URLs: ?ftid=0x35419186f3dcf331:0xcfdb147061f6629
    const ftid = parsed.searchParams.get('ftid')
    if (ftid && !result.cid) {
      // ftid format: 0x35419186f3dcf331:0xcfdb147061f6629 (hex identifier)
      // This is similar to CID and can be used for location identification
      result.cid = ftid
      if (result.confidence === 'low') {
        result.confidence = 'medium'
      }
    }
    
    // MEDIUM CONFIDENCE: Extract CID from data parameter
    const data = parsed.searchParams.get('data')
    if (data) {
      // Look for CID pattern: !1s0x... (hex identifier)
      const cidMatch = data.match(/!1s(0x[a-f0-9:]+)/i)
      if (cidMatch) {
        result.cid = cidMatch[1]
        if (result.confidence === 'low') {
          result.confidence = 'medium'
        }
      }
    }
    
    // MEDIUM CONFIDENCE: Extract coordinates from pathname (e.g., /@36.067,120.383,15z)
    const coordMatch = parsed.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)z/)
    if (coordMatch) {
      result.coordinates = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      }
      if (result.confidence === 'low') {
        result.confidence = 'medium'
      }
    }
    
    // LOW CONFIDENCE: Extract query from q parameter
    // q parameter contains location name and address: ?q=Shinsuke, 1 Chome-12-30 Daimyo,...
    const qParam = parsed.searchParams.get('q')
    if (qParam && !result.query) {
      // Extract location name (first part before comma)
      // Full format: "Location Name, Address, City, Country"
      // We only need the location name for search
      const locationName = qParam.split(',')[0].trim()
      result.query = decodeURIComponent(locationName)
      // Keep confidence as 'low' (query-based search is least reliable)
    }
    
    // LOW CONFIDENCE: Extract location name from path (e.g., /place/Senso-ji+Temple/)
    const placeMatch = parsed.pathname.match(/\/place\/([^/@]+)/)
    if (placeMatch) {
      result.query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      // Query-based search is least reliable, so keep confidence as 'low'
    }
    
  } catch (error) {
    console.error('[Link Parser] Failed to parse URL:', url, error)
    // Return result with low confidence and no identifiers
  }
  
  return result
}

