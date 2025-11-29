/**
 * Real-world test data for integration tests
 * 
 * These are actual Google Maps URLs, Place IDs, and coordinates
 * used to verify the link parser modules work with real data.
 * 
 * Note: Some URLs may become invalid over time. Update as needed.
 */

/**
 * Real Google Maps URLs in various formats
 */
export const REAL_GOOGLE_MAPS_URLS = {
  /**
   * Place ID format (highest confidence)
   * Senso-ji Temple, Tokyo
   */
  SENS0JI_TEMPLE_PLACE_ID: 'https://maps.google.com/maps?place_id=ChIJH_imbZuAZUYREePCK0vvmvU',
  
  /**
   * Coordinate format (medium confidence)
   * Tokyo Tower coordinates
   */
  TOKYO_TOWER_COORDS: 'https://maps.google.com/maps/@35.6586,139.7454,17z',
  
  /**
   * Place name format (low confidence)
   * Tsingtao Brewery
   */
  TSINGTAO_BREWERY_PLACE: 'https://maps.google.com/maps/place/Tsingtao+Brewery/',
  
  /**
   * Full URL with place path and coordinates
   * Senso-ji Temple with coordinates
   */
  SENS0JI_TEMPLE_FULL: 'https://maps.google.com/maps/place/Senso-ji+Temple/@35.7148,139.7967,17z',
  
  /**
   * Shortened URL (requires expansion)
   * Replace with actual goo.gl link if available
   */
  SHORTENED_EXAMPLE: 'https://goo.gl/maps/example', // Replace with real shortened URL
}

/**
 * Real Place IDs for Google Places API testing
 */
export const REAL_PLACE_IDS = {
  /**
   * Senso-ji Temple, Tokyo
   * Verified Place ID
   */
  SENS0JI_TEMPLE: 'ChIJH_imbZuAZUYREePCK0vvmvU',
  
  /**
   * Tokyo Tower
   * Replace with actual Place ID if known
   */
  TOKYO_TOWER: 'ChIJH_imbZuAZUYREePCK0vvmvU', // TODO: Replace with actual Tokyo Tower Place ID
}

/**
 * Real coordinates for Google Places API testing
 */
export const REAL_COORDINATES = {
  /**
   * Senso-ji Temple, Tokyo
   */
  SENS0JI_TEMPLE: { lat: 35.7148, lng: 139.7967 },
  
  /**
   * Tokyo Tower
   */
  TOKYO_TOWER: { lat: 35.6586, lng: 139.7454 },
  
  /**
   * Coordinates with no nearby places (for negative testing)
   * Middle of ocean
   */
  OCEAN_MIDDLE: { lat: 0, lng: 0 },
}

/**
 * Real text content with Google Maps links
 * Simulates content from Reddit, blogs, etc.
 */
export const REAL_TEXT_WITH_LINKS = {
  /**
   * Single link in text
   */
  SINGLE_LINK: `Check out Senso-ji Temple! ${REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_PLACE_ID} It's amazing.`,
  
  /**
   * Multiple Google Maps links
   */
  MULTIPLE_LINKS: `Visit ${REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_PLACE_ID} and ${REAL_GOOGLE_MAPS_URLS.TOKYO_TOWER_COORDS}`,
  
  /**
   * Mixed content: links + text + other URLs
   */
  MIXED_CONTENT: `Tokyo travel guide: ${REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_PLACE_ID} Also check https://reddit.com/r/travel`,
  
  /**
   * Link at start of text
   */
  LINK_AT_START: `${REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_PLACE_ID} This is a must-visit location!`,
  
  /**
   * Link at end of text
   */
  LINK_AT_END: `Amazing temple in Tokyo: ${REAL_GOOGLE_MAPS_URLS.SENS0JI_TEMPLE_PLACE_ID}`,
}

