import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errors'

/**
 * Unschedule locations on days beyond the new duration
 * POST /api/trips/:id/unschedule-days
 * 
 * Body: { newDuration: number }
 * 
 * This is called when a user reduces the trip duration
 * and confirms they want to unschedule affected locations
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { newDuration } = await request.json()
    
    if (!newDuration || newDuration < 1) {
      return NextResponse.json(
        { error: 'newDuration must be a positive integer' },
        { status: 400 }
      )
    }
    
    // Unschedule locations on days > newDuration
    const { data, error } = await supabase
      .from('trip_locations')
      .update({ day_number: null })
      .eq('trip_id', id)
      .gt('day_number', newDuration)
      .select()
    
    if (error) throw error
    
    return NextResponse.json({
      unscheduledCount: data?.length || 0,
      unscheduledLocationIds: data?.map(l => l.location_id) || []
    })
  } catch (error) {
    return handleError(error)
  }
}

