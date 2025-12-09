/**
 * End-to-End Test Data Repository
 * 
 * Real-world test data for comprehensive E2E testing of the Link-First Processing Architecture.
 * Includes URLs, text samples, Place IDs, and test user/trip IDs.
 */

/**
 * Real Google Maps URLs in various formats for testing
 */
export const E2E_TEST_URLS = {
  /**
   * Shortened URL (requires expansion)
   * Shinsuke restaurant, Fukuoka, Japan
   */
  SHORTENED: 'https://maps.app.goo.gl/NmAhzAmvd8x8MbdS6?g_st=ipc',
  
  /**
   * Full URL with Place ID (highest confidence)
   * Senso-ji Temple, Tokyo, Japan
   */
  WITH_PLACE_ID: 'https://maps.google.com/maps?place_id=ChIJH_imbZuAZUYREePCK0vvmvU',
  
  /**
   * URL with coordinates (medium confidence)
   * Tokyo Tower coordinates
   */
  WITH_COORDINATES: 'https://maps.google.com/maps/@35.6586,139.7454,17z',
  
  /**
   * URL with query/place name (low confidence)
   * Senso-ji Temple place path
   */
  WITH_QUERY: 'https://maps.google.com/maps/place/Senso-ji+Temple/@35.7148,139.7967,17z',
  
  /**
   * Malformed URL (no protocol)
   * Should trigger graceful fallback
   */
  MALFORMED_NO_PROTOCOL: 'maps.google.com/maps/place/Test',
  
  /**
   * Invalid/broken URL
   * Should trigger graceful fallback
   */
  BROKEN: 'https://maps.google.com/maps/invalid-path-12345',
  
  /**
   * Non-Maps URL (should be ignored)
   */
  NON_MAPS: 'https://example.com/location',
  
  /**
   * Multiple different Google Maps links for multi-link testing
   */
  MULTIPLE_LINK_1: 'https://maps.google.com/maps?place_id=ChIJH_imbZuAZUYREePCK0vvmvU', // Senso-ji
  MULTIPLE_LINK_2: 'https://maps.google.com/maps/@35.6586,139.7454,17z', // Tokyo Tower
  MULTIPLE_LINK_3: 'https://maps.google.com/maps/place/Tokyo+Tower/@35.6586,139.7454,17z',
}

/**
 * Expected Place IDs for validation
 */
export const EXPECTED_PLACE_IDS = {
  SENS0JI_TEMPLE: 'ChIJH_imbZuAZUYREePCK0vvmvU',
  // Add more as needed for validation
}

/**
 * Test text samples for various scenarios
 */
export const E2E_TEST_TEXT = {
  /**
   * Text with single Google Maps link
   */
  WITH_SINGLE_LINK: `Check out Senso-ji Temple! ${E2E_TEST_URLS.WITH_PLACE_ID} It's amazing.`,
  
  /**
   * Text with multiple Google Maps links
   */
  WITH_MULTIPLE_LINKS: `Visit ${E2E_TEST_URLS.MULTIPLE_LINK_1} and ${E2E_TEST_URLS.MULTIPLE_LINK_2} and ${E2E_TEST_URLS.MULTIPLE_LINK_3}`,
  
  /**
   * Text only (no links) - for regression testing
   */
  TEXT_ONLY: 'Senso-ji Temple is a must-visit Buddhist temple in Tokyo. It\'s located in Asakusa.',
  
  /**
   * Mixed content: link + text referencing same place
   */
  MIXED_SAME_PLACE: `Loved Senso-ji Temple! ${E2E_TEST_URLS.WITH_PLACE_ID} It's a must-visit location in Tokyo.`,
  
  /**
   * Mixed content: link + text referencing different places
   */
  MIXED_DIFFERENT_PLACES: `Visit Senso-ji Temple ${E2E_TEST_URLS.MULTIPLE_LINK_1} and Tokyo Tower. Both are amazing!`,
  
  /**
   * Text with malformed link
   */
  WITH_MALFORMED_LINK: `Check out this place: ${E2E_TEST_URLS.MALFORMED_NO_PROTOCOL} It's great!`,
  
  /**
   * Text with broken link
   */
  WITH_BROKEN_LINK: `Visit ${E2E_TEST_URLS.BROKEN} for amazing views.`,
  
  /**
   * Text with non-Maps URL
   */
  WITH_NON_MAPS_LINK: `Read more at ${E2E_TEST_URLS.NON_MAPS} about this location.`,
  
  /**
   * Empty text (link only scenario)
   */
  EMPTY: '',
}

/**
 * Test user IDs (UUIDs for testing)
 */
export const TEST_USER_IDS = {
  DEFAULT: '550e8400-e29b-41d4-a716-446655440000',
  // Add more test users as needed
}

/**
 * Test trip IDs (UUIDs for testing)
 */
export const TEST_TRIP_IDS = {
  DEFAULT: '660e8400-e29b-41d4-a716-446655440001',
  // Add more test trips as needed
}

/**
 * Test country IDs (UUIDs for testing)
 */
export const TEST_COUNTRY_IDS = {
  JAPAN: '43fa693a-e0aa-442f-88b5-bf539a980f61', // Example UUID - replace with actual
  // Add more countries as needed
}

/**
 * Mock screenshot data (base64 encoded minimal JPEG)
 * For testing scenarios that require screenshots
 */
export const MOCK_SCREENSHOT = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',

/**
 * Test page URLs and titles
 */
export const TEST_PAGE_DATA = {
  REDDIT_POST: {
    url: 'https://reddit.com/r/JapanTravel/comments/abc123/tokyo_travel_guide',
    title: 'Tokyo Travel Guide - Reddit',
  },
  TRAVEL_BLOG: {
    url: 'https://example.com/travel-blog/tokyo-guide',
    title: 'Tokyo Travel Guide - Example Blog',
  },
  CHROME_INTERNAL: {
    url: 'chrome://extensions',
    title: 'Extensions',
  },
}

