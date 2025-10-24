import { Loader } from '@googlemaps/js-api-loader'

// Get API key from window (set by map.tsx) or environment
const getApiKey = (): string => {
  return (typeof window !== 'undefined' && (window as any).__GOOGLE_MAPS_API_KEY__) ||
    process.env.PLASMO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    ''
}

let loader: Loader | null = null
let isLoaded = false

/**
 * Initialize Google Maps API loader
 */
function getLoader(): Loader {
  const apiKey = getApiKey()
  
  if (!loader && apiKey) {
    loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    })
  }
  return loader!
}

/**
 * Load Google Maps API
 */
export async function loadGoogleMaps(): Promise<boolean> {
  if (isLoaded) return true
  
  try {
    const loaderInstance = getLoader()
    if (!loaderInstance) {
      console.error('[GoogleMaps] No API key available')
      return false
    }
    
    await loaderInstance.load()
    isLoaded = true
    console.log('[GoogleMaps] API loaded successfully')
    return true
  } catch (error) {
    console.error('[GoogleMaps] Failed to load API:', error)
    return false
  }
}

/**
 * Create a Google Map instance
 */
export async function createMap(
  container: HTMLElement,
  options: google.maps.MapOptions
): Promise<google.maps.Map | null> {
  const loaded = await loadGoogleMaps()
  if (!loaded) return null
  
  try {
    const map = new google.maps.Map(container, {
      zoom: 12,
      center: { lat: 0, lng: 0 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      ...options,
    })
    
    console.log('[GoogleMaps] Map created successfully')
    return map
  } catch (error) {
    console.error('[GoogleMaps] Failed to create map:', error)
    return null
  }
}

/**
 * Fit map bounds to show all locations
 */
export function fitBounds(
  map: google.maps.Map,
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
) {
  const latLngBounds = new google.maps.LatLngBounds(
    { lat: bounds.south, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east }
  )
  
  map.fitBounds(latLngBounds)
}

/**
 * Center map on a specific location
 */
export function centerMap(
  map: google.maps.Map,
  lat: number,
  lng: number,
  zoom?: number
) {
  map.setCenter({ lat, lng })
  if (zoom) {
    map.setZoom(zoom)
  }
}
