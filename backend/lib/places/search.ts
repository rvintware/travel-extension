import { Client } from '@googlemaps/google-maps-services-js'

if (!process.env.GOOGLE_PLACES_API_KEY) {
  console.warn('GOOGLE_PLACES_API_KEY not set - Places enrichment will fail')
}

// Module-level client for backward compatibility
const defaultClient = new Client({})

export interface PlaceResult {
  place_id: string
  name: string
  address: string
  lat: number
  lng: number
  photos: string[]
  rating?: number
  priceLevel?: number
}

/**
 * Search Google Places for a location and get enriched data
 */
export async function searchGooglePlaces(
  locationName: string,
  address?: string
): Promise<PlaceResult | null> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('[Google Places] API key not set')
    return null
  }
  
  try {
    const query = address 
      ? `${locationName} ${address}`
      : locationName
    
    console.log(`[Google Places] Searching for: "${query}"`)
    
    // Text search
    const searchResponse = await defaultClient.textSearch({
      params: {
        query,
        key: process.env.GOOGLE_PLACES_API_KEY
      },
      timeout: 5000
    })
    
    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      console.log('[Google Places] No results found')
      return null
    }
    
    const topResult = searchResponse.data.results[0]
    const placeId = topResult.place_id
    
    if (!placeId) {
      console.log('[Google Places] No place_id in result')
      return null
    }
    
    // Get place details
    const detailsResponse = await defaultClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'price_level', 'types'],
        key: process.env.GOOGLE_PLACES_API_KEY
      },
      timeout: 5000
    })
    
    const place = detailsResponse.data.result
    
    if (!place) {
      console.log('[Google Places] No place details')
      return null
    }
    
    // Format photo URL - just one thumbnail
    const photos: string[] = []
    if (place.photos && place.photos.length > 0) {
      const photo = place.photos[0]  // Just first photo
      if (photo.photo_reference) {
        photos.push(
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
        )
      }
    }
    
    const result: PlaceResult = {
      place_id: placeId,
      name: place.name || locationName,
      address: place.formatted_address || '',
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
      photos,
      rating: place.rating,
      priceLevel: place.price_level
    }
    
    console.log(`[Google Places] Found: ${result.name} at ${result.address}`)
    
    return result
  } catch (error) {
    console.error('[Google Places] Search failed:', error)
    return null
  }
}

interface GoogleReview {
  author_name: string
  rating: number
  text: string
  time: number
}

/**
 * Fetch reviews for a place from Google Places API
 * Returns top 5 reviews sorted by rating (5-star first)
 */
export async function fetchGoogleReviews(
  placeId: string
): Promise<GoogleReview[]> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('[Google Places] API key not set')
    return []
  }
  
  try {
    console.log(`[Google Places] Fetching reviews for: ${placeId}`)
    
    const detailsResponse = await defaultClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['reviews'],
        key: process.env.GOOGLE_PLACES_API_KEY
      },
      timeout: 5000
    })
    
    const reviews = detailsResponse.data.result?.reviews || []
    
    // Sort by rating (5-star first) and take top 5
    const topReviews = reviews
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map(r => ({
        author_name: r.author_name || 'Anonymous',
        rating: r.rating || 0,
        text: r.text || '',
        time: r.time || 0
      }))
    
    console.log(`[Google Places] Found ${topReviews.length} reviews`)
    return topReviews
    
  } catch (error) {
    console.error('[Google Places] Review fetch failed:', error)
    return []
  }
}

/**
 * Internal helper function for Place ID lookup with dependency injection
 * @internal - Exported for testing purposes only
 */
export async function _searchGooglePlacesByPlaceIdInternal(
  placeId: string,
  placesClient: Client
): Promise<PlaceResult | null> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('[Google Places] API key not set')
    return null
  }
  
  try {
    console.log(`[Google Places] Looking up Place ID: ${placeId}`)
    
    const detailsResponse = await placesClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'price_level', 'types'],
        key: process.env.GOOGLE_PLACES_API_KEY
      },
      timeout: 5000
    })
    
    const place = detailsResponse.data.result
    
    if (!place) {
      console.log('[Google Places] Place ID not found')
      return null
    }
    
    // Format photo URL - just one thumbnail
    const photos: string[] = []
    if (place.photos && place.photos.length > 0) {
      const photo = place.photos[0]
      if (photo.photo_reference) {
        photos.push(
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
        )
      }
    }
    
    const result: PlaceResult = {
      place_id: placeId,
      name: place.name || '',
      address: place.formatted_address || '',
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
      photos,
      rating: place.rating,
      priceLevel: place.price_level
    }
    
    console.log(`[Google Places] Found via Place ID: ${result.name} at ${result.address}`)
    
    return result
  } catch (error) {
    console.error('[Google Places] Place ID lookup failed:', error)
    return null
  }
}

