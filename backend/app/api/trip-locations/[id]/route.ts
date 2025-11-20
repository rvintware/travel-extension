import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateTripLocationSchema } from '@/lib/validation'
import { handleError, badRequest, notFound } from '@/lib/errors'

/**
 * Update a trip location
 * PATCH /api/trip-locations/:id
 * 
 * Body: { dayNumber?, notes? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate input
    const validated = updateTripLocationSchema.parse(body)
    
    // Get trip_location to verify it exists and get trip_id
    const { data: tripLocation, error: fetchError } = await supabase
      .from('trip_locations')
      .select('trip_id')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        notFound('Trip location not found')
      }
      throw fetchError
    }
    
    // Get trip to validate day_number if provided
    if (validated.dayNumber !== undefined) {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('duration_days')
        .eq('id', tripLocation.trip_id)
        .single()
      
      if (tripError) throw tripError
      
      // Validate day_number is within trip duration
      if (validated.dayNumber !== null && trip.duration_days) {
        if (validated.dayNumber < 1 || validated.dayNumber > trip.duration_days) {
          badRequest(`Day number must be between 1 and ${trip.duration_days}`)
        }
      }
    }
    
    // Build update object
    const updateData: Record<string, any> = {}
    if (validated.dayNumber !== undefined) {
      updateData.day_number = validated.dayNumber
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }
    
    // Update trip_location
    const { data, error } = await supabase
      .from('trip_locations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        location:locations(*)
      `)
      .single()
    
    if (error) throw error
    
    // Format response similar to GET trip-locations
    const tripLocationWithData = {
      ...data.location,
      tripLocationId: data.id,
      dayNumber: data.day_number,
      displayOrder: data.display_order,
      timeOfDay: data.time_of_day,
      suggestedTime: data.suggested_time,
      estimatedDurationMinutes: data.estimated_duration_minutes,
      notes: data.notes,
      priority: data.priority,
      status: data.status,
      addedAt: data.added_at,
    }
    
    return NextResponse.json({ tripLocation: tripLocationWithData })
  } catch (error) {
    return handleError(error)
  }
}

