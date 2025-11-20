import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errors'

/**
 * Get all locations in a trip
 * GET /api/trips/:id/locations
 * 
 * Returns locations organized by day and unscheduled
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get trip details to know duration_days
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('duration_days')
      .eq('id', id)
      .single()
    
    if (tripError) throw tripError
    
    const { data, error } = await supabase
      .from('trip_locations')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('trip_id', id)
      .order('day_number', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true })
      .order('added_at', { ascending: false })
    
    if (error) throw error
    
    // Group locations by day
    const byDay: Record<string | number, any[]> = {}
    const allLocations: any[] = []
    
    // Initialize empty arrays for all days if trip has duration set
    if (trip?.duration_days) {
      for (let day = 1; day <= trip.duration_days; day++) {
        byDay[day] = []
      }
    }
    // Always initialize unscheduled
    byDay['unscheduled'] = []
    
    data.forEach(tl => {
      const dayKey = tl.day_number ?? 'unscheduled'
      
      // Create combined object with location data + trip-specific data
      const locationWithTripData = {
        ...tl.location,
        // Trip-specific fields
        tripLocationId: tl.id,
        dayNumber: tl.day_number,
        displayOrder: tl.display_order,
        timeOfDay: tl.time_of_day,
        suggestedTime: tl.suggested_time,
        estimatedDurationMinutes: tl.estimated_duration_minutes,
        notes: tl.notes,
        priority: tl.priority,
        status: tl.status,
        addedAt: tl.added_at,
      }
      
      // Add to byDay grouping
      if (!byDay[dayKey]) {
        byDay[dayKey] = []
      }
      byDay[dayKey].push(locationWithTripData)
      
      // Add to flat list
      allLocations.push(locationWithTripData)
    })
    
    return NextResponse.json({ 
      tripId: id,
      locations: allLocations,
      byDay: byDay,
      count: allLocations.length
    })
  } catch (error) {
    return handleError(error)
  }
}

