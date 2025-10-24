import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errors'

/**
 * Delete all data for a user
 * DELETE /api/users/:id/data
 * 
 * Deletes:
 * - All trips (cascade deletes trip_locations)
 * - All locations
 * 
 * Keeps:
 * - User record
 * - Settings (in extension local storage)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    
    console.log(`[API] Deleting all data for user ${userId}`)
    
    // Get counts before deleting (for logging)
    const [locationsResult, tripsResult] = await Promise.all([
      supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    ])
    
    const locationCount = locationsResult.count || 0
    const tripCount = tripsResult.count || 0
    
    console.log(`[API] Will delete: ${locationCount} locations, ${tripCount} trips`)
    
    // Delete trips first (cascade handles trip_locations)
    const { error: tripsError } = await supabase
      .from('trips')
      .delete()
      .eq('user_id', userId)
    
    if (tripsError) {
      console.error('[API] Failed to delete trips:', tripsError)
      throw tripsError
    }
    
    // Delete all locations
    const { error: locationsError } = await supabase
      .from('locations')
      .delete()
      .eq('user_id', userId)
    
    if (locationsError) {
      console.error('[API] Failed to delete locations:', locationsError)
      throw locationsError
    }
    
    console.log(`[API] ✅ Successfully deleted ${locationCount} locations and ${tripCount} trips`)
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[API] Delete all failed:', error)
    return handleError(error)
  }
}

