import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errors'

/**
 * Get map data for a trip
 * GET /api/trips/:id/map-data
 * 
 * Returns locations with coordinates optimized for map rendering
 * Calculates bounds to fit all locations on the map
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get all locations for this trip with their coordinates
    const { data: tripLocations, error } = await supabase
      .from('trip_locations')
      .select(`
        id,
        day_number,
        display_order,
        time_of_day,
        suggested_time,
        estimated_duration_minutes,
        notes,
        priority,
        status,
        location:locations(
          id,
          name,
          lat,
          lng,
          address,
          category,
          subcategory,
          photos,
          place_id,
          user_rating,
          summary
        )
      `)
      .eq('trip_id', id)
      .order('day_number', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true })
    
    if (error) throw error
    
    // Format response for map
    const locations = tripLocations
      .filter(tl => tl.location) // Ensure location exists
      .map((tl, index) => ({
        id: tl.location.id,
        tripLocationId: tl.id,
        name: tl.location.name,
        lat: tl.location.lat,
        lng: tl.location.lng,
        address: tl.location.address,
        category: tl.location.category,
        subcategory: tl.location.subcategory,
        photos: tl.location.photos || [],
        placeId: tl.location.place_id,
        userRating: tl.location.user_rating,
        summary: tl.location.summary,
        // Trip-specific data
        dayNumber: tl.day_number,
        displayOrder: tl.display_order ?? index + 1, // Use index as fallback
        timeOfDay: tl.time_of_day,
        suggestedTime: tl.suggested_time,
        estimatedDuration: tl.estimated_duration_minutes,
        notes: tl.notes,
        priority: tl.priority,
        status: tl.status || 'planned',
      }))
    
    // Calculate map bounds (only from locations with valid coordinates)
    const locationsWithCoords = locations.filter(
      loc => loc.lat != null && loc.lng != null
    )
    
    let bounds = null
    if (locationsWithCoords.length > 0) {
      const lats = locationsWithCoords.map(loc => loc.lat!)
      const lngs = locationsWithCoords.map(loc => loc.lng!)
      
      bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs),
      }
      
      // Add padding to bounds (5% on each side)
      const latPadding = (bounds.north - bounds.south) * 0.05
      const lngPadding = (bounds.east - bounds.west) * 0.05
      
      bounds.north += latPadding
      bounds.south -= latPadding
      bounds.east += lngPadding
      bounds.west -= lngPadding
    }
    
    // Calculate stats
    const byDay: Record<number, number> = {}
    const byCategory: Record<string, number> = {}
    
    locations.forEach(loc => {
      // Count by day
      if (loc.dayNumber != null) {
        byDay[loc.dayNumber] = (byDay[loc.dayNumber] || 0) + 1
      }
      
      // Count by category
      if (loc.category) {
        byCategory[loc.category] = (byCategory[loc.category] || 0) + 1
      }
    })
    
    return NextResponse.json({
      tripId: id,
      locations: locations,
      locationsWithCoordinates: locationsWithCoords.length,
      bounds: bounds,
      stats: {
        totalLocations: locations.length,
        withCoordinates: locationsWithCoords.length,
        byDay: byDay,
        byCategory: byCategory,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

