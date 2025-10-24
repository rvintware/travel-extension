import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { linkLocationToTripSchema } from '@/lib/validation'
import { handleError, badRequest, conflict } from '@/lib/errors'

/**
 * Link a location to a trip
 * POST /api/trip-locations
 * 
 * Body: { tripId, locationId, dayNumber?, displayOrder?, timeOfDay?, suggestedTime?, notes?, priority? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = linkLocationToTripSchema.parse(body)
    
    // Get location's country
    const { data: location } = await supabase
      .from('locations')
      .select('country_id')
      .eq('id', validated.locationId)
      .single()
    
    // Auto-add country to trip if not already there
    if (location?.country_id) {
      const { data: existingCountry } = await supabase
        .from('trip_countries')
        .select('id')
        .eq('trip_id', validated.tripId)
        .eq('country_id', location.country_id)
        .maybeSingle()
      
      if (!existingCountry) {
        console.log('[API] Auto-adding country to trip')
        await supabase.from('trip_countries').insert({
          trip_id: validated.tripId,
          country_id: location.country_id
        })
      }
    }
    
    // Insert trip_location link
    const { data, error } = await supabase
      .from('trip_locations')
      .insert({
        trip_id: validated.tripId,
        location_id: validated.locationId,
        day_number: validated.dayNumber,
        display_order: validated.displayOrder,
        time_of_day: validated.timeOfDay,
        suggested_time: validated.suggestedTime,
        estimated_duration_minutes: validated.estimatedDurationMinutes,
        notes: validated.notes,
        priority: validated.priority,
      })
      .select()
      .single()
    
    if (error) {
      // Handle duplicate (location already in trip)
      if (error.code === '23505') {
        conflict('Location is already in this trip')
      }
      throw error
    }
    
    return NextResponse.json({ 
      tripLocation: data 
    }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Remove a location from a trip
 * DELETE /api/trip-locations?tripId=xxx&locationId=xxx
 * 
 * Query params:
 * - tripId (required): Trip UUID
 * - locationId (required): Location UUID
 * 
 * This only removes the link, not the location from the pool
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')
    const locationId = searchParams.get('locationId')
    
    if (!tripId || !locationId) {
      badRequest('tripId and locationId query parameters are required')
    }
    
    const { error } = await supabase
      .from('trip_locations')
      .delete()
      .eq('trip_id', tripId)
      .eq('location_id', locationId)
    
    if (error) throw error
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}

