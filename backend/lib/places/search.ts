import { Client } from '@googlemaps/google-maps-services-js'

if (!process.env.GOOGLE_PLACES_API_KEY) {
  console.warn('GOOGLE_PLACES_API_KEY not set - Places enrichment will fail')
}

const client = new Client({})

interface PlaceResult {
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
    const searchResponse = await client.textSearch({
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
    const detailsResponse = await client.placeDetails({
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
    
    const detailsResponse = await client.placeDetails({
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

