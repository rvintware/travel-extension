import { NextResponse } from 'next/server'
import { supabase, ensureUser } from '@/lib/supabase'
import { createTripSchema } from '@/lib/validation'
import { handleError, badRequest } from '@/lib/errors'

/**
 * Create a new trip
 * POST /api/trips
 * 
 * Body: { userId, countryId, name, description?, startDate?, endDate?, durationDays? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = createTripSchema.parse(body)
    
    // Ensure user exists
    await ensureUser(validated.userId)
    
    // Insert trip
    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: validated.userId,
        country_id: validated.countryId,
        name: validated.name,
        description: validated.description,
        start_date: validated.startDate,
        end_date: validated.endDate,
        duration_days: validated.durationDays,
        is_itinerary: false,
        is_active: false,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      trip: data 
    }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Get trips for a user
 * GET /api/trips?userId=xxx
 * 
 * Query params:
 * - userId (required): User's UUID
 * 
 * Returns trips with country info and location count
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      badRequest('userId query parameter is required')
    }
    
    // Get trips with country info
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        *,
        country:countries(id, name, code, emoji)
      `)
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    
    if (tripsError) throw tripsError
    
    // Get location counts for each trip
    const tripsWithCounts = await Promise.all(
      (trips || []).map(async (trip) => {
        const { count, error } = await supabase
          .from('trip_locations')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', trip.id)
        
        if (error) console.error('Error counting locations:', error)
        
        return {
          ...trip,
          locationCount: count || 0
        }
      })
    )
    
    return NextResponse.json({ 
      trips: tripsWithCounts,
      count: tripsWithCounts.length
    })
  } catch (error) {
    return handleError(error)
  }
}