/**
 * Search Google Places by Place ID directly
 * 
 * This is the most reliable lookup method (confidence: 1.0).
 * Place IDs are Google's authoritative identifiers for locations.
 * 
 * **Performance:** Typically completes in <500ms
 * **Accuracy:** 100% - Place ID directly maps to a specific location
 * **Error Handling:** Returns null on all errors (network, API, invalid ID)
 * **API Quota:** ~$0.017 per request (Place Details API)
 * 
 * @param placeId - Google Place ID (e.g., 'ChIJH_imbZuAZUYREePCK0vvmvU')
 * @returns PlaceResult with enriched data, or null if not found
 * 
 * @throws Never throws - all errors are caught and return null
 * 
 * @example
 * ```typescript
 * const place = await searchGooglePlacesByPlaceId('ChIJH_imbZuAZUYREePCK0vvmvU')
 * if (place) {
 *   console.log(place.name) // "Senso-ji Temple"
 *   console.log(place.address) // "2 Chome-3-1 Asakusa..."
 * }
 * ```
 * 
 * @example Error handling
 * ```typescript
 * // Returns null on any error (no exception thrown)
 * const place = await searchGooglePlacesByPlaceId('INVALID_ID')
 * if (!place) {
 *   console.log('Place not found or error occurred')
 * }
 * ```
 */
export async function searchGooglePlacesByPlaceId(
  placeId: string
): Promise<PlaceResult | null> {
  return _searchGooglePlacesByPlaceIdInternal(placeId, defaultClient)
}

/**
 * Internal helper function for coordinate lookup with dependency injection
 * @internal - Exported for testing purposes only
 */
export async function _searchGooglePlacesByCoordinatesInternal(
  lat: number,
  lng: number,
  placesClient: Client,
  placeIdLookupFn: (placeId: string) => Promise<PlaceResult | null>
): Promise<PlaceResult | null> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('[Google Places] API key not set')
    return null
  }
  
  try {
    console.log(`[Google Places] Searching nearby: ${lat}, ${lng}`)
    
    // First, find nearby places
    const nearbyResponse = await placesClient.placesNearby({
      params: {
        location: { lat, lng },
        radius: 50, // 50 meters - very close
        key: process.env.GOOGLE_PLACES_API_KEY
      },
      timeout: 5000
    })
    
    if (!nearbyResponse.data.results || nearbyResponse.data.results.length === 0) {
      console.log('[Google Places] No nearby places found')
      return null
    }
    
    // Get the closest result
    const topResult = nearbyResponse.data.results[0]
    const placeId = topResult.place_id
    
    if (!placeId) {
      console.log('[Google Places] No place_id in nearby result')
      return null
    }
    
    // Get full details using Place ID lookup
    return await placeIdLookupFn(placeId)
    
  } catch (error) {
    console.error('[Google Places] Coordinate search failed:', error)
    return null
  }
}

/**
 * Search Google Places by coordinates (nearby search)
 * 
 * Uses placesNearby API with 50-meter radius to find the closest place.
 * This is a high-reliability method (confidence: 0.9).
 * 
 * **Performance:** Typically completes in <1000ms (includes nearby search + place details)
 * **Accuracy:** Finds closest place within 50m radius
 * **Error Handling:** Returns null on all errors (network, API, no nearby places)
 * **API Quota:** ~$0.032 per request (Nearby Search) + ~$0.017 (Place Details) = ~$0.049 total
 * 
 * **Implementation Details:**
 * 1. Calls placesNearby API with 50m radius
 * 2. Selects closest result (first in response)
 * 3. Fetches full details via Place ID lookup
 * 4. Returns enriched PlaceResult
 * 
 * @param lat - Latitude (-90 to 90)
 * @param lng - Longitude (-180 to 180)
 * @returns PlaceResult with enriched data, or null if no nearby place found
 * 
 * @throws Never throws - all errors are caught and return null
 * 
 * @example
 * ```typescript
 * const place = await searchGooglePlacesByCoordinates(35.7148, 139.7967)
 * if (place) {
 *   console.log(place.name) // "Senso-ji Temple" or nearby place
 * }
 * ```
 * 
 * @example Error handling
 * ```typescript
 * // Returns null if no places within 50m or on error
 * const place = await searchGooglePlacesByCoordinates(0, 0) // Middle of ocean
 * if (!place) {
 *   console.log('No nearby places found')
 * }
 * ```
 */
export async function searchGooglePlacesByCoordinates(
  lat: number,
  lng: number
): Promise<PlaceResult | null> {
  return _searchGooglePlacesByCoordinatesInternal(
    lat,
    lng,
    defaultClient,
    (placeId) => searchGooglePlacesByPlaceId(placeId)
  )
}

