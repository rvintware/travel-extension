import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { reorderTripLocationsSchema } from '@/lib/validation'
import { handleError, badRequest, notFound } from '@/lib/errors'

/**
 * Reorder locations within a specific day of a trip
 * POST /api/trip-locations/reorder
 * 
 * Body: { tripId: string, dayNumber: number, locationIds: string[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = reorderTripLocationsSchema.parse(body)
    
    // Get trip to verify it exists and validate dayNumber
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('duration_days')
      .eq('id', validated.tripId)
      .single()
    
    if (tripError) {
      if (tripError.code === 'PGRST116') {
        notFound('Trip not found')
      }
      throw tripError
    }
    
    // Validate dayNumber is within trip duration
    if (!trip.duration_days || validated.dayNumber > trip.duration_days) {
      badRequest(`Day number must be between 1 and ${trip.duration_days}`)
    }
    
    // Verify all locations exist and belong to this trip and day
    const { data: existingLocations, error: fetchError } = await supabase
      .from('trip_locations')
      .select('id, location_id')
      .eq('trip_id', validated.tripId)
      .eq('day_number', validated.dayNumber)
      .in('location_id', validated.locationIds)
    
    if (fetchError) throw fetchError
    
    // Check if all provided locationIds exist in this day
    const existingLocationIds = new Set(existingLocations.map(l => l.location_id))
    const missingIds = validated.locationIds.filter(id => !existingLocationIds.has(id))
    
    if (missingIds.length > 0) {
      badRequest(`Some locations not found in trip or day: ${missingIds.join(', ')}`)
    }
    
    // Update display_order for each location based on array index
    // Use a transaction-like approach: update all in sequence
    const updates = validated.locationIds.map((locationId, index) => {
      const tripLocationId = existingLocations.find(l => l.location_id === locationId)?.id
      if (!tripLocationId) {
        throw new Error(`Trip location ID not found for location ${locationId}`)
      }
      
      return supabase
        .from('trip_locations')
        .update({ display_order: index + 1 })
        .eq('id', tripLocationId)
    })
    
    // Execute all updates
    const results = await Promise.all(updates)
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw errors[0].error
    }
    
    return NextResponse.json({
      success: true,
      updated: validated.locationIds.length
    })
  } catch (error) {
    return handleError(error)
  }
}

